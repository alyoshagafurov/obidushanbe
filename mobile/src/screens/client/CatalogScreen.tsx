import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Product } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Body, H3, Loading, ErrorView, EmptyView } from '../../components/ui';
import { QuantityStepper } from '../../components/widgets';
import { getProducts } from '../../api/products';
import { apiErrorMessage } from '../../lib/api';
import { useCartStore } from '../../store/cart.store';
import { productImage } from '../../brand/assets';
import { money } from '../../lib/format';
import { colors, radius, spacing, shadow } from '../../theme';
import { t } from '../../i18n';

export function CatalogScreen() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });
  const cart = useCartStore();

  if (isLoading) return <Loading text={t().common.loading} />;
  if (isError) return <ErrorView message={apiErrorMessage(error)} onRetry={refetch} />;

  const renderItem = ({ item }: { item: Product }) => {
    const qty = cart.lines[item.id]?.quantity ?? 0;
    return (
      <View style={styles.tile}>
        <View style={styles.photo}>
          <Image source={productImage(item.type, item.photoUrl)} style={styles.photoImg} resizeMode="contain" />
        </View>
        <H3 numberOfLines={2} style={styles.name}>
          {item.name}
        </H3>
        <View style={styles.bottom}>
          <View>
            <Text style={styles.priceLabel}>{t().common.total}</Text>
            <Text style={styles.price}>{money(item.price)}</Text>
          </View>
          {qty > 0 ? (
            <QuantityStepper value={qty} onAdd={() => cart.add(item)} onRemove={() => cart.remove(item.id)} />
          ) : (
            <Pressable style={styles.addBtn} onPress={() => cart.add(item)} hitSlop={6}>
              <Text style={styles.addPlus}>+</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <Screen padded={false}>
      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        ListEmptyComponent={<EmptyView text={t().common.empty} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.soft,
  },
  photo: {
    height: 130,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  photoImg: { width: '88%', height: '92%' },
  name: { minHeight: 44 },
  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  priceLabel: { ...{ fontSize: 10, fontWeight: '600', letterSpacing: 0.4 }, color: colors.textMuted, textTransform: 'uppercase' },
  price: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 2, letterSpacing: -0.3 },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  addPlus: { color: colors.onDark, fontSize: 24, fontWeight: '600', lineHeight: 26 },
});
