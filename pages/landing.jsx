//responsive code - Calculated in percentages
import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import lightBackground from "../assets/landing1.jpg";
import darkBackground from "../assets/landing2.jpg"; 

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (Pixel 7)
const BASE_WIDTH = 432;
const BASE_HEIGHT = 818;

// Scaling factors
const scaleWidth = SCREEN_WIDTH / BASE_WIDTH;
const scaleHeight = SCREEN_HEIGHT / BASE_HEIGHT;
const scale = Math.min(scaleWidth, scaleHeight); // Use minimum to maintain aspect ratio

// Responsive size function
const responsive = (size) => size * scale;

export default function Landing({ navigation }) {
  const { user } = useAuth();

  // Redirect logged-in users directly to dashboard
  useEffect(() => {
    if (user) {
      navigation.replace('Dashboard');
    }
  }, [user]);
  
  // Determine theme - default to dark if user not logged in or theme not set
  const isDarkTheme = !user?.theme || user.theme === 'dark';
  const backgroundImage = isDarkTheme ? darkBackground : lightBackground;
  const textColor = isDarkTheme ? '#FFFFFF' : '#000000';
  
  return (
    <ImageBackground 
      source={backgroundImage} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* Main Title Section */}
        <View style={styles.titleContainer}>
          <Text style={[styles.mainTitle, { color: textColor }]}>RadiantClariX</Text>
          
          {/* Subtitle Section */}
          <Text style={[styles.subtitle, { color: textColor }]}>Your AI Assistant that reads your X-rays</Text>
          <Text style={[styles.subtitle, { color: textColor }]}>Fast, Accurate, and Clear.</Text>
        </View>

        {/* Bottom Section with Let's Start text and Arrow Button */}
        <View style={styles.bottomSection}>
          <Text style={[styles.letsStartText, { color: textColor }]}>Let's Start</Text>
          
          {/* Arrow Button - Circle with greater than symbol */}
          <TouchableOpacity 
              style={[styles.arrowButton, { 
                backgroundColor: isDarkTheme ? '#FFFFFF' : '#000000' 
              }]}
              onPress={() => navigation.navigate('Login')}
              >
            <Text style={[styles.arrowIcon, { 
              color: isDarkTheme ? '#000000' : '#FFFFFF' 
            }]}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // Background Image - Full screen coverage
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  // Main Container
  container: {
    flex: 1,
    justifyContent: "space-between", // Pushes title to top and bottom section to bottom
    paddingTop: responsive(60), // Top padding - adjust as needed
    paddingBottom: responsive(50), // Bottom padding - adjust as needed
    paddingHorizontal: responsive(45), // Left and right padding - adjust as needed
  },

  // Title Container - Top Section
  titleContainer: {
    // Adjust marginTop to move entire title section up/down
    marginTop: responsive(555), // Distance from top - adjust as needed
  },

  // Main Title "RadiantClariX"
  mainTitle: {
    fontSize: responsive(42), // Font size - adjust as needed
    fontWeight: "700", // Font weight (300=light, 400=normal, 500=medium, 600=semibold, 700=bold, 800=extrabold)
    // Color set dynamically based on theme
    fontFamily: "Montserrat", // Font family - make sure Montserrat is loaded in your project
    marginBottom: responsive(15), // Space below main title - adjust as needed
    letterSpacing: 1.5, // Letter spacing - adjust as needed
  },

  // Subtitle text "Your AI Assistant that reads your X-rays" and "Fast, Accurate, and Clear."
  subtitle: {
    fontSize: responsive(17), // Font size - adjust as needed
    fontWeight: "350", // Font weight
    // Color set dynamically based on theme
    fontFamily: "Montserrat", // Font family
    lineHeight: responsive(24), // Line height - space between lines - adjust as needed
    letterSpacing: 0.5, // Letter spacing - adjust as needed
  },

  // Bottom Section - Contains "Let's Start" text and arrow button
  bottomSection: {
    flexDirection: "row", // Places text and button side by side
    alignItems: "center", // Vertically centers items
    justifyContent: "space-between", // Pushes text left and button right
    marginBottom: responsive(40), // Distance from bottom - adjust as needed
  },

  // "Let's Start" text
  letsStartText: {
    fontSize: responsive(28), // Font size - adjust as needed
    fontWeight: "700", // Font weight
    // Color set dynamically based on theme
    fontFamily: "Montserrat", // Font family
    letterSpacing: 0.5,
  },

  // Arrow Button - Circle (color set dynamically)
  arrowButton: {
    width: responsive(90), // Circle width - adjust as needed
    height: responsive(90), // Circle height - adjust as needed
    borderRadius: responsive(45), // Half of width/height for perfect circle
    // Background color set dynamically based on theme
    justifyContent: "center", // Centers arrow vertically
    alignItems: "center", // Centers arrow horizontally
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    // Shadow for Android
    elevation: 10,
  },

  // Arrow Icon inside button - ">" symbol
  arrowIcon: {
    fontSize: responsive(42), // Arrow size - adjust as needed
    // Color set dynamically based on theme
    fontWeight: "600", // Arrow weight (300-900)
    lineHeight: responsive(42), // Same as fontSize for better centering
    marginTop: -2, // Fine-tune vertical position - adjust as needed
  },
});
