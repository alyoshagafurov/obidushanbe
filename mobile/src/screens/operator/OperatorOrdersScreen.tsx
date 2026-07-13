import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { OrderDto } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Loading, ErrorView, EmptyView } from '../../components/ui';
import { OrderCard } from '../../components/OrderCard';
import { getOperatorOrders } from '../../api/operator';
import { apiErrorMessage } from '../../lib/api';
import { useOrdersRealtime } from '../../hooks/useOrdersRealtime';
import { OperatorStackParamList } from '../../navigation/types';
import { spacing } from '../../theme';
import { t } from '../../i18n';

export function OperatorOrdersScreen() {
  const nav = useNavigation<NativeStackNavigationProp<OperatorStackParamList>>();
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['operator-orders'],
    queryFn: getOperatorOrders,
  });

  useOrdersRealtime({ queryKeysToInvalidate: [['operator-orders']] });

  if (isLoading) return <Loading />;
  if (isError) return <ErrorView message={apiErrorMessage(error)} onRetry={refetch} />;

  const renderItem = ({ item }: { item: OrderDto }) => (
    <OrderCard order={item} onPress={() => nav.navigate('OrderDetail', { orderId: item.id })} />
  );

  return (
    <Screen padded={false}>
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
