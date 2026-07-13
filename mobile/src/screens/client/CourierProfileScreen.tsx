import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { Body, Button, Card, Divider, H2, Muted, Loading, ErrorView, EmptyView } from '../../components/ui';
import { Avatar, StarRating } from '../../components/widgets';
import { getCourier, getCourierReviews } from '../../api/couriers';
import { apiErrorMessage } from '../../lib/api';
import { ClientStackParamList } from '../../navigation/types';
import { dateOnly } from '../../lib/format';
import { colors, spacing } from '../../theme';
import { t } from '../../i18n';

type ParamList = { CourierProfile: { courierId: string; orderId?: string } };

export function CourierProfileScreen() {
  const { params } = useRoute<RouteProp<ParamList, 'CourierProfile'>>();
  const nav = useNavigation<NativeStackNavigationProp<ClientStackParamList>>();

  const profile = useQuery({ queryKey: ['courier', params.courierId], queryFn: () => getCourier(params.courierId) });
  const reviews = useQuery({
    queryKey: ['courier-reviews', params.courierId],
    queryFn: () => getCourierReviews(params.courierId),
  });

  if (profile.isLoading) return <Loading />;
  if (profile.isError || !profile.data)
    return <ErrorView message={apiErrorMessage(profile.error)} onRetry={profile.refetch} />;

  const c = profile.data;

  return (
    <Screen scroll>
      <Card>
        <View style={styles.head}>
          <Avatar uri={c.photoUrl} name={c.name} size={72} />
          <H2 style={{ marginTop: spacing.md }}>{c.name}</H2>
          <View style={styles.ratingRow}>
            <StarRating value={c.rating} size={18} />
            <Body style={{ marginLeft: spacing.sm, fontWeight: '700' }}>{c.rating.toFixed(1)}</Body>
          </View>
          <Muted style={{ marginTop: spacing.xs }}>
            {t().courierProfile.deliveries}: {c.deliveriesCount} • {t().courierProfile.reviews}: {c.reviewsCount}
          </Muted>
        </View>
        {c.bio ? (
          <>
            <Divider />
            <Body>{c.bio}</Body>
          </>
        ) : null}
        <Button
          title={t().courierProfile.message}
          variant="secondary"
          style={{ marginTop: spacing.md }}
          onPress={() => nav.navigate('Chat', { peerId: c.id, orderId: params.orderId, peerName: c.name })}
        />
      </Card>

      <Card>
        <H2 style={{ fontSize: 18 }}>{t().courierProfile.reviews}</H2>
        <Divider />
        {reviews.isLoading ? (
          <Loading />
        ) : !reviews.data || reviews.data.length === 0 ? (
          <EmptyView text={t().courierProfile.noReviews} icon="⭐" />
        ) : (
          reviews.data.map((r) => (
            <View key={r.id} style={styles.review}>
              <View style={styles.reviewHead}>
                <Body style={{ fontWeight: '700' }}>{r.authorName}</Body>
                <StarRating value={r.rating} size={13} />
              </View>
              {r.text ? <Muted style={{ marginTop: 2 }}>{r.text}</Muted> : null}
              <Muted style={styles.reviewDate}>{dateOnly(r.createdAt)}</Muted>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  review: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewDate: { marginTop: 4, fontSize: 11, color: colors.textMuted },
});
