import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { coverRequestUrl, fetchAsDataUrl, optimizedCoverUrl, MAX_IMAGE_BYTES } from './imageLoader';

describe('coverRequestUrl', () => {
  it.each([
    ['https://books.google.com/books/content?id=abc&printsec=frontcover&img=1', 'https://books.google.com/books/content?id=abc&printsec=frontcover&img=1'],
    ['http://books.google.com/books/content?id=abc', 'https://books.google.com/books/content?id=abc'],
    ['https://i.scdn.co/image/ab67616d0000b273', 'https://i.scdn.co/image/ab67616d0000b273'],
    ['https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'],
    ['https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg', 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'],
    ['https://is3-ssl.mzstatic.com/image/thumb/a.jpg', 'https://is3-ssl.mzstatic.com/image/thumb/a.jpg'],
    ['https://financialmodelingprep.com/image-stock/AAPL.png', 'https://financialmodelingprep.com/image-stock/AAPL.png'],
  ])('rebuilds %s on its fixed host', (input, expected) => {
    expect(coverRequestUrl(input)).toBe(expected);
  });

  it('never keeps a port, credentials or anything before the path', () => {
    expect(coverRequestUrl('https://user:pass@i.scdn.co:8443//image/x')).toBe('https://i.scdn.co/image/x');
  });

  it.each([
    ['https://example.com/og.png'],
    ['https://i.scdn.co.evil.example/image/x'],
    ['http://169.254.169.254/latest/meta-data/'],
    ['http://localhost:3000/a.png'],
    ['data:image/png;base64,AAAA'],
    ['not a url'],
  ])('refuses %s', (input) => {
    expect(coverRequestUrl(input)).toBeNull();
  });
});

describe('fetchAsDataUrl', () => {
  const originalFetch = global.fetch;
  const fetchMock = vi.fn();

  const image = (bytes = 4) =>
    ({
      status: 200,
      ok: true,
      headers: new Headers({ 'content-type': 'image/png', 'content-length': String(bytes) }),
      arrayBuffer: async () => new Uint8Array(bytes).buffer,
    }) as unknown as Response;
  const redirect = (location: string) =>
    ({ status: 302, ok: false, headers: new Headers({ location }) }) as unknown as Response;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('loads a cover from a known image host as a data URL', async () => {
    fetchMock.mockResolvedValueOnce(image());

    const result = await fetchAsDataUrl('https://i.scdn.co/image/abc');

    expect(result).toMatch(/^data:image\/png;base64,/);
    expect(fetchMock).toHaveBeenCalledWith('https://i.scdn.co/image/abc', expect.objectContaining({ redirect: 'manual' }));
  });

  it('loads a cover from any other site through the site\'s own image optimizer', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://virtualbookshelf.app');
    fetchMock.mockResolvedValueOnce(image());

    const result = await fetchAsDataUrl('https://example.com/og.png?v=1');

    expect(result).toMatch(/^data:image\/png;base64,/);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://virtualbookshelf.app/_next/image?url=https%3A%2F%2Fexample.com%2Fog.png%3Fv%3D1&w=256&q=75'
    );
    vi.unstubAllEnvs();
  });

  it('never follows a redirect from the optimizer', async () => {
    fetchMock.mockResolvedValueOnce(redirect('https://example.com/elsewhere.png'));

    expect(await fetchAsDataUrl('https://example.com/og.png')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('makes no request for a cover that is not an https URL on another site', async () => {
    expect(await fetchAsDataUrl('http://169.254.169.254/')).toBeNull();
    expect(await fetchAsDataUrl('data:image/png;base64,AAAA')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks for a format the share-card renderer can draw', async () => {
    fetchMock.mockResolvedValueOnce(image());
    await fetchAsDataUrl('https://example.com/og.png');

    const accept = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(accept.Accept).not.toMatch(/webp|avif|\*/);
  });

  it('follows a redirect only to another known image host', async () => {
    fetchMock.mockResolvedValueOnce(redirect('https://books.googleusercontent.com/c/abc')).mockResolvedValueOnce(image());
    expect(await fetchAsDataUrl('https://books.google.com/books/content?id=abc')).toMatch(/^data:image/);

    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(redirect('http://127.0.0.1/secret'));
    expect(await fetchAsDataUrl('https://books.google.com/books/content?id=abc')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refuses an image larger than the cap', async () => {
    fetchMock.mockResolvedValueOnce(image(MAX_IMAGE_BYTES + 1));
    expect(await fetchAsDataUrl('https://i.scdn.co/image/huge')).toBeNull();
  });

  it('refuses a response that is not an image', async () => {
    fetchMock.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
      arrayBuffer: async () => new ArrayBuffer(4),
    } as unknown as Response);
    expect(await fetchAsDataUrl('https://i.scdn.co/image/abc')).toBeNull();
  });
});

describe('optimizedCoverUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the public domain in production, whatever the request said', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('VERCEL_URL', 'some-deployment.vercel.app');
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://virtualbookshelf.app/');

    expect(optimizedCoverUrl('https://example.com/a.png')).toMatch(/^https:\/\/virtualbookshelf\.app\/_next\/image\?url=/);
  });

  it('uses the deployment address on a preview', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('VERCEL_URL', 'preview-abc.vercel.app');

    expect(optimizedCoverUrl('https://example.com/a.png')).toMatch(/^https:\/\/preview-abc\.vercel\.app\/_next\/image\?url=/);
  });

  it('only accepts https covers, as next.config requires', () => {
    expect(optimizedCoverUrl('http://example.com/a.png')).toBeNull();
    expect(optimizedCoverUrl('not a url')).toBeNull();
  });
});
