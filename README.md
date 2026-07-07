<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:6A5AF9,100:2E9EF7&height=180&section=header&text=RadiantClariX&fontSize=40&fontColor=ffffff&animation=fadeIn&fontAlignY=40&desc=AI-Powered%20X-Ray%20Analysis%20Application&descAlignY=62&descSize=16" width="100%"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-2E9EF7?style=for-the-badge" alt="Version"/>
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge" alt="Status"/>
  <img src="https://img.shields.io/badge/license-Educational%20Use-lightgrey?style=for-the-badge" alt="License"/>
</p>

<p align="center">
  <a href="https://github.com/hyper-istic/RadiantClariX/stargazers"><img src="https://img.shields.io/github/stars/hyper-istic/RadiantClariX?style=social" alt="Stars"/></a>
  <a href="https://github.com/hyper-istic/RadiantClariX/network/members"><img src="https://img.shields.io/github/forks/hyper-istic/RadiantClariX?style=social" alt="Forks"/></a>
</p>

<p align="center">
  <img src="https://skillicons.dev/icons?i=python,react,nodejs,mongodb,pytorch&theme=dark"/>
</p>

RadiantClariX is an AI-powered medical imaging application that analyzes chest X-rays and detects bone fractures, generating detailed diagnostic reports for healthcare professionals, medical students, and clinics. Built as an AI thesis/portfolio project, it pairs a dual deep-learning pipeline with a mobile-first React Native frontend.

