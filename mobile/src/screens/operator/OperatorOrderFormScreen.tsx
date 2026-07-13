import React, { useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AddressSnapshot, PHONE_REGEX } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Body, Button, Card, Divider, H3, Input, Muted } from '../../components/ui';
import { QuantityStepper } from '../../components/widgets';
import { AddressEditor } from '../../components/AddressEditor';
import { productImage } from '../../brand/assets';
import { getProducts } from '../../api/products';
import { lookupClient, createOperatorOrder } from '../../api/operator';
import { apiErrorMessage } from '../../lib/api';
import { money } from '../../lib/format';
import { colors, spacing } from '../../theme';
import { t } from '../../i18n';

const EMPTY_ADDRESS: AddressSnapshot = { point: null, text: null, landmark: null };

/** Быстрая форма создания заказа оператором (оптимизирована под скорость во время звонка). */
export function OperatorOrderFormScreen() {
  const qc = useQueryClient();
  const [phone, setPhone] = useState('+992');
  const [name, setName] = useState('');
  const [lookupResult, setLookupResult] = useState<'found' | 'new' | null>(null);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [address, setAddress] = useState<AddressSnapshot>(EMPTY_ADDRESS);

  const products = useQuery({ queryKey: ['products'], queryFn: getProducts });

  const lookup = async () => {
    const normalized = phone.replace(/\s/g, '');
    if (!PHONE_REGEX.test(normalized)) {
      Alert.alert(t().common.appName, t().auth.invalidPhone);
      return;
    }
    try {
      const res = await lookupClient(normalized);
      if (res.exists) {
        setName(res.name ?? '');
        setLookupResult('found');
        // Подставим последний сохранённый адрес, если есть
        const last = res.addresses?.[0];
        if (last) {
          setAddress({
            point: last.lat != null && last.lng != null ? { lat: last.lat, lng: last.lng } : null,
            text: last.text ?? null,
            landmark: last.landmark ?? null,
          });
        }
      } else {
        setLookupResult('new');
      }
    } catch (e) {
      Alert.alert(t().common.error, apiErrorMessage(e));
    }
  };

  const setQty = (id: string, delta: number) =>
    setQtys((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });

  const items = Object.entries(qtys).map(([productId, quantity]) => ({ productId, quantity }));
  const total = (products.data ?? []).reduce((sum, p) => sum + (qtys[p.id] ?? 0) * p.price, 0);
  const canSubmit =
    PHONE_REGEX.test(phone.replace(/\s/g, '')) &&
    items.length > 0 &&
    (!!address.point || !!address.text?.trim());

  const mutation = useMutation({
    mutationFn: () =>
      createOperatorOrder({
        clientPhone: phone.replace(/\s/g, ''),
        clientName: name.trim() || undefined,
        items,
        address,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operator-orders'] });
      Alert.alert(t().common.appName, t().operator.created);
      // сброс формы
      setPhone('+992');
      setName('');
      setLookupResult(null);
      setQtys({});
      setAddress(EMPTY_ADDRESS);
    },
    onError: (e) => Alert.alert(t().common.error, apiErrorMessage(e)),
  });

  return (
    <Screen scroll>
      {/* Клиент */}
      <Card>
        <H3>{t().operator.clientPhone}</H3>
        <View style={styles.lookupRow}>
          <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ flex: 1 }} />
          <Button title={t().operator.lookup} small onPress={lookup} style={styles.lookupBtn} />
        </View>
        {lookupResult === 'found' ? <Muted style={{ color: colors.success }}>✓ {t().operator.clientFound}</Muted> : null}
        {lookupResult === 'new' ? <Muted style={{ color: colors.warning }}>{t().operator.clientNew}</Muted> : null}
        <Input
          label={t().operator.clientName}
          value={name}
          onChangeText={setName}
          placeholder={t().operator.clientName}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      {/* Товары */}
      <Card>
        <H3>{t().operator.products}</H3>
        <Divider />
        {(products.data ?? []).map((p) => (
          <View key={p.id} style={styles.productRow}>
            <Image source={productImage(p.type, p.photoUrl)} style={styles.thumb} resizeMode="contain" />
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Body numberOfLines={1}>{p.name}</Body>
              <Muted>{money(p.price)}</Muted>
            </View>
            <QuantityStepper
              value={qtys[p.id] ?? 0}
              onAdd={() => setQty(p.id, 1)}
              onRemove={() => setQty(p.id, -1)}
            />
          </View>
        ))}
        <Divider />
        <View style={styles.totalRow}>
          <H3>{t().common.total}</H3>
          <H3 style={{ color: colors.primary }}>{money(total)}</H3>
        </View>
      </Card>

      {/* Адрес */}
      <Card>
        <AddressEditor value={address} onChange={setAddress} />
      </Card>

      <Button
        title={t().operator.create}
        onPress={() => mutation.mutate()}
        loading={mutation.isPending}
        disabled={!canSubmit}
        style={{ marginBottom: spacing.xl }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lookupRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm },
  lookupBtn: { marginLeft: spacing.sm, marginTop: 0, alignSelf: 'center' },
  productRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xs },
  thumb: { width: 40, height: 40, marginRight: spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
