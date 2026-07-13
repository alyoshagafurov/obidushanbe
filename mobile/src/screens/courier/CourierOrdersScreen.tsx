import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { OrderDto } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Loading, ErrorView, EmptyView } from '../../components/ui';
import { OrderCard } from '../../components/OrderCard';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { getCourierOrders } from '../../api/orders';
import { apiErrorMessage } from '../../lib/api';
import { useOrdersRealtime } from '../../hooks/useOrdersRealtime';
import { CourierStackParamList } from '../../navigation/types';
import { spacing } from '../../theme';
import { t } from '../../i18n';

export function CourierOrdersScreen() {
  const nav = useNavigation<NativeStackNavigationProp<CourierStackParamList>>();
  const [active, setActive] = useState(true);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['courier-orders', active],
    queryFn: () => getCourierOrders(active),
  });

  useOrdersRealtime({ queryKeysToInvalidate: [['courier-orders', active], ['courier-orders']] });

  if (isLoading) return <Loading />;
  if (isError) return <ErrorView message={apiErrorMessage(error)} onRetry={refetch} />;

  const renderItem = ({ item }: { item: OrderDto }) => (
    <OrderCard order={item} onPress={() => nav.navigate('OrderDetail', { orderId: item.id })} />
  );

  return (
    <Screen padded={false}>
      <View style={styles.tabs}>
        <SegmentedTabs
          value={active ? 'active' : 'history'}
          onChange={(v) => setActive(v === 'active')}
          options={[
            { value: 'active', label: t().orders.current },
            { value: 'history', label: t().orders.history },
          ]}
        />
      </View>
      <FlatList
        data={data}
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
