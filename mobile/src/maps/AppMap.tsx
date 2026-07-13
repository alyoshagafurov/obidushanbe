/**
 * АБСТРАКЦИЯ КАРТ. Весь остальной код использует только <AppMap/>, а не конкретный
 * SDK — провайдера можно поменять в одном месте.
 *
 * Сейчас реализация на react-native-maps:
 *   - 'google'  -> Google Maps (нужен ключ в app.json -> android.config.googleMaps);
 *   - на iOS по умолчанию Apple Maps.
 *
 * 2ГИС / Яндекс.Карты лучше знают адреса Душанбе, но их нативные SDK требуют
 * dev-build (не работают в Expo Go). Чтобы подключить:
 *   1) добавьте нативный модуль провайдера (config plugin);
 *   2) реализуйте здесь ветку под config.mapProvider === '2gis' | 'yandex';
 *   3) задайте ключ в config.mapApiKey.
 * Интерфейс <AppMap/> при этом менять не нужно.
 */
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { config } from '../config';
import { colors, radius } from '../theme';
import { DUSHANBE_CENTER } from '@obi/shared';
import { AppMapProps } from './types';

export function AppMap({
  markers = [],
  center,
  selectedPoint,
  onPressMap,
  onPressMarker,
  showUserLocation,
  height = 240,
  style,
}: AppMapProps) {
  const initialCenter = center ?? selectedPoint ?? DUSHANBE_CENTER;
  const initialRegion: Region = {
    latitude: initialCenter.lat,
    longitude: initialCenter.lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // PROVIDER_GOOGLE форсим ТОЛЬКО на Android (там нужен Google + ключ).
  // На iOS используем системные Apple Maps (работают в симуляторе/Expo Go без ключа),
  // иначе react-native-maps падает с ошибкой "AirGoogleMaps dir must be added".
  const provider =
    Platform.OS === 'android' && config.mapProvider === 'google' ? PROVIDER_GOOGLE : undefined;

  return (
    <View style={[styles.wrap, { height }, style]}>
      <MapView
        provider={provider}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation={showUserLocation}
        onPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          onPressMap?.({ lat: latitude, lng: longitude });
        }}
      >
        {markers.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            title={m.title}
            description={m.subtitle}
            pinColor={m.selected ? colors.accent : colors.primary}
            onPress={() => onPressMarker?.(m.id)}
          />
        ))}
        {selectedPoint && (
          <Marker
            coordinate={{ latitude: selectedPoint.lat, longitude: selectedPoint.lng }}
            pinColor={colors.danger}
            draggable
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              onPressMap?.({ lat: latitude, lng: longitude });
            }}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.primaryLight,
  },
});
