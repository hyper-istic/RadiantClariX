"""
Test script to verify the chest X-ray model API is working correctly
Run this after starting the model service to ensure everything is set up properly
"""
import requests
import sys
from pathlib import Path
from PIL import Image
import io

def test_health_endpoint():
    """Test the health check endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get("http://localhost:8502/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed!")
            print(f"   Status: {data.get('status')}")
            print(f"   Model loaded: {data.get('model_loaded')}")
            print(f"   Device: {data.get('device')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Is the server running?")
        print("   Run: .\\start-model-service.ps1")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_predict_endpoint():
    """Test the predict endpoint with a dummy image"""
    print("\n🔍 Testing predict endpoint...")
    try:
        # Create a dummy image
        dummy_image = Image.new('RGB', (224, 224), color='white')
        img_byte_arr = io.BytesIO()
        dummy_image.save(img_byte_arr, format='JPEG')
        img_byte_arr.seek(0)
        
        # Send request
        files = {'file': ('test_image.jpg', img_byte_arr, 'image/jpeg')}
        response = requests.post("http://localhost:8502/predict", files=files)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Prediction test passed!")
            print(f"   Caption: {data.get('caption')}")
            print(f"   Model: {data.get('model')}")
            print(f"   Status: {data.get('status')}")
            return True
        else:
            print(f"❌ Prediction test failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("=" * 50)
    print("  RadiantClariX Model API Test")
    print("=" * 50)
    print()
    
    # Test health endpoint
    health_ok = test_health_endpoint()
    
    if not health_ok:
        print("\n❌ Cannot proceed with further tests")
        sys.exit(1)
    
    # Test predict endpoint
    predict_ok = test_predict_endpoint()
    
    print("\n" + "=" * 50)
    if health_ok and predict_ok:
        print("✅ All tests passed! API is working correctly.")
        print("\n📱 You can now:")
        print("   1. Update services/api.js with your IP address")
        print("   2. Start your React Native app")
        print("   3. Test the upload feature in the app")
    else:
        print("❌ Some tests failed. Check the errors above.")
    print("=" * 50)

if __name__ == "__main__":
    # Install requests if not available
    try:
        import requests
    except ImportError:
        print("📦 Installing requests package...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
        import requests
    
    main()
