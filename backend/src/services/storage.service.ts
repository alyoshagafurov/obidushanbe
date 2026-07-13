/**
 * Абстракция хранилища файлов (фото товаров, аватары доставщиков).
 * По умолчанию провайдер 'local' (заглушка). Для прода — 's3' (S3-совместимое:
 * AWS S3 или Cloudflare R2 — задайте S3_* переменные).
 *
 * Модель загрузки: сервер выдаёт presigned-URL, мобильное приложение
 * загружает файл напрямую в хранилище (не гоняем картинки через API).
 */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

export interface UploadTarget {
  /** URL для PUT-загрузки файла (с подписью). */
  uploadUrl: string;
  /** Итоговый публичный URL файла (после загрузки). */
  publicUrl: string;
  /** Ключ объекта в хранилище. */
  key: string;
}

export interface StorageProvider {
  createUploadUrl(key: string, contentType: string): Promise<UploadTarget>;
}

/**
 * Локальное хранилище — файлы загружаются на сам бэкенд (PUT /api/uploads/:key)
 * и раздаются статикой (GET /uploads/:key). Работает без S3 — удобно для
 * разработки и демонстрации. На реальном устройстве задайте BACKEND_PUBLIC_URL.
 */
const localProvider: StorageProvider = {
  async createUploadUrl(key) {
    const base = env.BACKEND_PUBLIC_URL.replace(/\/$/, '');
    return {
      uploadUrl: `${base}/api/uploads/${key}`,
      publicUrl: `${base}/uploads/${key}`,
      key,
    };
  },
};

function buildS3Client(): S3Client {
  if (!env.S3_REGION || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY || !env.S3_BUCKET) {
    throw new Error('S3/R2 не настроен: задайте S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY');
  }
  return new S3Client({
    region: env.S3_REGION,
    // Для Cloudflare R2 задайте S3_ENDPOINT (https://<accountid>.r2.cloudflarestorage.com)
    endpoint: env.S3_ENDPOINT,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });
}

const s3Provider: StorageProvider = {
  async createUploadUrl(key, contentType) {
    const client = buildS3Client();
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
    const base = env.S3_PUBLIC_URL?.replace(/\/$/, '') ?? `${env.S3_ENDPOINT}/${env.S3_BUCKET}`;
    return { uploadUrl, publicUrl: `${base}/${key}`, key };
  },
};

const provider: StorageProvider = env.STORAGE_PROVIDER === 's3' ? s3Provider : localProvider;

export const storage = provider;
