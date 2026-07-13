/**
 * Загрузка изображения: получаем presigned-URL у бэкенда, затем PUT-ом
 * заливаем сам файл прямо в хранилище (локальное или S3/R2).
 * Возвращает публичный URL картинки.
 */
import { api } from '../lib/api';

interface UploadTarget {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export async function uploadImage(
  localUri: string,
  contentType: string,
  kind: 'product' | 'avatar',
): Promise<string> {
  // 1) Просим у сервера адрес для загрузки.
  const { data } = await api.post<UploadTarget>('/users/me/upload-url', { contentType, kind });

  // 2) Читаем локальный файл как blob и заливаем PUT-ом.
  const fileRes = await fetch(localUri);
  const blob = await fileRes.blob();
  const putRes = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
  if (!putRes.ok) throw new Error('Не удалось загрузить файл');

  // 3) Возвращаем публичный URL для сохранения в товаре/профиле.
  return data.publicUrl;
}
