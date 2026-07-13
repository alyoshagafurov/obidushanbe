import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { UserRole } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Button, Input, H2, Muted } from '../../components/ui';
import { completeRegistration } from '../../api/auth';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { colors, radius, spacing } from '../../theme';
import { t } from '../../i18n';

const ROLES: { value: UserRole; icon: string }[] = [
  { value: UserRole.CLIENT, icon: '🛒' },
  { value: UserRole.COURIER, icon: '🚚' },
  { value: UserRole.OPERATOR, icon: '🎧' },
  { value: UserRole.CASHIER, icon: '🧮' },
  { value: UserRole.ADMIN, icon: '👑' },
];

// Роли, которым нужно подтверждение администратора.
const PENDING_ROLES = [UserRole.COURIER, UserRole.OPERATOR, UserRole.CASHIER];

/** Завершение регистрации: имя + выбор роли (+ код для админа). */
export function RegistrationScreen() {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const user = await completeRegistration({
        name: name.trim(),
        role,
        adminCode: role === UserRole.ADMIN ? adminCode.trim() : undefined,
      });
      setUser(user); // обновляем стор -> навигация уходит дальше (или на экран ожидания)
    } catch (e) {
      Alert.alert(t().common.error, apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.head}>
        <H2>{t().auth.nameTitle}</H2>
      </View>
      <Input value={name} onChangeText={setName} placeholder={t().auth.namePlaceholder} autoFocus />

      <Muted style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}>{t().auth.chooseRole}</Muted>
      <View style={styles.roles}>
        {ROLES.map((r) => {
          const active = r.value === role;
          return (
            <Pressable
              key={r.value}
              onPress={() => setRole(r.value)}
              style={[styles.roleCard, active && styles.roleActive]}
            >
              <Text style={styles.roleIcon}>{r.icon}</Text>
              <Text style={[styles.roleLabel, active && { color: colors.primary }]}>
                {t().roles[r.value]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {role === UserRole.ADMIN ? (
        <Input
          label={t().auth.adminCode}
          value={adminCode}
          onChangeText={setAdminCode}
          placeholder={t().auth.adminCodeHint}
          secureTextEntry
          style={{ marginTop: spacing.md }}
        />
      ) : null}

      {PENDING_ROLES.includes(role) ? (
        <Muted style={styles.note}>⏳ {t().auth.pendingText}</Muted>
      ) : null}

      <Button
        title={t().auth.register}
        onPress={submit}
        loading={loading}
        disabled={!name.trim() || (role === UserRole.ADMIN && !adminCode.trim())}
        style={{ marginTop: spacing.lg }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { marginTop: spacing.lg, marginBottom: spacing.lg },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  roleCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  roleActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  roleIcon: { fontSize: 30, marginBottom: spacing.xs },
  roleLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  note: {
    marginTop: spacing.md,
    color: colors.warning,
    backgroundColor: '#FFF7E6',
    padding: spacing.md,
    borderRadius: radius.sm,
  },
});
