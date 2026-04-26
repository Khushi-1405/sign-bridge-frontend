import base64
import cv2
import numpy as np
import logging
import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # 🔥 Added to serve GIFs

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

# ✅ FIX 1: Corrected CORS (Must include https://)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sign-bridge-frontend-six.vercel.app", 
        "http://localhost:5173" # Allow local development too
    ], 
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ✅ FIX 2: Serve the 'signs' folder as Static Assets
# This allows the frontend to fetch GIFs via URL
if os.path.exists("signs"):
    app.mount("/signs", StaticFiles(directory="signs"), name="signs")
    logger.info("📂 Signs folder mounted successfully")
else:
    logger.warning("⚠️ 'signs' folder not found! Speech-to-Sign GIFs will not load.")

@app.get("/")
async def home():
    return {"message": "🚀 SignBridge AI Backend is Live", "version": "1.0.1"}

@app.get("/health")
async def health():
    return {"status": "OK", "model_ready": True}

# ✅ FIX 3: Helper endpoint for Frontend to know what GIFs exist
@app.get("/list-signs")
async def list_signs():
    if not os.path.exists("signs"):
        return {"available_signs": []}
    files = os.listdir("signs")
    signs = [f.split(".")[0].lower() for f in files if f.endswith(".gif")]
    return {"available_signs": signs}

# 🧠 Prediction API
@app.post("/predict")
async def predict(request: Request):
    try:
        # Optimized parsing for large Base64 strings
        data = await request.json()
        image_data = data.get("image")
        
        if not image_data:
            raise HTTPException(status_code=400, detail="No image data found")

        # Robust Base64 Handling
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
            sign_name, confidence, landmarks = predict_sign(frame)
        except Exception as te:
            logger.error(f"ML Error: {te}")
            return {"sign": "Processing Error", "confidence": 0, "landmarks": []}

        return {
            "sign": sign_name,
            "confidence": round(float(confidence), 2),
            "landmarks": landmarks
        }

    except Exception as e:
        logger.error(f"❌ Critical: {str(e)}")
        return {"sign": "Offline", "confidence": 0, "landmarks": [], "error": str(e)}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Ensure your uvicorn is using the environment PORT
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)