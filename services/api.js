// services/api.js
// API service layer for backend communication

// ============================================
// API URL CONFIGURATION
// ============================================
// 
// FOR DEVELOPMENT (Testing on your device):
// 1. Find your computer's IP address:
//    - Windows: CMD → ipconfig → IPv4 Address
//    - Mac/Linux: Terminal → ifconfig → inet address
// 2. Replace 'YOUR_LOCAL_IP' below with your actual IP
// 3. Make sure your phone and computer are on same WiFi
//
// FOR PRODUCTION (When deploying app):
// 1. Deploy backend to Railway/Render/Heroku
// 2. Replace PRODUCTION_API_URL with your deployed URL
// 3. Set IS_PRODUCTION to true when building APK
// ============================================

const IS_PRODUCTION = false; // Set to true when building production APK

const DEVELOPMENT_API_URL = 'http://192.168.1.70:5000/api'; // Backend API URL
const PRODUCTION_API_URL = 'https://your-backend-url.com/api'; // Replace with your production URL
const CHEST_MODEL_API_URL = 'http://192.168.1.70:8502'; // Chest Model API URL
const BONES_MODEL_API_URL = 'http://192.168.1.70:8503'; // Bones Model API URL


// Automatically select URL based on environment
const API_URL = IS_PRODUCTION ? PRODUCTION_API_URL : DEVELOPMENT_API_URL;
console.log('🌐 API URL:', API_URL); // Debug log to see which URL is being used

// Auth API endpoints

