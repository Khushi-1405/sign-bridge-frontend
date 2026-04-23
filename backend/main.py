import base64
import cv2
import numpy as np
import logging
import os  # 🔥 Added for Environment Variables
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

# ✅ Import your multi-output prediction function
try:
    from predict_sign import predict_sign
except ImportError as e:
    logging.error(f"❌ Failed to import predict_sign: {e}")

app = FastAPI(title="SignBridge AI API")

# 🔥 Professional Logging Configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("SignBridgeAPI")

# ✅ CORS: Allow all for testing, but ideally replace "*" with your Vercel URL later
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def home():
    return {"message": "🚀 SignBridge AI Backend is Live", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "OK", "model_ready": True, "worker_active": True}

# 🧠 Prediction API
@app.post("/predict")
async def predict(request: Request, background_tasks: BackgroundTasks):
    try:
        # 1. Parse JSON safely
        try:
            data = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")
        
        image_data = data.get("image")
        if not image_data:
            raise HTTPException(status_code=400, detail="No image data found")

        # 2. Decode Base64 efficiently
        try:
            if "," in image_data:
                encoded = image_data.split(",", 1)[1]
            else:
                encoded = image_data
            
            img_bytes = base64.b64decode(encoded)
        except Exception as e:
            logger.warning(f"Base64 Decoding failed: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid base64 encoding")

        # 3. Convert to OpenCV Format
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            logger.error("OpenCV failed to decode image buffer.")
            return {"sign": "No Image", "confidence": 0, "landmarks": []}

        # 4. ML Prediction 
        try:
            sign_name, confidence, landmarks = predict_sign(frame)
        except Exception as te:
            logger.error(f"ML Processing Error: {te}")
            return {"sign": "Processing Error", "confidence": 0, "landmarks": []}

        # 5. Dynamic Console Output
        if landmarks:
            logger.info(f"✨ {sign_name.upper()} | Confidence: {confidence:.1f}%")
        else:
            logger.info("🔭 Scanning for hand landmarks...")

        # 6. Response Payload
        return {
            "sign": sign_name,
            "confidence": round(float(confidence), 2),
            "landmarks": landmarks,
            "timestamp": np.datetime64('now').astype(str)
        }

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        logger.error(f"❌ Critical Server Error: {str(e)}")
        return {
            "sign": "Error", 
            "confidence": 0, 
            "landmarks": [], 
            "error_msg": "Internal Server Error"
        }

# 🔥 ADDED FOR DEPLOYMENT: Dynamic Port Binding
if __name__ == "__main__":
    import uvicorn
    # Render provides a PORT environment variable, default to 8000 for local dev
    port = int(os.environ.get("PORT", 8000))
    # host="0.0.0.0" is required for Render to reach your app
    uvicorn.run(app, host="0.0.0.0", port=port)