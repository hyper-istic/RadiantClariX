from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from transformers import BlipForConditionalGeneration, AutoProcessor
from PIL import Image
from pathlib import Path
import torch, io

# Paths
BASE_DIR = Path(__file__).resolve().parent / "chest"
MODEL_DIR = BASE_DIR / "hf_model"
PROC_DIR = BASE_DIR / "hf_processor"

# Init FastAPI
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once
device = "cuda" if torch.cuda.is_available() else "cpu"
model = BlipForConditionalGeneration.from_pretrained(str(MODEL_DIR)).to(device)
processor = AutoProcessor.from_pretrained(str(PROC_DIR))
model.eval()

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    img_bytes = await file.read()
    image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        ids = model.generate(**inputs, max_length=128)
        caption = processor.batch_decode(ids, skip_special_tokens=True)[0]
    return {"caption": caption}
