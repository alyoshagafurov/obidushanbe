import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SMS_CODE_LENGTH } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Button, Input, Muted, H2 } from '../../components/ui';
import { AuthStackParamList } from '../../navigation/types';
import { verifyCode } from '../../api/auth';
import { requestCode } from '../../api/auth';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { spacing } from '../../theme';
import { t } from '../../i18n';

type Props = NativeStackScreenProps<AuthStackParamList, 'Code'>;

export function CodeScreen({ route }: Props) {
  const { phone, devCode } = route.params;
  const [code, setCode] = useState(devCode ?? '');
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);

  const submit = async () => {
    if (code.length !== SMS_CODE_LENGTH) return;
    setLoading(true);
    try {
      const res = await verifyCode(phone, code);
      // signIn переключит навигацию на нужную роль; имя спросим, если isNewUser.
      await signIn({ accessToken: res.accessToken, refreshToken: res.refreshToken }, res.user);
    } catch (e) {
      Alert.alert(t().common.error, apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await requestCode(phone);
      Alert.alert(t().common.appName, t().auth.resend);
    } catch (e) {
      Alert.alert(t().common.error, apiErrorMessage(e));
    }
  };

  return (
    <Screen scroll>
      <View style={styles.head}>
        <H2>{t().auth.codeTitle}</H2>
        <Muted style={styles.sub}>
          {t().auth.codeSubtitle} {phone}
        </Muted>
        {devCode ? <Muted style={styles.dev}>{t().auth.devCodeHint}</Muted> : null}
      </View>
      <Input
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, SMS_CODE_LENGTH))}
        keyboardType="number-pad"
        placeholder={t().auth.codePlaceholder}
        autoFocus
        style={styles.codeInput}
      />
      <Button title={t().auth.verify} onPress={submit} loading={loading} disabled={code.length !== SMS_CODE_LENGTH} />
      <Button title={t().auth.resend} variant="outline" onPress={resend} style={{ marginTop: spacing.md }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { marginTop: spacing.xl, marginBottom: spacing.lg },
  sub: { marginTop: spacing.xs },
  dev: { marginTop: spacing.sm, color: '#E0A106' },
  codeInput: { fontSize: 28, letterSpacing: 8, textAlign: 'center' },
});
