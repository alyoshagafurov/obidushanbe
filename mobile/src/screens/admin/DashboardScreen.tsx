import React, { useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { Body, Card, Divider, H2, H3, Muted, Loading, ErrorView } from '../../components/ui';
import { Hero } from '../../components/Hero';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { BarChart } from '../../components/BarChart';
import { getStats } from '../../api/admin';
import { apiErrorMessage } from '../../lib/api';
import { money } from '../../lib/format';
import { colors, radius, shadow, spacing } from '../../theme';
import { t } from '../../i18n';

type Period = 'day' | 'week' | 'month' | 'year';

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function DashboardScreen() {
  const [period, setPeriod] = useState<Period>('week');
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['stats', period],
    queryFn: () => getStats({ period }),
  });

  const dayLabel = (date: string) => date.slice(8, 10) + '.' + date.slice(5, 7);

  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      <View style={{ marginBottom: spacing.lg }}>
        <SegmentedTabs
          value={period}
          onChange={(v) => setPeriod(v as Period)}
          options={[
            { value: 'day', label: t().admin.period.day },
            { value: 'week', label: t().admin.period.week },
            { value: 'month', label: t().admin.period.month },
            { value: 'year', label: t().admin.period.year },
          ]}
        />
      </View>

      {isLoading ? (
        <Loading />
      ) : isError || !data ? (
        <ErrorView message={apiErrorMessage(error)} onRetry={refetch} />
      ) : (
        <>
          {/* Выручка — премиальная графит-карта */}
          <Hero rounded style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>{t().admin.revenue}</Text>
            <Text style={styles.revenueValue}>{money(data.revenue)}</Text>
            <Text style={styles.revenueSub}>
              {data.deliveredOrders} {t().admin.delivered.toLowerCase()} · {data.totalOrders}{' '}
              {t().admin.totalOrders.toLowerCase()}
            </Text>
          </Hero>

          {/* KPI-плитки */}
          <View style={styles.kpiRow}>
            <Kpi label={t().admin.newClients} value={String(data.newClients)} />
            <Kpi label={t().admin.totalOrders} value={String(data.totalOrders)} />
            <Kpi label={t().admin.delivered} value={String(data.deliveredOrders)} />
          </View>

          {/* Заказы по дням */}
          <Card>
            <H3>{t().admin.ordersByDay}</H3>
            <Divider />
            <BarChart
              data={data.timeseries.map((p) => ({ label: dayLabel(p.date), value: p.ordersCount }))}
              color={colors.accent}
            />
          </Card>

          {/* Выручка по дням */}
          <Card>
            <H3>{t().admin.revenueByDay}</H3>
            <Divider />
            <BarChart
              data={data.timeseries.map((p) => ({ label: dayLabel(p.date), value: p.revenue }))}
              valueFormatter={(v) => String(Math.round(v))}
            />
          </Card>

          {/* Продажи по товарам */}
          <Card>
            <H3>{t().admin.productSales}</H3>
            <Divider />
            {data.productSales.length === 0 ? (
              <Muted>{t().common.empty}</Muted>
            ) : (
              data.productSales.map((p) => (
                <View key={p.productId} style={styles.statRow}>
                  <Body style={{ flex: 1 }} numberOfLines={1}>
                    {p.productName}
                  </Body>
                  <Muted style={{ marginRight: spacing.md }}>{p.quantity} шт</Muted>
                  <Body style={{ fontWeight: '700' }}>{money(p.revenue)}</Body>
                </View>
              ))
            )}
          </Card>

          {/* Топ доставщиков */}
          <Card>
            <H3>{t().admin.topCouriers}</H3>
            <Divider />
            {data.topCouriers.length === 0 ? (
              <Muted>{t().common.empty}</Muted>
            ) : (
              data.topCouriers.map((c, i) => (
                <View key={c.courierId} style={styles.statRow}>
                  <Body style={{ width: 24 }}>{i + 1}.</Body>
                  <Body style={{ flex: 1 }} numberOfLines={1}>
                    {c.courierName}
                  </Body>
                  <Muted style={{ marginRight: spacing.md }}>{c.deliveriesCount} дост.</Muted>
                  <Body style={{ fontWeight: '700' }}>★ {c.rating.toFixed(1)}</Body>
                </View>
              ))
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  revenueCard: { padding: spacing.xl, marginBottom: spacing.md },
  revenueLabel: {
    color: colors.onDarkMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  revenueValue: { color: colors.onDark, fontSize: 38, fontWeight: '800', letterSpacing: -1, marginTop: spacing.xs },
  revenueSub: { color: colors.onDarkMuted, fontSize: 13, marginTop: spacing.sm },
  kpiRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  kpi: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.soft,
  },
  kpiValue: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  kpiLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  statRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
});
