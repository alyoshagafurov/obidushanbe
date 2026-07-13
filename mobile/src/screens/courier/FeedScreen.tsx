import React, { useState } from 'react';
import { Alert, FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderDto } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Button, Loading, ErrorView, EmptyView } from '../../components/ui';
import { OrderCard } from '../../components/OrderCard';
import { getFeed, takeOrder } from '../../api/orders';
import { apiErrorMessage } from '../../lib/api';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useOrdersRealtime } from '../../hooks/useOrdersRealtime';
import { CourierStackParamList } from '../../navigation/types';
import { spacing } from '../../theme';
import { t } from '../../i18n';

/**
 * Лента новых заказов доставщика. Реалтайм: новые заказы появляются сразу,
 * взятые другими — мгновенно исчезают (через useOrdersRealtime -> invalidate).
 */
export function FeedScreen() {
  const nav = useNavigation<NativeStackNavigationProp<CourierStackParamList>>();
  const qc = useQueryClient();
  const geo = useGeolocation();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['feed', coords],
    queryFn: () => getFeed(coords),
  });

  // Реалтайм-обновление ленты
  useOrdersRealtime({ queryKeysToInvalidate: [['feed', coords], ['feed']] });

  const takeMutation = useMutation({
    mutationFn: (orderId: string) => takeOrder(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['courier-orders'] });
    },
    onError: (e) => Alert.alert(t().courier.taken, apiErrorMessage(e)),
  });

  const detectAndRefresh = async () => {
    const p = await geo.detect();
    if (p) setCoords(p);
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorView message={apiErrorMessage(error)} onRetry={refetch} />;

  const renderItem = ({ item }: { item: OrderDto }) => (
    <OrderCard
      order={item}
      showDistance
      onPress={() => nav.navigate('OrderDetail', { orderId: item.id })}
      footer={
        <Button
          title={t().courier.take}
          onPress={() => takeMutation.mutate(item.id)}
          loading={takeMutation.isPending && takeMutation.variables === item.id}
        />
      }
    />
  );

  return (
    <Screen padded={false}>
      <FlatList
        data={data}
        keyExtractor={(o) => o.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.lg }}
        ListHeaderComponent={
          <Button
            title={coords ? '📍 Обновить местоположение' : t().checkout.useLocation}
            variant="outline"
            small
            loading={geo.loading}
            onPress={detectAndRefresh}
            style={{ marginBottom: spacing.md }}
          />
        }
        ListEmptyComponent={<EmptyView text={t().courier.feedEmpty} icon="🚚" />}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      />
    </Screen>
  );
}
