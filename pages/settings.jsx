//learningrn/pages/settings.jsx


import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  ImageBackground,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/api";
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

export default function Settings({ navigation }) {
  const { user, token, logout, updateUser } = useAuth();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [isDark, setIsDark] = useState(user?.theme === 'dark');
  
  // Password change modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete account modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  // Delete history modal states
  const [showDeleteHistoryModal, setShowDeleteHistoryModal] = useState(false);

  // Logout modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Handle username update
  const handleUpdateUsername = async () => {
    if (!newUsername || newUsername === user?.username) {
      setIsEditingUsername(false);
      return;
    }

    try {
      const result = await userAPI.updateUsername(token, newUsername);
      
      if (result.success) {
        await updateUser({ username: newUsername });
        Alert.alert('Success', 'Username updated successfully');
        setIsEditingUsername(false);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update username');
    }
  };

  // Handle theme toggle
  const handleThemeToggle = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);

    try {
      const result = await userAPI.updateTheme(token, newTheme);
      
      if (result.success) {
        await updateUser({ theme: newTheme });
      } else {
        // Revert if failed
        setIsDark(!isDark);
        Alert.alert('Error', 'Failed to update theme');
      }
    } catch (error) {
      setIsDark(!isDark);
      Alert.alert('Error', 'Failed to update theme');
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    try {
      const result = await userAPI.changePassword(
        token,
        currentPassword,
        newPassword,
        confirmPassword
      );

      if (result.success) {
        Alert.alert('Success', 'Password changed successfully');
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      const result = await userAPI.deleteAccount(token, deletePassword);

      if (result.success) {
        Alert.alert('Account Deleted', 'Your account has been deleted successfully');
        await logout();
        navigation.navigate('Dashboard');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account');
    }
  };

  // Handle delete scan history
  const handleDeleteHistory = async () => {
    try {
      const { scanHistoryAPI } = require('../services/api');
      const result = await scanHistoryAPI.deleteAllScans(token);

      if (result.success) {
        Alert.alert('Success', 'All scan history has been deleted');
        setShowDeleteHistoryModal(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to delete history');
      }
    } catch (error) {
      console.error('Delete history error:', error);
      Alert.alert('Error', 'Failed to delete scan history');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        setShowLogoutModal(false);
        navigation.navigate('Dashboard');
      } else {
        Alert.alert('Error', 'Failed to logout');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const backgroundImage = isDark ? darkBackground : lightBackground;

  return (
    <ImageBackground 
      source={backgroundImage} 
      style={styles.container}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>

        {/* Username Section */}
        <View style={styles.usernameSection}>
          {isEditingUsername ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.usernameInput, { color: isDark ? '#FFFFFF' : '#000000' }]}
                value={newUsername}
                onChangeText={setNewUsername}
                autoFocus
                onBlur={handleUpdateUsername}
              />
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditingUsername(true)}>
              <Text style={[styles.username, { color: isDark ? '#FFFFFF' : '#000000' }]}>{user?.username || 'Username'}</Text>
              <Text style={styles.clickToEdit}>Click To Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Theme Toggle */}
        <View style={styles.themeSection}>
          <View style={styles.themeToggle}>
            <TouchableOpacity 
              style={styles.toggleContainer}
              onPress={handleThemeToggle}
            >
              {/* Sun/Moon Circle */}
              <View style={[styles.circle, isDark && styles.circleDark]}>
                {!isDark && <View style={styles.sunCore} />}
                {isDark && <View style={styles.crescentMoon} />}
              </View>
              
              {/* Toggle Switch */}
              <View style={styles.toggleSwitch}>
                <View style={[styles.slider, isDark && styles.sliderDark]} />
                <View style={styles.labels}>
                  <Text style={[
                    styles.label, 
                    { color: !isDark ? '#000000' : '#CCCCCC' },
                    !isDark && styles.labelActive
                  ]}>Light</Text>
                  <Text style={[
                    styles.label, 
                    { color: isDark ? '#FFFFFF' : '#888888' },
                    isDark && styles.labelActive
                  ]}>Dark</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsSection}>
          {/* Logout Button - Light Red */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={() => setShowLogoutModal(true)}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>

          {/* Change Password Button - Medium Red */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.changePasswordButton]}
            onPress={() => setShowPasswordModal(true)}
          >
            <Text style={styles.buttonText}>Change Your Password?</Text>
          </TouchableOpacity>

          {/* Delete History Button - Dark Red */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteHistoryButton]}
            onPress={() => setShowDeleteHistoryModal(true)}
          >
            <Text style={styles.buttonText}>Delete Reports History?</Text>
          </TouchableOpacity>

          {/* Delete Account Button - Darkest Red */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteAccountButton]}
            onPress={() => setShowDeleteModal(true)}
          >
            <Text style={styles.buttonText}>Delete Your Account?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Current Password"
              placeholderTextColor="#888888"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="New Password"
              placeholderTextColor="#888888"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm New Password"
              placeholderTextColor="#888888"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleChangePassword}
              >
                <Text style={styles.modalButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.warningText}>
              This action cannot be undone. Enter your password to confirm.
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter Password"
              placeholderTextColor="#888888"
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete History Modal */}
      <Modal
        visible={showDeleteHistoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Scan History</Text>
            <Text style={styles.warningText}>
              Are you sure you want to delete all your scan history? This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteHistoryModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDeleteHistory}
              >
                <Text style={styles.modalButtonText}>Delete All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.warningText}>
              Are you sure you want to logout?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleLogout}
              >
                <Text style={styles.modalButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  scrollContent: {
    paddingBottom: responsive(50),
  },

  // Back Button
  backButton: {
    position: "absolute",
    top: responsive(70),
    left: responsive(23),
    width: responsive(50),
    height: responsive(50),
    borderRadius: responsive(35),
    backgroundColor: "#e8e8e8",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },

  backIcon: {
    fontSize: responsive(28), // Match dashboard icon size
    marginBottom: responsive(5),
    fontWeight: "900",
    color: "#00000",
  },

  // Username Section
  usernameSection: {
    alignItems: "center",
    marginTop: responsive(120),
    marginBottom: responsive(40),
  },

  username: {
    fontSize: responsive(36),
    fontWeight: "700",
    // color applied dynamically inline
    fontFamily: "Montserrat",
    textAlign: "center",
  },

  clickToEdit: {
    fontSize: responsive(14),
    color: "#888888",
    fontFamily: "Montserrat",
    textAlign: "center",
    marginTop: responsive(8),
  },

  editContainer: {
    width: "80%",
  },

  usernameInput: {
    fontSize: responsive(36),
    fontWeight: "700",
    // color applied dynamically inline
    fontFamily: "Montserrat",
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#4285F4",
    paddingBottom: responsive(5),
  },

  // Theme Section
  themeSection: {
    alignItems: "center",
    marginBottom: responsive(60),
  },

  themeToggle: {
    backgroundColor: "#2a2a2a",
    borderRadius: responsive(20),
    padding: responsive(30),
  },

  toggleContainer: {
    alignItems: "center",
  },

  circle: {
    width: responsive(150),
    height: responsive(150),
    borderRadius: responsive(75),
    backgroundColor: "#FFA500", // Orange gradient base for sun
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsive(30),
    position: "relative",
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },

  circleDark: {
    backgroundColor: "#a3dafb", // Light blue for moon
    shadowColor: "#a3dafb",
  },

  // Sun core (gradient effect)
  sunCore: {
    width: responsive(140),
    height: responsive(140),
    borderRadius: responsive(70),
    backgroundColor: "#FFD700", // Gold/yellow
  },

  // Crescent moon shape
  crescentMoon: {
    width: responsive(130),
    height: responsive(130),
    borderRadius: responsive(65),
    backgroundColor: "#2a2a2a",
    position: "absolute",
    right: responsive(-20),
    top: responsive(10),
  },

  toggleSwitch: {
    width: responsive(220),
    height: responsive(55),
    backgroundColor: "#3a3a3a",
    borderRadius: responsive(30),
    position: "relative",
    overflow: "hidden",
  },

  slider: {
    position: "absolute",
    width: "50%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: responsive(30),
    left: 0,
  },

  sliderDark: {
    left: "50%",
    backgroundColor: "#5a5a5a",
  },

  labels: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: "100%",
    paddingHorizontal: responsive(25),
  },

  label: {
    fontSize: responsive(17),
    fontWeight: "700",
    fontFamily: "Montserrat",
    // Color applied dynamically inline
    zIndex: 1,
  },

  labelActive: {
    fontWeight: "800",
  },

  // Buttons Section
  buttonsSection: {
    paddingHorizontal: responsive(40),
  },

  actionButton: {
    borderRadius: responsive(15),
    paddingVertical: responsive(18),
    marginBottom: responsive(15),
    alignItems: "center",
  },

  // Button Colors - Light red to darkest red
  logoutButton: {
    backgroundColor: "#ff6b6b", // Light red
  },

  changePasswordButton: {
    backgroundColor: "#ff5252", // Medium red
  },

  deleteHistoryButton: {
    backgroundColor: "#ff3838", // Dark red
  },

  deleteAccountButton: {
    backgroundColor: "#fc0000", // Darkest red
  },

  disabledButton: {
    opacity: 0.5,
  },

  buttonText: {
    fontSize: responsive(16),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Montserrat",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "#2a2a2a",
    borderRadius: responsive(20),
    padding: responsive(30),
    width: "85%",
  },

  modalTitle: {
    fontSize: responsive(24),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Montserrat",
    marginBottom: responsive(10),
    textAlign: "center",
  },

  warningText: {
    fontSize: responsive(14),
    color: "#ff6b6b",
    fontFamily: "Montserrat",
    marginBottom: responsive(20),
    textAlign: "center",
  },

  modalInput: {
    backgroundColor: "#1a1a1a",
    borderRadius: responsive(12),
    padding: responsive(15),
    fontSize: responsive(16),
    color: "#FFFFFF",
    fontFamily: "Montserrat",
    marginBottom: responsive(15),
    borderWidth: 1,
    borderColor: "#3f3f46",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: responsive(10),
  },

  modalButton: {
    flex: 1,
    paddingVertical: responsive(15),
    borderRadius: responsive(12),
    alignItems: "center",
    marginHorizontal: responsive(5),
  },

  cancelButton: {
    backgroundColor: "#3f3f46",
  },

  confirmButton: {
    backgroundColor: "#4285F4",
  },

  deleteButton: {
    backgroundColor: "#fc0000",
  },

  modalButtonText: {
    fontSize: responsive(16),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Montserrat",
  },
});