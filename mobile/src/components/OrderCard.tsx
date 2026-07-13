/** Карточка заказа — общий вид для списков (клиент/доставщик/оператор/админ). */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { OrderDto } from '@obi/shared';
import { Card, Body, Muted, H3 } from './ui';
import { StatusPill } from './widgets';
import { money, dateTime } from '../lib/format';
import { colors, spacing } from '../theme';

interface Props {
  order: OrderDto;
  onPress?: () => void;
  /** Показать расстояние (для ленты доставщика). */
  showDistance?: boolean;
  /** Доп. контент снизу (например, кнопки действий). */
  footer?: React.ReactNode;
}

export function OrderCard({ order, onPress, showDistance, footer }: Props) {
  const itemsLabel = order.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ');
  const addr = order.address.text || (order.address.point ? 'Точка на карте' : '—');

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card>
        <View style={styles.headerRow}>
          <H3>{money(order.total)}</H3>
          <StatusPill status={order.status} />
        </View>

        <Body numberOfLines={2} style={{ marginTop: spacing.xs }}>
          {itemsLabel}
        </Body>

        <Muted numberOfLines={1} style={{ marginTop: spacing.xs }}>
          📍 {addr}
        </Muted>
        {order.address.landmark ? (
          <Muted numberOfLines={2} style={styles.landmark}>
            💬 {order.address.landmark}
          </Muted>
        ) : null}

        <View style={styles.footerRow}>
          <Muted>{dateTime(order.createdAt)}</Muted>
          {showDistance && order.distanceKm != null ? (
            <Muted style={{ color: colors.primary }}>~{order.distanceKm} км</Muted>
          ) : null}
        </View>

        {footer ? <View style={{ marginTop: spacing.md }}>{footer}</View> : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  landmark: { marginTop: 2, fontStyle: 'italic' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
