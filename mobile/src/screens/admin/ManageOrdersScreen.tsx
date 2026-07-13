import React, { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderStatus } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Body, Button, Card, H2, Muted, Loading, ErrorView, EmptyView } from '../../components/ui';
import { OrderCard } from '../../components/OrderCard';
import { getAdminOrders, getCouriers, reassignOrder } from '../../api/admin';
import { apiErrorMessage } from '../../lib/api';
import { AdminStackParamList } from '../../navigation/types';
import { statusLabel } from '../../i18n';
import { colors, radius, spacing } from '../../theme';
import { t } from '../../i18n';

const STATUS_FILTERS: (OrderStatus | 'ALL')[] = [
  'ALL',
  OrderStatus.NEW,
  OrderStatus.TAKEN,
  OrderStatus.ON_WAY,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

export function ManageOrdersScreen() {
  const nav = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const qc = useQueryClient();
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [reassignId, setReassignId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-orders', status],
    queryFn: () => getAdminOrders(status === 'ALL' ? {} : { status }),
  });

  const couriers = useQuery({ queryKey: ['admin-couriers'], queryFn: getCouriers });

  const reassignMutation = useMutation({
    mutationFn: ({ orderId, courierId }: { orderId: string; courierId: string | null }) =>
      reassignOrder(orderId, courierId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      setReassignId(null);
    },
    onError: (e) => Alert.alert(t().common.error, apiErrorMessage(e)),
  });

  return (
    <Screen padded={false}>
      <View style={styles.filters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(s) => s}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}
          renderItem={({ item }) => {
            const active = item === status;
            return (
              <Pressable
                onPress={() => setStatus(item)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {item === 'ALL' ? t().common.all : statusLabel(item as OrderStatus)}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorView message={apiErrorMessage(error)} onRetry={refetch} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: spacing.lg }}
          ListEmptyComponent={<EmptyView text={t().orders.empty} icon="📦" />}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => nav.navigate('OrderDetail', { orderId: item.id })}
              footer={
                <View style={styles.footerRow}>
                  <Muted style={{ flex: 1 }}>
                    {item.courier ? `🚚 ${item.courier.name}` : t().orders.noCourier}
                  </Muted>
                  <Button title={t().admin.reassign} variant="outline" small onPress={() => setReassignId(item.id)} />
                </View>
              }
            />
          )}
        />
      )}

      {/* Модал переназначения */}
      <Modal visible={!!reassignId} animationType="slide" transparent onRequestClose={() => setReassignId(null)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <H2 style={{ fontSize: 18, marginBottom: spacing.md }}>{t().admin.reassign}</H2>
            <Pressable
              style={styles.courierItem}
              onPress={() => reassignId && reassignMutation.mutate({ orderId: reassignId, courierId: null })}
            >
              <Body style={{ color: colors.danger }}>✕ {t().orders.noCourier}</Body>
            </Pressable>
            {(couriers.data ?? [])
              .filter((c) => c.isActive)
              .map((c) => (
                <Pressable
                  key={c.id}
                  style={styles.courierItem}
                  onPress={() => reassignId && reassignMutation.mutate({ orderId: reassignId, courierId: c.id })}
                >
                  <Body>🚚 {c.name}</Body>
                  <Muted>★ {c.rating.toFixed(1)}</Muted>
                </Pressable>
              ))}
            <Button title={t().common.cancel} variant="outline" onPress={() => setReassignId(null)} style={{ marginTop: spacing.md }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: colors.onPrimary },
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  modalBg: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '70%',
  },
  courierItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
