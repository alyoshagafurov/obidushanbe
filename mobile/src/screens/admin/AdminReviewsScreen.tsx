import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { Body, Card, Muted, Loading, ErrorView, EmptyView } from '../../components/ui';
import { StarRating } from '../../components/widgets';
import { getAdminReviews } from '../../api/admin';
import { apiErrorMessage } from '../../lib/api';
import { dateOnly } from '../../lib/format';
import { spacing } from '../../theme';
import { t } from '../../i18n';

export function AdminReviewsScreen() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: getAdminReviews,
  });

  if (isLoading) return <Loading />;
  if (isError) return <ErrorView message={apiErrorMessage(error)} onRetry={refetch} />;

  return (
    <Screen padded={false}>
      <FlatList
        data={data}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<EmptyView text={t().courierProfile.noReviews} icon="⭐" />}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.head}>
              <Body style={{ fontWeight: '700' }}>🚚 {item.courierName}</Body>
              <StarRating value={item.rating} size={14} />
            </View>
            <Muted style={{ marginTop: 4 }}>от {item.authorName}</Muted>
            {item.text ? <Body style={{ marginTop: spacing.xs }}>{item.text}</Body> : null}
            <Muted style={{ marginTop: spacing.xs }}>{dateOnly(item.createdAt)}</Muted>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