> ⚠️ **For educational and preliminary-analysis purposes only — not a substitute for professional medical diagnosis.** See [Disclaimers](#-important-disclaimers) below.

🔗 **Repo:** [github.com/hyper-istic/RadiantClariX](https://github.com/hyper-istic/RadiantClariX)

---

## 📋 Table of Contents

- [Key Features](#-key-features)
- [About the AI Models](#-about-the-ai-models)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [User Guide](#-user-guide)
- [Ports & Services](#-ports--services)
- [Troubleshooting](#-troubleshooting)
- [Privacy & Security](#-privacy--security)
- [FAQ](#-faq)
- [Important Disclaimers](#-important-disclaimers)
- [Version Info](#-version-info)

---

## ✨ Key Features

**Dual AI Models**
- 🫁 **Chest X-Ray Analyzer** — generates detailed textual descriptions of chest X-rays, including visible anatomical features, abnormalities, and medical devices, with both technical and plain-language explanations (powered by **BLIP** image captioning)
- 🦴 **Bone Fracture Detector** — identifies **7 types of bone injuries** with bounding boxes and confidence scores

**User Experience**
- 🌗 Dark & light theme
- 📤 Easy image upload (camera or gallery)
- ⚡ Real-time analysis
- 🕘 Scan history
- 📄 One-tap PDF export

**Security**
- 🔐 Authentication system
- 🔒 Encrypted data storage
- 🗑️ Full account & data deletion on request

---

## 🧠 About the AI Models

| Model | Architecture | Purpose |
|---|---|---|
| Chest X-Ray Analyzer | BLIP (Bootstrapping Language-Image Pretraining) | Detects lung/heart issues & visible medical devices, generates image captions |
| Bone Fracture Detector | Faster R-CNN with ResNet-50 backbone | Detects 7 fracture types with bounding boxes + confidence scores |

AI confidence scores can vary, and false positives/negatives are possible — models are updated regularly to improve accuracy.

---

## 🛠️ Tech Stack

- **Frontend:** React Native (Expo)
- **Backend:** Python, Node.js
- **Database:** MongoDB
- **ML:** BLIP, Faster R-CNN (ResNet-50)

---

## 📁 Project Structure

```
RadiantClariX/
├── android/          # Native Android project (Expo)
├── assets/           # Images, fonts, icons
├── backend/          # Backend services (chest & bone AI model servers, API)
├── components/       # Reusable React Native components
├── context/          # React context / global state
├── docs/             # Additional documentation
├── models-train/     # Training notebooks & evaluation results
├── pages/            # App screens
├── services/         # API clients / service layer
├── App.js            # App entry point
├── app.json           # Expo config
└── package.json
```

> The frontend is the project root itself (Expo/React Native) — there's no separate `frontend/` folder.

---

## 🧩 Model Weights

The `models-train/` folder in this repo holds the training notebooks and evaluation results — the actual trained weights are hosted on Hugging Face Hub instead, since they're too large for standard Git:

| Model | Hugging Face Repo |
|---|---|
| Chest X-Ray Analyzer (BLIP) | [`hyper-istic/radiantclarix-chest-blip`](https://huggingface.co/hyper-istic/radiantclarix-chest-blip) |
| Bone Fracture Detector (ResNet-50) | [`hyper-istic/radiantclarix-bones-resnet`](https://huggingface.co/hyper-istic/radiantclarix-bones-resnet) |

`inference_script.py` pulls both automatically at runtime — no manual download needed.

---

## 📦 Getting Started

### Prerequisites
- Windows 10/11
- Python 3.8+
- Node.js 14+
- 8 GB RAM minimum, 5 GB free disk space
- [Expo Go](https://expo.dev/go) app (for mobile) or a web browser

### 0. Clone the repo
```bash
git clone https://github.com/hyper-istic/RadiantClariX.git
cd RadiantClariX
```

### 1. Start the backend services
```bash
cd backend
.\start-all-services.ps1
```
> Adjust this if your backend's actual startup script or path differs from what's shown here.

### 2. Start the frontend app
The frontend lives at the repo root (`App.js`, `app.json`, `package.json`), so from the project root:
```bash
npm install
npm start
```

### 3. Open the app
Scan the QR code with **Expo Go** on mobile, or launch it in an emulator / web browser.

---

## 📱 User Guide

1. **Register or log in** with email and password
2. From the **Dashboard**: Upload & Analyze, View History, Settings, or Logout
3. **Upload & Analyze:**
   - Select a model (Chest / Bone)
   - Enter patient name
   - Upload an image (camera or gallery) — analysis starts automatically
4. **Review results:**
   - Technical report (for professionals)
   - Plain-language report (for patients)
   - Generate PDF, start a new scan, or view the annotated image
5. **Scan History** keeps a full record of past scans, reports, and dates
6. **Settings** covers account info, theme, password changes, and history/account deletion

---

## 🔌 Ports & Services

| Port | Service |
|---|---|
| 5000 | Backend API |
| 8502 | Chest X-Ray AI Model |
| 8503 | Bone Fracture Model |
| 8081 | Expo Dev Server |

---

## 🐛 Troubleshooting

<details>
<summary><b>App won't start</b></summary>

Make sure the backend services are running, then restart both backend and frontend.
</details>

<details>
<summary><b>Login issues</b></summary>

Double-check your credentials and internet connection.
</details>

<details>
<summary><b>Upload issues</b></summary>

Grant the required permissions, restart the app, and confirm the AI models are running.
</details>

<details>
<summary><b>History not updating</b></summary>

Refresh or restart the app.
</details>

<details>
<summary><b>Performance issues</b></summary>

Restart the backend, use smaller images, and clear the app cache.
</details>

---

## 🔒 Privacy & Security

- Passwords are encrypted and hashed
- Data is stored securely in MongoDB
- Users can view, delete, or export their data at any time
- **Recommended:** use strong passwords, log out on shared devices, and back up reports regularly

---

## ❓ FAQ

**Is this suitable for medical diagnosis?**
No — for preliminary analysis only.

**Is offline mode supported?**
No, an internet connection is required.

**How many scans can I store?**
Unlimited, but generated reports are only available for **15 days** from creation.

**Can I share reports?**
Yes, via PDF export.

**Is my data private?**
Yes — fully private, user-only access.

---

## ⚠️ Important Disclaimers

**Medical Disclaimer:** For educational use only. This app does not replace a professional diagnosis — always consult a qualified healthcare professional for treatment decisions.

**Accuracy Notice:** AI confidence scores vary, and false positives/negatives are possible. Models are updated periodically to improve accuracy.

---

## 📌 Version Info

| | |
|---|---|
| **Application Version** | 1.0.0 |
| **Release Date** | October 2025 |
| **Last Updated** | October 30, 2025 |

---
<p align="center"><i>Built with 🩻 + 🧠 as part of an AI research portfolio. For technical support, contact the project maintainer.</i></p>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:2E9EF7,100:6A5AF9&height=100&section=footer" width="100%"/>
