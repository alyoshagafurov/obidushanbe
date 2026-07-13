import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { Button, Card, H2, Input, Muted } from '../../components/ui';
import { StarRating } from '../../components/widgets';
import { createReview } from '../../api/reviews';
import { apiErrorMessage } from '../../lib/api';
import { spacing } from '../../theme';
import { t } from '../../i18n';

type ParamList = { Review: { orderId: string; courierId: string } };

export function ReviewScreen() {
  const { params } = useRoute<RouteProp<ParamList, 'Review'>>();
  const nav = useNavigation();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');

  const mutation = useMutation({
    mutationFn: () => createReview({ orderId: params.orderId, rating, text: text.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', params.orderId] });
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      qc.invalidateQueries({ queryKey: ['courier', params.courierId] });
      Alert.alert(t().common.appName, t().review.thanks);
      nav.goBack();
    },
    onError: (e) => Alert.alert(t().common.error, apiErrorMessage(e)),
  });

  return (
    <Screen scroll>
      <Card>
        <H2 style={{ fontSize: 18 }}>{t().review.title}</H2>
        <Muted style={{ marginVertical: spacing.md }}>{t().review.rate}</Muted>
        <View style={styles.stars}>
          <StarRating value={rating} size={40} onChange={setRating} />
        </View>
        <Input
          label={t().review.comment}
          value={text}
          onChangeText={setText}
          placeholder={t().review.comment}
          multiline
          style={{ minHeight: 90, textAlignVertical: 'top' }}
        />
        <Button title={t().review.submit} onPress={() => mutation.mutate()} loading={mutation.isPending} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stars: { alignItems: 'center', marginBottom: spacing.lg },
});
