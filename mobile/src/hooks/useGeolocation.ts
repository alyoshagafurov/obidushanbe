/** Хук определения текущего местоположения через expo-location. */
import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { GeoPoint } from '@obi/shared';

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(async (): Promise<GeoPoint | null> => {
    setError(null);
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Нет доступа к геолокации. Разрешите в настройках.');
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      setError('Не удалось определить местоположение');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { detect, loading, error };
}
