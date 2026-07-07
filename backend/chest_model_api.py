from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import BlipForConditionalGeneration, AutoProcessor
from PIL import Image
from pathlib import Path
import torch
import io
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths to model files
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "xray_models" / "chest" / "hf_model"
PROCESSOR_DIR = BASE_DIR / "xray_models" / "chest" / "hf_processor"

# Initialize FastAPI app
app = FastAPI(
    title="RadiantClariX Chest Model API",
    description="API for chest X-ray image analysis using BLIP model",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and processor
model = None
processor = None
device = None

@app.on_event("startup")
async def load_model():
    """Load the model and processor on startup"""
    global model, processor, device
    
    try:
        logger.info("Loading model and processor...")
        
        # Set device
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {device}")
        
        # Check if model directories exist
        if not MODEL_DIR.exists():
            raise FileNotFoundError(f"Model directory not found: {MODEL_DIR}")
        if not PROCESSOR_DIR.exists():
            raise FileNotFoundError(f"Processor directory not found: {PROCESSOR_DIR}")
        
        # Load model and processor
        model = BlipForConditionalGeneration.from_pretrained(str(MODEL_DIR)).to(device)
        processor = AutoProcessor.from_pretrained(str(PROCESSOR_DIR))
        model.eval()
        
        logger.info("Model and processor loaded successfully!")
        
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        raise e

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "RadiantClariX Chest Model API is running",
        "status": "healthy",
        "model_loaded": model is not None
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "processor_loaded": processor is not None,
        "device": device
    }

@app.post("/predict")
async def predict_caption(file: UploadFile = File(...)):
    """
    Predict caption for chest X-ray image
    
    Args:
        file: Image file (jpg, png, etc.)
    
    Returns:
        JSON with caption and metadata
    """
    try:
        # Validate file
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and process image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Prepare inputs
        inputs = processor(images=image, return_tensors="pt").to(device)
        
        # Generate caption
        with torch.no_grad():
            generated_ids = model.generate(
                **inputs, 
                max_length=128, 
                num_beams=5,
                early_stopping=True
            )
            caption = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        
        logger.info(f"Generated caption: {caption}")
        
        return {
            "caption": caption,
            "model": "BLIP Chest X-ray",
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "chest_model_api:app",
        host="0.0.0.0",
        port=8502,
        reload=True,
        log_level="info"
    )
