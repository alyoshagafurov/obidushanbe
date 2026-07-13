import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, shadow } from '../theme';

interface Option {
  value: string;
  label: string;
}

/** Сегментированный переключатель (вкладки «Текущие/История» и т.п.). */
export function SegmentedTabs({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
}) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.seg, active && styles.segActive]}
          >
            <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  seg: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segActive: { backgroundColor: colors.surface, ...shadow.soft },
  text: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  textActive: { color: colors.ink, fontWeight: '700' },
});
