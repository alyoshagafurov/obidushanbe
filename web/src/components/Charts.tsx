/** Лёгкие SVG-графики без зависимостей: площадной график и donut. */

export function AreaChart({
  data, height = 200, color = '#0E72C9', fmt,
}: { data: { label: string; value: number }[]; height?: number; color?: string; fmt?: (n: number) => string }) {
  const W = 640, H = height, P = 28;
  if (!data.length) return <div className="hairline-muted">Нет данных</div>;
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = (W - P * 2) / Math.max(1, data.length - 1);
  const x = (i: number) => P + i * stepX;
  const y = (v: number) => H - P - (v / max) * (H - P * 2);
  const pts = data.map((d, i) => `${x(i)},${y(d.value)}`);
  const line = `M ${pts.join(' L ')}`;
  const area = `${line} L ${x(data.length - 1)},${H - P} L ${x(0)},${H - P} Z`;
  const last = data[data.length - 1];
  const gid = `g-${color.replace('#', '')}`;
  const labelEvery = Math.ceil(data.length / 8);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <line key={i} x1={P} x2={W - P} y1={y(max * f)} y2={y(max * f)} stroke="#eef1f6" strokeWidth="1" />
      ))}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(data.length - 1)} cy={y(last.value)} r="4.5" fill={color} stroke="#fff" strokeWidth="2" />
      {data.map((d, i) => (i % labelEvery === 0 ? (
        <text key={i} x={x(i)} y={H - 8} fontSize="10" fill="#93a1ae" textAnchor="middle">{d.label}</text>
      ) : null))}
      <text x={x(data.length - 1)} y={y(last.value) - 10} fontSize="11" fontWeight="700" fill={color} textAnchor="middle">
        {fmt ? fmt(last.value) : last.value}
      </text>
    </svg>
  );
}

export function Donut({ segments, size = 180 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 60, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <svg viewBox="0 0 160 160" width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="80" cy="80" r={r} fill="none" stroke="#eef1f6" strokeWidth="20" />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = <circle key={i} cx="80" cy="80" r={r} fill="none" stroke={s.color} strokeWidth="20" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />;
          offset += len;
          return el;
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
            <span className="grow">{s.label}</span>
            <b>{Math.round((s.value / total) * 100)}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}
