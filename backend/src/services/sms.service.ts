/**
 * Абстракция SMS-провайдера. Сейчас активен провайдер 'dev' (код печатается в лог,
 * реально SMS не отправляется). Чтобы подключить настоящего провайдера (OsonSMS,
 * Twilio и т.п.) — реализуйте соответствующий метод и задайте SMS_PROVIDER в .env.
 */
import { env, isDemo } from '../config/env';
import { logger } from '../lib/logger';
import { DEV_SMS_CODE, SMS_CODE_LENGTH } from '@obi/shared';

export interface SmsProvider {
  send(phone: string, text: string): Promise<void>;
}

/** Dev-провайдер: ничего не отправляет, просто пишет в лог. */
const devProvider: SmsProvider = {
  async send(phone, text) {
    logger.info('[sms:dev] SMS не отправлено (dev-режим)', { phone, text });
  },
};

/**
 * Заготовка под OsonSMS (популярный провайдер в Таджикистане).
 * TODO: реализовать реальный HTTP-вызов, когда будут ключи.
 */
const osonSmsProvider: SmsProvider = {
  async send(phone, text) {
    if (!env.SMS_API_URL || !env.SMS_API_KEY) {
      throw new Error('OsonSMS не настроен: задайте SMS_API_URL и SMS_API_KEY');
    }
    // Пример (псевдо): нужно сверить с актуальной документацией провайдера.
    // const res = await fetch(env.SMS_API_URL, { method: 'POST', headers: {...}, body: ... });
    // if (!res.ok) throw new Error('Ошибка отправки SMS');
    logger.warn('[sms:osonsms] Заглушка отправки — реализуйте интеграцию', { phone });
  },
};

/** Заготовка под Twilio. */
const twilioProvider: SmsProvider = {
  async send(phone, text) {
    if (!env.SMS_API_KEY) throw new Error('Twilio не настроен');
    logger.warn('[sms:twilio] Заглушка отправки — реализуйте интеграцию', { phone });
  },
};

function getProvider(): SmsProvider {
  switch (env.SMS_PROVIDER) {
    case 'osonsms':
      return osonSmsProvider;
    case 'twilio':
      return twilioProvider;
    case 'dev':
    default:
      return devProvider;
  }
}

const provider = getProvider();

/**
 * Генерирует код подтверждения. В dev-режиме всегда DEV_SMS_CODE ("0000")
 * для удобства разработки. В проде — случайный.
 */
export function generateSmsCode(): string {
  if (isDemo && env.SMS_PROVIDER === 'dev') return DEV_SMS_CODE;
  const max = 10 ** SMS_CODE_LENGTH;
  return Math.floor(Math.random() * max)
    .toString()
    .padStart(SMS_CODE_LENGTH, '0');
}

export async function sendVerificationCode(phone: string, code: string): Promise<void> {
  const text = `ОБИ ДУШАНБЕ: ваш код подтверждения ${code}`;
  await provider.send(phone, text);
}
