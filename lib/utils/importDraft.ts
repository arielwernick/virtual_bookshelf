/**
 * Import draft storage
 *
 * Keeps a pasted-list preview in the visitor's browser so it survives the
 * trip through sign-up or sign-in. Nothing is sent to the server until the
 * visitor has an account and the shelf is created.
 */

export interface ImportDraftItem {
  url: string;
  resolvedUrl?: string;
  parsedTitle?: string;
  parsedDescription?: string;
  fetchedTitle?: string;
  fetchedImage?: string;
  fetchedPublisher?: string;
  selected: boolean;
}

export interface ImportDraft {
  items: ImportDraftItem[];
  shelfTitle: string;
  /** True once the visitor chose "sign up to save": create the shelf when they return signed in. */
  saveAfterAuth: boolean;
  savedAt: number;
}

export const IMPORT_DRAFT_KEY = 'vb:import-draft';
export const IMPORT_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_DRAFT_ITEMS = 50;

function getStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    // Storage can throw in private windows or when site data is blocked
    return null;
  }
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function toDraftItem(value: unknown): ImportDraftItem | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.url !== 'string' || !/^https?:\/\//i.test(raw.url)) return null;

  return {
    url: raw.url,
    resolvedUrl: optionalString(raw.resolvedUrl),
    parsedTitle: optionalString(raw.parsedTitle),
    parsedDescription: optionalString(raw.parsedDescription),
    fetchedTitle: optionalString(raw.fetchedTitle),
    fetchedImage: optionalString(raw.fetchedImage),
    fetchedPublisher: optionalString(raw.fetchedPublisher),
    selected: raw.selected !== false,
  };
}

/**
 * Save the current preview. Returns false when the browser refuses storage.
 */
export function saveImportDraft(
  draft: Pick<ImportDraft, 'items' | 'shelfTitle' | 'saveAfterAuth'>
): boolean {
  const storage = getStorage();
  if (!storage) return false;

  const items = draft.items
    .map(toDraftItem)
    .filter((item): item is ImportDraftItem => item !== null)
    .slice(0, MAX_DRAFT_ITEMS);

  try {
    storage.setItem(
      IMPORT_DRAFT_KEY,
      JSON.stringify({
        items,
        shelfTitle: draft.shelfTitle,
        saveAfterAuth: draft.saveAfterAuth,
        savedAt: Date.now(),
      } satisfies ImportDraft)
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Load the saved preview, or null when there is none, it is malformed, or it
 * is older than a day. Stale and malformed drafts are removed.
 */
export function loadImportDraft(): ImportDraft | null {
  const storage = getStorage();
  if (!storage) return null;

  let raw: string | null;
  try {
    raw = storage.getItem(IMPORT_DRAFT_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const savedAt = typeof parsed.savedAt === 'number' ? parsed.savedAt : 0;
    const items = Array.isArray(parsed.items)
      ? parsed.items
          .map(toDraftItem)
          .filter((item): item is ImportDraftItem => item !== null)
          .slice(0, MAX_DRAFT_ITEMS)
      : [];

    const expired = Date.now() - savedAt > IMPORT_DRAFT_MAX_AGE_MS;
    if (expired || items.length === 0) {
      clearImportDraft();
      return null;
    }

    return {
      items,
      shelfTitle: typeof parsed.shelfTitle === 'string' ? parsed.shelfTitle : '',
      saveAfterAuth: parsed.saveAfterAuth === true,
      savedAt,
    };
  } catch {
    clearImportDraft();
    return null;
  }
}

export function clearImportDraft(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(IMPORT_DRAFT_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable
  }
}

/**
 * True when a visitor asked to save a preview and has not finished yet.
 */
export function hasPendingImportDraft(): boolean {
  return loadImportDraft()?.saveAfterAuth === true;
}
