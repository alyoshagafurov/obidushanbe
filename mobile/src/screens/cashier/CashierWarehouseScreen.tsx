import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BOTTLE_PRICE, WATER_PRICE, WarehouseReportDto } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Body, Button, Card, Divider, H2, H3, Muted, Loading, ErrorView, EmptyView } from '../../components/ui';
import { getPayroll, getWarehouse, createWarehouseReport } from '../../api/cashier';
import { apiErrorMessage } from '../../lib/api';
import { money } from '../../lib/format';
import { colors, radius, spacing } from '../../theme';
import { t } from '../../i18n';

const timeOf = (iso: string) => { const d = new Date(iso); const p = (n: number) => String(n).padStart(2, '0'); return `${p(d.getHours())}:${p(d.getMinutes())}`; };

export function CashierWarehouseScreen() {
  const qc = useQueryClient();
  const [courierId, setCourierId] = useState('');
  const [fullTaken, setFullTaken] = useState('');
  const [emptyReturned, setEmptyReturned] = useState('');
  const [fullReturned, setFullReturned] = useState('');

  const couriers = useQuery({ queryKey: ['payroll'], queryFn: () => getPayroll() });
  const wh = useQuery({ queryKey: ['warehouse'], queryFn: () => getWarehouse() });

  const preview = useMemo(() => {
    const ft = parseInt(fullTaken || '0', 10) || 0;
    const er = parseInt(emptyReturned || '0', 10) || 0;
    const fr = parseInt(fullReturned || '0', 10) || 0;
    const fullSold = Math.max(0, ft - fr);
    const bottlesSold = Math.max(0, fullSold - er);
    return { fullSold, bottlesSold, total: fullSold * WATER_PRICE + bottlesSold * BOTTLE_PRICE };
  }, [fullTaken, emptyReturned, fullReturned]);

  const create = useMutation({
    mutationFn: () => createWarehouseReport({
      courierId,
      fullTaken: parseInt(fullTaken || '0', 10) || 0,
      emptyReturned: parseInt(emptyReturned || '0', 10) || 0,
      fullReturned: parseInt(fullReturned || '0', 10) || 0,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouse'] });
      Alert.alert(t().common.appName, t().cashier.reportSaved);
      setFullTaken(''); setEmptyReturned(''); setFullReturned('');
    },
    onError: (e) => Alert.alert(t().common.error, apiErrorMessage(e)),
  });

  const canSubmit = !!courierId && (parseInt(fullTaken || '0', 10) || 0) > 0;

  if (couriers.isLoading) return <Loading />;

  return (
    <Screen scroll>
      <H2 style={{ marginBottom: spacing.xs }}>{t().cashier.warehouseTitle}</H2>
      <Muted style={{ marginBottom: spacing.md }}>{t().cashier.priceHint}</Muted>

      <Card>
        <Muted style={{ marginBottom: spacing.sm }}>{t().orders.courier}</Muted>
        <View style={styles.chips}>
          {(couriers.data ?? []).map((c) => {
            const on = c.courierId === courierId;
            return (
              <Pressable key={c.courierId} onPress={() => setCourierId(c.courierId)} style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && { color: '#fff' }]} numberOfLines={1}>{c.courierName}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Muted>{t().cashier.fullTaken}</Muted>
            <TextInput style={styles.input} keyboardType="number-pad" value={fullTaken} onChangeText={(v) => setFullTaken(v.replace(/\D/g, ''))} placeholder="120" placeholderTextColor={colors.textMuted} />
          </View>
          <View style={styles.col}>
            <Muted>{t().cashier.emptyReturned}</Muted>
            <TextInput style={styles.input} keyboardType="number-pad" value={emptyReturned} onChangeText={(v) => setEmptyReturned(v.replace(/\D/g, ''))} placeholder="100" placeholderTextColor={colors.textMuted} />
          </View>
        </View>
        <Muted style={{ marginTop: spacing.sm }}>{t().cashier.fullReturned}</Muted>
        <TextInput style={styles.input} keyboardType="number-pad" value={fullReturned} onChangeText={(v) => setFullReturned(v.replace(/\D/g, ''))} placeholder="0" placeholderTextColor={colors.textMuted} />
      </Card>

      {/* Живой расчёт */}
      <View style={styles.calc}>
        <View style={styles.calcRow}>
          <Text style={styles.calcMuted}>{t().cashier.soldWater}: <Text style={styles.calcVal}>{preview.fullSold}</Text></Text>
          <Text style={styles.calcMuted}>{t().cashier.soldBottles}: <Text style={styles.calcVal}>{preview.bottlesSold}</Text></Text>
        </View>
        <Text style={styles.calcLabel}>{t().cashier.toHandOver}</Text>
        <Text style={styles.calcTotal}>{money(preview.total)}</Text>
      </View>

      <Button title={t().cashier.saveReport} onPress={() => create.mutate()} loading={create.isPending} disabled={!canSubmit} />

      {/* Итоги + отчёты за день */}
      {wh.isLoading ? <Loading /> : wh.isError ? <ErrorView message={apiErrorMessage(wh.error)} onRetry={wh.refetch} /> : (
        <View style={{ marginTop: spacing.lg }}>
          {(wh.data?.summary.reportsCount ?? 0) > 0 && (
            <View style={styles.dayTotal}>
              <Text style={styles.calcLabel}>{t().cashier.toHandOver} · {t().cashier.warehouseTab}</Text>
              <Text style={styles.calcTotal}>{money(wh.data!.summary.total)}</Text>
              <Muted style={{ color: colors.onDarkMuted, marginTop: 4 }}>
                Взяли {wh.data!.summary.fullTaken} · тары продано {wh.data!.summary.bottlesSold} · отчётов {wh.data!.summary.reportsCount}
              </Muted>
            </View>
          )}
          {(wh.data?.reports.length ?? 0) === 0 ? (
            <EmptyView text={t().cashier.noReports} icon="📦" />
          ) : (
            wh.data!.reports.map((r: WarehouseReportDto) => (
              <Card key={r.id}>
                <View style={styles.repTop}>
                  <H3>{r.courierName}</H3>
                  <Muted>{timeOf(r.createdAt)}</Muted>
                </View>
                <Divider />
                <View style={styles.repRow}><Muted>Взял / пустых / тары</Muted><Body>{r.fullTaken} / {r.emptyReturned} / {r.bottlesSold}</Body></View>
                <View style={styles.repRow}><H3>{t().cashier.toHandOver}</H3><H3 style={{ color: colors.primary }}>{money(r.total)}</H3></View>
              </Card>
            ))
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  row: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  col: { flex: 1 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 22, fontWeight: '700', color: colors.text, backgroundColor: colors.surface, marginTop: 4 },
  calc: { backgroundColor: colors.ink, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between' },
  calcMuted: { color: colors.onDarkMuted, fontSize: 14 },
  calcVal: { color: '#fff', fontWeight: '800' },
  calcLabel: { color: colors.onDarkMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: spacing.sm },
  calcTotal: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  dayTotal: { backgroundColor: colors.ink, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  repTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  repRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 2 },
});
