/** Премиальная градиентная hero-секция (графит → вода). Используется на ключевых экранах. */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, radius } from '../theme';

interface Props {
  children?: React.ReactNode;
  variant?: keyof typeof gradients;
  style?: ViewStyle;
  rounded?: boolean;
}

export function Hero({ children, variant = 'hero', style, rounded }: Props) {
  return (
    <LinearGradient
      colors={gradients[variant] as unknown as string[]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.base, rounded && styles.rounded, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: { width: '100%' },
  rounded: { borderRadius: radius.xl, overflow: 'hidden' },
});
