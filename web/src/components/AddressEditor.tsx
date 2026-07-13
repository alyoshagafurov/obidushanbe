import { useState } from 'react';
import { AddressSnapshot, GeoPoint } from '@obi/shared';
import { MapPicker } from './MapPicker';

export function AddressEditor({
  value,
  onChange,
}: {
  value: AddressSnapshot;
  onChange: (a: AddressSnapshot) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [geoErr, setGeoErr] = useState('');

  const detect = () => {
    if (!navigator.geolocation) return setGeoErr('Геолокация не поддерживается');
    setGeoErr(''); setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ ...value, point: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
        setLocating(false);
      },
      () => { setGeoErr('Не удалось определить местоположение'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const setPoint = (point: GeoPoint) => onChange({ ...value, point });

  return (
    <div>
      <button className="btn btn--light btn--block" disabled={locating} onClick={detect}>
        {locating ? 'Определяем…' : '📍 Определить моё местоположение'}
      </button>
      {geoErr && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 6 }}>{geoErr}</div>}
      {value.point && <div style={{ color: 'var(--success)', fontSize: 13, marginTop: 6 }}>✓ Точка на карте установлена</div>}

      <div style={{ margin: '14px 0' }}>
        <MapPicker value={value.point ?? null} onChange={setPoint} height={260} />
        <div className="hairline-muted" style={{ fontSize: 13, marginTop: 6 }}>Нажмите на карту, чтобы поставить точку</div>
      </div>

      <div className="field">
        <label className="label">Адрес (улица, дом, квартира)</label>
        <input className="input" value={value.text ?? ''} onChange={(e) => onChange({ ...value, text: e.target.value })}
          placeholder="ул. Рудаки 25, кв. 14" />
      </div>
      <div className="field">
        <label className="label">Ориентир / комментарий для доставщика</label>
        <textarea className="textarea" value={value.landmark ?? ''} onChange={(e) => onChange({ ...value, landmark: e.target.value })}
          placeholder="возле школы №5, домофон не работает" />
      </div>
    </div>
  );
}
