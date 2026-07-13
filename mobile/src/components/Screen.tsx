import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle, RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

/** Базовый контейнер экрана с безопасными зонами и фоном темы. */
export function Screen({ children, scroll, padded = true, style, refreshControl }: Props) {
  const inner = (
    <View style={[padded && styles.padded, !scroll && styles.flex, style]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  padded: { padding: spacing.lg },
  scrollContent: { flexGrow: 1 },
});
