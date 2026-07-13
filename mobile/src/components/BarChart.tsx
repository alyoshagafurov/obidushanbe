/** Простой столбчатый график без сторонних зависимостей (только View). */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

export interface BarДatum {
  label: string;
  value: number;
}

export function BarChart({
  data,
  height = 140,
  color = colors.primary,
  valueFormatter,
}: {
  data: BarДatum[];
  height?: number;
  color?: string;
  valueFormatter?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) {
    return <Text style={styles.empty}>Нет данных</Text>;
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.row, { height: height + 30 }]}>
        {data.map((d, i) => {
          const h = Math.round((d.value / max) * height);
          return (
            <View key={i} style={styles.col}>
              <Text style={styles.value} numberOfLines={1}>
                {valueFormatter ? valueFormatter(d.value) : d.value}
              </Text>
              <View style={[styles.bar, { height: Math.max(2, h), backgroundColor: color }]} />
              <Text style={styles.label} numberOfLines={1}>
                {d.label}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: spacing.md },
  col: { alignItems: 'center', marginRight: spacing.md, width: 44 },
  bar: { width: 24, borderRadius: radius.sm },
  value: { fontSize: 10, color: colors.textSecondary, marginBottom: 4 },
  label: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  empty: { color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
});