//ChestModel API endpoints EXPORTED TO USE IN THE APP
export const modelAPI = {
  predictCaption: async (imageUri) => {
    try {
      console.log("🩻 Sending chest X-ray request to:", `${CHEST_MODEL_API_URL}/predict`);
      console.log("📸 Image URI:", imageUri);
      
      // Determine file extension and mime type
      const fileExtension = imageUri.split('.').pop().toLowerCase();
      let mimeType = 'image/jpeg';
      if (fileExtension === 'png') mimeType = 'image/png';
      else if (fileExtension === 'jpg' || fileExtension === 'jpeg') mimeType = 'image/jpeg';
      
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        type: mimeType,
        name: `chest_xray.${fileExtension}`,
      });

      const response = await fetch(`${CHEST_MODEL_API_URL}/predict`, {
        method: "POST",
        body: formData,
        headers: {
          'Accept': 'application/json',
          // Don't set Content-Type - let it auto-generate with boundary
        },
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Model response:", data);
      return data.caption;
    } catch (error) {
      console.error("❌ Model API Error:", error);
      console.error("❌ Error details:", error.message);
      throw new Error(`Could not connect to model backend: ${error.message}`);
    }
  },

  // Translate technical medical text to plain language using Hugging Face
  translateToPlainLanguage: async (technicalText) => {
    try {
      console.log("🔄 Translating to plain language...");
      
      // Use Hugging Face's free inference API with FLAN-T5 model
      const prompt = `Simplify this medical report into easy-to-understand language for a regular person. Keep it short and clear:\n\nMedical Report: ${technicalText}\n\nSimple Explanation:`;
      
      const response = await fetch(
        "https://api-inference.huggingface.co/models/google/flan-t5-large",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_length: 200,
              temperature: 0.7,
              top_p: 0.9,
            }
          }),
        }
      );

      if (!response.ok) {
        console.warn("⚠️ Plain language translation failed, using fallback");
        // Fallback: Simple rule-based translation
        return modelAPI.simpleFallbackTranslation(technicalText);
      }

      const result = await response.json();
      const plainText = result[0]?.generated_text || result.generated_text || '';
      
      console.log("✅ Plain language translation:", plainText);
      
      // If translation is empty or too short, use fallback
      if (!plainText || plainText.length < 10) {
        return modelAPI.simpleFallbackTranslation(technicalText);
      }
      
      return plainText.trim();
    } catch (error) {
      console.warn("⚠️ Translation error, using fallback:", error.message);
      return modelAPI.simpleFallbackTranslation(technicalText);
    }
  },

  // Simple fallback translation using basic text replacement
  simpleFallbackTranslation: (technicalText) => {
    // Check if this is a bone fracture detection result (structured format)
    if (technicalText.includes('Detected') && technicalText.includes('potential fracture')) {
      // Parse the structured bone fracture text
      const match = technicalText.match(/Detected (\d+) potential fracture\(s\):\s*(.+?)\.\s*Please/i);
      
      if (match) {
        const count = match[1];
        const findingsText = match[2];
        
        // Parse individual findings (format: "bone_name (XX.X% confidence)")
        const findings = findingsText.split(',').map(f => f.trim());
        
        // Build simplified explanation
        let simplified = '';
        
        if (count === '0') {
          simplified = 'Great news! No broken bones were detected in the X-ray image. Your bones appear to be healthy and intact.';
        } else {
          // Create a friendly intro
          const boneWord = count === '1' ? 'injury' : 'injuries';
          simplified = `The X-ray scan found ${count} possible bone ${boneWord}:\n\n`;
          
          // List each finding with simplified bone names
          findings.forEach((finding, index) => {
            // Extract bone name and confidence
            const findingMatch = finding.match(/(.+?)\s*\((.+?)%\s*confidence\)/i);
            if (findingMatch) {
              const boneName = findingMatch[1].trim();
              const confidence = findingMatch[2].trim();
              
              // Simplify bone names
              const simpleBoneName = boneName
                .replace(/humerus/i, 'upper arm bone')
                .replace(/forearm fracture/i, 'forearm injury')
                .replace(/elbow positive/i, 'elbow injury')
                .replace(/wrist positive/i, 'wrist injury')
                .replace(/fingers positive/i, 'finger injury')
                .replace(/shoulder fracture/i, 'shoulder injury')
                .replace(/fracture/i, 'break')
                .replace(/positive/i, 'injury');
              
              simplified += `${index + 1}. ${simpleBoneName.charAt(0).toUpperCase() + simpleBoneName.slice(1)} - detected with ${confidence}% confidence\n`;
            }
          });
          
          simplified += '\nImportant: This is a preliminary analysis. Please consult a qualified healthcare professional for proper medical diagnosis and treatment recommendations.';
        }
        
        return simplified;
      }
    }
    
    // For chest X-rays and other medical reports (original logic)
    let simplified = technicalText.toLowerCase();
    
    // Comprehensive medical term replacements
    const replacements = {
      // Devices and Equipment
      'icd': 'heart device',
      'catheter': 'tube',
      'catheters': 'tubes',
      'endotracheal tube': 'breathing tube',
      'nasogastric tube': 'feeding tube',
      'ng tube': 'feeding tube',
      'pacemaker': 'heart device',
      'stent': 'support tube',
      'shunt': 'drainage tube',
      'drain': 'tube',
      
      // Positions and Locations
      'in situ': 'in place',
      'insitu': 'in place',
      'distal': 'lower',
      'proximal': 'upper',
      'lateral': 'side',
      'medial': 'middle',
      'anterior': 'front',
      'posterior': 'back',
      'superior': 'upper',
      'inferior': 'lower',
      'bilateral': 'on both sides',
      'unilateral': 'on one side',
      'ipsilateral': 'same side',
      'contralateral': 'opposite side',
      'apical': 'top',
      'basal': 'bottom',
      
      // Lung Conditions
      'pneumothorax': 'collapsed lung',
      'collapsed lung': 'air leak causing lung to deflate',
      'atelectasis': 'partially collapsed lung area',
      'consolidation': 'lung area filled with fluid',
      'infiltrate': 'fluid or infection in lung',
      'opacity': 'cloudy area',
      'pleural effusion': 'fluid around the lung',
      'hemothorax': 'blood around the lung',
      'pneumonia': 'lung infection',
      'emphysema': 'damaged air sacs in lungs',
      'fibrosis': 'scarring',
      'pulmonary': 'lung-related',
      
      // Heart Conditions
      'cardiomegaly': 'enlarged heart',
      'cardiac': 'heart-related',
      'pericardial effusion': 'fluid around the heart',
      'myocardial': 'heart muscle',
      'ventricular': 'heart chamber',
      'atrial': 'upper heart chamber',
      
      // General Medical Terms
      'lesion': 'abnormal area',
      'nodule': 'small round spot',
      'mass': 'large abnormal lump',
      'tumor': 'growth',
      'neoplasm': 'growth',
      'cyst': 'fluid-filled sac',
      'edema': 'swelling',
      'oedema': 'swelling',
      'hemorrhage': 'bleeding',
      'haemorrhage': 'bleeding',
      'thrombus': 'blood clot',
      'embolus': 'traveling blood clot',
      'ischemia': 'lack of blood flow',
      'necrosis': 'dead tissue',
      'inflammation': 'swelling and irritation',
      'stenosis': 'narrowing',
      'occlusion': 'blockage',
      'perforation': 'hole',
      'rupture': 'tear',
      
      // Descriptive Terms
      'abnormality': 'something unusual',
      'pathology': 'disease',
      'benign': 'not cancerous',
      'malignant': 'cancerous',
      'acute': 'sudden or severe',
      'chronic': 'long-lasting',
      'diffuse': 'widespread',
      'focal': 'in one spot',
      'localized': 'in one area',
      'extensive': 'widespread',
      'moderate': 'medium amount',
      'severe': 'serious',
      'mild': 'slight',
      'significant': 'important',
      'unremarkable': 'normal',
      'remarkable': 'unusual',
      
      // Imaging Terms
      'radiopaque': 'shows up bright on x-ray',
      'radiolucent': 'shows up dark on x-ray',
      'lucency': 'dark area',
      'density': 'bright area',
      'calcification': 'calcium buildup',
      'artifact': 'false image',
      
      // Actions and Processes
      'demonstrate': 'show',
      'demonstrates': 'shows',
      'visualized': 'seen',
      'identified': 'found',
      'noted': 'seen',
      'present': 'there',
      'absent': 'not there',
      'consistent with': 'looks like',
      'suggestive of': 'might be',
      'compatible with': 'could be',
      'indicative of': 'signs of',
    };

    // Replace technical terms with simple ones
    for (const [medical, simple] of Object.entries(replacements)) {
      const regex = new RegExp('\\b' + medical + '\\b', 'gi');
      simplified = simplified.replace(regex, simple);
    }

    // Clean up multiple spaces
    simplified = simplified.replace(/\s+/g, ' ').trim();
    
    // Capitalize first letter
    simplified = simplified.charAt(0).toUpperCase() + simplified.slice(1);
    
    // Make it friendlier
    if (!simplified.startsWith('In simpler terms') && !simplified.startsWith('The image shows')) {
      simplified = `The image shows: ${simplified}`;
    }
    
    return simplified;
  },

  // Bones fracture detection
  predictBoneFractures: async (imageUri) => {
    try {
      console.log("🦴 Sending bone X-ray request to:", `${BONES_MODEL_API_URL}/predict`);
      console.log("📸 Image URI:", imageUri);
      
      // Determine file extension and mime type
      const fileExtension = imageUri.split('.').pop().toLowerCase();
      let mimeType = 'image/jpeg';
      if (fileExtension === 'png') mimeType = 'image/png';
      else if (fileExtension === 'jpg' || fileExtension === 'jpeg') mimeType = 'image/jpeg';
      
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        type: mimeType,
        name: `bone_xray.${fileExtension}`,
      });

      const response = await fetch(`${BONES_MODEL_API_URL}/predict`, {
        method: "POST",
        body: formData,
        headers: {
          'Accept': 'application/json',
          // Don't set Content-Type - let it auto-generate with boundary
        },
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Bones model response:", data);
      
      return {
        detections: data.detections || 0,
        annotatedImage: data.image_base64 || null,
        findings: data.findings || [],
        caption: data.caption || 'Analysis complete',
        message: data.message || 'Analysis complete'
      };
    } catch (error) {
      console.error("❌ Bones Model API Error:", error);
      console.error("❌ Error details:", error.message);
      throw new Error(`Could not connect to bones model backend: ${error.message}`);
    }
  },
};



