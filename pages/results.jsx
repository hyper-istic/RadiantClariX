import React, { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from "../context/AuthContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BASE_WIDTH = 432;
const BASE_HEIGHT = 818;
const scaleWidth = SCREEN_WIDTH / BASE_WIDTH;
const scaleHeight = SCREEN_HEIGHT / BASE_HEIGHT;
const scale = Math.min(scaleWidth, scaleHeight);
const responsive = (size) => size * scale;

export default function Results({ navigation, route }) {
  const { user } = useAuth();
  const { result } = route.params || {};
  const [activeTab, setActiveTab] = useState('technical'); // 'technical' or 'plain'
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Theme
  const isDarkTheme = !user?.theme || user.theme === 'dark';
  const colors = {
    background: isDarkTheme ? '#000000' : '#FFFFFF',
    text: isDarkTheme ? '#FFFFFF' : '#000000',
    subtext: isDarkTheme ? '#B0B0B0' : '#666666',
    border: isDarkTheme ? '#444444' : '#DDDDDD',
    card: isDarkTheme ? '#2a2a2a' : '#F5F5F5',
    tabActive: isDarkTheme ? '#4285F4' : '#4285F4',
    tabInactive: isDarkTheme ? '#888888' : '#999999',
    button: isDarkTheme ? '#2a2a2a' : '#E8E8E8',
    buttonBorder: isDarkTheme ? 'transparent' : '#DDDDDD',
    buttonText: isDarkTheme ? '#FFFFFF' : '#000000',
  };
  
  if (!result) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={responsive(60)} color="#f00" />
          <Text style={styles.errorText}>No analysis result found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Upload')}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { technicalReport, plainLanguageReport, caption, patientName, model, imageUri, timestamp } = result;
  
  // Backwards compatibility - if old format with just 'caption', use it for both
  const technical = technicalReport || caption;
  const plain = plainLanguageReport || caption;

  const handleNewAnalysis = () => {
    navigation.navigate('Upload');
  };

  const handleBack = () => {
    // Navigate directly to Upload page instead of going back through history
    navigation.navigate('Upload');
  };

  const generatePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      
      // Format timestamp
      const formattedDate = new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Convert image to base64 for embedding in PDF
      let imageBase64 = '';
      if (imageUri) {
        try {
          // Check if imageUri is already a base64 data URI
          if (imageUri.startsWith('data:image')) {
            // Already a data URI, use it directly
            imageBase64 = imageUri;
            //console.log("✅ Using existing base64 data URI for PDF");
          } else {
            // File URI, need to convert to base64
            //console.log("🔄 Converting file URI to base64 for PDF");
            const response = await fetch(imageUri);
            const blob = await response.blob();
            imageBase64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
            //console.log("✅ Image converted to base64 for PDF");
          }
        } catch (error) {
          console.warn("Could not embed image in PDF:", error);
        }
      }

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              margin: 80px;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              line-height: 1.6;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #4285F4;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #4285F4;
              margin: 0;
              font-size: 32px;
            }
            .header p {
              color: #666;
              margin: 10px 0 0 0;
            }
            .info-section {
              background: #f5f5f5;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 25px;
            }
            .info-row {
              display: flex;
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: bold;
              color: #4285F4;
              width: 150px;
            }
            .info-value {
              color: #333;
            }
            .image-section {
              text-align: center;
              margin: 30px 0;
              page-break-inside: avoid;
            }
            .xray-image {
              max-width: 100%;
              max-height: 400px;
              border: 2px solid #4285F4;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .section-title {
              color: #4285F4;
              font-size: 22px;
              font-weight: bold;
              margin-top: 30px;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #4285F4;
              page-break-after: avoid;
            }
            .report-box {
              background: #fff;
              border: 2px solid #e0e0e0;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
              page-break-inside: avoid;
              margin-top: 30px;
            }
            .report-content {
              color: #333;
              font-size: 16px;
              line-height: 1.8;
            }
            .disclaimer {
              background: #fff3cd;
              border: 2px solid #ffc107;
              border-radius: 8px;
              padding: 15px;
              margin-top: 30px;
              text-align: center;
              page-break-inside: avoid;
            }
            .disclaimer p {
              color: #856404;
              margin: 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RadiantClariX</h1>
            <p>${model === 'bones' ? 'Bone Fracture Detection Report' : 'Chest X-ray Analysis Report'}</p>
          </div>

          <div class="info-section">
            <div class="info-row">
              <div class="info-label">Patient Name:</div>
              <div class="info-value">${patientName}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Analysis Type:</div>
              <div class="info-value">${model === 'bones' ? 'Bone Fracture Detection' : 'Chest X-ray Analysis'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Date & Time:</div>
              <div class="info-value">${formattedDate}</div>
            </div>
          </div>

          ${imageBase64 ? `
          <div class="image-section">
            <h2 class="section-title">${model === 'bones' ? 'Bone X-ray Image with Detected Fractures' : '🩻 X-ray Image'}</h2>
            <img src="${imageBase64}" class="xray-image" alt="${model === 'bones' ? 'Bone X-ray' : 'Chest X-ray'}" />
          </div>
          ` : ''}

          <h2 class="section-title">📋 Technical Report</h2>
          <div class="report-box">
            <p class="report-content">${technical}</p>
          </div>

          <h2 class="section-title">💬 Plain Language Explanation</h2>
          <div class="report-box">
            <p class="report-content">${plain}</p>
          </div>

          <div class="disclaimer">
            <p>⚠️ DISCLAIMER</p>
            <p style="font-weight: normal; margin-top: 10px;">
              This analysis is for demonstration purposes only. 
              Please consult with a qualified medical professional for accurate diagnosis and treatment.
            </p>
          </div>

          <div class="footer">
            <p>Generated by RadiantClariX AI Analysis System</p>
            <p>Report ID: ${timestamp}</p>
          </div>
        </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      // Share the PDF directly without moving it
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download X-ray Analysis Report',
          UTI: 'com.adobe.pdf'
        });
        
        Alert.alert(
          "Success", 
          "Report generated successfully!",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Error", 
          "Sharing is not available on this device",
          [{ text: "OK" }]
        );
      }

    } catch (error) {
      console.error("PDF Generation Error:", error);
      Alert.alert(
        "Error", 
        "Failed to generate PDF. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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

      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.successCircle}>
          <MaterialCommunityIcons name="check" size={responsive(30)} color="#00FF00" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Analysis Complete</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          {model === 'bones' ? 'Bone Fracture Detection' : 'Chest X-ray Analysis'}
        </Text>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Patient Info Card */}
        <View style={[styles.infoCard, { 
          backgroundColor: colors.card, 
          borderColor: colors.border,
          borderWidth: isDarkTheme ? 0 : 1,
        }]}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account" size={responsive(20)} color="#4285F4" />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Patient:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{patientName}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="brain" size={responsive(20)} color="#4285F4" />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Model:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {model === 'bones' ? 'Bone Fracture Detection' : 'Chest X-ray Analysis'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock" size={responsive(20)} color="#4285F4" />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Analyzed:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{new Date(timestamp).toLocaleString()}</Text>
          </View>
        </View>

        {/* Image Display */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Text style={[styles.imageLabel, { color: colors.text }]}>Analyzed Image</Text>
            <Image 
              source={{ uri: imageUri }} 
              style={styles.analyzedImage} 
              resizeMode="contain"
            />
          </View>
        )}

        {/* Report Tabs */}
        <View style={[styles.tabContainer, { 
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: isDarkTheme ? 0 : 1,
        }]}>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'technical' && [
                styles.activeTab,
                { backgroundColor: isDarkTheme ? '#2a2a3e' : '#D0D0D0' }
              ]
            ]}
            onPress={() => setActiveTab('technical')}
          >
            <MaterialCommunityIcons 
              name="clipboard-text" 
              size={responsive(18)} 
              color={activeTab === 'technical' ? colors.tabActive : colors.tabInactive} 
            />
            <Text style={[
              styles.tabText, 
              { color: colors.tabInactive },
              activeTab === 'technical' && { color: colors.tabActive }
            ]}>
              Technical Report
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'plain' && [
                styles.activeTab,
                { backgroundColor: isDarkTheme ? '#2a2a3e' : '#D0D0D0' }
              ]
            ]}
            onPress={() => setActiveTab('plain')}
          >
            <MaterialCommunityIcons 
              name="message-text" 
              size={responsive(18)} 
              color={activeTab === 'plain' ? colors.tabActive : colors.tabInactive} 
            />
            <Text style={[
              styles.tabText, 
              { color: colors.tabInactive },
              activeTab === 'plain' && { color: colors.tabActive }
            ]}>
              Plain Language
            </Text>
          </TouchableOpacity>
        </View>

        {/* Analysis Result Card */}
        <View style={[styles.resultCard, { 
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: isDarkTheme ? 0 : 1,
        }]}>
          <View style={styles.resultHeader}>
            <MaterialCommunityIcons 
              name={activeTab === 'technical' ? "file-document" : "message-text"} 
              size={responsive(24)} 
              color="#4285F4" 
            />
            <Text style={[styles.resultTitle, { color: colors.text }]}>
              {activeTab === 'technical' ? 'Technical Analysis' : 'Simple Explanation'}
            </Text>
          </View>
          <View style={[styles.resultContent, {
            backgroundColor: isDarkTheme ? '#0a0a0a' : '#E8E8E8',
          }]}>
            <Text style={[styles.captionText, { 
              color: isDarkTheme ? '#FFFFFF' : '#000000' 
            }]}>
              {activeTab === 'technical' ? technical : plain}
            </Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <MaterialCommunityIcons name="information" size={responsive(20)} color="#FFA500" />
          <Text style={[styles.disclaimerText, { color: colors.text }]}>
            This analysis is for demonstration purposes only. 
            Please consult with a qualified medical professional for accurate diagnosis.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.downloadButton} 
          onPress={generatePDF}
          disabled={isGeneratingPDF}
        >
          {isGeneratingPDF ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="download" size={responsive(20)} color="#FFFFFF" />
              <Text style={styles.downloadButtonText}>Download PDF</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.newAnalysisButton} onPress={handleNewAnalysis}>
          <MaterialCommunityIcons name="plus" size={responsive(20)} color="#FFFFFF" />
          <Text style={styles.newAnalysisText}>New Analysis</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor applied dynamically
  },

  // Back button
  backButton: {
    position: "absolute",
    top: responsive(70), // Match dashboard topBar paddingTop
    left: responsive(23), // Match dashboard/upload
    width: responsive(50), // Match dashboard/upload
    height: responsive(50),
    borderRadius: responsive(35),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },

  backIcon: {
    fontSize: responsive(28), // Match dashboard/upload
    fontWeight: "900",
    marginBottom: responsive(5),
  },

  // Header section
  headerSection: {
    alignItems: "center",
    paddingTop: responsive(100),
    paddingHorizontal: responsive(30),
    paddingBottom: responsive(30),
  },

  successCircle: {
    width: responsive(80),
    height: responsive(80),
    borderRadius: responsive(40),
    borderWidth: responsive(3),
    borderColor: "#00FF00",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsive(15),
    marginTop: responsive(35),
    backgroundColor: "rgba(0, 255, 0, 0.1)",
  },

  title: {
    fontSize: responsive(32),
    fontWeight: "700",
    // color applied dynamically
    marginBottom: responsive(8),
    fontFamily: "Montserrat",
    textAlign: "center",
  },

  subtitle: {
    fontSize: responsive(18),
    // color applied dynamically
    fontFamily: "Montserrat",
    textAlign: "center",
  },

  // Content container
  contentContainer: {
    flex: 1,
    paddingHorizontal: responsive(25),
  },

  // Tab container of Plain and technical report
  tabContainer: {
    flexDirection: "row",
    // backgroundColor and border applied dynamically
    borderRadius: responsive(12),
    padding: responsive(4),
    marginBottom: responsive(20),
  },

  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: responsive(12),
    paddingHorizontal: responsive(8),
    borderRadius: responsive(8),
    gap: responsive(6),
  },

  activeTab: {
    // backgroundColor applied dynamically inline
  },

  tabText: {
    // color applied dynamically
    fontSize: responsive(13),
    fontWeight: "600",
    fontFamily: "Montserrat",
  },

  // Info card
  infoCard: {
    // backgroundColor and border applied dynamically
    borderRadius: responsive(16),
    padding: responsive(20),
    marginBottom: responsive(20),
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsive(12),
  },

  infoLabel: {
    // color applied dynamically
    fontSize: responsive(16),
    marginLeft: responsive(10),
    fontFamily: "Montserrat",
    fontWeight: "600",
  },

  infoValue: {
    color: "#FFFFFF",
    fontSize: responsive(16),
    marginLeft: responsive(8),
    fontFamily: "Montserrat",
    flex: 1,
  },

  // Image container
  imageContainer: {
    marginBottom: responsive(20),
  },

  imageLabel: {
    // color applied dynamically
    fontSize: responsive(18),
    fontWeight: "600",
    marginBottom: responsive(10),
    fontFamily: "Montserrat",
  },

  analyzedImage: {
    width: "100%",
    height: responsive(300), // Increased height for full image display
    borderRadius: responsive(12),
    backgroundColor: "#2a2a2a",
  },

  // Result card
  resultCard: {
    // backgroundColor and border applied dynamically
    borderRadius: responsive(16),
    padding: responsive(20),
    marginBottom: responsive(20),
  },

  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsive(15),
  },

  resultTitle: {
    // color applied dynamically
    fontSize: responsive(20),
    fontWeight: "700",
    marginLeft: responsive(10),
    fontFamily: "Montserrat",
  },

  resultContent: {
    // backgroundColor applied dynamically
    borderRadius: responsive(12),
    padding: responsive(16),
    borderWidth: 1,
    borderColor: "#bfc7d3ff",
  },

  captionText: {
    // color applied dynamically
    fontSize: responsive(16),
    lineHeight: responsive(24),
    fontFamily: "Montserrat",
    textAlign: "justify",
  },

  // Disclaimer card
  disclaimerCard: {
    backgroundColor: "rgba(255, 165, 0, 0.1)",
    borderRadius: responsive(12),
    padding: responsive(16),
    marginBottom: responsive(20),
    borderWidth: 1,
    borderColor: "#FFA500",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  disclaimerText: {
    // color applied dynamically (but with orange tint for disclaimer)
    fontSize: responsive(14),
    lineHeight: responsive(20),
    marginLeft: responsive(10),
    fontFamily: "Montserrat",
    flex: 1,
  },

  // Action container
  actionContainer: {
    paddingHorizontal: responsive(20),
    paddingBottom: responsive(30),
    paddingTop: responsive(20),
    gap: responsive(12),
  },

  downloadButton: {
    backgroundColor: "#00AA00",
    borderRadius: responsive(12),
    padding: responsive(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00AA00",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },

  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: responsive(16),
    fontWeight: "700",
    marginLeft: responsive(8),
    fontFamily: "Montserrat",
  },

  newAnalysisButton: {
    backgroundColor: "#4285F4",
    borderRadius: responsive(12),
    padding: responsive(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  newAnalysisText: {
    color: "#FFFFFF",
    fontSize: responsive(16),
    fontWeight: "700",
    marginLeft: responsive(8),
    fontFamily: "Montserrat",
  },

  // Error container
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: responsive(40),
  },

  errorText: {
    color: "#FFFFFF",
    fontSize: responsive(18),
    marginTop: responsive(20),
    marginBottom: responsive(30),
    textAlign: "center",
    fontFamily: "Montserrat",
  },

  backButtonText: {
    color: "#4285F4",
    fontSize: responsive(16),
    fontWeight: "600",
    fontFamily: "Montserrat",
  },
});
