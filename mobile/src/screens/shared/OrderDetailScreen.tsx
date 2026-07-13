import React from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  COURIER_STATUS_TRANSITIONS,
  OrderStatus,
  UserRole,
} from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Body, Button, Card, Divider, H2, H3, Loading, ErrorView, Muted } from '../../components/ui';
import { StatusPill, Avatar, StarRating } from '../../components/widgets';
import { AppMap } from '../../maps/AppMap';
import { getOrder, updateOrderStatus } from '../../api/orders';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { useOrdersRealtime } from '../../hooks/useOrdersRealtime';
import { money, dateTime } from '../../lib/format';
import { colors, spacing } from '../../theme';
import { t } from '../../i18n';

type ParamList = { OrderDetail: { orderId: string } };
type Nav = NativeStackNavigationProp<{
  CourierProfile: { courierId: string; orderId?: string };
  Chat: { peerId: string; orderId?: string; peerName?: string };
  Review: { orderId: string; courierId: string };
}>;

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: 'Принял',
  ON_WAY: 'В пути',
  DELIVERED: 'Доставлено',
};

export function OrderDetailScreen() {
  const { params } = useRoute<RouteProp<ParamList, 'OrderDetail'>>();
  const nav = useNavigation<Nav>();
  const role = useAuthStore((s) => s.user?.role);
  const qc = useQueryClient();

  const { data: order, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['order', params.orderId],
    queryFn: () => getOrder(params.orderId),
  });

  useOrdersRealtime({ queryKeysToInvalidate: [['order', params.orderId], ['courier-orders'], ['my-orders']] });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(params.orderId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', params.orderId] });
      qc.invalidateQueries({ queryKey: ['courier-orders'] });
    },
    onError: (e) => Alert.alert(t().common.error, apiErrorMessage(e)),
  });

  if (isLoading) return <Loading />;
  if (isError || !order) return <ErrorView message={apiErrorMessage(error)} onRetry={refetch} />;

  const isCourier = role === UserRole.COURIER;
  const isClient = role === UserRole.CLIENT;
  const nextStatuses = (COURIER_STATUS_TRANSITIONS[order.status] ?? []).filter(
    (s) => s !== OrderStatus.CANCELLED,
  );

  const call = (phone: string) => Linking.openURL(`tel:${phone}`);

  return (
    <Screen scroll>
      {/* Шапка статуса */}
      <Card>
        <View style={styles.headerRow}>
          <H2>{money(order.total)}</H2>
          <StatusPill status={order.status} />
        </View>
        <Muted style={{ marginTop: spacing.xs }}>
          {t().orders.order} • {dateTime(order.createdAt)}
        </Muted>
      </Card>

      {/* Состав заказа */}
      <Card>
        <H3>{t().orders.items}</H3>
        <Divider />
        {order.items.map((it) => (
          <View key={it.id} style={styles.itemRow}>
            <Body style={{ flex: 1 }} numberOfLines={1}>
              {it.productName} × {it.quantity}
            </Body>
            <Body>{money(it.unitPrice * it.quantity)}</Body>
          </View>
        ))}
      </Card>

      {/* Адрес */}
      <Card>
        <H3>{t().checkout.address}</H3>
        <Divider />
        {order.address.text ? <Body>📍 {order.address.text}</Body> : null}
        {order.address.landmark ? (
          <Muted style={{ marginTop: spacing.xs, fontStyle: 'italic' }}>💬 {order.address.landmark}</Muted>
        ) : null}
        {order.address.point ? (
          <View style={{ marginTop: spacing.md }}>
            <AppMap
              height={180}
              center={order.address.point}
              markers={[{ id: order.id, lat: order.address.point.lat, lng: order.address.point.lng }]}
            />
          </View>
        ) : null}
        {/* Телефон клиента виден доставщику/оператору/админу (бэкенд это контролирует) */}
        {order.clientPhone && !isClient ? (
          <Button
            title={`${t().courier.clientPhone}: ${order.clientPhone}`}
            variant="outline"
            small
            style={{ marginTop: spacing.md }}
            onPress={() => call(order.clientPhone!)}
          />
        ) : null}
      </Card>

      {/* Доставщик (для клиента) */}
      {isClient && order.courier ? (
        <Card>
          <H3>{t().orders.courier}</H3>
          <Divider />
          <View style={styles.courierRow}>
            <Avatar uri={order.courier.photoUrl} name={order.courier.name} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Body style={{ fontWeight: '700' }}>{order.courier.name}</Body>
              <View style={styles.ratingRow}>
                <StarRating value={order.courier.rating} size={14} />
                <Muted style={{ marginLeft: 6 }}>
                  {order.courier.rating.toFixed(1)} • {order.courier.deliveriesCount} дост.
                </Muted>
              </View>
            </View>
          </View>
          <View style={styles.courierBtns}>
            <Button
              title={t().courierProfile.message}
              variant="secondary"
              small
              style={{ flex: 1, marginRight: spacing.sm }}
              onPress={() =>
                nav.navigate('Chat', {
                  peerId: order.courier!.id,
                  orderId: order.id,
                  peerName: order.courier!.name,
                })
              }
            />
            <Button
              title={t().courierProfile.reviews}
              variant="outline"
              small
              style={{ flex: 1 }}
              onPress={() => nav.navigate('CourierProfile', { courierId: order.courier!.id, orderId: order.id })}
            />
          </View>
        </Card>
      ) : null}

      {isClient && !order.courier ? (
        <Card>
          <Muted style={{ textAlign: 'center' }}>{t().orders.noCourier}</Muted>
        </Card>
      ) : null}

      {/* Действия доставщика: смена статуса + чат с клиентом */}
      {isCourier ? (
        <Card>
          <H3>{t().orders.courierAction}</H3>
          <Divider />
          {nextStatuses.length === 0 ? (
            <Muted>{t().orders.statuses[order.status]}</Muted>
          ) : (
            nextStatuses.map((s) => (
              <Button
                key={s}
                title={STATUS_LABELS[s] ?? s}
                variant={s === OrderStatus.DELIVERED ? 'success' : 'primary'}
                style={{ marginBottom: spacing.sm }}
                loading={statusMutation.isPending}
                onPress={() => statusMutation.mutate(s)}
              />
            ))
          )}
          <Button
            title={t().orders.openChat}
            variant="secondary"
            onPress={() =>
              nav.navigate('Chat', {
                peerId: order.clientId,
                orderId: order.id,
                peerName: order.clientName ?? 'Клиент',
              })
            }
          />
        </Card>
      ) : null}

      {/* Отзыв (клиент, после доставки) */}
      {isClient && order.status === OrderStatus.DELIVERED && order.courier && !order.reviewed ? (
        <Button
          title={t().orders.leaveReview}
          onPress={() => nav.navigate('Review', { orderId: order.id, courierId: order.courier!.id })}
          style={{ marginBottom: spacing.xl }}
        />
      ) : null}
      {isClient && order.reviewed ? (
        <Muted style={{ textAlign: 'center', marginBottom: spacing.xl }}>✓ {t().orders.reviewed}</Muted>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  courierRow: { flexDirection: 'row', alignItems: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  courierBtns: { flexDirection: 'row', marginTop: spacing.md },
});
