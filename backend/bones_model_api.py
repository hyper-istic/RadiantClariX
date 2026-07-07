from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchvision
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision import transforms
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import io
import base64
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths to model files
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "xray_models" / "bones" / "resnet.pt"  # Updated to resnet.pt

# Initialize FastAPI app
app = FastAPI(
    title="RadiantClariX Bones Model API",
    description="API for bone fracture detection using ResNet-based Faster R-CNN",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model
model = None
device = None

# Class names (from bones_final.ipynb)
CLASS_NAMES = [
    'elbow positive',
    'fingers positive',
    'forearm fracture',
    'humerus fracture',
    'humerus',
    'shoulder fracture',
    'wrist positive'
]
NUM_CLASSES = len(CLASS_NAMES)

CLASS_COLORS = {
    'elbow positive': (255, 0, 0),        # Red
    'fingers positive': (255, 165, 0),    # Orange
    'forearm fracture': (0, 255, 0),      # Green
    'humerus fracture': (0, 0, 255),      # Blue
    'humerus': (128, 0, 128),             # Purple
    'shoulder fracture': (255, 255, 0),   # Yellow
    'wrist positive': (0, 255, 255)       # Cyan
}

@app.on_event("startup")
async def load_model():
    """Load the ResNet-based Faster R-CNN model on startup"""
    global model, device
    
    try:
        logger.info("Loading ResNet-based Faster R-CNN model for bone fracture detection...")
        
        # Set device
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {device}")
        
        # Check if model file exists
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
        
        # Load model with pretrained ResNet50 backbone
        model = torchvision.models.detection.fasterrcnn_resnet50_fpn(pretrained=True)
        in_features = model.roi_heads.box_predictor.cls_score.in_features
        model.roi_heads.box_predictor = FastRCNNPredictor(in_features, NUM_CLASSES)
        
        # Load trained weights
        model.load_state_dict(torch.load(str(MODEL_PATH), map_location=device))
        model.to(device)
        model.eval()
        
        logger.info("ResNet Bones model loaded successfully!")
        
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        raise e

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "RadiantClariX Bones Model API is running",
        "status": "healthy",
        "model_loaded": model is not None
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy" if model is not None else "unhealthy",
        "model_loaded": model is not None,
        "device": str(device) if device else "not initialized",
        "model_type": "Faster R-CNN",
        "num_classes": len(CLASS_NAMES),
        "classes": CLASS_NAMES
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Predict bone fractures in uploaded X-ray image
    
    Returns:
    - detections: number of fractures detected
    - image_base64: annotated image with bounding boxes
    - findings: list of detected fractures with details
    - caption: text description of findings
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Transform image for model
        transform = transforms.Compose([transforms.ToTensor()])
        img_tensor = transform(image).unsqueeze(0).to(device)
        
        # Run inference
        with torch.no_grad():
            outputs = model(img_tensor)
        
        # Extract predictions
        boxes = outputs[0]['boxes'].cpu()
        scores = outputs[0]['scores'].cpu()
        labels = outputs[0]['labels'].cpu()
        
        # Filter by confidence threshold
        threshold = 0.5
        filtered_indices = scores > threshold
        filtered_boxes = boxes[filtered_indices]
        filtered_scores = scores[filtered_indices]
        filtered_labels = labels[filtered_indices]
        
        # Prepare findings list
        findings = []
        for i in range(len(filtered_boxes)):
            label_idx = int(filtered_labels[i].item())
            label_name = CLASS_NAMES[label_idx] if label_idx < len(CLASS_NAMES) else f"class_{label_idx}"
            confidence = float(filtered_scores[i].item())
            
            findings.append({
                "type": label_name,
                "confidence": round(confidence * 100, 1),
                "box": [float(x) for x in filtered_boxes[i].tolist()]
            })
        
        # Draw annotations on image
        draw = ImageDraw.Draw(image)
        try:
            # Try to use a larger font
            font = ImageFont.truetype("arial.ttf", 30)
        except:
            # Fallback to default font
            font = ImageFont.load_default()
        
        for i, box in enumerate(filtered_boxes):
            x1, y1, x2, y2 = box
            label_idx = int(filtered_labels[i].item())
            label_name = CLASS_NAMES[label_idx] if label_idx < len(CLASS_NAMES) else f"class_{label_idx}"
            color = CLASS_COLORS.get(label_name, (255, 0, 0))
            score = filtered_scores[i].item()
            
            # Draw bounding box
            draw.rectangle([(x1, y1), (x2, y2)], outline=color, width=3)
            
            # Draw label with background
            label_text = f"{label_name}: {score:.2f}"
            bbox = draw.textbbox((x1, y1), label_text, font=font)
            draw.rectangle(bbox, fill=color)
            draw.text((x1 + 5, y1 + 5), label_text, fill=(255, 255, 255), font=font)
        
        # Convert annotated image to base64
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        # Generate text caption
        if len(findings) == 0:
            caption = "No fractures detected in the bone X-ray. The bones appear to be intact with no visible abnormalities."
        else:
            fracture_list = [f"{f['type']} ({f['confidence']}% confidence)" for f in findings]
            caption = f"Detected {len(findings)} potential fracture(s): {', '.join(fracture_list)}. "
            caption += "Please consult with a medical professional for proper diagnosis and treatment."
        
        return {
            "success": True,
            "detections": len(filtered_boxes),
            "image_base64": f"data:image/jpeg;base64,{img_str}",
            "findings": findings,
            "caption": caption
        }
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "bones_model_api:app",
        host="0.0.0.0",
        port=8503,
        log_level="info"
    )
