import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { PhoneScreen } from '../screens/auth/PhoneScreen';
import { CodeScreen } from '../screens/auth/CodeScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerShadowVisible: false,
        headerTintColor: colors.onPrimary,
        headerTitle: '',
      }}
    >
      <Stack.Screen name="Phone" component={PhoneScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Code" component={CodeScreen} />
    </Stack.Navigator>
  );
}
