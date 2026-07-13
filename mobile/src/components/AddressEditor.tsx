/**
 * РЕДАКТОР АДРЕСА — три способа, комбинируются (см. ТЗ):
 *  1) кнопка «Определить моё местоположение» (геолокация одним нажатием);
 *  2) выбор точки на карте (тап/перетаскивание маркера);
 *  3) текстовый адрес + поле «ориентир/комментарий».
 *
 * Используется и клиентом (оформление заказа), и оператором.
 * Минимум валидации: должна быть либо точка, либо текстовый адрес.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AddressSnapshot, GeoPoint } from '@obi/shared';
import { AppMap } from '../maps/AppMap';
import { Button, Input, Muted, H3 } from './ui';
import { useGeolocation } from '../hooks/useGeolocation';
import { colors, spacing } from '../theme';
import { t } from '../i18n';

interface Props {
  value: AddressSnapshot;
  onChange: (next: AddressSnapshot) => void;
}

export function AddressEditor({ value, onChange }: Props) {
  const geo = useGeolocation();

  const setPoint = (point: GeoPoint | null) => onChange({ ...value, point });
  const setText = (text: string) => onChange({ ...value, text });
  const setLandmark = (landmark: string) => onChange({ ...value, landmark });

  const detectLocation = async () => {
    const point = await geo.detect();
    if (point) setPoint(point);
  };

  return (
    <View>
      <H3 style={{ marginBottom: spacing.sm }}>{t().checkout.address}</H3>

      {/* 1) Геолокация одной кнопкой */}
      <Button
        title={geo.loading ? t().checkout.locating : t().checkout.useLocation}
        variant="secondary"
        loading={geo.loading}
        onPress={detectLocation}
      />
      {geo.error ? <Muted style={styles.err}>{geo.error}</Muted> : null}
      {value.point ? <Muted style={styles.ok}>✓ {t().checkout.pointSet}</Muted> : null}

      {/* 2) Точка на карте (тап/перетаскивание) */}
      <View style={{ marginVertical: spacing.md }}>
        <AppMap
          height={200}
          center={value.point ?? undefined}
          selectedPoint={value.point}
          showUserLocation
          onPressMap={(p) => setPoint(p)}
        />
        <Muted style={{ marginTop: spacing.xs }}>{t().checkout.pickOnMap}</Muted>
      </View>

      {/* 3) Текстовый адрес + ориентир */}
      <Input
        label={t().checkout.addressText}
        value={value.text ?? ''}
        onChangeText={setText}
        placeholder={t().checkout.addressText}
        multiline
      />
      <Input
        label={t().checkout.landmark}
        value={value.landmark ?? ''}
        onChangeText={setLandmark}
        placeholder={t().checkout.landmarkHint}
        multiline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  err: { color: colors.danger, marginTop: spacing.xs },
  ok: { color: colors.success, marginTop: spacing.xs },
});
