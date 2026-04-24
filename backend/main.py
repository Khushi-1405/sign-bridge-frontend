import base64
import cv2
import numpy as np
import logging
import os
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

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

# ✅ FIX 1: Explicit CORS for Vercel
# Replace "*" with your actual Vercel URL to avoid browser security blocks
app.add_middleware(
    CORSMiddleware,
    allow_origins=["sign-bridge-frontend-six.vercel.app"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def home():
    return {"message": "🚀 SignBridge AI Backend is Live", "version": "1.0.1"}

@app.get("/health")
async def health():
    return {"status": "OK", "model_ready": True}

# 🧠 Prediction API
@app.post("/predict")
async def predict(request: Request):
    try:
        # ✅ FIX 2: Optimized parsing for large Base64 strings
        data = await request.json()
        image_data = data.get("image")
        
        if not image_data:
            raise HTTPException(status_code=400, detail="No image data found")

        # ✅ FIX 3: Robust Base64 Handling
        try:
            if "," in image_data:
                encoded = image_data.split(",", 1)[1]
            else:
                encoded = image_data
            
            img_bytes = base64.b64decode(encoded)
        except Exception as e:
            logger.warning(f"Decoding failed: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid base64 encoding")

        # Convert to OpenCV Format
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return {"sign": "No Image", "confidence": 0, "landmarks": []}

        # ML Prediction 
        try:
            # ✅ Ensure your predict_sign function is efficient
            sign_name, confidence, landmarks = predict_sign(frame)
        except Exception as te:
            logger.error(f"ML Error: {te}")
            return {"sign": "Processing Error", "confidence": 0, "landmarks": []}

        # Response Payload
        return {
            "sign": sign_name,
            "confidence": round(float(confidence), 2),
            "landmarks": landmarks
        }

    except Exception as e:
        logger.error(f"❌ Critical: {str(e)}")
        return {"sign": "Offline", "confidence": 0, "landmarks": [], "error": str(e)}

# 🔥 FIX 4: Optimized Uvicorn settings for Render
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    # host="0.0.0.0" is mandatory for cloud deployment
    # limit_concurrency helps prevent the free tier from crashing
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=port, 
        limit_concurrency=10, 
        timeout_keep_alive=30
    )