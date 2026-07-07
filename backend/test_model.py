#!/usr/bin/env python3
"""
Test script for the chest model
"""
import sys
from pathlib import Path
from transformers import BlipForConditionalGeneration, AutoProcessor
from PIL import Image
import torch

def test_model_loading():
    """Test if the model can be loaded successfully"""
    print("🧪 Testing model loading...")
    
    # Paths
    BASE_DIR = Path(__file__).resolve().parent
    MODEL_DIR = BASE_DIR / "xray_models" / "chest" / "hf_model"
    PROCESSOR_DIR = BASE_DIR / "xray_models" / "chest" / "hf_processor"
    
    try:
        # Check if directories exist
        if not MODEL_DIR.exists():
            print(f"❌ Model directory not found: {MODEL_DIR}")
            return False
            
        if not PROCESSOR_DIR.exists():
            print(f"❌ Processor directory not found: {PROCESSOR_DIR}")
            return False
        
        print(f"✅ Model directory found: {MODEL_DIR}")
        print(f"✅ Processor directory found: {PROCESSOR_DIR}")
        
        # Set device
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🖥️  Using device: {device}")
        
        # Load model
        print("📦 Loading model...")
        model = BlipForConditionalGeneration.from_pretrained(str(MODEL_DIR)).to(device)
        print("✅ Model loaded successfully!")
        
        # Load processor
        print("🔧 Loading processor...")
        processor = AutoProcessor.from_pretrained(str(PROCESSOR_DIR))
        print("✅ Processor loaded successfully!")
        
        # Test with a dummy image
        print("🖼️  Testing with dummy image...")
        dummy_image = Image.new('RGB', (224, 224), color='white')
        
        # Process image
        inputs = processor(images=dummy_image, return_tensors="pt").to(device)
        
        # Generate caption
        with torch.no_grad():
            generated_ids = model.generate(**inputs, max_length=128)
            caption = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        
        print(f"📝 Generated caption: {caption}")
        print("✅ Model inference test passed!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Starting chest model test...")
    success = test_model_loading()
    
    if success:
        print("\n🎉 All tests passed! Model is ready to use.")
        sys.exit(0)
    else:
        print("\n💥 Tests failed! Check the errors above.")
        sys.exit(1)
