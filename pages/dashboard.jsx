import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from "../context/AuthContext";
import { scanHistoryAPI } from "../services/api";
import lightBackground from "../assets/dashboard1.jpg";
import darkBackground from "../assets/dashboard2.jpg";

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (Pixel 7)
const BASE_WIDTH = 432;
const BASE_HEIGHT = 818;

// Scaling factors
const scaleWidth = SCREEN_WIDTH / BASE_WIDTH;
const scaleHeight = SCREEN_HEIGHT / BASE_HEIGHT;
const scale = Math.min(scaleWidth, scaleHeight);

// Responsive size function
const responsive = (size) => size * scale;

export default function Dashboard({ navigation }) {
  const { isAuthenticated, user, logout } = useAuth();
  const [scanHistory, setScanHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [loadingRecordId, setLoadingRecordId] = useState(null);

  // Fetch scan history when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetchScanHistory();
    } else {
      setScanHistory([]);
    }
  }, [isAuthenticated]);

  // Auto-refresh history when dashboard comes into focus (after scanning, deleting, etc.)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchScanHistory();
      }
    }, [isAuthenticated])
  );

  const fetchScanHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.log('No token found');
        setScanHistory([]);
        return;
      }

      //console.log('📋 Fetching scan history...');
      const response = await scanHistoryAPI.getAllScans(token);
      //console.log('📋 Response:', response);
      
      if (response.success) {
        console.log('✅ Scan history fetched:', response.count, 'records');
        setScanHistory(response.data || []);
      } else {
        console.log('❌ Failed to fetch history:', response.message);
        setScanHistory([]);
      }
    } catch (error) {
      console.error("❌ Error fetching scan history:", error);
      setScanHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      // User logged out, stay on dashboard
      console.log('Logged out successfully');
    }
  };

  const handleRecordClick = async (record) => {
    try {
      setLoadingRecordId(record._id);
      console.log('📄 Fetching full scan data for:', record._id);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found');
        setLoadingRecordId(null);
        return;
      }

      // Fetch full scan data including image
      const response = await scanHistoryAPI.getScanById(token, record._id);
      
      if (response.success && response.data) {
        const fullScan = response.data;
        
        // imageBase64 already contains the data URI prefix (data:image/jpeg;base64,)
        // from FileReader.readAsDataURL(), so we use it directly
        const imageUri = fullScan.imageBase64;
        
        // Navigate to results page with the complete scan data
        navigation.navigate('Results', {
          result: {
            technicalReport: fullScan.technicalReport,
            plainLanguageReport: fullScan.plainLanguageReport,
            caption: fullScan.technicalReport, // For backwards compatibility
            patientName: fullScan.patientName,
            model: fullScan.model,
            imageUri: imageUri,
            timestamp: fullScan.timestamp,
          }
        });
      } else {
        console.log('❌ Failed to fetch scan:', response.message);
      }
    } catch (error) {
      console.error('❌ Error fetching scan details:', error);
    } finally {
      setLoadingRecordId(null);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const renderHistoryRecord = (record, index, showDivider = true) => {
    const isLoading = loadingRecordId === record._id;
    
    // Determine colors based on theme
    const isDarkTheme = !user?.theme || user.theme === 'dark';
    const historyTextColor = isDarkTheme ? '#FFFFFF' : '#000000';
    const historyMetaColor = isDarkTheme ? '#AAAAAA' : '#666666';
    const historyTimestampColor = isDarkTheme ? '#888888' : '#999999';
    const dividerColor = isDarkTheme ? '#444444' : '#DDDDDD';
    const chevronColor = isDarkTheme ? '#888888' : '#AAAAAA';
    
    return (
      <View key={record._id || index}>
        <TouchableOpacity
          style={styles.historyRecord}
          onPress={() => handleRecordClick(record)}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <View style={styles.historyRecordContent}>
            <Text style={[styles.historyPatientName, { color: historyTextColor }]} numberOfLines={1}>
              {record.patientName}
            </Text>
            <View style={styles.historyMetaRow}>
              <Text style={[styles.historyModel, { color: historyMetaColor }]}>{record.model}</Text>
              <Text style={[styles.historyTimestamp, { color: historyTimestampColor }]}>
                {formatTimestamp(record.timestamp)}
              </Text>
            </View>
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color={historyTextColor} />
          ) : (
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={responsive(24)} 
              color={chevronColor} 
            />
          )}
        </TouchableOpacity>
        {showDivider && <View style={[styles.historyDivider, { backgroundColor: dividerColor }]} />}
      </View>
    );
  };

  const renderHistoryContent = () => {
    const isDarkTheme = !user?.theme || user.theme === 'dark';
    const placeholderColor = isDarkTheme ? '#888888' : '#999999';
    const loadingColor = isDarkTheme ? '#FFFFFF' : '#4285F4';
    const loadingTextColor = isDarkTheme ? '#888888' : '#666666';
    const viewMoreTextColor = isDarkTheme ? '#FFFFFF' : '#4285F4';
    const dividerBorderColor = isDarkTheme ? '#444444' : '#DDDDDD';
    
    if (!isAuthenticated) {
      return (
        <Text style={[styles.reportsPlaceholder, { color: placeholderColor }]}>
          Login to Fetch Your History
        </Text>
      );
    }

    if (isLoadingHistory) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={loadingColor} />
          <Text style={[styles.loadingText, { color: loadingTextColor }]}>Loading history...</Text>
        </View>
      );
    }

    if (scanHistory.length === 0) {
      return (
        <Text style={[styles.reportsPlaceholder, { color: placeholderColor }]}>
          No history found. Scan now!
        </Text>
      );
    }

    // Show first 3 records only (non-scrollable preview)
    const visibleRecords = scanHistory.slice(0, 3);
    const hasMore = scanHistory.length > 3;

    return (
      <View style={styles.historyContainer}>
        <View>
          {visibleRecords.map((record, index) => 
            renderHistoryRecord(record, index, index < visibleRecords.length - 1)
          )}
        </View>
        
        {hasMore && (
          <TouchableOpacity
            style={[styles.viewMoreButton, { borderTopColor: dividerBorderColor }]}
            onPress={() => setShowFullHistory(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewMoreText, { color: viewMoreTextColor }]}>
              View All ({scanHistory.length} records)
            </Text>
            <MaterialCommunityIcons 
              name="arrow-expand" 
              size={responsive(18)} 
              color={viewMoreTextColor} 
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Determine theme - default to dark if not set
  const isDarkTheme = !user?.theme || user.theme === 'dark';
  const backgroundImage = isDarkTheme ? darkBackground : lightBackground;
  
  // Theme-based colors
  const colors = {
    text: isDarkTheme ? '#FFFFFF' : '#000000',
    textSecondary: isDarkTheme ? '#CCCCCC' : '#666666',
    cardBg: isDarkTheme ? '#2a2a2a' : '#FFFFFF',
    border: isDarkTheme ? '#333333' : '#E0E0E0',
    iconColor: isDarkTheme ? '#FFFFFF' : '#000000',
    placeholderText: isDarkTheme ? '#888888' : '#999999',
    divider: isDarkTheme ? '#444444' : '#DDDDDD',
    historyText: isDarkTheme ? '#FFFFFF' : '#000000',
    historyMeta: isDarkTheme ? '#AAAAAA' : '#666666',
    historyTimestamp: isDarkTheme ? '#888888' : '#999999',
    modalBg: isDarkTheme ? '#1a1a1a' : '#F5F5F5',
    modalHeader: isDarkTheme ? '#2a2a2a' : '#FFFFFF',
  };

  return (
    <ImageBackground 
      source={backgroundImage} 
      style={styles.container}
      resizeMode="cover"
    >
      {/* Top Section - Login/Logout and Settings */}
      <View style={styles.topBar}>
        {/* Settings Icon - Only show when logged in */}
        {isAuthenticated && (
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <MaterialCommunityIcons 
              name="cog-outline" 
              size={responsive(28)} 
              color={colors.iconColor} 
            />
          </TouchableOpacity>
        )}

        {/* Spacer when logged out to keep layout */}
        {!isAuthenticated && <View style={styles.settingsButton} />}

        {/* Login or Logout Button */}
        {isAuthenticated ? (
          <TouchableOpacity 
            style={[styles.logoutButton, { 
              backgroundColor: isDarkTheme ? '#FF0000' : '#FF4444' 
            }]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.loginButton, { 
              backgroundColor: isDarkTheme ? '#FFFFFF' : '#4285F4' 
            }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.loginButtonText, { 
              color: isDarkTheme ? '#000000' : '#FFFFFF' 
            }]}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Greeting Section */}
      <View style={styles.greetingSection}>
        {isAuthenticated ? (
          <>
            <Text style={[styles.greetingTitle, { color: colors.text }]}>Hey, {user?.username || 'User'}</Text>
            <Text style={[styles.greetingSubtitle, { color: colors.textSecondary }]}>How are you doing today?</Text>
          </>
        ) : (
          <Text style={[styles.greetingTitle, { color: colors.text }]}>Good Day!</Text>
        )}
      </View>

      {/* Ready to Scan Button */}
      <TouchableOpacity 
        style={[styles.scanButton, { 
          backgroundColor: isDarkTheme ? '#2a2a2a' : '#F5F5F5',
          borderColor: isDarkTheme ? 'transparent' : '#DDDDDD',
          borderWidth: isDarkTheme ? 0 : 1,
        }]}
        onPress={() => navigation.navigate('Upload')}
        activeOpacity={0.8}
      >
        <View style={styles.scanButtonContent}>
          <View>
            <Text style={[styles.scanButtonTitle, { color: colors.text }]}>Ready to Scan a new Xray?</Text>
            <Text style={[styles.scanButtonSubtitle, { color: colors.textSecondary }]}>Let's Do it!</Text>
          </View>
          <View style={[styles.arrowCircle, { 
            backgroundColor: isDarkTheme ? '#FFFFFF' : '#E8E8E8',
            borderColor: isDarkTheme ? 'transparent' : '#DDDDDD',
            borderWidth: isDarkTheme ? 0 : 1,
          }]}>
            <Text style={[styles.arrowIcon, { 
              color: isDarkTheme ? '#000000' : '#333333' 
            }]}>{'>>>'}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Previous Reports Section */}
      <View style={styles.reportsSection}>
        <Text style={[styles.reportsTitle, { color: colors.text }]}>Previous Reports</Text>
        
        <View style={[styles.reportsBox, { 
          backgroundColor: isDarkTheme ? '#2a2a2a' : '#F5F5F5',
          borderColor: isDarkTheme ? 'transparent' : '#DDDDDD',
          borderWidth: isDarkTheme ? 0 : 1,
        }]}>
          {renderHistoryContent()}
        </View>
      </View>

      {/* Full History Modal */}
      <Modal
        visible={showFullHistory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFullHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.modalBg }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { 
              backgroundColor: colors.modalHeader,
              borderBottomColor: colors.border,
            }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Scan History</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFullHistory(false)}
              >
                <MaterialCommunityIcons 
                  name="close" 
                  size={responsive(28)} 
                  color={colors.iconColor} 
                />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollViewContent}
            >
              {scanHistory.map((record, index) => 
                renderHistoryRecord(record, index, index < scanHistory.length - 1)
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  // Top Bar - Contains settings and login/logout
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: responsive(60), // Distance from top - adjust as needed
    paddingHorizontal: responsive(13), // Side padding - adjust as needed
  },

  // Settings Button (not clickable)
  settingsButton: {
    width: responsive(70), // Button size - adjust as needed
    height: responsive(70),
    justifyContent: "center",
    alignItems: "center",
  },

  // Login Button
  loginButton: {
    // Background color applied dynamically
    paddingHorizontal: responsive(20), // Horizontal padding - adjust as needed
    paddingVertical: responsive(12), // Vertical padding - adjust as needed
    borderRadius: responsive(25), // Rounded corners - adjust as needed
    marginRight: responsive(18),
  },

  loginButtonText: {
    // Color applied dynamically
    fontSize: responsive(16), // Font size - adjust as needed
    fontWeight: "600",
    fontFamily: "Montserrat",
  },

  // Logout Button
  logoutButton: {
    // Background color applied dynamically
    paddingHorizontal: responsive(20), // Horizontal padding - adjust as needed
    paddingVertical: responsive(12), // Vertical padding - adjust as needed
    borderRadius: responsive(25), // Rounded corners - adjust as needed
    marginRight: responsive(18),
  },

  logoutButtonText: {
    color: "#FFFFFF", // White text always
    fontSize: responsive(16), // Font size - adjust as needed
    fontWeight: "600",
    fontFamily: "Montserrat",
  },

  // Greeting Section
  greetingSection: {
    paddingHorizontal: responsive(30),
    marginTop: responsive(25), // Space from top bar - adjust as needed
    marginBottom: responsive(30), // Space below greeting - adjust as needed
    marginLeft: responsive(5),
  },

  greetingTitle: {
    fontSize: responsive(40), // Font size - adjust as needed
    fontWeight: "700",
    // Color applied dynamically
    fontFamily: "Montserrat",
    marginBottom: responsive(5),
  },

  greetingSubtitle: {
    fontSize: responsive(18), // Font size - adjust as needed
    fontWeight: "400",
    // Color applied dynamically
    fontFamily: "Montserrat",
  },

  // Ready to Scan Button
  scanButton: {
    marginHorizontal: responsive(30),
    // Background color applied dynamically
    borderRadius: responsive(30), // Rounded corners - adjust as needed
    padding: responsive(25), // Inner padding - adjust as needed
    marginBottom: responsive(40), // Space below button - adjust as needed
  },

  scanButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  scanButtonTitle: {
    fontSize: responsive(20), // Font size - adjust as needed
    fontWeight: "700",
    // Color applied dynamically
    fontFamily: "Montserrat",
    marginBottom: responsive(5),
  },

  scanButtonSubtitle: {
    fontSize: responsive(14), // Font size - adjust as needed
    fontWeight: "400",
    // Color applied dynamically
    fontFamily: "Montserrat",
  },

  arrowCircle: {
    width: responsive(60), // Circle size - adjust as needed
    height: responsive(60),
    borderRadius: responsive(30),
    // Background color applied dynamically
    justifyContent: "center",
    alignItems: "center",
  },

  arrowIcon: {
    fontSize: responsive(18), // Arrow size - adjust as needed
    // Color applied dynamically
    fontWeight: "700",
    marginBottom: responsive(2),
  },

  // Previous Reports Section
  reportsSection: {
    paddingHorizontal: responsive(30),
    flex: 1,
  },

  reportsTitle: {
    fontSize: responsive(28), // Font size - adjust as needed
    fontWeight: "700",
    // Color applied dynamically
    fontFamily: "Montserrat",
    marginBottom: responsive(20), // Space below title - adjust as needed
  },

  reportsBox: {
    // Background color applied dynamically
    borderRadius: responsive(30), // Rounded corners - adjust as needed
    padding: responsive(20), // Inner padding - reduced for better list display
    height: responsive(300), // Box height - increased by 50% (was 200)
    justifyContent: "center",
  },

  reportsPlaceholder: {
    fontSize: responsive(16), // Font size - adjust as needed
    fontWeight: "400",
    // Color applied dynamically
    fontFamily: "Montserrat",
    textAlign: "center",
  },

  // Loading State
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    fontSize: responsive(14),
    fontWeight: "400",
    // Color applied dynamically
    fontFamily: "Montserrat",
    marginTop: responsive(10),
  },

  // History Container
  historyContainer: {
    flex: 1,
  },

  historyScrollView: {
    flex: 1,
  },

  // History Record
  historyRecord: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: responsive(12),
  },

  historyRecordContent: {
    flex: 1,
    marginRight: responsive(10),
  },

  historyPatientName: {
    fontSize: responsive(16),
    fontWeight: "600",
    // Color applied dynamically
    fontFamily: "Montserrat",
    marginBottom: responsive(4),
  },

  historyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  historyModel: {
    fontSize: responsive(13),
    fontWeight: "400",
    // Color applied dynamically
    fontFamily: "Montserrat",
  },

  historyTimestamp: {
    fontSize: responsive(12),
    fontWeight: "400",
    // Color applied dynamically
    fontFamily: "Montserrat",
  },

  historyDivider: {
    height: 1,
    // Background color applied dynamically
    marginVertical: responsive(4),
  },

  // View More Button
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: responsive(15),
    borderTopWidth: 1,
    // Border color applied dynamically
    marginTop: responsive(10),
  },

  viewMoreText: {
    fontSize: responsive(14),
    fontWeight: "500",
    // Color applied dynamically
    fontFamily: "Montserrat",
    marginRight: responsive(8),
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.8,
    // Background color applied dynamically
    borderRadius: responsive(20),
    overflow: "hidden",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsive(20),
    paddingVertical: responsive(20),
    // Background color applied dynamically
    borderBottomWidth: 1,
    // Border color applied dynamically
  },

  modalTitle: {
    fontSize: responsive(22),
    fontWeight: "700",
    // Color applied dynamically
    fontFamily: "Montserrat",
  },

  closeButton: {
    width: responsive(40),
    height: responsive(40),
    justifyContent: "center",
    alignItems: "center",
  },

  modalScrollView: {
    flex: 1,
    paddingHorizontal: responsive(20),
    paddingVertical: responsive(15),
  },

  modalScrollViewContent: {
    paddingBottom: responsive(30), // Add padding at the bottom for last record
  },
});
