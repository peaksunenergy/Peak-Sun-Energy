import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';

// Public screens
import HomeScreen from '../screens/HomeScreen';
import ServicesScreen from '../screens/ServicesScreen';
import QuoteRequestScreen from '../screens/QuoteRequestScreen';
import ContactScreen from '../screens/ContactScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// Client screens
import ClientDashboardScreen from '../screens/client/ClientDashboardScreen';
import ClientNewClaimScreen from '../screens/client/ClientNewClaimScreen';
import ClientClaimsScreen from '../screens/client/ClientClaimsScreen';

// Admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminClientManagementScreen from '../screens/admin/AdminClientManagementScreen';
import AdminAddClientScreen from '../screens/admin/AdminAddClientScreen';
import AdminClaimManagementScreen from '../screens/admin/AdminClaimManagementScreen';
import AdminQuoteRequestsScreen from '../screens/admin/AdminQuoteRequestsScreen';
import AdminTechStatsScreen from '../screens/admin/AdminTechStatsScreen';

// Technician screens
import TechDashboardScreen from '../screens/tech/TechDashboardScreen';
import TechClaimsScreen from '../screens/tech/TechClaimsScreen';

const Stack = createNativeStackNavigator();

function PublicStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Services" component={ServicesScreen} />
      <Stack.Screen name="QuoteRequest" component={QuoteRequestScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function ClientStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientDashboard" component={ClientDashboardScreen} />
      <Stack.Screen name="ClientNewClaim" component={ClientNewClaimScreen} />
      <Stack.Screen name="ClientClaims" component={ClientClaimsScreen} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminClients" component={AdminClientManagementScreen} />
      <Stack.Screen name="AdminAddClient" component={AdminAddClientScreen} />
      <Stack.Screen
        name="AdminEditClient"
        component={AdminAddClientScreen}
      />
      <Stack.Screen name="AdminClaims" component={AdminClaimManagementScreen} />
      <Stack.Screen name="AdminQuotes" component={AdminQuoteRequestsScreen} />
      <Stack.Screen name="AdminTechStats" component={AdminTechStatsScreen} />
    </Stack.Navigator>
  );
}

function TechStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TechDashboard" component={TechDashboardScreen} />
      <Stack.Screen name="TechClaims" component={TechClaimsScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <PublicStack />
      ) : user.role === 'admin' ? (
        <AdminStack />
      ) : user.role === 'technician' ? (
        <TechStack />
      ) : (
        <ClientStack />
      )}
    </NavigationContainer>
  );
}
