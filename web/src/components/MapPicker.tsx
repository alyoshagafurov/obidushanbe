import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { GeoPoint, DUSHANBE_CENTER } from '@obi/shared';
import { useEffect } from 'react';

// Починка стандартной иконки маркера для сборщика (Vite).
L.Marker.prototype.options.icon = L.icon({
  iconUrl, iconRetinaUrl, shadowUrl,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

export interface MapMarker { id: string; lat: number; lng: number; onClick?: () => void }

function ClickHandler({ onPick }: { onPick?: (p: GeoPoint) => void }) {
  useMapEvents({
    click(e) { onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng }); },
  });
  return null;
}

function Recenter({ point }: { point: GeoPoint | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.setView([point.lat, point.lng], map.getZoom());
  }, [point?.lat, point?.lng]);
  return null;
}

interface Props {
  value?: GeoPoint | null;
  onChange?: (p: GeoPoint) => void;
  markers?: MapMarker[];
  center?: GeoPoint | null;
  height?: number;
}

export function MapPicker({ value, onChange, markers = [], center, height = 300 }: Props) {
  const c = value ?? center ?? DUSHANBE_CENTER;
  return (
    <div className="mapbox" style={{ height }}>
      <MapContainer center={[c.lat, c.lng]} zoom={13} scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        <Recenter point={value ?? null} />
        {value && <Marker position={[value.lat, value.lng]} />}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} eventHandlers={{ click: () => m.onClick?.() }} />
        ))}
      </MapContainer>
    </div>
  );
}
