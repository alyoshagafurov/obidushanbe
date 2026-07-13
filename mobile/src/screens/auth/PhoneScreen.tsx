import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PHONE_REGEX } from '@obi/shared';
import { Hero } from '../../components/Hero';
import { Button, Input, Muted, H1 } from '../../components/ui';
import { AuthStackParamList } from '../../navigation/types';
import { logoImage } from '../../brand/assets';
import { requestCode } from '../../api/auth';
import { apiErrorMessage } from '../../lib/api';
import { brand, colors, radius, spacing, shadow } from '../../theme';
import { t } from '../../i18n';

type Props = NativeStackScreenProps<AuthStackParamList, 'Phone'>;

export function PhoneScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('+992');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const normalized = phone.replace(/\s/g, '');
    if (!PHONE_REGEX.test(normalized)) {
      Alert.alert(t().common.appName, t().auth.invalidPhone);
      return;
    }
    setLoading(true);
    try {
      const res = await requestCode(normalized);
      navigation.navigate('Code', { phone: normalized, devCode: res.devCode });
    } catch (e) {
      Alert.alert(t().common.error, apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Hero style={styles.hero}>
        <SafeAreaView edges={['top']} style={styles.heroInner}>
          <View style={styles.pedestal}>
            <Image source={logoImage} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brandName}>{brand.name}</Text>
          <Text style={styles.tagline}>{brand.tagline}</Text>
        </SafeAreaView>
      </Hero>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <H1 style={styles.title}>{t().auth.phoneTitle}</H1>
          <Muted style={styles.subtitle}>{t().auth.phoneSubtitle}</Muted>
          <Input
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder={t().auth.phonePlaceholder}
            style={styles.input}
          />
          <Button title={t().auth.getCode} onPress={submit} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  pedestal: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.floating,
  },
  logo: { width: 130, height: 130 },
  brandName: {
    color: colors.onDark,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: spacing.xl,
  },
  tagline: { color: colors.onDarkMuted, fontSize: 14, marginTop: 4, letterSpacing: 0.3 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  input: { marginBottom: spacing.lg },
});
