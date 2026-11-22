import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ImportPage from './page';
import {
  saveImportDraft,
  loadImportDraft,
  ImportDraftItem,
} from '@/lib/utils/importDraft';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img src={props.src as string} alt={props.alt as string} />,
}));

function createDraftItem(overrides: Partial<ImportDraftItem> = {}): ImportDraftItem {
  return {
    url: 'https://example.com/a',
    parsedTitle: 'Example article',
    fetchedTitle: 'Example article',
    selected: true,
    ...overrides,
  };
}

interface FetchOptions {
  authenticated?: boolean;
  createStatus?: number;
}

function mockFetch({ authenticated = false, createStatus = 200 }: FetchOptions = {}) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url === '/api/auth/me') {
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve({ authenticated }),
      } as unknown as Response);
    }
    if (url === '/api/import/create') {
      const ok = createStatus === 200;
      return Promise.resolve({
        status: createStatus,
        json: () =>
          Promise.resolve(
            ok
              ? { success: true, data: { shelf: { id: 'shelf-1' } } }
              : { success: false, error: 'Unauthorized - please log in first' }
          ),
      } as unknown as Response);
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function createCalls(fetchMock: ReturnType<typeof mockFetch>) {
  return fetchMock.mock.calls.filter(([url]) => String(url) === '/api/import/create');
}

function renderComponent() {
  return render(<ImportPage />);
}

describe('ImportPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    push.mockClear();
  });

  describe('Rendering', () => {
    it('labels the first step as a preview', async () => {
      mockFetch();
      renderComponent();

      expect(screen.getByRole('button', { name: 'Preview my shelf' })).toBeInTheDocument();
      await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/auth/me'));
    });

    it('offers sign-up instead of create to a signed-out visitor with a preview', async () => {
      saveImportDraft({ items: [createDraftItem()], shelfTitle: 'My list', saveAfterAuth: false });
      mockFetch({ authenticated: false });
      renderComponent();

      expect(await screen.findByRole('button', { name: 'Sign up to save this shelf' })).toBeEnabled();
      expect(screen.queryByRole('button', { name: 'Save this shelf' })).not.toBeInTheDocument();
    });

    it('restores a preview for a signed-in visitor without saving it for them', async () => {
      saveImportDraft({ items: [createDraftItem()], shelfTitle: 'My list', saveAfterAuth: false });
      const fetchMock = mockFetch({ authenticated: true });
      renderComponent();

      expect(await screen.findByRole('button', { name: 'Save this shelf' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'My list' })).toBeInTheDocument();
      expect(createCalls(fetchMock)).toHaveLength(0);
    });
  });

  describe('Interactions', () => {
    it('keeps the preview and sends the visitor to sign-up with a way back', async () => {
      saveImportDraft({ items: [createDraftItem()], shelfTitle: 'My list', saveAfterAuth: false });
      mockFetch({ authenticated: false });
      renderComponent();

      fireEvent.click(await screen.findByRole('button', { name: 'Sign up to save this shelf' }));

      expect(push).toHaveBeenCalledWith('/signup?returnTo=%2Fimport');
      expect(loadImportDraft()?.saveAfterAuth).toBe(true);
    });

    it('sends an existing user to sign-in the same way', async () => {
      saveImportDraft({ items: [createDraftItem()], shelfTitle: 'My list', saveAfterAuth: false });
      mockFetch({ authenticated: false });
      renderComponent();

      fireEvent.click(await screen.findByRole('button', { name: 'Already have an account? Sign in' }));

      expect(push).toHaveBeenCalledWith('/login?returnTo=%2Fimport');
      expect(loadImportDraft()?.saveAfterAuth).toBe(true);
    });

    it('creates the shelf once the visitor returns signed in', async () => {
      saveImportDraft({
        items: [createDraftItem(), createDraftItem({ url: 'https://example.com/b', selected: false })],
        shelfTitle: 'My list',
        saveAfterAuth: true,
      });
      const fetchMock = mockFetch({ authenticated: true });
      renderComponent();

      expect(await screen.findByText('Shelf created')).toBeInTheDocument();

      const calls = createCalls(fetchMock);
      expect(calls).toHaveLength(1);
      const body = JSON.parse((calls[0] as unknown as [string, RequestInit])[1].body as string);
      expect(body.title).toBe('My list');
      expect(body.items).toHaveLength(1);
      expect(body.items[0].url).toBe('https://example.com/a');
      expect(loadImportDraft()).toBeNull();
    });

    it('clears the saved preview when starting over', async () => {
      saveImportDraft({ items: [createDraftItem()], shelfTitle: 'My list', saveAfterAuth: false });
      mockFetch({ authenticated: false });
      renderComponent();

      fireEvent.click(await screen.findByRole('button', { name: /Start over/ }));

      expect(loadImportDraft()).toBeNull();
      expect(screen.getByRole('button', { name: 'Preview my shelf' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('does not save for a visitor who came back still signed out', async () => {
      saveImportDraft({ items: [createDraftItem()], shelfTitle: 'My list', saveAfterAuth: true });
      const fetchMock = mockFetch({ authenticated: false });
      renderComponent();

      expect(await screen.findByRole('button', { name: 'Sign up to save this shelf' })).toBeInTheDocument();
      expect(createCalls(fetchMock)).toHaveLength(0);
    });

    it('shows the sign-up step when the session has ended at save time', async () => {
      saveImportDraft({ items: [createDraftItem()], shelfTitle: 'My list', saveAfterAuth: false });
      mockFetch({ authenticated: true, createStatus: 401 });
      renderComponent();

      fireEvent.click(await screen.findByRole('button', { name: 'Save this shelf' }));

      expect(await screen.findByRole('button', { name: 'Sign up to save this shelf' })).toBeInTheDocument();
      expect(screen.getByText(/Your preview is kept on this device/)).toBeInTheDocument();
      expect(loadImportDraft()?.items).toHaveLength(1);
    });

    it('asks for a title before the sign-up step is available', async () => {
      saveImportDraft({ items: [createDraftItem()], shelfTitle: '', saveAfterAuth: false });
      mockFetch({ authenticated: false });
      renderComponent();

      expect(await screen.findByRole('button', { name: 'Sign up to save this shelf' })).toBeDisabled();
      expect(screen.getByText('Give your shelf a name to continue.')).toBeInTheDocument();
    });
  });
});
