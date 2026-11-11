import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPublicUrl, isPublicHttpUrl, UnsafeUrlError } from './safeFetch';

describe('isPublicHttpUrl', () => {
  it.each([
    ['https://example.com/cover.jpg'],
    ['http://books.google.com/books/content?id=abc'],
    ['https://i.scdn.co/image/ab67616d'],
    ['https://8.8.8.8/'],
    ['https://[2606:4700:4700::1111]/'],
  ])('accepts %s', (url) => {
    expect(isPublicHttpUrl(url)).toBe(true);
  });

  it.each([
    ['loopback', 'http://127.0.0.1/'],
    ['loopback name', 'http://localhost:3000/'],
    ['subdomain of localhost', 'http://app.localhost/'],
    ['private 10/8', 'http://10.0.0.5/'],
    ['private 172.16/12', 'http://172.20.1.1/'],
    ['private 192.168/16', 'http://192.168.1.1/'],
    ['cloud metadata address', 'http://169.254.169.254/latest/meta-data/'],
    ['carrier-grade NAT', 'http://100.64.0.1/'],
    ['zero address', 'http://0.0.0.0/'],
    ['decimal spelling of loopback', 'http://2130706433/'],
    ['hex spelling of loopback', 'http://0x7f000001/'],
    ['IPv6 loopback', 'http://[::1]/'],
    ['IPv6 unique local', 'http://[fd00::1]/'],
    ['IPv6 link-local', 'http://[fe80::1]/'],
    ['IPv4-mapped loopback', 'http://[::ffff:127.0.0.1]/'],
    ['internal name', 'http://db.internal/'],
    ['mDNS name', 'http://printer.local/'],
    ['single-label host', 'http://intranet/'],
    ['credentials in the URL', 'https://user:pass@example.com/'],
    ['file scheme', 'file:///etc/passwd'],
    ['javascript scheme', 'javascript:alert(1)'],
    ['not a URL', 'nope'],
  ])('rejects %s', (_name, url) => {
    expect(isPublicHttpUrl(url)).toBe(false);
  });
});

describe('fetchPublicUrl', () => {
  const originalFetch = global.fetch;
  const fetchMock = vi.fn();

  const ok = (url = '') => ({ status: 200, url, headers: new Headers() }) as unknown as Response;
  const redirect = (location: string) =>
    ({ status: 302, url: '', headers: new Headers({ location }) }) as unknown as Response;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches a public URL without letting the runtime follow redirects', async () => {
    fetchMock.mockResolvedValueOnce(ok());

    const { finalUrl } = await fetchPublicUrl('https://example.com/a');

    expect(finalUrl).toBe('https://example.com/a');
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/a', expect.objectContaining({ redirect: 'manual' }));
  });

  it('follows redirects itself and reports where it ended up', async () => {
    fetchMock.mockResolvedValueOnce(redirect('/b')).mockResolvedValueOnce(ok());

    const { finalUrl } = await fetchPublicUrl('https://example.com/a');

    expect(finalUrl).toBe('https://example.com/b');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('refuses a non-public URL without making a request', async () => {
    await expect(fetchPublicUrl('http://169.254.169.254/')).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a redirect that leads to a non-public address', async () => {
    fetchMock.mockResolvedValueOnce(redirect('http://127.0.0.1:8080/admin'));

    await expect(fetchPublicUrl('https://example.com/a')).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('gives up after too many redirects', async () => {
    fetchMock.mockResolvedValue(redirect('https://example.com/loop'));

    await expect(fetchPublicUrl('https://example.com/a')).rejects.toThrow('Too many redirects');
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});
