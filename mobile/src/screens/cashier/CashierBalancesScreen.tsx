import React from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CourierPayrollRow } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Body, Card, H2, H3, Muted, Button, Loading, ErrorView, EmptyView, Divider } from '../../components/ui';
import { getPayroll, payout } from '../../api/cashier';
import { apiErrorMessage } from '../../lib/api';
import { money } from '../../lib/format';
import { colors, spacing } from '../../theme';
import { t } from '../../i18n';

export function CashierBalancesScreen() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['balances'],
    queryFn: () => getPayroll(),
  });

  const payoutMutation = useMutation({
    mutationFn: (courierId: string) => payout({ courierId }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['balances'] });
      qc.invalidateQueries({ queryKey: ['payroll'] });
      Alert.alert(t().cashier.payoutDone, money(res.paid));
    },
    onError: (e) => Alert.alert(t().common.error, apiErrorMessage(e)),
  });

  const confirmPayout = (row: CourierPayrollRow) =>
    Alert.alert(t().cashier.payout, `${row.courierName}: ${money(row.balance)}\n${t().cashier.payoutConfirm}`, [
      { text: t().common.cancel, style: 'cancel' },
      { text: t().cashier.payout, onPress: () => payoutMutation.mutate(row.courierId) },
    ]);

  if (isLoading) return <Loading />;
  if (isError) return <ErrorView message={apiErrorMessage(error)} onRetry={refetch} />;

  const grandTotal = (data ?? []).reduce((s, r) => s + r.balance, 0);

  const renderItem = ({ item }: { item: CourierPayrollRow }) => (
    <Card>
      <View style={styles.top}>
        <H3 style={{ flex: 1 }} numberOfLines={1}>
          {item.courierName}
        </H3>
        <View style={{ alignItems: 'flex-end' }}>
          <Muted>{t().cashier.balance}</Muted>
          <H2 style={{ color: item.balance > 0 ? colors.success : colors.textMuted }}>{money(item.balance)}</H2>
        </View>
      </View>
      <Divider />
      <View style={styles.statsRow}>
        <Muted>
          {t().cashier.earned}: {money(item.totalEarned)}
        </Muted>
        <Muted>
          {t().cashier.paid}: {money(item.totalPaid)}
        </Muted>
      </View>
      <Button
        title={t().cashier.payout}
        variant="success"
        small
        disabled={item.balance <= 0}
        loading={payoutMutation.isPending && payoutMutation.variables === item.courierId}
        onPress={() => confirmPayout(item)}
        style={{ marginTop: spacing.md }}
      />
    </Card>
  );

  return (
    <Screen padded={false}>
      <FlatList
        data={data}
        keyExtractor={(r) => r.courierId}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<EmptyView text={t().cashier.noCouriers} icon="🚚" />}
        ListHeaderComponent={
          (data?.length ?? 0) > 0 ? (
            <Card style={styles.totalCard}>
              <View style={styles.top}>
                <H3>{t().cashier.grandTotal}</H3>
                <H2 style={{ color: colors.primary }}>{money(grandTotal)}</H2>
              </View>
            </Card>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalCard: { backgroundColor: colors.primaryLight },
});
