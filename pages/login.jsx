import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Alert,
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

export default function Login({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);

    const result = await login(email, password);

    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Login successful!');
      navigation.navigate('Dashboard');
    } else {
      Alert.alert('Login Failed', result.message || 'Invalid credentials');
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

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to your account</Text>

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

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: responsive(25),
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

  // Login Button
  loginButton: {
    backgroundColor: "#4285F4",
    borderRadius: responsive(12),
    padding: responsive(16),
    alignItems: "center",
    marginTop: responsive(10),
    marginBottom: responsive(20),
  },

  loginButtonDisabled: {
    opacity: 0.6,
  },

  loginButtonText: {
    fontSize: responsive(18),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Montserrat",
  },

  // Register Link
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  registerText: {
    fontSize: responsive(14),
    color: "#CCCCCC",
    fontFamily: "Montserrat",
  },

  registerLink: {
    fontSize: responsive(14),
    fontWeight: "700",
    color: "#4285F4",
    fontFamily: "Montserrat",
  },
});