import { GeoPoint } from '@obi/shared';

export type LatLng = GeoPoint;

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  subtitle?: string;
  selected?: boolean;
}

export interface AppMapProps {
  /** Маркеры на карте. */
  markers?: MapMarker[];
  /** Центр при первом показе. */
  center?: LatLng;
  /** Поставленная пользователем точка (для выбора адреса). */
  selectedPoint?: LatLng | null;
  /** Тап по карте — выбрать точку. */
  onPressMap?: (p: LatLng) => void;
  /** Тап по маркеру. */
  onPressMarker?: (id: string) => void;
  /** Показывать точку пользователя. */
  showUserLocation?: boolean;
  /** Высота карты. */
  height?: number;
  style?: object;
}
