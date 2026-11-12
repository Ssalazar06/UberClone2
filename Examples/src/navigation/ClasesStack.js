import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ClasesScreen from '../screens/ClasesScreen';
import DetailClaseScreen from '../screens/DetailClaseScreen';
import ReservasScreen from '../screens/ReservasScreen';

const Stack = createNativeStackNavigator();

export default function ClasesStack() {
  return (
    <Stack.Navigator
      initialRouteName="ClasesList"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ClasesList"
        component={ClasesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DetailClase"
        component={DetailClaseScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Reservas"
        component={ReservasScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}