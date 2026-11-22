import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ImportFlow, EXAMPLE_LIST } from './ImportFlow';
import { saveImportDraft, loadImportDraft, ImportDraftItem } from '@/lib/utils/importDraft';

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
    selected: true,
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({ status, json: () => Promise.resolve(body) } as unknown as Response);
}

function mockFetch({ authenticated = false }: { authenticated?: boolean } = {}) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url === '/api/auth/me') return jsonResponse({ authenticated });
    if (url === '/api/import/parse') {
      return jsonResponse({
        success: true,
        data: { items: [{ url: 'https://example.com/a', parsedTitle: 'Example article', order: 0 }] },
      });
    }
    if (url === '/api/import/resolve') {
      return jsonResponse({ success: true, data: { resolved: {} } });
    }
    if (url === '/api/import/metadata') {
      return jsonResponse({
        success: true,
        data: { results: [{ url: 'https://example.com/a', metadata: { title: 'Fetched title' } }] },
      });
    }
    if (url === '/api/import/create') {
      return jsonResponse({ success: true, data: { shelf: { id: 'shelf-1' } } });
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function callsTo(fetchMock: ReturnType<typeof mockFetch>, path: string) {
  return fetchMock.mock.calls.filter(([url]) => String(url) === path);
}

function renderComponent(props: { variant?: 'page' | 'embedded' } = {}) {
  return render(<ImportFlow {...props} />);
}

describe('ImportFlow', () => {
  beforeEach(() => {
    window.localStorage.clear();
    push.mockClear();
  });

  describe('Rendering', () => {
    it('embedded: starts at the paste box even when a preview is saved', async () => {
      saveImportDraft({ items: [createDraftItem()], shelfTitle: 'Old list', saveAfterAuth: false });
      const fetchMock = mockFetch({ authenticated: false });
      renderComponent({ variant: 'embedded' });

      await waitFor(() => expect(callsTo(fetchMock, '/api/auth/me')).toHaveLength(1));
      expect(screen.getByRole('button', { name: 'Preview my shelf' })).toBeInTheDocument();
      expect(screen.queryByLabelText('Shelf name')).not.toBeInTheDocument();
    });

    it('page: restores a saved preview', async () => {
      saveImportDraft({ items: [createDraftItem()], shelfTitle: 'Old list', saveAfterAuth: false });
      mockFetch({ authenticated: false });
      renderComponent({ variant: 'page' });

      expect(await screen.findByRole('heading', { name: 'Old list' })).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('embedded: previews a pasted list and hands off to /import for sign-up', async () => {
      mockFetch({ authenticated: false });
      renderComponent({ variant: 'embedded' });

      fireEvent.change(screen.getByLabelText('Paste text with links'), {
        target: { value: 'Example article\nhttps://example.com/a' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Preview my shelf' }));

      expect(await screen.findByRole('button', { name: 'View details for Fetched title' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Edit shelf' }));
      fireEvent.change(screen.getByLabelText('Shelf name'), { target: { value: 'My list' } });
      fireEvent.click(screen.getByRole('button', { name: 'Sign up to save this shelf' }));

      expect(push).toHaveBeenCalledWith('/signup?returnTo=%2Fimport');
      const draft = loadImportDraft();
      expect(draft?.saveAfterAuth).toBe(true);
      expect(draft?.shelfTitle).toBe('My list');
      expect(draft?.items[0].fetchedTitle).toBe('Fetched title');
    });
  });

  describe('Shelf name', () => {
    async function previewPastedText(value: string) {
      mockFetch({ authenticated: false });
      renderComponent();
      fireEvent.change(screen.getByLabelText('Paste text with links'), { target: { value } });
      fireEvent.click(screen.getByRole('button', { name: 'Preview my shelf' }));
      await screen.findByRole('button', { name: 'View details for Fetched title' });
    }

    it('starts with a name, so the shelf can be saved without typing', async () => {
      await previewPastedText('Example article\nhttps://example.com/a');

      expect(screen.getByRole('heading', { name: 'My shelf' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Sign up to save this shelf' }));

      expect(push).toHaveBeenCalledWith('/signup?returnTo=%2Fimport');
      expect(loadImportDraft()?.shelfTitle).toBe('My shelf');
    });

    it('still asks for a name when the visitor clears it', async () => {
      await previewPastedText('Example article\nhttps://example.com/a');

      fireEvent.click(screen.getByRole('button', { name: 'Edit shelf' }));
      fireEvent.change(screen.getByLabelText('Shelf name'), { target: { value: '' } });

      expect(screen.getByRole('button', { name: 'Sign up to save this shelf' })).toBeDisabled();
      expect(screen.getByText('Give your shelf a name to continue.')).toBeInTheDocument();
    });
  });

  describe('Shelf preview', () => {
    function savedPreview() {
      saveImportDraft({
        items: [
          createDraftItem({ fetchedTitle: 'First article' }),
          createDraftItem({ url: 'https://example.com/b', parsedTitle: 'Second article' }),
        ],
        shelfTitle: 'My list',
        saveAfterAuth: false,
      });
    }

    async function startEditing() {
      fireEvent.click(await screen.findByRole('button', { name: 'Edit shelf' }));
    }

    it('opens as a read-only shelf with an Edit button', async () => {
      savedPreview();
      mockFetch({ authenticated: false });
      renderComponent({ variant: 'page' });

      expect(await screen.findByRole('heading', { name: 'My list' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View details for First article' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Remove First article' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Edit First article' })).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Shelf name')).not.toBeInTheDocument();
      expect(screen.queryByText('Add a note')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign up to save this shelf' })).toBeEnabled();
    });

    it('opens an item window when an item is clicked, like a saved shelf', async () => {
      savedPreview();
      mockFetch({ authenticated: false });
      renderComponent({ variant: 'page' });

      fireEvent.click(await screen.findByRole('button', { name: 'View details for First article' }));

      expect(await screen.findByRole('dialog')).toHaveTextContent('First article');
    });

    it('switches to edit mode and back', async () => {
      savedPreview();
      mockFetch({ authenticated: false });
      renderComponent({ variant: 'page' });

      await startEditing();
      expect(screen.getByLabelText('Shelf name')).toHaveValue('My list');
      expect(screen.getByRole('button', { name: 'Remove First article' })).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText('Shelf name'), { target: { value: 'Renamed' } });
      fireEvent.click(screen.getByRole('button', { name: 'Done' }));

      expect(screen.getByRole('heading', { name: 'Renamed' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Remove First article' })).not.toBeInTheDocument();
    });

    it('loads the example list into the paste box', async () => {
      mockFetch();
      renderComponent({ variant: 'embedded' });

      fireEvent.click(screen.getByRole('button', { name: 'Try an example' }));

      expect(screen.getByLabelText('Paste text with links')).toHaveValue(EXAMPLE_LIST);
      expect(screen.getByRole('button', { name: 'Preview my shelf' })).toBeEnabled();
    });

    it('takes an item off the shelf, offers it back, and leaves it out of the save', async () => {
      savedPreview();
      const fetchMock = mockFetch({ authenticated: true });
      renderComponent({ variant: 'page' });

      await startEditing();
      fireEvent.click(screen.getByRole('button', { name: 'Remove Second article' }));

      expect(screen.getByText('Left off the shelf')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Put Second article back' })).toBeInTheDocument();
      expect(screen.getByText(/^1 item ·/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Save this shelf' }));
      await screen.findByText('Shelf created');

      const [, init] = callsTo(fetchMock, '/api/import/create')[0] as unknown as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.items).toHaveLength(1);
      expect(body.items[0].title).toBe('First article');
    });

    it('puts a removed item back', async () => {
      savedPreview();
      mockFetch({ authenticated: false });
      renderComponent({ variant: 'page' });

      await startEditing();
      fireEvent.click(screen.getByRole('button', { name: 'Remove Second article' }));
      fireEvent.click(screen.getByRole('button', { name: 'Put Second article back' }));

      expect(screen.queryByText('Left off the shelf')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove Second article' })).toBeInTheDocument();
    });

    it('saves an edited title and note with the shelf and keeps them in the saved preview', async () => {
      savedPreview();
      const fetchMock = mockFetch({ authenticated: true });
      renderComponent({ variant: 'page' });

      await startEditing();
      fireEvent.click(screen.getByRole('button', { name: 'Edit First article' }));
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'My own title' } });
      fireEvent.change(screen.getByLabelText("Why it's on your shelf"), {
        target: { value: 'Changed how I work.' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByRole('button', { name: 'Edit My own title' })).toBeInTheDocument();
      expect(screen.getByText('Changed how I work.')).toBeInTheDocument();
      await waitFor(() => expect(loadImportDraft()?.items[0].customTitle).toBe('My own title'));

      fireEvent.click(screen.getByRole('button', { name: 'Save this shelf' }));
      await screen.findByText('Shelf created');

      const [, init] = callsTo(fetchMock, '/api/import/create')[0] as unknown as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.items[0].title).toBe('My own title');
      expect(body.items[0].notes).toBe('Changed how I work.');
    });

    it('asks for an item when everything has been taken off the shelf', async () => {
      saveImportDraft({ items: [createDraftItem()], shelfTitle: 'My list', saveAfterAuth: false });
      mockFetch({ authenticated: false });
      renderComponent({ variant: 'page' });

      await startEditing();
      fireEvent.click(screen.getByRole('button', { name: 'Remove Example article' }));

      expect(screen.getByText('Your shelf is empty.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign up to save this shelf' })).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('embedded: never saves a pending preview on load, even when signed in', async () => {
      saveImportDraft({ items: [createDraftItem()], shelfTitle: 'Pending', saveAfterAuth: true });
      const fetchMock = mockFetch({ authenticated: true });
      renderComponent({ variant: 'embedded' });

      await waitFor(() => expect(callsTo(fetchMock, '/api/auth/me')).toHaveLength(1));
      expect(callsTo(fetchMock, '/api/import/create')).toHaveLength(0);
      // The pending preview is left for /import (or the dashboard redirect) to finish
      expect(loadImportDraft()?.saveAfterAuth).toBe(true);
    });

    it('shows an error when the text has no links', async () => {
      const fetchMock = mockFetch();
      fetchMock.mockImplementation((input: RequestInfo | URL) => {
        const url = String(input);
        if (url === '/api/auth/me') return jsonResponse({ authenticated: false });
        return jsonResponse({ success: true, data: { items: [] } });
      });
      renderComponent({ variant: 'embedded' });

      fireEvent.change(screen.getByLabelText('Paste text with links'), {
        target: { value: 'Dune by Frank Herbert' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Preview my shelf' }));

      expect(await screen.findByText(/couldn't find any links/)).toBeInTheDocument();
    });
  });
});
