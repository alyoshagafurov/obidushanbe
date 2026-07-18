import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Product, ProductType } from '@obi/shared';
import { getAllProducts, createProduct, updateProduct, deleteProduct, uploadImage } from '../../api';
import { apiError } from '../../lib/api';
import { money, productImg } from '../../lib/format';
import { Spinner, ErrorBox } from '../../components/ui';
import { useToast } from '../../components/Toast';

const TYPES: { v: ProductType; l: string }[] = [
  { v: ProductType.WATER_20L, l: 'Вода 20л' }, { v: ProductType.WATER_05L, l: 'Вода 0.5л' },
  { v: ProductType.COOLER, l: 'Кулер' }, { v: ProductType.PUMP_MANUAL, l: 'Помпа ручная' },
  { v: ProductType.PUMP_ELECTRIC, l: 'Помпа электр.' }, { v: ProductType.OTHER, l: 'Другое' },
];
type Form = { name: string; price: string; type: ProductType; photoUrl: string | null };
const EMPTY: Form = { name: '', price: '', type: ProductType.WATER_20L, photoUrl: null };

export function Products() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['admin-products'], queryFn: getAllProducts });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); qc.invalidateQueries({ queryKey: ['products'] }); };

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ name: p.name, price: String(p.price), type: p.type, photoUrl: p.photoUrl }); setOpen(true); };

  const pick = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try { const url = await uploadImage(file, 'product'); setForm((f) => ({ ...f, photoUrl: url })); toast('Фото загружено', 'success'); }
    catch (e) { toast(apiError(e), 'error'); } finally { setUploading(false); }
  };

  const save = useMutation({
    mutationFn: () => {
      const payload = { name: form.name.trim(), price: Number(form.price), type: form.type, photoUrl: form.photoUrl };
      return editing ? updateProduct(editing.id, payload) : createProduct({ ...payload, isActive: true });
    },
    onSuccess: () => { invalidate(); setOpen(false); toast('Товар сохранён', 'success'); }, onError: (e) => toast(apiError(e), 'error'),
  });
  const toggle = useMutation({ mutationFn: (p: Product) => updateProduct(p.id, { isActive: !p.isActive }), onSuccess: invalidate });
  const del = useMutation({ mutationFn: (id: string) => deleteProduct(id), onSuccess: () => { invalidate(); toast('Товар удалён', 'success'); } });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBox message={apiError(error)} onRetry={refetch} />;

  return (
    <>
      <div className="page__head"><h1>Товары</h1><button className="btn" onClick={openCreate}>+ Добавить товар</button></div>
      <div className="grid grid--products">
        {data!.map((p) => (
          <div className="prod" key={p.id} style={{ opacity: p.isActive ? 1 : 0.5 }}>
            <div className="prod__img"><img src={productImg(p.type, p.photoUrl)} alt="" loading="lazy" decoding="async" /></div>
            <div className="prod__name">{p.name}</div>
            <div className="hairline-muted">{money(p.price)}</div>
            <div className="prod__foot" style={{ gap: 6 }}>
              <button className="btn btn--ghost btn--sm grow" onClick={() => openEdit(p)}>Изменить</button>
              <button className="btn btn--sm" onClick={() => toggle.mutate(p)}>{p.isActive ? 'Скрыть' : 'Показать'}</button>
            </div>
            <button className="btn btn--danger btn--sm" style={{ marginTop: 6 }} onClick={() => confirm(`Удалить «${p.name}»?`) && del.mutate(p.id)}>Удалить</button>
          </div>
        ))}
      </div>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Изменить товар' : 'Новый товар'}</h3>
            <div style={{ textAlign: 'center', margin: '14px 0' }}>
              <img className="thumb-blend" src={productImg(form.type, form.photoUrl)} alt="" style={{ width: 120, height: 120, objectFit: 'contain', background: 'var(--surface-alt)', borderRadius: 14, border: '1px solid var(--border)' }} />
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
              <button className="btn btn--light btn--sm btn--block" style={{ marginTop: 8 }} disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? 'Загрузка…' : form.photoUrl ? '📷 Изменить фото' : '📷 Добавить фото'}
              </button>
            </div>
            <div className="field"><label className="label">Название</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label className="label">Цена (смн)</label><input className="input" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^\d.]/g, '') })} /></div>
            <label className="label">Тип</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TYPES.map((t) => <button key={t.v} className={`chip ${form.type === t.v ? 'chip--active' : ''}`} onClick={() => setForm({ ...form, type: t.v })}>{t.l}</button>)}
            </div>
            <button className="btn btn--block" style={{ marginTop: 16 }} disabled={!form.name.trim() || !form.price || save.isPending} onClick={() => save.mutate()}>Сохранить</button>
            <button className="btn btn--ghost btn--block" style={{ marginTop: 8 }} onClick={() => setOpen(false)}>Отмена</button>
          </div>
        </div>
      )}
    </>
  );
}
