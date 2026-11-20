// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const afterCallbacks: Array<() => Promise<void>> = [];
vi.mock('next/server', () => ({
  after: (callback: () => Promise<void>) => {
    afterCallbacks.push(callback);
  },
}));

const { resendSend } = vi.hoisted(() => ({ resendSend: vi.fn() }));
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: resendSend } };
  }),
}));

import {
  EMAIL_FROM,
  canSendTo,
  getEmailAllowlist,
  sendEmail,
  sendEmailInBackground,
  type EmailClient,
  type EmailMessage,
} from './send';

const createMessage = (overrides: Partial<EmailMessage> = {}): EmailMessage => ({
  to: 'tester@example.com',
  subject: 'Hello',
  text: 'Body',
  ...overrides,
});

type SendResponse = Awaited<ReturnType<EmailClient['emails']['send']>>;

const ok = (id = 'email-1'): SendResponse => ({ data: { id }, error: null });
const fail = (statusCode: number | null, name = 'application_error'): SendResponse => ({
  data: null,
  error: { statusCode, name, message: 'nope' },
});

function createClient(...responses: SendResponse[]) {
  const send = vi.fn();
  for (const response of responses) send.mockResolvedValueOnce(response);
  return { client: { emails: { send } } as EmailClient, send };
}

const noSleep = async () => {};

const PREVIEW = { VERCEL_ENV: 'preview', RESEND_API_KEY: 're_test', EMAIL_ALLOWLIST: 'tester@example.com' };
const PRODUCTION = { VERCEL_ENV: 'production', RESEND_API_KEY: 're_test' };

describe('sendEmail', () => {
  beforeEach(() => {
    afterCallbacks.length = 0;
    resendSend.mockReset();
  });

  describe('Production', () => {
    it('sends to any address from the verified domain', async () => {
      const { client, send } = createClient(ok('abc'));
      const result = await sendEmail(createMessage({ to: 'anyone@else.com' }), {
        env: PRODUCTION,
        client,
      });

      expect(result).toEqual({ sent: true, id: 'abc' });
      expect(send).toHaveBeenCalledWith(
        { from: EMAIL_FROM, to: 'anyone@else.com', subject: 'Hello', text: 'Body' },
        undefined
      );
    });

    it('fails loudly without an API key', async () => {
      await expect(
        sendEmail(createMessage(), { env: { VERCEL_ENV: 'production' } })
      ).rejects.toThrow('RESEND_API_KEY');
    });

    it('passes html, reply-to and the idempotency key through', async () => {
      const { client, send } = createClient(ok());
      await sendEmail(
        createMessage({ html: '<p>Body</p>', replyTo: 'help@example.com', idempotencyKey: 'reset/1' }),
        { env: PRODUCTION, client }
      );
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({ html: '<p>Body</p>', replyTo: 'help@example.com' }),
        { idempotencyKey: 'reset/1' }
      );
    });
  });

  describe('Previews and local', () => {
    it('sends to an allowlisted address', async () => {
      const { client, send } = createClient(ok());
      const result = await sendEmail(createMessage({ to: 'Tester@Example.com ' }), {
        env: PREVIEW,
        client,
      });
      expect(result.sent).toBe(true);
      expect(send).toHaveBeenCalledOnce();
    });

    it('drops every other address without calling Resend', async () => {
      const { client, send } = createClient(ok());
      const result = await sendEmail(createMessage({ to: 'real.user@gmail.com' }), {
        env: PREVIEW,
        client,
      });
      expect(result).toEqual({ sent: false, reason: 'not_allowlisted' });
      expect(send).not.toHaveBeenCalled();
    });

    it('treats local dev (no VERCEL_ENV) like a preview', async () => {
      const { client, send } = createClient(ok());
      const result = await sendEmail(createMessage({ to: 'real.user@gmail.com' }), {
        env: { RESEND_API_KEY: 're_test' },
        client,
      });
      expect(result.sent).toBe(false);
      expect(send).not.toHaveBeenCalled();
    });

    it('quietly does nothing without an API key', async () => {
      const result = await sendEmail(createMessage(), { env: { EMAIL_ALLOWLIST: 'tester@example.com' } });
      expect(result).toEqual({ sent: false, reason: 'no_api_key' });
    });
  });

  describe('Retries', () => {
    it('retries rate limits and server errors, then succeeds', async () => {
      const { client, send } = createClient(fail(429), fail(503), ok('third'));
      const result = await sendEmail(createMessage(), { env: PRODUCTION, client, sleep: noSleep });
      expect(result).toEqual({ sent: true, id: 'third' });
      expect(send).toHaveBeenCalledTimes(3);
    });

    it('gives up after three attempts', async () => {
      const { client, send } = createClient(fail(500), fail(500), fail(500));
      const result = await sendEmail(createMessage(), { env: PRODUCTION, client, sleep: noSleep });
      expect(result).toEqual({ sent: false, reason: 'send_failed' });
      expect(send).toHaveBeenCalledTimes(3);
    });

    it('does not retry other client errors', async () => {
      const { client, send } = createClient(fail(422, 'validation_error'));
      const result = await sendEmail(createMessage(), { env: PRODUCTION, client, sleep: noSleep });
      expect(result).toEqual({ sent: false, reason: 'send_failed' });
      expect(send).toHaveBeenCalledOnce();
    });
  });

  describe('Real Resend client', () => {
    it('builds a Resend client from RESEND_API_KEY', async () => {
      resendSend.mockResolvedValueOnce(ok('from-sdk'));
      const result = await sendEmail(createMessage(), { env: PRODUCTION });
      expect(result).toEqual({ sent: true, id: 'from-sdk' });
    });
  });
});

describe('sendEmailInBackground', () => {
  beforeEach(() => {
    afterCallbacks.length = 0;
    resendSend.mockReset();
  });

  it('defers the send until after the response', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', 're_test');
    resendSend.mockResolvedValueOnce(ok());

    sendEmailInBackground(createMessage());
    expect(resendSend).not.toHaveBeenCalled();

    await afterCallbacks[0]();
    expect(resendSend).toHaveBeenCalledOnce();
    vi.unstubAllEnvs();
  });

  it('never throws into the request, even in production without a key', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', '');

    sendEmailInBackground(createMessage());
    await expect(afterCallbacks[0]()).resolves.toBeUndefined();
    vi.unstubAllEnvs();
  });
});

describe('allowlist helpers', () => {
  it('parses a comma-separated, case-insensitive list', () => {
    expect(getEmailAllowlist({ EMAIL_ALLOWLIST: ' A@x.com, b@y.com ,,' })).toEqual([
      'a@x.com',
      'b@y.com',
    ]);
  });

  it('allows everyone only in production', () => {
    expect(canSendTo('a@x.com', { VERCEL_ENV: 'production' })).toBe(true);
    expect(canSendTo('a@x.com', { VERCEL_ENV: 'preview' })).toBe(false);
    expect(canSendTo('a@x.com', {})).toBe(false);
  });
});
