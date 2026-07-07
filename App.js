import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider } from "./context/AuthContext";


// Import pages
import Landing from "./pages/landing";
import Dashboard from "./pages/dashboard";
import Upload from "./pages/upload";
import Results from "./pages/results";
import Login from "./pages/login";
import Register from "./pages/register";
import Settings from "./pages/settings";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Landing"
          screenOptions={{
            headerShown: false, // Hides the header on all screens
          }}
        >
          <Stack.Screen name="Landing" component={Landing} />
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="Upload" component={Upload} />
          <Stack.Screen name="Results" component={Results} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Settings" component={Settings} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}