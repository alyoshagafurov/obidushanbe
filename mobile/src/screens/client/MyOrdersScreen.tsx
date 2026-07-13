import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { ACTIVE_ORDER_STATUSES, OrderDto, OrderStatus } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Loading, ErrorView, EmptyView } from '../../components/ui';
import { OrderCard } from '../../components/OrderCard';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { getMyOrders } from '../../api/orders';
import { apiErrorMessage } from '../../lib/api';
import { useOrdersRealtime } from '../../hooks/useOrdersRealtime';
import { ClientStackParamList } from '../../navigation/types';
import { spacing } from '../../theme';
import { t } from '../../i18n';

export function MyOrdersScreen() {
  const nav = useNavigation<NativeStackNavigationProp<ClientStackParamList>>();
  const [tab, setTab] = useState<'current' | 'history'>('current');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['my-orders'],
    queryFn: getMyOrders,
  });

  useOrdersRealtime({ queryKeysToInvalidate: [['my-orders']] });

  const filtered = useMemo(() => {
    const all = data ?? [];
    return tab === 'current'
      ? all.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status))
      : all.filter((o) => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED);
  }, [data, tab]);

  if (isLoading) return <Loading />;
  if (isError) return <ErrorView message={apiErrorMessage(error)} onRetry={refetch} />;

  const renderItem = ({ item }: { item: OrderDto }) => (
    <OrderCard order={item} onPress={() => nav.navigate('OrderDetail', { orderId: item.id })} />
  );

  return (
    <Screen padded={false}>
      <View style={styles.tabs}>
        <SegmentedTabs
          value={tab}
          onChange={(v) => setTab(v as 'current' | 'history')}
          options={[
            { value: 'current', label: t().orders.current },
            { value: 'history', label: t().orders.history },
          ]}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<EmptyView text={t().orders.empty} icon="📦" />}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
});
