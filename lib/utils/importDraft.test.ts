import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveImportDraft,
  loadImportDraft,
  clearImportDraft,
  hasPendingImportDraft,
  IMPORT_DRAFT_KEY,
  IMPORT_DRAFT_MAX_AGE_MS,
  ImportDraftItem,
} from './importDraft';

function createDraftItem(overrides: Partial<ImportDraftItem> = {}): ImportDraftItem {
  return {
    url: 'https://example.com/a',
    parsedTitle: 'Example',
    selected: true,
    ...overrides,
  };
}

describe('importDraft', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('save and load', () => {
    it('round-trips items, title and the save flag', () => {
      const items = [
        createDraftItem({ fetchedTitle: 'Fetched', fetchedImage: 'https://img.example.com/a.jpg' }),
        createDraftItem({ url: 'https://example.com/b', selected: false }),
      ];

      expect(saveImportDraft({ items, shelfTitle: 'My list', saveAfterAuth: true })).toBe(true);

      const draft = loadImportDraft();
      expect(draft?.shelfTitle).toBe('My list');
      expect(draft?.saveAfterAuth).toBe(true);
      expect(draft?.items).toHaveLength(2);
      expect(draft?.items[0].fetchedTitle).toBe('Fetched');
      expect(draft?.items[1].selected).toBe(false);
    });

    it('drops fields that are not part of a draft item', () => {
      const item = { ...createDraftItem(), loading: true, error: 'Preview unavailable' };
      saveImportDraft({ items: [item], shelfTitle: '', saveAfterAuth: false });

      const stored = JSON.parse(window.localStorage.getItem(IMPORT_DRAFT_KEY) as string);
      expect(stored.items[0]).not.toHaveProperty('loading');
      expect(stored.items[0]).not.toHaveProperty('error');
    });

    it('returns null when nothing is saved', () => {
      expect(loadImportDraft()).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('discards a draft older than a day', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-16T12:00:00Z'));
      saveImportDraft({ items: [createDraftItem()], shelfTitle: 'Old', saveAfterAuth: true });

      vi.setSystemTime(Date.now() + IMPORT_DRAFT_MAX_AGE_MS + 1000);

      expect(loadImportDraft()).toBeNull();
      expect(window.localStorage.getItem(IMPORT_DRAFT_KEY)).toBeNull();
    });

    it('discards malformed JSON', () => {
      window.localStorage.setItem(IMPORT_DRAFT_KEY, '{not json');
      expect(loadImportDraft()).toBeNull();
      expect(window.localStorage.getItem(IMPORT_DRAFT_KEY)).toBeNull();
    });

    it('ignores items without an http(s) url', () => {
      window.localStorage.setItem(
        IMPORT_DRAFT_KEY,
        JSON.stringify({
          items: [{ url: 'javascript:alert(1)', selected: true }, createDraftItem(), null, 'x'],
          shelfTitle: 'Mixed',
          saveAfterAuth: false,
          savedAt: Date.now(),
        })
      );

      const draft = loadImportDraft();
      expect(draft?.items).toHaveLength(1);
      expect(draft?.items[0].url).toBe('https://example.com/a');
    });

    it('treats a draft with no usable items as empty', () => {
      window.localStorage.setItem(
        IMPORT_DRAFT_KEY,
        JSON.stringify({ items: [], shelfTitle: 'Empty', saveAfterAuth: true, savedAt: Date.now() })
      );
      expect(loadImportDraft()).toBeNull();
    });

    it('returns false instead of throwing when storage is full', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(saveImportDraft({ items: [createDraftItem()], shelfTitle: '', saveAfterAuth: true })).toBe(false);
    });
  });

  describe('clear and pending', () => {
    it('clearImportDraft removes the draft', () => {
      saveImportDraft({ items: [createDraftItem()], shelfTitle: 'x', saveAfterAuth: true });
      clearImportDraft();
      expect(loadImportDraft()).toBeNull();
    });

    it('hasPendingImportDraft is true only when the visitor asked to save', () => {
      expect(hasPendingImportDraft()).toBe(false);

      saveImportDraft({ items: [createDraftItem()], shelfTitle: 'x', saveAfterAuth: false });
      expect(hasPendingImportDraft()).toBe(false);

      saveImportDraft({ items: [createDraftItem()], shelfTitle: 'x', saveAfterAuth: true });
      expect(hasPendingImportDraft()).toBe(true);
    });
  });
});
