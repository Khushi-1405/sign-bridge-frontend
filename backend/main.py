import base64
import cv2
import numpy as np
import logging
import os
import pickle
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# 🔥 1. PRE-LOADING & CONFIGURATION
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("SignBridgeAPI")

app = FastAPI(title="SignBridge AI API")

# GLOBAL VARIABLE FOR MODEL
MODEL = None

# ✅ SUGGESTION: Use Lifespan or Global Loading
@app.on_event("startup")
def load_model():
    global MODEL
    try:
        # If your predict_sign function loads the pkl internally, 
        # ensure it uses a global variable or cache.
        from predict_sign import predict_sign
        logger.info("✅ ML Model and Prediction Function Loaded")
    except ImportError as e:
        logger.error(f"❌ Failed to import predict_sign: {e}")

# ✅ FIX: Updated CORS for Production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://sign-bridge-frontend-six.vercel.app/"], # For production, replace with your specific Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Static File Serving
if os.path.exists("signs"):
    app.mount("/signs", StaticFiles(directory="signs"), name="signs")
    logger.info("📂 Signs folder mounted")
else:
    logger.warning("⚠️ 'signs' folder not found!")

# --- ENDPOINTS ---

@app.get("/")
async def home():
    return {"message": "🚀 SignBridge AI Backend is Live", "status": "running"}

@app.get("/list-signs")
async def list_signs():
    if not os.path.exists("signs"):
        return {"available_signs": []}
    files = os.listdir("signs")
    # Clean list of available sign names
    signs = [f.split(".")[0].lower() for f in files if f.endswith(".gif")]
    return {"available_signs": signs}

@app.post("/predict")
async def predict(request: Request):
    try:
        data = await request.json()
        image_data = data.get("image")
        
        if not image_data:
            raise HTTPException(status_code=400, detail="No image")

        # Base64 to Image
        header, encoded = image_data.split(",", 1) if "," in image_data else (None, image_data)
        img_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return {"sign": "Error", "confidence": 0}

        # Use the imported prediction function
        # This function should load model.pkl globally once
        from predict_sign import predict_sign
        sign_name, confidence, landmarks = predict_sign(frame)

        return {
            "sign": sign_name,
            "confidence": round(float(confidence), 2),
            "landmarks": landmarks
        }

    except Exception as e:
        logger.error(f"Prediction Error: {str(e)}")
        return {"sign": "Offline", "error": str(e)}

if __name__ == "__main__":
    
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)