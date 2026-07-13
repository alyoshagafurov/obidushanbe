import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button, H2, Muted } from '../../components/ui';
import { useAuthStore } from '../../store/auth.store';
import { spacing } from '../../theme';
import { t } from '../../i18n';

/** Экран ожидания подтверждения админом (для доставщика/оператора). */
export function PendingScreen() {
  const signOut = useAuthStore((s) => s.signOut);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const user = useAuthStore((s) => s.user);

  return (
    <Screen>
      <View style={styles.center}>
        <Text style={styles.icon}>⏳</Text>
        <H2 style={{ textAlign: 'center' }}>{t().auth.pendingTitle}</H2>
        <Muted style={styles.text}>{t().auth.pendingText}</Muted>
        {user ? (
          <Muted style={styles.role}>
            {t().common.role}: {t().roles[user.role]}
          </Muted>
        ) : null}
        <Button title={t().auth.refresh} onPress={() => bootstrap()} style={styles.btn} />
        <Button title={t().auth.logout} variant="outline" onPress={signOut} style={styles.btn} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 60, marginBottom: spacing.lg },
  text: { textAlign: 'center', marginTop: spacing.md, marginHorizontal: spacing.lg },
  role: { marginTop: spacing.md },
  btn: { alignSelf: 'stretch', marginTop: spacing.md, marginHorizontal: spacing.xl },
});