export const authAPI = {
  // Register new user
  register: async (username, email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Register API Error:', error);
      throw new Error('Network error. Please check your connection.');
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login API Error:', error);
      throw new Error('Network error. Please check your connection.');
    }
  },

  // Get current user
  getMe: async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get Me API Error:', error);
      throw new Error('Network error. Please check your connection.');
    }
  },

  // Logout
  logout: async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Logout API Error:', error);
      throw new Error('Network error. Please check your connection.');
    }
  },
};

// User API endpoints
export const userAPI = {
  // Update username
  updateUsername: async (token, username) => {
    try {
      const response = await fetch(`${API_URL}/user/update-username`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update Username API Error:', error);
      throw new Error('Network error. Please check your connection.');
    }
  },

  // Update theme
  updateTheme: async (token, theme) => {
    try {
      const response = await fetch(`${API_URL}/user/update-theme`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update Theme API Error:', error);
      throw new Error('Network error. Please check your connection.');
    }
  },

  // Change password
  changePassword: async (token, currentPassword, newPassword, confirmPassword) => {
    try {
      const response = await fetch(`${API_URL}/user/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Change Password API Error:', error);
      throw new Error('Network error. Please check your connection.');
    }
  },

  // Delete account
  deleteAccount: async (token, password) => {
    try {
      const response = await fetch(`${API_URL}/user/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Delete Account API Error:', error);
      throw new Error('Network error. Please check your connection.');
    }
  },
};

// Scan History API endpoints
export const scanHistoryAPI = {
  // Save scan to history
  saveScan: async (token, scanData) => {
    try {
      const response = await fetch(`${API_URL}/scan-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scanData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Save Scan API Error:', error);
      throw new Error('Network error. Please check your connection.');
    }
  },

  // Get all scans for user
  getAllScans: async (token) => {
    try {
      const response = await fetch(`${API_URL}/scan-history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get Scans API Error:', error);
      throw new Error('Network error. Please check your connection.');
    }
  },

  // Get single scan by ID
  getScanById: async (token, scanId) => {
    try {
      const response = await fetch(`${API_URL}/scan-history/${scanId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get Scan API Error:', error);
      throw new Error('Network error. Please check your connection.');
    }
  },

  // Delete scan
  deleteScan: async (token, scanId) => {
    try {
      const response = await fetch(`${API_URL}/scan-history/${scanId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Delete Scan API Error:', error);
      throw new Error('Network error. Please check your connection.');
    }
  },

  // Delete all scans (clear history)
  deleteAllScans: async (token) => {
    try {
      const response = await fetch(`${API_URL}/scan-history/all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Delete All Scans API Error:', error);
      throw new Error('Network error. Please check your connection.');
    }
  },
};
