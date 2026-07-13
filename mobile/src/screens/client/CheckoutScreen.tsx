import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AddressSnapshot } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Button, Card, Divider, H3, Muted } from '../../components/ui';
import { AddressEditor } from '../../components/AddressEditor';
import { createOrder } from '../../api/orders';
import { apiErrorMessage } from '../../lib/api';
import { useCartStore } from '../../store/cart.store';
import { ClientStackParamList } from '../../navigation/types';
import { money } from '../../lib/format';
import { colors, spacing } from '../../theme';
import { t } from '../../i18n';

const EMPTY_ADDRESS: AddressSnapshot = { point: null, text: null, landmark: null };

export function CheckoutScreen() {
  const cart = useCartStore();
  const nav = useNavigation<NativeStackNavigationProp<ClientStackParamList>>();
  const qc = useQueryClient();
  const [address, setAddress] = useState<AddressSnapshot>(EMPTY_ADDRESS);

  const mutation = useMutation({
    mutationFn: () =>
      createOrder({
        items: cart.items().map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        address,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      cart.clear();
      Alert.alert(t().common.appName, t().checkout.success);
      nav.navigate('Tabs');
    },
    onError: (e) => Alert.alert(t().common.error, apiErrorMessage(e)),
  });

  const canSubmit = !!address.point || !!address.text?.trim();

  const submit = () => {
    if (!canSubmit) {
      Alert.alert(t().common.appName, t().checkout.needAddress);
      return;
    }
    mutation.mutate();
  };

  return (
    <Screen scroll>
      <Card>
        <H3>{t().cart.title}</H3>
        <Divider />
        {cart.items().map((l) => (
          <View key={l.product.id} style={styles.itemRow}>
            <Muted style={{ flex: 1 }} numberOfLines={1}>
              {l.product.name} × {l.quantity}
            </Muted>
            <Muted>{money(l.product.price * l.quantity)}</Muted>
          </View>
        ))}
        <Divider />
        <View style={styles.itemRow}>
          <H3>{t().common.total}</H3>
          <H3 style={{ color: colors.primary }}>{money(cart.total())}</H3>
        </View>
      </Card>

      <Card>
        <AddressEditor value={address} onChange={setAddress} />
      </Card>

      <Button
        title={t().checkout.placeOrder}
        onPress={submit}
        loading={mutation.isPending}
        disabled={!canSubmit}
        style={{ marginBottom: spacing.xl }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
});
