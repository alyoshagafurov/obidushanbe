import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Hero } from '../../components/Hero';
import { Body, Button, Card, Divider, Muted } from '../../components/ui';
import { Avatar } from '../../components/widgets';
import { useAuthStore } from '../../store/auth.store';
import { colors, spacing } from '../../theme';
import { t } from '../../i18n';

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <View style={styles.root}>
      <Hero style={styles.hero}>
        <SafeAreaView edges={['top']} style={styles.heroInner}>
          <View style={styles.avatarRing}>
            <Avatar name={user?.name} size={84} />
          </View>
          <Text style={styles.name}>{user?.name ?? '—'}</Text>
          {user ? (
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>{t().roles[user.role]}</Text>
            </View>
          ) : null}
        </SafeAreaView>
      </Hero>

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.row}>
            <Muted>{t().common.phone}</Muted>
            <Body style={styles.value}>{user?.phone}</Body>
          </View>
          <Divider />
          <View style={styles.row}>
            <Muted>{t().common.role}</Muted>
            <Body style={styles.value}>{user ? t().roles[user.role] : ''}</Body>
          </View>
        </Card>

        <Button title={t().auth.logout} variant="outline" onPress={signOut} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { paddingBottom: spacing.xxl },
  heroInner: { alignItems: 'center', paddingTop: spacing.lg },
  avatarRing: {
    padding: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  name: { color: colors.onDark, fontSize: 22, fontWeight: '800', marginTop: spacing.md, letterSpacing: -0.3 },
  roleChip: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 999,
  },
  roleChipText: { color: colors.onDark, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  content: { padding: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  value: { fontWeight: '700' },
});
