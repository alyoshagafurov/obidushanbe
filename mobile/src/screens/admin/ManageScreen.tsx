import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Body, Card } from '../../components/ui';
import { AdminStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { t } from '../../i18n';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

const ITEMS: { screen: keyof AdminStackParamList; icon: string; key: keyof ReturnType<typeof t>['admin'] }[] = [
  { screen: 'ManageProducts', icon: '💧', key: 'products' },
  { screen: 'ManageCouriers', icon: '🚚', key: 'couriers' },
  { screen: 'ManageOperators', icon: '🎧', key: 'operators' },
  { screen: 'ManageCashiers', icon: '🧮', key: 'cashiers' },
  { screen: 'ManageOrders', icon: '📦', key: 'ordersAll' },
  { screen: 'Reviews', icon: '⭐', key: 'reviews' },
];

export function ManageScreen() {
  const nav = useNavigation<Nav>();
  return (
    <Screen scroll>
      {ITEMS.map((item) => (
        <Pressable key={item.screen} onPress={() => nav.navigate(item.screen as any)}>
          <Card style={styles.row}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Body style={styles.label}>{t().admin[item.key] as string}</Body>
            <Text style={styles.chevron}>›</Text>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 26, marginRight: spacing.md },
  label: { flex: 1, fontWeight: '600' },
  chevron: { fontSize: 28, color: colors.textMuted },
});
