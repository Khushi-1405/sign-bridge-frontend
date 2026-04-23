import cv2
import mediapipe as mp
import csv
import os

# --- CONFIGURATION ---
SIGNS = ["hello", "thanks", "yes", "no", "help", "stop", "love", "sorry"]
DATA_PATH = "dataset.csv"

# State variables
current_idx = 0
label = SIGNS[current_idx]
count = 0

# --- INITIALIZE ---
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True, min_detection_confidence=0.7)
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)

print("🚀 SignBridge Data Collector")
print(f"Controls: 's' = Save, 'n' = Next Sign, 'esc' = Quit")

while True:
    ret, frame = cap.read()
    if not ret: break
    
    frame = cv2.flip(frame, 1)
    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)

    # --- UI OVERLAY ---
    cv2.rectangle(frame, (0, 0), (350, 120), (0, 0, 0), -1) # Background for text
    cv2.putText(frame, f"SIGN: {label.upper()}", (10, 40), 
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    cv2.putText(frame, f"SAMPLES: {count}", (10, 80), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    cv2.putText(frame, "'s': Save | 'n': Next", (10, 110), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

    if result.multi_hand_landmarks:
        for handLms in result.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, handLms, mp_hands.HAND_CONNECTIONS)
            
            # 1. Extract raw landmarks
            x_vals = [lm.x for lm in handLms.landmark]
            y_vals = [lm.y for lm in handLms.landmark]
            
            # 2. Normalize (Relative to wrist)
            base_x, base_y = x_vals[0], y_vals[0]
            temp_data = []
            for i in range(len(x_vals)):
                temp_data.append(x_vals[i] - base_x)
                temp_data.append(y_vals[i] - base_y)
            
            # 3. Scale (Distance independent)
            max_val = max(map(abs, temp_data))
            normalized_row = [val / max_val for val in temp_data] if max_val != 0 else temp_data

            # --- KEYBOARD CONTROLS ---
            key = cv2.waitKey(1)
            
            # Press 's' to save the normalized data
            if key == ord('s'):
                with open(DATA_PATH, "a", newline="") as f:
                    writer = csv.writer(f)
                    writer.writerow(normalized_row + [label])
                count += 1
                print(f"✅ {label} ({count}/300)")

    # Press 'n' to go to the next sign
    key = cv2.waitKey(1)
    if key == ord('n'):
        current_idx = (current_idx + 1) % len(SIGNS)
        label = SIGNS[current_idx]
        count = 0 # Reset counter for the new sign
        print(f"➡️ Switched to: {label.upper()}")

    # Press ESC to quit
    if key == 27:
        break

    cv2.imshow("SignBridge - Data Collection", frame)

cap.release()
cv2.destroyAllWindows()