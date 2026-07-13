import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { Loading, ErrorView, EmptyView, Muted } from '../../components/ui';
import { AppMap } from '../../maps/AppMap';
import { MapMarker } from '../../maps/types';
import { getCourierOrders } from '../../api/orders';
import { apiErrorMessage } from '../../lib/api';
import { useOrdersRealtime } from '../../hooks/useOrdersRealtime';
import { CourierStackParamList } from '../../navigation/types';
import { spacing } from '../../theme';
import { t } from '../../i18n';

/**
 * Карта доставщика: только точки ЕГО заказов (адреса доставки).
 * Авто-оптимизации маршрута НЕТ — доставщик сам решает порядок объезда.
 * TODO (будущая версия): оптимизация маршрута (TSP / API маршрутизации).
 */
export function CourierMapScreen() {
  const nav = useNavigation<NativeStackNavigationProp<CourierStackParamList>>();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['courier-orders', true],
    queryFn: () => getCourierOrders(true),
  });

  useOrdersRealtime({ queryKeysToInvalidate: [['courier-orders', true]] });

  const markers: MapMarker[] = useMemo(
    () =>
      (data ?? [])
        .filter((o) => o.address.point)
        .map((o) => ({
          id: o.id,
          lat: o.address.point!.lat,
          lng: o.address.point!.lng,
          title: o.clientName ?? t().orders.order,
          subtitle: o.address.text ?? o.address.landmark ?? undefined,
        })),
    [data],
  );

  if (isLoading) return <Loading />;
  if (isError) return <ErrorView message={apiErrorMessage(error)} onRetry={refetch} />;

  if (markers.length === 0) {
    return (
      <Screen>
        <EmptyView text={t().courier.feedEmpty} icon="🗺️" />
      </Screen>
    );
  }

  return (
    <View style={styles.full}>
      <AppMap
        style={styles.full}
        height={undefined as unknown as number}
        markers={markers}
        center={{ lat: markers[0].lat, lng: markers[0].lng }}
        onPressMarker={(id) => nav.navigate('OrderDetail', { orderId: id })}
      />
      <View style={styles.hint}>
        <Muted>{t().courier.map}: {markers.length} • нажмите на точку для деталей</Muted>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  hint: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
});
