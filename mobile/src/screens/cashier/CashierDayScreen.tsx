import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CourierPayrollRow } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Body, Card, H2, H3, Muted, Button, Loading, ErrorView, EmptyView } from '../../components/ui';
import { getPayroll, saveEntry } from '../../api/cashier';
import { apiErrorMessage } from '../../lib/api';
import { money } from '../../lib/format';
import { colors, radius, spacing } from '../../theme';
import { t } from '../../i18n';

/** Локальная дата в формате YYYY-MM-DD. */
function localDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return localDateStr(d);
}

export function CashierDayScreen() {
  const qc = useQueryClient();
  const today = localDateStr(new Date());
  const [date, setDate] = useState(today);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['payroll', date],
    queryFn: () => getPayroll(date),
  });

  // Инициализируем поля ввода значениями с сервера при смене дня/данных.
  useEffect(() => {
    if (data) {
      const next: Record<string, string> = {};
      data.forEach((r) => (next[r.courierId] = String(r.bottlesToday)));
      setEdits(next);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (vars: { courierId: string; bottles: number }) =>
      saveEntry({ courierId: vars.courierId, bottles: vars.bottles, date }),
    onSuccess: (rows) => qc.setQueryData(['payroll', date], rows),
    onError: (e) => Alert.alert(t().common.error, apiErrorMessage(e)),
  });

  const totals = useMemo(() => {
    const rows = data ?? [];
    return {
      bottles: rows.reduce((s, r) => s + r.bottlesToday, 0),
      amount: rows.reduce((s, r) => s + r.amountToday, 0),
    };
  }, [data]);

  if (isLoading) return <Loading />;
  if (isError) return <ErrorView message={apiErrorMessage(error)} onRetry={refetch} />;

  const renderItem = ({ item }: { item: CourierPayrollRow }) => {
    const editVal = edits[item.courierId] ?? String(item.bottlesToday);
    const bottles = parseInt(editVal || '0', 10) || 0;
    const preview = bottles * item.rate;
    const changed = bottles !== item.bottlesToday;
    return (
      <Card>
        <View style={styles.rowTop}>
          <H3 style={{ flex: 1 }} numberOfLines={1}>
            {item.courierName}
          </H3>
          <Muted>
            {item.rate.toFixed(2)} {t().common.currency}/{t().cashier.perBottle}
          </Muted>
        </View>

        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <Muted>{t().cashier.bottles20}</Muted>
            <TextInput
              value={editVal}
              onChangeText={(v) =>
                setEdits((e) => ({ ...e, [item.courierId]: v.replace(/[^\d]/g, '') }))
              }
              keyboardType="number-pad"
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
            <Muted style={{ marginTop: 2 }}>
              {t().cashier.appHint}: {item.appBottlesToday}
            </Muted>
          </View>

          <View style={styles.amountBox}>
            <Muted>{t().cashier.amountToday}</Muted>
            <Text style={styles.amount}>{money(preview)}</Text>
          </View>
        </View>

        <Button
          title={changed ? t().cashier.save : t().cashier.saved}
          small
          variant={changed ? 'primary' : 'secondary'}
          disabled={!changed}
          loading={saveMutation.isPending && saveMutation.variables?.courierId === item.courierId}
          onPress={() => saveMutation.mutate({ courierId: item.courierId, bottles })}
          style={{ marginTop: spacing.sm }}
        />
      </Card>
    );
  };

  return (
    <Screen padded={false}>
      {/* Переключатель даты */}
      <View style={styles.dateBar}>
        <Pressable onPress={() => setDate((d) => shiftDate(d, -1))} style={styles.arrow}>
          <Text style={styles.arrowText}>◀</Text>
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <H3>{date === today ? t().cashier.today : date}</H3>
          {date !== today ? <Muted>{date}</Muted> : null}
        </View>
        <Pressable
          onPress={() => date < today && setDate((d) => shiftDate(d, 1))}
          style={[styles.arrow, date >= today && { opacity: 0.3 }]}
        >
          <Text style={styles.arrowText}>▶</Text>
        </Pressable>
      </View>

      <FlatList
        data={data}
        keyExtractor={(r) => r.courierId}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<EmptyView text={t().cashier.noCouriers} icon="🚚" />}
        ListFooterComponent={
          (data?.length ?? 0) > 0 ? (
            <Card style={styles.totalCard}>
              <View style={styles.totalRow}>
                <Body>{t().cashier.totalBottles}</Body>
                <H3>{totals.bottles}</H3>
              </View>
              <View style={styles.totalRow}>
                <H3>{t().cashier.totalToPay}</H3>
                <H2 style={{ color: colors.primary }}>{money(totals.amount)}</H2>
              </View>
            </Card>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  arrow: { padding: spacing.sm },
  arrowText: { fontSize: 20, color: colors.primary, fontWeight: '700' },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: colors.surface,
    marginTop: 2,
  },
  amountBox: { alignItems: 'flex-end', marginLeft: spacing.lg, minWidth: 100 },
  amount: { fontSize: 20, fontWeight: '800', color: colors.primary, marginTop: 2 },
  totalCard: { backgroundColor: colors.primaryLight },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 2 },
});
