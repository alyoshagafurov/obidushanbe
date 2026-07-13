import React from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Body, Button, Card, EmptyView, H3, Muted, Divider } from '../../components/ui';
import { QuantityStepper } from '../../components/widgets';
import { CartLine, useCartStore } from '../../store/cart.store';
import { ClientStackParamList } from '../../navigation/types';
import { productImage } from '../../brand/assets';
import { money } from '../../lib/format';
import { colors, radius, spacing } from '../../theme';
import { t } from '../../i18n';

export function CartScreen() {
  const cart = useCartStore();
  const nav = useNavigation<NativeStackNavigationProp<ClientStackParamList>>();
  const items = cart.items();

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyView text={t().cart.empty} icon="🛒" />
      </Screen>
    );
  }

  const renderItem = ({ item }: { item: CartLine }) => (
    <Card style={styles.row}>
      <Image
        source={productImage(item.product.type, item.product.photoUrl)}
        style={styles.thumb}
        resizeMode="contain"
      />
      <View style={{ flex: 1, marginRight: spacing.sm }}>
        <H3 numberOfLines={2}>{item.product.name}</H3>
        <Muted style={{ marginTop: 2 }}>{money(item.product.price)} × {item.quantity}</Muted>
      </View>
      <QuantityStepper
        value={item.quantity}
        onAdd={() => cart.add(item.product)}
        onRemove={() => cart.remove(item.product.id)}
      />
    </Card>
  );

  return (
    <Screen padded={false}>
      <FlatList
        data={items}
        keyExtractor={(l) => l.product.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.lg }}
      />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <H3>{t().common.total}</H3>
          <H3 style={{ color: colors.primary }}>{money(cart.total())}</H3>
        </View>
        <Divider />
        <Button title={t().cart.checkout} onPress={() => nav.navigate('Checkout')} />
        <Button title={t().cart.clear} variant="outline" onPress={cart.clear} style={{ marginTop: spacing.sm }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    marginRight: spacing.md,
    backgroundColor: colors.surface,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
