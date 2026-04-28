import cv2
import mediapipe as mp
import csv

mp_hands = mp.solutions.hands
hands = mp_hands.Hands()
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)

# 🔥 Define all signs here
labels = {
    ord('1'): "hello",
    ord('2'): "thanks",
    ord('3'): "yes",
    ord('4'): "no",
    ord('5'): "help",
    ord('6'): "stop",
    ord('7'): "love",
    ord('8'): "sorry"
}

current_label = "hello"

file = open("dataset.csv", "a", newline="")
writer = csv.writer(file)

print("📸 Data Collection Started")
print("Press keys to change label:")
print("1: Hello | 2: Thanks | 3: Yes | 4: No | 5: Help | 6: Stop | 7: Love | 8: Sorry")
print("Press 's' to SAVE data | ESC to exit")

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ Camera error")
        break

    frame = cv2.flip(frame, 1)

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)

    key = cv2.waitKey(1)

    # 🔥 Change label dynamically
    if key in labels:
        current_label = labels[key]
        print(f"👉 Switched to: {current_label}")

    if result.multi_hand_landmarks:
        for handLms in result.multi_hand_landmarks:
            data = []

            # 🔥 NORMALIZATION (relative to wrist)
            base_x = handLms.landmark[0].x
            base_y = handLms.landmark[0].y

            for lm in handLms.landmark:
                data.append(lm.x - base_x)
                data.append(lm.y - base_y)

            mp_draw.draw_landmarks(frame, handLms, mp_hands.HAND_CONNECTIONS)

            # 🔥 Save data
            if key == ord('s'):
                data.append(current_label)
                writer.writerow(data)
                print(f"✅ Saved: {current_label}")

    # 🔥 Show current label on screen
    cv2.putText(frame, f"Label: {current_label}", (10, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1,
                (0, 255, 0), 2)

    cv2.imshow("Data Collection", frame)

    if key == 27:
        break

file.close()
cap.release()
cv2.destroyAllWindows()