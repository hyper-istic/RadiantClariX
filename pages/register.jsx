import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import backgroundImage from "../assets/clickupload.jpg";

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

export default function Register({ navigation }) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('error'); // 'error' or 'success'
  
  // Terms modal states
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const showModalMessage = (title, message, type = 'error') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  };

  const handleRegister = async () => {
    // Validation
    if (!username || !email || !password || !confirmPassword) {
      showModalMessage('Error', 'Please fill all fields', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showModalMessage('Error', 'Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showModalMessage('Error', 'Password must be at least 6 characters', 'error');
      return;
    }

    if (!agreedToTerms) {
      showModalMessage('Error', 'You must agree to the Terms and Conditions', 'error');
      return;
    }

    setLoading(true);

    const result = await register(username, email, password);

    setLoading(false);

    if (result.success) {
      showModalMessage('Success', 'Registration successful!', 'success');
      setTimeout(() => {
        setShowModal(false);
        navigation.navigate('Dashboard');
      }, 1500);
    } else {
      showModalMessage('Registration Failed', result.message || 'Please try again', 'error');
    }
  };

  return (
    <ImageBackground 
      source={backgroundImage} 
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>{'<'}</Text>
          </TouchableOpacity>

          {/* Register Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Register to get started</Text>

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#888888"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#888888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#888888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#888888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Terms and Conditions Checkbox */}
            <TouchableOpacity 
              style={styles.termsContainer}
              onPress={() => setShowTermsModal(true)}
            >
              <TouchableOpacity 
                style={styles.checkboxTouchable}
                onPress={(e) => {
                  e.stopPropagation();
                  setAgreedToTerms(!agreedToTerms);
                }}
              >
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                  {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms and Conditions</Text>
              </Text>
            </TouchableOpacity>

            {/* Register Button */}
            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Register</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Message Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={[
              styles.modalMessage,
              modalType === 'error' ? styles.errorText : styles.successText
            ]}>
              {modalMessage}
            </Text>

            <TouchableOpacity 
              style={[styles.modalButton, modalType === 'error' ? styles.errorButton : styles.successButton]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={showTermsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.termsModalOverlay}>
          <View style={styles.termsModalContainer}>
            <Text style={styles.termsModalTitle}>Terms and Conditions</Text>
            
            <ScrollView style={styles.termsScrollView} showsVerticalScrollIndicator={true}>
              <Text style={styles.termsFullText}>
                <Text style={styles.termsHeading}>Welcome to RadiantClariX</Text>
                {'\n\n'}
                By using this application, you agree to the following terms and conditions:
                {'\n\n'}
                <Text style={styles.termsHeading}>1. Medical Disclaimer</Text>
                {'\n'}
                RadiantClariX is an AI-powered tool designed to assist in X-ray analysis. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or qualified healthcare provider with any questions regarding a medical condition.
                {'\n\n'}
                <Text style={styles.termsHeading}>2. No Reliance on Results</Text>
                {'\n'}
                The AI-generated analysis provided by this app should not be solely relied upon for medical decisions. Results are for informational purposes only and may contain inaccuracies. Always consult with licensed medical professionals for proper diagnosis and treatment.
                {'\n\n'}
                <Text style={styles.termsHeading}>3. Data Privacy</Text>
                {'\n'}
                • Your X-ray images and analysis results are stored securely
                {'\n'}
                • We do not share your medical data with third parties without consent
                {'\n'}
                • Scan history is automatically deleted after 15 days
                {'\n'}
                • You can delete your data anytime from Settings
                {'\n\n'}
                <Text style={styles.termsHeading}>4. Acceptable Use Policy</Text>
                {'\n'}
                You agree NOT to:
                {'\n'}
                • Misuse or abuse the application
                {'\n'}
                • Attempt to exploit, hack, or reverse-engineer the system
                {'\n'}
                • Upload inappropriate, illegal, or non-medical images
                {'\n'}
                • Use the app for any unlawful purposes
                {'\n'}
                • Share your account credentials with others
                {'\n\n'}
                <Text style={styles.termsHeading}>5. Limitation of Liability</Text>
                {'\n'}
                RadiantClariX and its developers shall not be liable for any damages arising from the use or inability to use this application, including but not limited to medical misdiagnosis, data loss, or system failures.
                {'\n\n'}
                <Text style={styles.termsHeading}>6. AI Accuracy</Text>
                {'\n'}
                While our AI models are trained on extensive datasets, they are not 100% accurate. False positives and false negatives may occur. Always verify findings with qualified radiologists.
                {'\n\n'}
                <Text style={styles.termsHeading}>7. Age Restriction</Text>
                {'\n'}
                You must be at least 18 years old to use this application. If you are under 18, you must use this app under parental or guardian supervision.
                {'\n\n'}
                <Text style={styles.termsHeading}>8. Account Responsibility</Text>
                {'\n'}
                You are responsible for maintaining the confidentiality of your account and password. Any activity under your account is your responsibility.
                {'\n\n'}
                <Text style={styles.termsHeading}>9. Updates and Changes</Text>
                {'\n'}
                We reserve the right to modify these terms at any time. Continued use of the app after changes constitutes acceptance of the modified terms.
                {'\n\n'}
                <Text style={styles.termsHeading}>10. Emergency Situations</Text>
                {'\n'}
                This app is NOT for emergency use. In case of medical emergencies, immediately call emergency services or visit the nearest hospital.
                {'\n\n'}
                <Text style={styles.termsHeading}>11. Termination</Text>
                {'\n'}
                We reserve the right to terminate or suspend your account if you violate these terms or engage in prohibited activities.
                {'\n\n'}
                <Text style={styles.termsHeading}>12. Governing Law</Text>
                {'\n'}
                These terms shall be governed by applicable laws. Any disputes will be resolved through appropriate legal channels.
                {'\n\n'}
                By registering, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions.
              </Text>
            </ScrollView>

            <TouchableOpacity 
              style={styles.termsCloseButton}
              onPress={() => setShowTermsModal(false)}
            >
              <Text style={styles.termsCloseButtonText}>Close</Text>
            </TouchableOpacity>
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

  keyboardView: {
    flex: 1,
  },

  scrollView: {
    flexGrow: 1,
    justifyContent: "center",
  },

  // Back Button
  backButton: {
    position: "absolute",
    top: responsive(50),
    left: responsive(30),
    width: responsive(50),
    height: responsive(50),
    borderRadius: responsive(25),
    backgroundColor: "#3f3f46",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  backIcon: {
    fontSize: responsive(23),
    color: "#FFFFFF",
    fontWeight: "500",
  },

  // Form Container
  formContainer: {
    paddingHorizontal: responsive(40),
    paddingTop: responsive(120),
  },

  title: {
    fontSize: responsive(40),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Montserrat",
    marginBottom: responsive(10),
  },

  subtitle: {
    fontSize: responsive(16),
    fontWeight: "400",
    color: "#CCCCCC",
    fontFamily: "Montserrat",
    marginBottom: responsive(40),
  },

  // Input Fields
  inputContainer: {
    marginBottom: responsive(20),
  },

  label: {
    fontSize: responsive(14),
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Montserrat",
    marginBottom: responsive(8),
  },

  input: {
    backgroundColor: "#2a2a2a",
    borderRadius: responsive(12),
    padding: responsive(15),
    fontSize: responsive(16),
    color: "#FFFFFF",
    fontFamily: "Montserrat",
    borderWidth: 1,
    borderColor: "#3f3f46",
  },

  // Register Button
  registerButton: {
    backgroundColor: "#4285F4",
    borderRadius: responsive(12),
    padding: responsive(16),
    alignItems: "center",
    marginTop: responsive(10),
    marginBottom: responsive(20),
  },

  registerButtonDisabled: {
    opacity: 0.6,
  },

  registerButtonText: {
    fontSize: responsive(18),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Montserrat",
  },

  // Login Link
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  loginText: {
    fontSize: responsive(14),
    color: "#CCCCCC",
    fontFamily: "Montserrat",
  },

  loginLink: {
    fontSize: responsive(14),
    fontWeight: "700",
    color: "#4285F4",
    fontFamily: "Montserrat",
  },

  // Terms Checkbox
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: responsive(5),
    marginBottom: responsive(15),
    paddingHorizontal: responsive(5),
  },

  checkboxTouchable: {
    marginRight: responsive(10),
  },

  checkbox: {
    width: responsive(20),
    height: responsive(20),
    borderRadius: responsive(4),
    borderWidth: 2,
    borderColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxChecked: {
    backgroundColor: "#4285F4",
    borderColor: "#4285F4",
  },

  checkmark: {
    color: "#FFFFFF",
    fontSize: responsive(14),
    fontWeight: "700",
  },

  termsText: {
    flex: 1,
    fontSize: responsive(13),
    color: "#CCCCCC",
    fontFamily: "Montserrat",
  },

  termsLink: {
    color: "#4285F4",
    textDecorationLine: "underline",
  },

  // Message Modal Styles
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
    alignItems: "center",
  },

  modalTitle: {
    fontSize: responsive(24),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Montserrat",
    marginBottom: responsive(15),
    textAlign: "center",
  },

  modalMessage: {
    fontSize: responsive(16),
    fontFamily: "Montserrat",
    marginBottom: responsive(25),
    textAlign: "center",
    lineHeight: responsive(24),
  },

  errorText: {
    color: "#ff6b6b",
  },

  successText: {
    color: "#4ade80",
  },

  modalButton: {
    paddingVertical: responsive(15),
    paddingHorizontal: responsive(40),
    borderRadius: responsive(12),
    minWidth: responsive(120),
    alignItems: "center",
  },

  errorButton: {
    backgroundColor: "#ff6b6b",
  },

  successButton: {
    backgroundColor: "#4ade80",
  },

  modalButtonText: {
    fontSize: responsive(16),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Montserrat",
  },

  // Terms Modal Styles
  termsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },

  termsModalContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: responsive(20),
    padding: responsive(25),
    width: "90%",
    maxHeight: "85%",
  },

  termsModalTitle: {
    fontSize: responsive(26),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Montserrat",
    marginBottom: responsive(20),
    textAlign: "center",
  },

  termsScrollView: {
    maxHeight: responsive(400),
    marginBottom: responsive(20),
  },

  termsFullText: {
    fontSize: responsive(14),
    color: "#CCCCCC",
    fontFamily: "Montserrat",
    lineHeight: responsive(22),
  },

  termsHeading: {
    fontWeight: "700",
    color: "#FFFFFF",
    fontSize: responsive(15),
  },

  termsCloseButton: {
    backgroundColor: "#4285F4",
    paddingVertical: responsive(15),
    borderRadius: responsive(12),
    alignItems: "center",
  },

  termsCloseButtonText: {
    fontSize: responsive(16),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Montserrat",
  },
});
