/**
 * The one way the app sends email (issue #264), through Resend.
 *
 * - Production: sends to anyone. A missing RESEND_API_KEY is an error.
 * - Everywhere else (Vercel previews, local dev, tests): only sends to the
 *   addresses in EMAIL_ALLOWLIST and drops the rest with a log line, so a
 *   preview or the dev database can never email a real user. Without a key
 *   it logs and does nothing.
 *
 * Request handlers should call `sendEmailInBackground`, so a slow or failing
 * send never holds up the response (Better Auth recommends the same).
 */

import { after } from 'next/server';
import { Resend } from 'resend';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('Email');

/** Verified in Resend on Nov 19, 2026. */
export const EMAIL_FROM = 'Virtual Bookshelf <hello@mail.virtualbookshelf.app>';

export interface EmailMessage {
  to: string;
  subject: string;
  /** Plain text. Always sent; some inboxes only show this part. */
  text: string;
  html?: string;
  replyTo?: string;
  /**
   * Resend keeps one email per key for 24 hours. Use one per attempt for
   * login links and resets, one per event for receipts and notifications.
   */
  idempotencyKey?: string;
}

export type SendResult =
  | { sent: true; id: string }
  | { sent: false; reason: 'no_api_key' | 'not_allowlisted' | 'send_failed' };

type EmailEnv = Record<string, string | undefined>;

/** The part of the Resend client this module uses, so tests can fake it. */
export interface EmailClient {
  emails: {
    send: (
      payload: {
        from: string;
        to: string;
        subject: string;
        text: string;
        html?: string;
        replyTo?: string;
      },
      options?: { idempotencyKey?: string }
    ) => Promise<{
      data: { id: string } | null;
      error: { message: string; statusCode: number | null; name: string } | null;
    }>;
  };
}

export function isProductionEnv(env: EmailEnv): boolean {
  return env.VERCEL_ENV === 'production';
}

/** Lowercased addresses from EMAIL_ALLOWLIST (comma-separated). */
export function getEmailAllowlist(env: EmailEnv): string[] {
  return (env.EMAIL_ALLOWLIST || '')
    .split(',')
    .map((address) => address.trim().toLowerCase())
    .filter(Boolean);
}

export function canSendTo(to: string, env: EmailEnv): boolean {
  if (isProductionEnv(env)) return true;
  return getEmailAllowlist(env).includes(to.trim().toLowerCase());
}

/** Network errors, rate limits and server errors are worth one more try. */
function isRetryable(statusCode: number | null): boolean {
  return statusCode === null || statusCode === 429 || statusCode >= 500;
}

const RETRY_DELAYS_MS = [500, 2000];

const defaultSleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Domain only, so logs never hold a full address. */
function maskAddress(address: string): string {
  const at = address.lastIndexOf('@');
  return at === -1 ? '(invalid)' : `*@${address.slice(at + 1)}`;
}

export async function sendEmail(
  message: EmailMessage,
  deps: { env?: EmailEnv; client?: EmailClient; sleep?: (ms: number) => Promise<void> } = {}
): Promise<SendResult> {
  const env = deps.env ?? process.env;
  const sleep = deps.sleep ?? defaultSleep;
  const recipient = maskAddress(message.to);

  if (!env.RESEND_API_KEY && !deps.client) {
    if (isProductionEnv(env)) {
      throw new Error('RESEND_API_KEY is not set. Email cannot be sent in production.');
    }
    logger.info('No RESEND_API_KEY, email not sent', { to: recipient, subject: message.subject });
    return { sent: false, reason: 'no_api_key' };
  }

  if (!canSendTo(message.to, env)) {
    logger.info('Recipient not on EMAIL_ALLOWLIST, email dropped', {
      to: recipient,
      subject: message.subject,
      vercelEnv: env.VERCEL_ENV ?? 'local',
    });
    return { sent: false, reason: 'not_allowlisted' };
  }

  const client = deps.client ?? (new Resend(env.RESEND_API_KEY) as unknown as EmailClient);
  const payload = {
    from: EMAIL_FROM,
    to: message.to,
    subject: message.subject,
    text: message.text,
    ...(message.html ? { html: message.html } : {}),
    ...(message.replyTo ? { replyTo: message.replyTo } : {}),
  };
  const options = message.idempotencyKey ? { idempotencyKey: message.idempotencyKey } : undefined;

  for (let attempt = 0; ; attempt++) {
    const { data, error } = await client.emails.send(payload, options);
    if (data && !error) {
      logger.info('Email sent', { id: data.id, to: recipient, subject: message.subject });
      return { sent: true, id: data.id };
    }

    const statusCode = error?.statusCode ?? null;
    if (attempt < RETRY_DELAYS_MS.length && isRetryable(statusCode)) {
      await sleep(RETRY_DELAYS_MS[attempt]);
      continue;
    }

    logger.error('Email failed', {
      to: recipient,
      subject: message.subject,
      statusCode,
      error: error?.name,
      message: error?.message,
    });
    return { sent: false, reason: 'send_failed' };
  }
}

/**
 * Send after the response has gone out. Errors are logged, never thrown into
 * the request.
 */
export function sendEmailInBackground(message: EmailMessage): void {
  after(async () => {
    try {
      await sendEmail(message);
    } catch (error) {
      logger.errorWithException('Background email failed', error, { subject: message.subject });
    }
  });
}
