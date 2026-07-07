import React, { useState, useEffect, useRef, useCallback } from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { modelAPI, scanHistoryAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BASE_WIDTH = 432;
const BASE_HEIGHT = 818;
const scaleWidth = SCREEN_WIDTH / BASE_WIDTH;
const scaleHeight = SCREEN_HEIGHT / BASE_HEIGHT;
const scale = Math.min(scaleWidth, scaleHeight);
const responsive = (size) => size * scale;

export default function Upload({ navigation }) {
  const { user } = useAuth();
  
  // States
  const [selectedModel, setSelectedModel] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [image, setImage] = useState(null);
  const [activeButton, setActiveButton] = useState(null);
  const [maxSlide, setMaxSlide] = useState(responsive(130));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [token, setToken] = useState(null);

  // Theme
  const isDarkTheme = !user?.theme || user.theme === 'dark';
  
  // Debug log
  //console.log('Upload Page - user.theme:', user?.theme, 'isDarkTheme:', isDarkTheme);
  
  const colors = {
    background: isDarkTheme ? '#000000' : '#FFFFFF',
    text: isDarkTheme ? '#FFFFFF' : '#000000',
    subtext: isDarkTheme ? '#B0B0B0' : '#666666',
    border: isDarkTheme ? 'transparent' : '#DDDDDD',
    card: isDarkTheme ? '#2a2a2a' : '#F5F5F5',
    input: isDarkTheme ? '#3a3a3a' : '#FFFFFF',
    inputBorder: isDarkTheme ? '#4a4a4a' : '#DDDDDD',
    button: isDarkTheme ? '#2a2a2a' : '#E8E8E8', // Match dashboard
    buttonBorder: isDarkTheme ? 'transparent' : '#DDDDDD', // Match dashboard
    arrowCircle: isDarkTheme ? '#4a4a4a' : '#E8E8E8',
    arrowBorder: isDarkTheme ? '#5a5a5a' : '#DDDDDD',
    arrowText: isDarkTheme ? '#FFFFFF' : '#333333',
  };

  // Animation refs
  const cameraSlideAnim = useRef(new Animated.Value(0)).current;
  const fileSlideAnim = useRef(new Animated.Value(0)).current;
  const arrowOpacity = useRef(new Animated.Value(0)).current;
  const oppositeButtonOpacity = useRef(new Animated.Value(1)).current;

  // Refs for measuring
  const cameraButtonRef = useRef(null);
  const fileButtonRef = useRef(null);
  const buttonContainerRef = useRef(null);

  useEffect(() => {
    (async () => {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cam.status !== "granted") alert("Camera permission required");
      if (lib.status !== "granted") alert("Gallery permission required");
      
      // Load token from storage
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        console.error("Error loading token:", error);
      }
    })();
  }, []);

  // Measure slide distance
  useEffect(() => {
      const measurePositions = () => {
        if (cameraButtonRef.current && fileButtonRef.current && buttonContainerRef.current) {
          cameraButtonRef.current.measureLayout(
            buttonContainerRef.current,
            (cx, cy, cw, ch) => {
              fileButtonRef.current.measureLayout(
                buttonContainerRef.current,
                (fx, fy, fw, fh) => {
                  const neededTranslate = fx - cx;
                  const finalMax = neededTranslate > 0 ? neededTranslate : responsive(100);
                  setMaxSlide(finalMax);
                },
                (err) => console.warn("file measureLayout err", err)
              );
            },
            (err) => console.warn("camera measureLayout err", err)
          );
        }
      };

      const timer = setTimeout(() => {
        measurePositions();
      }, 300);
      return () => clearTimeout(timer);
  }, []);

  // Auto-reset slider position when page comes into focus (after scanning completes)
  useFocusEffect(
    useCallback(() => {
      // Reset all animations to initial state
      cameraSlideAnim.setValue(0);
      fileSlideAnim.setValue(0);
      arrowOpacity.setValue(0);
      oppositeButtonOpacity.setValue(1);
      setActiveButton(null);
    }, [])
  );

  // Handle model selection
  const handleModelSelect = (model) => {
    setSelectedModel(model);
  };

  // Note: we intentionally don't use a separate "continue" submission step.
  // The upload slider appears on step 2 and is locked until `patientName` is non-empty.

  const resetAnimations = () => {
    Animated.parallel([
      Animated.timing(cameraSlideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fileSlideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(arrowOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(oppositeButtonOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setActiveButton(null));
  };

  const handleImagePick = async (source) => {
    const opts = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Remove cropping
      quality: 1,
    };
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      console.log("Image selected:", result.assets[0].uri);
      console.log("Model:", selectedModel);
      console.log("Patient:", patientName);
    }
    resetAnimations();
  };

  const analyzeImage = async (imageUri) => {
    try {
      setIsAnalyzing(true);
      console.log("Starting image analysis...");
      console.log("Model type:", selectedModel);
      
      let technicalReport = '';
      let plainLanguageReport = '';
      let annotatedImageUri = imageUri; // For bones model with bounding boxes
      
      if (selectedModel === 'chest') {
        // Chest X-ray analysis
        console.log("🩻 Analyzing chest X-ray...");
        technicalReport = await modelAPI.predictCaption(imageUri);
        //console.log("Technical report:", technicalReport);
        
        // Translate to plain language
        plainLanguageReport = await modelAPI.translateToPlainLanguage(technicalReport);
        //console.log("Plain language report:", plainLanguageReport);
        
      } else if (selectedModel === 'bones') {
        // Bone fracture detection
        console.log("🦴 Detecting bone fractures...");
        const bonesResult = await modelAPI.predictBoneFractures(imageUri);
        console.log("Bones detection result:", bonesResult);
        
        // Use the annotated image with bounding boxes
        annotatedImageUri = bonesResult.annotatedImage;
        
        // Technical report with findings details
        if (bonesResult.detections === 0) {
          technicalReport = bonesResult.caption;
        } else {
          technicalReport = `Detected ${bonesResult.detections} potential fracture(s):\n\n`;
          bonesResult.findings.forEach((finding, index) => {
            technicalReport += `${index + 1}. ${finding.type} - Confidence: ${finding.confidence}%\n`;
          });
          technicalReport += `\n${bonesResult.caption}`;
        }
        //console.log("Technical report:", technicalReport);
        
        // Plain language translation
        plainLanguageReport = await modelAPI.translateToPlainLanguage(technicalReport);
        //console.log("Plain language report:", plainLanguageReport);
      }
      
      // Convert image to base64 for storage
      let imageBase64 = '';
      try {
        // For bones model, use the annotated image; for chest, use original
        const imageToStore = selectedModel === 'bones' ? annotatedImageUri : imageUri;
        
        // Check if it's already base64 (bones annotated image)
        if (imageToStore.startsWith('data:image')) {
          imageBase64 = imageToStore;
          console.log("Using base64 image directly");
        } else {
          // Convert file URI to base64
          const response = await fetch(imageToStore);
          const blob = await response.blob();
          imageBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          console.log("Image converted to base64");
        }
      } catch (error) {
        console.warn("Could not convert image to base64:", error);
      }
      
      const resultData = {
        technicalReport,
        plainLanguageReport,
        patientName,
        model: selectedModel,
        imageUri: annotatedImageUri, // Use annotated image for bones, original for chest
        imageBase64,
        timestamp: new Date().toISOString()
      };
      
      setAnalysisResult(resultData);
      
      // Auto-save to history if user is logged in
      if (token && imageBase64) {
        try {
          console.log("Auto-saving scan to history...");
          const saveResponse = await scanHistoryAPI.saveScan(token, {
            patientName,
            model: selectedModel,
            imageBase64,
            technicalReport,
            plainLanguageReport,
            timestamp: new Date().toISOString()
          });
          
          if (saveResponse.success) {
            console.log("✅ Scan saved to history:", saveResponse.data.id);
          } else {
            console.warn("⚠️ Failed to save scan:", saveResponse.message);
          }
        } catch (saveError) {
          console.warn("⚠️ Could not save to history:", saveError.message);
          // Don't block navigation if save fails
        }
      }
      
      // Navigate to results page
      navigation.navigate('Results', { 
        result: resultData
      });
      
    } catch (error) {
      console.error("Analysis error:", error);
      Alert.alert(
        "Analysis Failed", 
        "Could not analyze the image. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cameraPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setActiveButton("camera");
        Animated.parallel([
          Animated.timing(arrowOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(oppositeButtonOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      },
      onPanResponderMove: (e, g) => {
        if (g.dx > 0) cameraSlideAnim.setValue(Math.min(g.dx, maxSlide));
      },
      onPanResponderRelease: async (e, g) => {
        if (g.dx >= maxSlide) await handleImagePick("camera");
        else resetAnimations();
      },
    })
  ).current;

  const filePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setActiveButton("file");
        Animated.parallel([
          Animated.timing(arrowOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(oppositeButtonOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      },
      onPanResponderMove: (e, g) => {
        if (g.dx < 0) fileSlideAnim.setValue(Math.max(g.dx, -maxSlide));
      },
      onPanResponderRelease: async (e, g) => {
        if (g.dx <= -maxSlide) await handleImagePick("library");
        else resetAnimations();
      },
    })
  ).current;

  // Handle back button
  const handleBack = () => {
    if (selectedModel) {
      setSelectedModel(null);
    } else if (patientName) {
      setPatientName("");
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Full Screen Image Preview - Shows when image is selected */}
      {image ? (
        <View style={styles.fullScreenImageContainer}>
          <Image source={{ uri: image }} style={styles.fullScreenImage} />
          
          {/* Close/Retake Button */}
          {!isAnalyzing && (
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setImage(null)}
            >
              <MaterialIcons name="close" size={responsive(28)} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Tick/Upload Button - Works for both chest and bones */}
          {(selectedModel === "chest" || selectedModel === "bones") && !isAnalyzing && (
            <TouchableOpacity 
              style={styles.fullScreenTickButton} 
              onPress={() => analyzeImage(image)}
            >
              <MaterialIcons name="check" size={responsive(40)} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Analyzing Overlay */}
          {isAnalyzing && (
            <View style={styles.fullScreenAnalyzingOverlay}>
              <ActivityIndicator size="large" color="#4285F4" />
              <Text style={styles.fullScreenAnalyzingText}>AI Model Processing...</Text>
            </View>
          )}
        </View>
      ) : (
        /* Original Upload Page - Only shows when no image */
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={[
              styles.backButton,
              { backgroundColor: isDarkTheme ? 'transparent' : '#E8E8E8' }
            ]} 
            onPress={handleBack}
          >
            <Text style={[styles.backIcon, { color: colors.text }]}>{"<"}</Text>
          </TouchableOpacity>

          {/* Top Section */}
          <View style={styles.topSection}>
            <View style={styles.redCircle}>
              <Text style={styles.exclamationMark}>!</Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Begin X-ray Analysis</Text>
            <Text style={[styles.description, { color: colors.subtext }]}>
              {!selectedModel && "Select X-ray type to analyze"}
              {selectedModel && !patientName && "Enter patient information"}
              {selectedModel && patientName && "Choose an image from your gallery or\ntake a new one — we'll handle the rest"}
            </Text>
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            <View style={styles.stepContainer}>
              <View style={styles.modelButtonsContainer}>
                {/* Chest X-ray Button */}
                <TouchableOpacity
                  style={[
                    styles.modelButton,
                    { 
                      backgroundColor: colors.button, 
                      borderColor: colors.buttonBorder, 
                      borderWidth: isDarkTheme ? 0 : 1 
                    },
                    selectedModel === "chest" && styles.modelButtonSelected
                  ]}
                  onPress={() => handleModelSelect("chest")}
                >
                  <MaterialCommunityIcons 
                    name="lungs" 
                    size={responsive(40)} 
                    color={selectedModel === "chest" ? "#4285F4" : colors.text} 
                  />
                  <Text style={[
                    styles.modelButtonText,
                    { color: colors.text },
                    selectedModel === "chest" && styles.modelButtonTextSelected
                  ]}>
                    Chest X-ray
                  </Text>
                </TouchableOpacity>

                {/* Bones Button - Now Enabled */}
                <TouchableOpacity
                  style={[
                    styles.modelButton,
                    { 
                      backgroundColor: colors.button, 
                      borderColor: colors.buttonBorder, 
                      borderWidth: isDarkTheme ? 0 : 1 
                    },
                    selectedModel === "bones" && styles.modelButtonSelected
                  ]}
                  onPress={() => handleModelSelect("bones")}
                >
                  <MaterialCommunityIcons 
                    name="bone" 
                    size={responsive(40)} 
                    color={selectedModel === "bones" ? "#4285F4" : colors.text}
                  />
                  <Text style={[
                    styles.modelButtonText,
                    { color: colors.text },
                    selectedModel === "bones" && styles.modelButtonTextSelected
                  ]}>
                    Bone X-ray
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.uploadContentContainer}>
                {/* Patient Name Input */}
                <TextInput
                  style={[
                    styles.patientInput, 
                    { 
                      marginBottom: responsive(20), 
                      width: "100%",
                      opacity: selectedModel ? 1 : 0.5,
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    }
                  ]}
                  placeholder="Enter patient name"
                  placeholderTextColor={isDarkTheme ? "#888888" : "#999999"}
                  value={patientName}
                  onChangeText={setPatientName}
                  editable={!!selectedModel}
                  returnKeyType="done"
                />

                {/* Image Upload Slider */}
                <View style={[
                  styles.buttonContainer,
                  { 
                    opacity: (selectedModel && patientName.trim()) ? 1 : 0.5,
                    marginBottom: responsive(20)
                  }
                ]} ref={buttonContainerRef}>
                  <Animated.View
                    {...((selectedModel && patientName.trim()) ? cameraPanResponder.panHandlers : {})}
                    style={{
                      transform: [{ translateX: cameraSlideAnim }],
                      opacity: activeButton === "file" ? oppositeButtonOpacity : 1,
                      zIndex: activeButton === "camera" ? 2 : 1,
                    }}
                  >
                    <View style={styles.cameraButton} ref={cameraButtonRef}>
                      <MaterialCommunityIcons name="camera" size={responsive(50)} color="#000" />
                    </View>
                  </Animated.View>

                  <Animated.View style={[styles.arrowContainer, { opacity: arrowOpacity }]}>
                    <Text style={[styles.arrow, styles.arrow1, { color: colors.arrowText }]}>
                      {activeButton === "file" ? "<" : ">"}
                    </Text>
                    <Text style={[styles.arrow, styles.arrow2, { color: colors.arrowText }]}>
                      {activeButton === "file" ? "<" : ">"}
                    </Text>
                    <Text style={[styles.arrow, styles.arrow3, { color: colors.arrowText }]}>
                      {activeButton === "file" ? "<" : ">"}
                    </Text>
                  </Animated.View>

                  <Animated.View
                    {...((selectedModel && patientName.trim()) ? filePanResponder.panHandlers : {})}
                    style={{
                      transform: [{ translateX: fileSlideAnim }],
                      opacity: activeButton === "camera" ? oppositeButtonOpacity : 1,
                      zIndex: activeButton === "file" ? 2 : 1,
                    }}
                  >
                    <View style={styles.fileButton} ref={fileButtonRef}>
                      <MaterialCommunityIcons
                        name="file-document-outline"
                        size={responsive(50)}
                        color="#fff"
                      />
                    </View>
                  </Animated.View>

                  {!(selectedModel && patientName.trim()) && (
                    <View style={styles.lockOverlay}>
                      <MaterialCommunityIcons name="lock" size={responsive(24)} color="#FFFFFF" />
                      <Text style={styles.lockText}>
                        {!selectedModel ? "Select a model first" : "Enter patient name to unlock"}
                      </Text>
                    </View>
                  )}

                  {isAnalyzing && (
                    <View style={styles.analyzingOverlay}>
                      <ActivityIndicator size="large" color="#4285F4" />
                      <Text style={styles.analyzingText}>Analyzing image...</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Full Screen Image Preview
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    resizeMode: "contain",
  },

  closeButton: {
    position: "absolute",
    top: responsive(50),
    left: responsive(20),
    width: responsive(50),
    height: responsive(50),
    borderRadius: responsive(25),
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  fullScreenTickButton: {
    position: "absolute",
    bottom: responsive(50),
    alignSelf: "center",
    width: responsive(80),
    height: responsive(80),
    borderRadius: responsive(40),
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: responsive(5),
    borderColor: "#FFFFFF",
    shadowColor: "#4285F4",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
    zIndex: 10,
  },

  fullScreenAnalyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },

  fullScreenAnalyzingText: {
    color: "#FFFFFF",
    fontSize: responsive(18),
    marginTop: responsive(20),
    fontFamily: "Montserrat",
    fontWeight: "700",
  },
  
  // Pin the back button so it doesn't affect vertical layout
  // Position matches dashboard settings button
  backButton: {
    position: "absolute",
    top: responsive(70), // Match dashboard topBar paddingTop
    left: responsive(23), // Match dashboard settings button left padding
    width: responsive(50), // Match dashboard settings button size
    height: responsive(50),
    borderRadius: responsive(35),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },

  backIcon: {
    fontSize: responsive(28), // Match dashboard icon size
    marginBottom: responsive(5),
    fontWeight: "900",
  },

  topSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: responsive(30),
    paddingTop: responsive(60),
    marginBottom: responsive(20),
  },

  redCircle: {
    width: responsive(50),
    height: responsive(50),
    borderRadius: responsive(25),
    borderWidth: responsive(2.5),
    marginLeft: responsive(10),
    borderColor: "#f00",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsive(20),
    marginTop : responsive(45),
  },

  exclamationMark: { 
    fontSize: responsive(28), 
    color: "#f00", 
    fontWeight: "700" 
  },

  title: { 
    fontSize: responsive(34), 
    fontWeight: "700", 
    color: "#fff", 
    marginBottom: responsive(12),
    marginLeft: responsive(10),
    fontFamily: "Montserrat",
  },

  description: { 
    fontSize: responsive(19), 
    color: "#fff", 
    lineHeight: responsive(24),
    marginLeft: responsive(10),
    fontFamily: "Montserrat",
  },

  bottomSection: {
    // No background color - transparent
    borderTopLeftRadius: responsive(60),
    borderTopRightRadius: responsive(60),
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: responsive(37),
    paddingBottom: responsive(40),
    flex: 1.5,
    maxHeight: SCREEN_HEIGHT * 0.65,
  },

  stepContainer: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: responsive(20),
    flex: 1,
  },

  uploadContentContainer: {
    width: "90%",
    alignItems: "center",
    flex: 1,
  },

  // Step 1: Model Selection Styles
  modelButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: responsive(10),
    marginBottom: responsive(24),
    gap: responsive(20),
  },

  modelButton: {
    // Background and border colors applied dynamically inline
    borderRadius: responsive(24),
    padding: responsive(16),
    alignItems: "center",
    justifyContent: "center",
    width: responsive(120),
    height: responsive(135),
    marginBottom: responsive(5),
  },

  modelButtonSelected: {
    backgroundColor: "#1a1a2e",
    borderColor: "#4285F4",
    borderWidth: responsive(2),
    transform: [{ scale: 1.05 }],
  },

  modelButtonText: {
    // Color applied dynamically inline
    fontSize: responsive(12),
    fontWeight: "600",
    marginTop: responsive(10),
    textAlign: "center",
    fontFamily: "Montserrat",
  },

  modelButtonTextSelected: {
    color: "#4285F4",
  },

  modelButtonDisabled: {
    backgroundColor: "#1a1a1a",
    borderColor: "#333333",
    opacity: 0.5,
  },

  modelButtonTextDisabled: {
    color: "#666666",
  },

  // Step 2: Patient Name Styles
  patientInputContainer: {
    width: "90%",
    backgroundColor: "#2a2a2a",
    borderRadius: responsive(24),
    padding: responsive(35),
    
  },

  inputLabel: {
    color: "#FFFFFF",
    fontSize: responsive(16),
    fontWeight: "700",
    marginBottom: responsive(15),
    fontFamily: "Montserrat",
  },

  patientInput: {
    backgroundColor: "#1a1a1a",
    borderRadius: responsive(12),
    padding: responsive(15),
    fontSize: responsive(16),
    color: "#FFFFFF",
    fontFamily: "Montserrat",
    borderWidth: 1,
    borderColor: "#3f3f46",
    marginBottom: responsive(20),
  },

  continueButton: {
    backgroundColor: "#4285F4",
    borderRadius: responsive(12),
    padding: responsive(15),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  continueButtonText: {
    color: "#FFFFFF",
    fontSize: responsive(16),
    fontWeight: "700",
    marginRight: responsive(8),
    fontFamily: "Montserrat",
  },

  // Step 3: Image Upload Slider Styles
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: responsive(5),
    backgroundColor: "#1a1a1a",
    borderRadius: responsive(60),
    paddingHorizontal: responsive(10),
    paddingVertical: responsive(10),
    overflow: "visible",
  },

  cameraButton: {
    width: responsive(88),
    height: responsive(88),
    borderRadius: responsive(44),
    backgroundColor: "#e7e8e9",
    justifyContent: "center",
    alignItems: "center",
  },

  fileButton: {
    width: responsive(88),
    height: responsive(88),
    borderRadius: responsive(44),
    backgroundColor: "#10100f",
    justifyContent: "center",
    alignItems: "center",
  },

  arrowContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginHorizontal: responsive(30) 
  },

  arrow: { 
    fontSize: responsive(20), 
    fontWeight: "700", 
    marginHorizontal: responsive(2) 
  },

  arrow1: { color: "#666", opacity: 0.4 },
  arrow2: { color: "#888", opacity: 0.6 },
  arrow3: { color: "#aaa", opacity: 0.8 },

  // Lock overlay styles
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: responsive(50),
    zIndex: 10,
  },
  lockText: {
    color: "#FFFFFF",
    fontSize: responsive(12),
    marginTop: responsive(5),
    fontFamily: "Montserrat",
  },

  // Analyzing overlay styles
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: responsive(50),
    zIndex: 20,
  },
  analyzingText: {
    color: "#FFFFFF",
    fontSize: responsive(14),
    marginTop: responsive(10),
    fontFamily: "Montserrat",
    fontWeight: "600",
  },

  // Upload button styles
  uploadButton: {
    backgroundColor: "#4285F4",
    borderRadius: responsive(25),
    paddingHorizontal: responsive(24),
    paddingVertical: responsive(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: responsive(15),
    alignSelf: "center",
    shadowColor: "#4285F4",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: responsive(16),
    fontWeight: "700",
    marginLeft: responsive(8),
    fontFamily: "Montserrat",
  },

  // Image preview container (replaces imageEditContainer)
  imagePreviewContainer: {
    width: "100%",
    flex: 1,
    marginTop: responsive(20),
    borderRadius: responsive(20),
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000",
    minHeight: responsive(300),
    maxHeight: responsive(450),
  },

  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  // Tick button - same style as camera capture
  tickButton: {
    position: "absolute",
    bottom: responsive(20),
    alignSelf: "center",
    left: "50%",
    marginLeft: responsive(-35),
    width: responsive(70),
    height: responsive(70),
    borderRadius: responsive(35),
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: responsive(4),
    borderColor: "#FFFFFF",
    shadowColor: "#4285F4",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 10,
  },

  // Retake button
  retakeButton: {
    position: "absolute",
    top: responsive(15),
    right: responsive(15),
    width: responsive(40),
    height: responsive(40),
    borderRadius: responsive(20),
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Analyzing overlay on image
  imageAnalyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },

  imageAnalyzingText: {
    color: "#FFFFFF",
    fontSize: responsive(16),
    marginTop: responsive(15),
    fontFamily: "Montserrat",
    fontWeight: "700",
  },

  // Image edit container styles (DEPRECATED - keeping for backwards compatibility)
  imageEditContainer: {
    marginTop: responsive(20),
    marginBottom: responsive(10),
  },

  imageEditLabel: {
    color: "#FFFFFF",
    fontSize: responsive(18),
    fontWeight: "600",
    marginBottom: responsive(15),
    fontFamily: "Montserrat",
    textAlign: "center",
  },

  imageWrapper: {
    position: "relative",
    width: "100%",
    alignItems: "center",
  },

  selectedImage: {
    width: "100%",
    height: responsive(250),
    borderRadius: responsive(16),
    backgroundColor: "#2a2a2a",
  },
});
