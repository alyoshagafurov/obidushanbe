/** Базовые UI-примитивы: Button, Input, Card, Text-хелперы, состояния. */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { t } from '../i18n';

/* --------------------------------- Text -------------------------------- */

type TxtProps = { children: React.ReactNode; style?: TextStyle | TextStyle[]; numberOfLines?: number };
export const H1 = ({ children, style }: TxtProps) => <Text style={[styles.h1, style]}>{children}</Text>;
export const H2 = ({ children, style }: TxtProps) => <Text style={[styles.h2, style]}>{children}</Text>;
export const H3 = ({ children, style }: TxtProps) => <Text style={[styles.h3, style]}>{children}</Text>;
export const Body = ({ children, style, numberOfLines }: TxtProps) => (
  <Text style={[styles.body, style]} numberOfLines={numberOfLines}>
    {children}
  </Text>
);
export const Muted = ({ children, style, numberOfLines }: TxtProps) => (
  <Text style={[styles.muted, style]} numberOfLines={numberOfLines}>
    {children}
  </Text>
);

/* -------------------------------- Button ------------------------------- */

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'dark' | 'accent';
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  small,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const bg: Record<string, string> = {
    primary: colors.primary,
    secondary: colors.primaryLight,
    outline: 'transparent',
    danger: colors.danger,
    success: colors.success,
    dark: colors.ink,
    accent: colors.accent,
  };
  const fg: Record<string, string> = {
    primary: colors.onPrimary,
    secondary: colors.primary,
    outline: colors.text,
    danger: colors.onPrimary,
    success: colors.onPrimary,
    dark: colors.onDark,
    accent: colors.onPrimary,
  };
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        {
          backgroundColor: bg[variant],
          opacity: isDisabled ? 0.45 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
        variant === 'outline' && styles.btnOutline,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <Text style={[styles.btnText, { color: fg[variant] }, small && styles.btnTextSmall]}>{title}</Text>
      )}
    </Pressable>
  );
}

/* -------------------------------- Input -------------------------------- */

interface InputProps extends TextInputProps {
  label?: string;
}

export function Input({ label, style, ...props }: InputProps) {
  return (
    <View style={styles.inputWrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

/* --------------------------------- Card -------------------------------- */

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/* ------------------------------- States -------------------------------- */

export function Loading({ text }: { text?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      {text ? <Muted style={{ marginTop: spacing.md }}>{text}</Muted> : null}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Body style={{ textAlign: 'center', marginBottom: spacing.md }}>
        {message ?? t().common.error}
      </Body>
      {onRetry ? <Button title={t().common.retry} variant="outline" onPress={onRetry} small /> : null}
    </View>
  );
}

export function EmptyView({ text, icon = '📭' }: { text?: string; icon?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorIcon}>{icon}</Text>
      <Muted style={{ textAlign: 'center' }}>{text ?? t().common.empty}</Muted>
    </View>
  );
}

/* ------------------------------- Divider ------------------------------- */
export const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  h1: { ...typography.h1, color: colors.text },
  h2: { ...typography.h2, color: colors.text },
  h3: { ...typography.h3, color: colors.text },
  body: { ...typography.body, color: colors.text },
  muted: { ...typography.small, color: colors.textSecondary },

  btn: {
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnSmall: { height: 40, borderRadius: radius.sm, paddingHorizontal: spacing.md },
  btnOutline: { borderWidth: 1.5, borderColor: colors.border },
  btnText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  btnTextSmall: { fontSize: 14, letterSpacing: 0 },

  inputWrap: { marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase' },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.soft,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorIcon: { fontSize: 36, marginBottom: spacing.sm },
  divider: { height: 1, backgroundColor: colors.hairline, marginVertical: spacing.md },
});
