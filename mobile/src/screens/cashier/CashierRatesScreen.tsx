import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CourierPayrollRow } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Card, H3, Muted, Button, Loading, ErrorView, EmptyView } from '../../components/ui';
import { getPayroll, setRate } from '../../api/cashier';
import { apiErrorMessage } from '../../lib/api';
import { colors, radius, spacing } from '../../theme';
import { t } from '../../i18n';

export function CashierRatesScreen() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['rates'],
    queryFn: () => getPayroll(),
  });
  const [edits, setEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      const next: Record<string, string> = {};
      data.forEach((r) => (next[r.courierId] = r.rate.toFixed(2)));
      setEdits(next);
    }
  }, [data]);

  const rateMutation = useMutation({
    mutationFn: (vars: { courierId: string; rate: number }) => setRate(vars.courierId, vars.rate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rates'] });
      qc.invalidateQueries({ queryKey: ['payroll'] });
      Alert.alert(t().common.appName, t().cashier.rateSaved);
    },
    onError: (e) => Alert.alert(t().common.error, apiErrorMessage(e)),
  });

  if (isLoading) return <Loading />;
  if (isError) return <ErrorView message={apiErrorMessage(error)} onRetry={refetch} />;

  const renderItem = ({ item }: { item: CourierPayrollRow }) => {
    const val = edits[item.courierId] ?? item.rate.toFixed(2);
    const num = parseFloat(val.replace(',', '.')) || 0;
    const changed = Math.abs(num - item.rate) > 0.001;
    return (
      <Card>
        <H3 numberOfLines={1}>{item.courierName}</H3>
        <Muted style={{ marginTop: spacing.xs, marginBottom: spacing.sm }}>{t().cashier.setRate}</Muted>
        <View style={styles.row}>
          <TextInput
            value={val}
            onChangeText={(v) => setEdits((e) => ({ ...e, [item.courierId]: v.replace(/[^\d.,]/g, '') }))}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <Button
            title={t().common.save}
            small
            disabled={!changed}
            loading={rateMutation.isPending && rateMutation.variables?.courierId === item.courierId}
            onPress={() => rateMutation.mutate({ courierId: item.courierId, rate: num })}
            style={{ marginLeft: spacing.md }}
          />
        </View>
      </Card>
    );
  };

  return (
    <Screen padded={false}>
      <FlatList
        data={data}
        keyExtractor={(r) => r.courierId}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<EmptyView text={t().cashier.noCouriers} icon="🚚" />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: colors.surface,
  },
});
