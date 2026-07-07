# 🚀 RadiantClariX - Quick Start Commands

## 📋 TL;DR - Start Everything

```powershell
# 1. Navigate to backend
cd backend

# 2. Run pre-flight check (optional but recommended)
python preflight-check.py

# 3. Start all services
.\start-all-services.ps1

# 4. Get your IP address
.\get-ip.ps1

# 5. Update services/api.js with your IP (line 22-23)

# 6. Start React Native app (in new terminal, from root folder)
cd ..
npm start
```

---

## 📝 Detailed Commands

### First Time Setup

```powershell
# Backend - Node.js
cd backend
npm install

# Backend - Python
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install fastapi uvicorn transformers torch pillow python-multipart

# Frontend
cd ..
npm install
```

### Every Time You Start Development

**Option 1: All-in-One (Recommended)**
```powershell
cd backend
.\start-all-services.ps1
```

**Option 2: Separate Terminals**

Terminal 1:
```bash
cd backend
node server.js
```

Terminal 2:
```powershell
cd backend
.\start-model-service.ps1
```

Terminal 3:
```bash
npm start
```

---

## 🧪 Testing Commands

### Test Python Model
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python test_model.py
```

### Test API Endpoints
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python test_api.py
```

### Test with Curl
```powershell
# Health check
curl http://localhost:8502/health

# Predict (with image)
curl -X POST http://localhost:8502/predict -F "file=@path/to/image.jpg"
```

### Check Pre-Flight
```powershell
cd backend
python preflight-check.py
```

---

## 🌐 Network Configuration Commands

### Get Your IP Address
```powershell
cd backend
.\get-ip.ps1
```

Or manually:
```powershell
ipconfig
# Look for IPv4 Address
```

### Test from Phone Browser
```
http://YOUR_IP:8502/health
http://YOUR_IP:5000
```

---

## 🛠️ Troubleshooting Commands

### Restart Services
```powershell
# Stop (Ctrl+C in both terminal windows)
# Then restart
cd backend
.\start-all-services.ps1
```

### Reinstall Python Packages
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install --upgrade fastapi uvicorn transformers torch pillow python-multipart
```

### Reinstall Node Packages
```bash
cd backend
rm -rf node_modules
npm install
```

### Check What's Running on Ports
```powershell
# Check port 5000
netstat -ano | findstr :5000

# Check port 8502
netstat -ano | findstr :8502
```

### Kill Process on Port
```powershell
# Find PID
netstat -ano | findstr :8502

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F
```

---

## 📱 React Native Commands

### Start Development Server
```bash
npm start
```

### Run on Android
```bash
npm run android
```

### Run on iOS
```bash
npm run ios
```

### Clear Cache
```bash
npm start -- --clear
```

### View Logs
```bash
# In Expo
Press 'j' to open Chrome DevTools
```

---

## 🔍 Diagnostic Commands

### Check Python Version
```bash
python --version
```

### Check Node Version
```bash
node --version
npm --version
```

### List Python Packages
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip list
```

### Check Model Files
```powershell
dir backend\xray_models\chest\hf_model
dir backend\xray_models\chest\hf_processor
```

---

## 💾 File Update Commands

### Update IP in Frontend
```bash
# Edit services/api.js
# Find lines 22-23 and update:
const DEVELOPMENT_API_URL = 'http://YOUR_IP:5000/api';
const MODEL_API_URL = 'http://YOUR_IP:8502';
```

---

## 🎯 Complete Workflow

```powershell
# === FIRST TIME SETUP ===

# 1. Install backend dependencies
cd backend
npm install

# 2. Create Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install fastapi uvicorn transformers torch pillow python-multipart

# 3. Install frontend dependencies
cd ..
npm install

# 4. Run pre-flight check
cd backend
python preflight-check.py


# === EVERY TIME YOU DEVELOP ===

# 1. Start all services (in backend folder)
cd backend
.\start-all-services.ps1

# 2. Get your IP address
.\get-ip.ps1

# 3. Update services/api.js if IP changed

# 4. Start React Native (in root folder)
cd ..
npm start

# 5. Test in app:
#    - Select Chest X-ray
#    - Enter patient name
#    - Upload image
#    - Click "Upload & Analyze"
#    - View results


# === TESTING ===

# Test model
cd backend
.\venv\Scripts\Activate.ps1
python test_model.py

# Test API
python test_api.py

# Test endpoints
curl http://localhost:8502/health
curl http://localhost:5000
```

---

## 📞 Quick Reference

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Node.js Backend | 5000 | http://localhost:5000 | Auth & User Management |
| Python AI Model | 8502 | http://localhost:8502 | Chest X-ray Analysis |
| React Native | 8081 | Metro Bundler | Mobile App |

---

## ⚡ PowerShell Scripts Reference

| Script | Purpose |
|--------|---------|
| `start-all-services.ps1` | Start both Node.js and Python services |
| `start-model-service.ps1` | Start only Python AI model |
| `get-ip.ps1` | Get your local IP address |
| `preflight-check.py` | Verify all dependencies |
| `test_model.py` | Test model loading |
| `test_api.py` | Test API endpoints |

---

## 🎨 Alternative Methods

### If PowerShell Scripts Don't Work

Use batch files instead:
```cmd
cd backend
start-model-service.bat
```

Or run Python directly:
```bash
cd backend
venv\Scripts\activate
python chest_model_api.py
```

---

## ✨ Pro Tips

1. **Keep terminals open** - Don't close the service windows
2. **Check IP regularly** - It may change if you reconnect to WiFi
3. **Use pre-flight check** - Run before each session
4. **Monitor console logs** - They show connection status
5. **Test incrementally** - Test each component separately first

---

**Need help? Check `INTEGRATION-CHECKLIST.md` for detailed troubleshooting!**
