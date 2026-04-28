import cv2
import mediapipe as mp
import pickle
import numpy as np
import os
from collections import deque

# ✅ NEW: Explicitly import solutions to prevent AttributeError on Railway
try:
    from mediapipe.solutions import hands as mp_hands
except ImportError:
    from mediapipe.python.solutions import hands as mp_hands


# ✅ 1. Load Scikit-Learn Model Safely
model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
model = None

if os.path.exists(model_path):
    try:
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        print("✅ Scikit-Learn Model loaded successfully")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
else:
    print(f"⚠️ Warning: {model_path} not found!")

# ✅ 2. Initialize MediaPipe (Railway Compatible)
# We initialized this using the explicit import from mediapipe.python.solutions
hands = mp_hands.Hands(
    static_image_mode=False, 
    max_num_hands=1, 
    min_detection_confidence=0.7, 
    min_tracking_confidence=0.7
)

# ✅ 3. Prediction Smoothing Buffer
prediction_buffer = deque(maxlen=5)

def predict_sign(frame):
    """
    Takes an OpenCV frame, processes landmarks, 
    and returns (sign_name, confidence, landmarks).
    """
    if frame is None:
        return "No Sign", 0, []
    
    if model is None:
        return "Model Offline", 0, []

    try:
        # 🎨 Convert BGR to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = hands.process(rgb_frame)

        if result.multi_hand_landmarks:
            for hand_landmarks in result.multi_hand_landmarks:
                # Extract raw coordinates
                x_vals = [lm.x for lm in hand_landmarks.landmark]
                y_vals = [lm.y for lm in hand_landmarks.landmark]

                # 📏 NORMALIZATION (Relative to Wrist - Landmark 0)
                base_x, base_y = x_vals[0], y_vals[0]
                temp_data = []
                for i in range(len(x_vals)):
                    temp_data.append(x_vals[i] - base_x)
                    temp_data.append(y_vals[i] - base_y)

                # 📉 SCALING (Distance Independence)
                max_val = max(map(abs, temp_data))
                if max_val == 0: max_val = 1
                data = [val / max_val for val in temp_data]

                # 🔮 ML PREDICTION (Scikit-Learn)
                raw_prediction = model.predict([data])[0]
                
                # Get confidence score
                try:
                    probabilities = model.predict_proba([data])
                    confidence = np.max(probabilities) * 100
                except:
                    confidence = 100 # Fallback

                # 🌊 SMOOTHING
                prediction_buffer.append(raw_prediction)
                most_frequent_sign = max(set(prediction_buffer), key=list(prediction_buffer).count)

                # 📍 SERIALIZATION (Format landmarks for React Canvas)
                serialized_landmarks = [{'x': lm.x, 'y': lm.y} for lm in hand_landmarks.landmark]

                return str(most_frequent_sign), confidence, serialized_landmarks

        # Clear buffer if no hand detected
        prediction_buffer.clear()
        return "No Sign", 0, []

    except Exception as e:
        print(f"ML Processing Error: {e}")
        return "Error", 0, []

# ✅ RESOURCE CLEANUP (Good practice for Railway)
def cleanup():
    hands.close()