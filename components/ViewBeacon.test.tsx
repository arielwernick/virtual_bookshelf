import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { ViewBeacon } from './ViewBeacon';
import type { ViewSurface } from '@/lib/types/shelf';

const sendBeacon = vi.fn(() => true);

function renderComponent(props: Partial<{ shareToken: string; surface: ViewSurface }> = {}) {
  return render(<ViewBeacon shareToken="tok12345" surface="shelf" {...props} />);
}

async function lastPayload(): Promise<Record<string, string>> {
  const calls = sendBeacon.mock.calls as unknown as [string, Blob][];
  const [url, blob] = calls[calls.length - 1];
  expect(url).toBe('/api/views');
  // jsdom's Blob has no .text(), so read it the old-fashioned way
  const text = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(blob);
  });
  return JSON.parse(text);
}

function setReferrer(value: string) {
  Object.defineProperty(document, 'referrer', { value, configurable: true });
}

describe('ViewBeacon', () => {
  beforeEach(() => {
    sendBeacon.mockClear();
    Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true });
    sessionStorage.clear();
    setReferrer('');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing', () => {
      const { container } = renderComponent();
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Interactions', () => {
    it('sends one shelf view on mount without a referrer', async () => {
      setReferrer('https://blog.example.com/post');
      renderComponent();

      expect(sendBeacon).toHaveBeenCalledTimes(1);
      expect(await lastPayload()).toEqual({ shareToken: 'tok12345', surface: 'shelf' });
    });

    it('sends only the host of the embedding page for embeds', async () => {
      setReferrer('https://blog.example.com/2026/my-reading-list?utm_source=x#top');
      renderComponent({ surface: 'embed' });

      expect(await lastPayload()).toEqual({
        shareToken: 'tok12345',
        surface: 'embed',
        embedHost: 'blog.example.com',
      });
    });

    it('sends an empty host when an embed has no referrer', async () => {
      renderComponent({ surface: 'embed' });

      expect((await lastPayload()).embedHost).toBe('');
    });

    it('does not count again after a refresh in the same tab', () => {
      const first = renderComponent();
      first.unmount();
      renderComponent();

      expect(sendBeacon).toHaveBeenCalledTimes(1);
    });

    it('counts the shelf page and its embed separately', () => {
      renderComponent({ surface: 'shelf' });
      renderComponent({ surface: 'embed' });

      expect(sendBeacon).toHaveBeenCalledTimes(2);
    });

    it('does not fire twice when re-rendered', () => {
      const { rerender } = renderComponent();
      rerender(<ViewBeacon shareToken="tok12345" surface="shelf" />);

      expect(sendBeacon).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('still counts when sessionStorage is blocked', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      renderComponent();

      expect(sendBeacon).toHaveBeenCalledTimes(1);
    });

    it('does nothing when sendBeacon is unavailable', () => {
      Object.defineProperty(navigator, 'sendBeacon', { value: undefined, configurable: true });

      expect(() => renderComponent()).not.toThrow();
    });

    it('does nothing without a share token', () => {
      renderComponent({ shareToken: '' });

      expect(sendBeacon).not.toHaveBeenCalled();
    });
  });
});
