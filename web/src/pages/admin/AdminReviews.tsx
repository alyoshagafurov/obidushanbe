import { useQuery } from '@tanstack/react-query';
import { getAdminReviews } from '../../api';
import { apiError } from '../../lib/api';
import { dateOnly } from '../../lib/format';
import { Spinner, ErrorBox, Empty, Stars } from '../../components/ui';

export function AdminReviews() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['admin-reviews'], queryFn: getAdminReviews });
  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBox message={apiError(error)} onRetry={refetch} />;
  if (!data?.length) return <Empty text="Отзывов пока нет" icon="⭐" />;
  return (
    <>
      <div className="page__head"><h1>Отзывы</h1></div>
      <div className="grid grid--2">
        {data.map((r) => (
          <div className="card" key={r.id}>
            <div className="row-between"><b>🚚 {r.courierName}</b><Stars value={r.rating} size={14} /></div>
            <div className="hairline-muted" style={{ marginTop: 4 }}>от {r.authorName}</div>
            {r.text && <p style={{ marginTop: 6 }}>{r.text}</p>}
            <div className="hairline-muted" style={{ marginTop: 6, fontSize: 13 }}>{dateOnly(r.createdAt)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
