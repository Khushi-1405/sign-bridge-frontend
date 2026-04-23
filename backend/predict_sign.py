import cv2
import mediapipe as mp
import pickle
import numpy as np
import os
from collections import deque

# ✅ 1. Load model safely
model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
try:
    with open(model_path, "rb") as f:
        model = pickle.load(f)
except FileNotFoundError:
    print("❌ Error: model.pkl not found in the backend directory!")
    model = None

# ✅ 2. Initialize MediaPipe (Cleaned up redundancy)
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False, # Optimized for video tracking
    max_num_hands=1, 
    min_detection_confidence=0.8, # Increased for better accuracy
    min_tracking_confidence=0.8
)

# ✅ 3. BUFFER FOR SMOOTHING (Prevents flickering)
# Stores the last 5 predictions to ensure stability
prediction_buffer = deque(maxlen=5)

def predict_sign(frame):
    if frame is None or not isinstance(frame, np.ndarray):
        return "No Sign", 0, []
    
    if model is None:
        return "Model Error", 0, []

    try:
        # Convert BGR (OpenCV) to RGB (MediaPipe)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = hands.process(rgb)

        if result.multi_hand_landmarks:
            for handLms in result.multi_hand_landmarks:
                x_vals = [lm.x for lm in handLms.landmark]
                y_vals = [lm.y for lm in handLms.landmark]

                # ✅ NORMALIZATION: Relative to Wrist (Landmark 0)
                base_x, base_y = x_vals[0], y_vals[0]
                temp_data = []
                for i in range(len(x_vals)):
                    temp_data.append(x_vals[i] - base_x)
                    temp_data.append(y_vals[i] - base_y)

                # ✅ SCALING: Makes detection distance-independent
                max_val = max(map(abs, temp_data))
                data = [val / max_val for val in temp_data] if max_val != 0 else temp_data

                # 🔥 PREDICTION
                raw_prediction = model.predict([data])[0]
                probabilities = model.predict_proba([data])
                confidence = np.max(probabilities) * 100

                # 🚀 SMOOTHING LOGIC
                # Only return the sign if it appears consistently in the buffer
                prediction_buffer.append(raw_prediction)
                most_frequent_sign = max(set(prediction_buffer), key=list(prediction_buffer).count)

                # 🚀 SERIALIZATION: For React Canvas Drawing
                serialized_landmarks = [{'x': lm.x, 'y': lm.y} for lm in handLms.landmark]

                return str(most_frequent_sign), confidence, serialized_landmarks

        # If no hand detected, clear the buffer gradually
        prediction_buffer.clear()
        return "No Sign", 0, []

    except Exception as e:
        print(f"Prediction Error: {e}")
        return "Error", 0, []