/** Доменные виджеты: статус заказа, рейтинг, счётчик кол-ва, аватар, логотип. */
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { OrderStatus } from '@obi/shared';
import { colors, radius, spacing } from '../theme';
import { statusLabel } from '../i18n';
import { brand } from '../theme';
import { logoImage } from '../brand/assets';

/* ---------------------------- StatusPill ---------------------------- */

const STATUS_COLOR: Record<OrderStatus, string> = {
  [OrderStatus.NEW]: colors.info,
  [OrderStatus.TAKEN]: colors.accent,
  [OrderStatus.ACCEPTED]: colors.warning,
  [OrderStatus.ON_WAY]: colors.primary,
  [OrderStatus.DELIVERED]: colors.success,
  [OrderStatus.CANCELLED]: colors.danger,
};

export function StatusPill({ status }: { status: OrderStatus }) {
  const color = STATUS_COLOR[status] ?? colors.textSecondary;
  return (
    <View style={[styles.pill, { backgroundColor: color + '22' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color }]}>{statusLabel(status)}</Text>
    </View>
  );
}

/* ---------------------------- StarRating ---------------------------- */

export function StarRating({
  value,
  size = 16,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (v: number) => void;
}) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        const star = (
          <Text style={{ fontSize: size, color: filled ? colors.star : colors.border }}>★</Text>
        );
        return onChange ? (
          <Pressable key={i} onPress={() => onChange(i)} hitSlop={6} style={{ marginRight: 2 }}>
            {star}
          </Pressable>
        ) : (
          <View key={i} style={{ marginRight: 2 }}>
            {star}
          </View>
        );
      })}
    </View>
  );
}

/* -------------------------- QuantityStepper ------------------------- */

export function QuantityStepper({
  value,
  onAdd,
  onRemove,
}: {
  value: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onRemove} style={styles.stepBtn} hitSlop={6}>
        <Text style={styles.stepText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable onPress={onAdd} style={styles.stepBtn} hitSlop={6}>
        <Text style={styles.stepText}>+</Text>
      </Pressable>
    </View>
  );
}

/* ------------------------------ Avatar ----------------------------- */

export function Avatar({ uri, name, size = 48 }: { uri?: string | null; name?: string | null; size?: number }) {
  const initials = (name ?? '?').trim().slice(0, 1).toUpperCase();
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: size * 0.4 }}>{initials}</Text>
    </View>
  );
}

/* ------------------------------- Logo ------------------------------ */

export function Logo({ size = 120, showTagline = true, style }: { size?: number; showTagline?: boolean; style?: ViewStyle }) {
  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <Image source={logoImage} style={{ width: size, height: size, resizeMode: 'contain' }} />
      {showTagline ? <Text style={styles.logoTag}>{brand.tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  pillText: { fontSize: 12, fontWeight: '600' },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
  },
  stepBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 20, fontWeight: '700', color: colors.primary },
  stepValue: { minWidth: 24, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text },

  avatar: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },

  logoIcon: { fontSize: 44 },
  logoText: { fontSize: 24, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  logoTag: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
