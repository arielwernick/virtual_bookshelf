// @vitest-environment node
/**
 * Database-backed tests: the real queries, the real migrations, a real
 * Postgres engine (PGlite) inside the test process. See
 * test/utils/pgliteClient.ts for what this does and does not prove.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('./client', () => import('@/test/utils/pgliteClient'));

import {
  getTestDatabase,
  migrationFiles,
  readMigration,
  resetTestDatabase,
} from '@/test/utils/pgliteClient';
import {
  createUser,
  createShelf,
  updateShelf,
  createItem,
  updateItem,
  getItemsByShelfId,
  getItemsForUserShelves,
  updateItemOrder,
  getShelvesForDashboard,
  getShelfViewsForOwner,
  getPublicShelves,
  recordShelfView,
} from './queries';

let counter = 0;

async function createTestUser() {
  counter += 1;
  return createUser({
    username: `user${counter}`,
    email: `user${counter}@example.com`,
    passwordHash: 'not-a-real-hash',
  });
}

async function createTestShelf(userId: string, options: { name?: string; isPublic?: boolean } = {}) {
  const shelf = await createShelf(userId, options.name ?? 'Favorite Books', null);
  return options.isPublic ? updateShelf(shelf.id, { is_public: true }) : shelf;
}

const book = (title: string, order_index: number, extra: Record<string, unknown> = {}) => ({
  type: 'book' as const,
  title,
  creator: 'An Author',
  order_index,
  ...extra,
});

describe('migrations', () => {
  it('apply cleanly to an empty database, in order', async () => {
    const db = await resetTestDatabase();
    const tables = await db.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );

    expect(tables.rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining(['users', 'shelves', 'items', 'shelf_view_daily'])
    );
  });

  it('can be run twice without error (idempotent)', async () => {
    const db = await resetTestDatabase();
    for (const file of migrationFiles()) {
      await expect(db.exec(readMigration(file))).resolves.toBeDefined();
    }
  });

  it('007 adds the identity columns and its down file removes them', async () => {
    const db = await resetTestDatabase();
    const columns = async () =>
      (
        await db.query<{ column_name: string }>(
          "SELECT column_name FROM information_schema.columns WHERE table_name = 'items'"
        )
      ).rows.map((row) => row.column_name);

    expect(await columns()).toEqual(expect.arrayContaining(['source', 'source_id']));

    await db.exec(readMigration('007_item_identity.down.sql'));
    expect(await columns()).not.toContain('source');
    expect(await columns()).not.toContain('source_id');

    await db.exec(readMigration('007_item_identity.sql'));
    expect(await columns()).toEqual(expect.arrayContaining(['source', 'source_id']));
  });
});

describe('queries against a real database', () => {
  beforeAll(async () => {
    await resetTestDatabase();
  });

  describe('createItem and updateItem', () => {
    it('saves an item and records its canonical identifier', async () => {
      const user = await createTestUser();
      const shelf = await createTestShelf(user.id);

      const item = await createItem(
        shelf.id,
        { type: 'video', title: 'A Video', creator: 'A Channel', external_url: 'https://youtu.be/dQw4w9WgXcQ' },
        user.id
      );

      expect(item.id).toBeTruthy();
      expect(item.source).toBe('youtube');
      expect(item.source_id).toBe('dQw4w9WgXcQ');

      const [stored] = await getItemsByShelfId(shelf.id);
      expect(stored).toMatchObject({ source: 'youtube', source_id: 'dQw4w9WgXcQ' });
    });

    it('stores NULL, not the text, for a URL that is not a web address', async () => {
      const user = await createTestUser();
      const shelf = await createTestShelf(user.id);

      const item = await createItem(shelf.id, book('Odd', 0, { external_url: 'javascript:alert(1)' }), user.id);

      expect(item.external_url).toBeNull();
      expect(item.source).toBeNull();
    });

    it('keeps the identifier in step when the link changes or is cleared', async () => {
      const user = await createTestUser();
      const shelf = await createTestShelf(user.id);
      const item = await createItem(shelf.id, book('A Book', 0), user.id);

      const linked = await updateItem(item.id, { external_url: 'https://books.google.com/books?id=zyTCAlFPjgYC' });
      expect(linked).toMatchObject({ source: 'google_books', source_id: 'zyTCAlFPjgYC' });

      const cleared = await updateItem(item.id, { external_url: '' });
      expect(cleared.external_url).toBeNull();
      expect(cleared.source).toBeNull();
      expect(cleared.source_id).toBeNull();
    });

    it('still saves items on a database that has not had migration 007', async () => {
      const db = getTestDatabase();
      await db.exec(readMigration('007_item_identity.down.sql'));
      try {
        const user = await createTestUser();
        const shelf = await createTestShelf(user.id);

        const item = await createItem(
          shelf.id,
          { type: 'video', title: 'A Video', creator: 'C', external_url: 'https://youtu.be/dQw4w9WgXcQ' },
          user.id
        );

        expect(item.id).toBeTruthy();
        expect(await getItemsByShelfId(shelf.id)).toHaveLength(1);
      } finally {
        await db.exec(readMigration('007_item_identity.sql'));
      }
    });
  });

  describe('updateItemOrder', () => {
    async function shelfWithThree() {
      const user = await createTestUser();
      const shelf = await createTestShelf(user.id);
      const a = await createItem(shelf.id, book('A', 0), user.id);
      const b = await createItem(shelf.id, book('B', 1), user.id);
      const c = await createItem(shelf.id, book('C', 2), user.id);
      return { shelf, a, b, c };
    }
    const titles = async (shelfId: string) => (await getItemsByShelfId(shelfId)).map((item) => item.title);

    it('reorders a shelf despite the unique (shelf, position) constraint', async () => {
      const { shelf, a, b, c } = await shelfWithThree();

      await updateItemOrder(shelf.id, [c.id, a.id, b.id]);

      expect(await titles(shelf.id)).toEqual(['C', 'A', 'B']);
      const positions = (await getItemsByShelfId(shelf.id)).map((item) => item.order_index);
      expect(positions).toEqual([0, 1, 2]);
    });

    it('rolls back completely when it cannot finish, leaving the old order', async () => {
      const { shelf, a, b, c } = await shelfWithThree();

      // A partial list: C is sent to position 0, which A (not in the list)
      // still holds. The first half of the work has already parked C and B on
      // negative positions by then, so without a transaction the shelf would
      // be left half-moved.
      expect(a.order_index).toBe(0);
      await expect(updateItemOrder(shelf.id, [c.id, b.id])).rejects.toThrow();

      expect(await titles(shelf.id)).toEqual(['A', 'B', 'C']);
      const positions = (await getItemsByShelfId(shelf.id)).map((item) => item.order_index);
      expect(positions).toEqual([0, 1, 2]);
    });

    it('does not move items that belong to another shelf', async () => {
      const first = await shelfWithThree();
      const second = await shelfWithThree();

      await updateItemOrder(first.shelf.id, [second.c.id, second.b.id, second.a.id]);

      expect(await titles(second.shelf.id)).toEqual(['A', 'B', 'C']);
    });
  });

  describe('getItemsForUserShelves (account export)', () => {
    it('returns every item on the user\'s shelves and nobody else\'s', async () => {
      const me = await createTestUser();
      const other = await createTestUser();
      const mine = await createTestShelf(me.id);
      const alsoMine = await createTestShelf(me.id, { name: 'Private' });
      const theirs = await createTestShelf(other.id);
      await createItem(mine.id, book('Mine 1', 0), me.id);
      await createItem(alsoMine.id, book('Mine 2', 0), me.id);
      await createItem(theirs.id, book('Theirs', 0), other.id);

      const items = await getItemsForUserShelves(me.id);

      expect(items.map((item) => item.title).sort()).toEqual(['Mine 1', 'Mine 2']);
    });
  });

  describe('getShelfViewsForOwner', () => {
    beforeEach(async () => {
      await getTestDatabase().exec('DELETE FROM shelf_view_daily');
    });

    it('totals views per shelf and names the busiest embedding site', async () => {
      const me = await createTestUser();
      const shelf = await createTestShelf(me.id, { isPublic: true });
      const quiet = await createTestShelf(me.id, { name: 'Quiet', isPublic: true });

      await recordShelfView(shelf.share_token, 'shelf');
      await recordShelfView(shelf.share_token, 'shelf');
      await recordShelfView(shelf.share_token, 'embed', 'small.example');
      await recordShelfView(shelf.share_token, 'embed', 'big.example');
      await recordShelfView(shelf.share_token, 'embed', 'big.example');

      const views = await getShelfViewsForOwner(me.id);

      expect(views.get(shelf.id)).toEqual({
        views_7d: 5,
        views_total: 5,
        top_embed_host: 'big.example',
        top_embed_host_views: 2,
      });
      expect(views.has(quiet.id)).toBe(false);
    });

    it('counts old views in the total but not in the week', async () => {
      const me = await createTestUser();
      const shelf = await createTestShelf(me.id, { isPublic: true });
      await getTestDatabase().query(
        "INSERT INTO shelf_view_daily (shelf_id, day, surface, embed_host, views) VALUES ($1, CURRENT_DATE - 40, 'shelf', '', 7)",
        [shelf.id]
      );
      await recordShelfView(shelf.share_token, 'shelf');

      const views = await getShelfViewsForOwner(me.id);

      expect(views.get(shelf.id)).toMatchObject({ views_7d: 1, views_total: 8, top_embed_host: null });
    });

    it('never includes another owner\'s shelves', async () => {
      const me = await createTestUser();
      const other = await createTestUser();
      const theirs = await createTestShelf(other.id, { isPublic: true });
      await recordShelfView(theirs.share_token, 'shelf');

      expect((await getShelfViewsForOwner(me.id)).size).toBe(0);
    });
  });

  describe('existing queries the new pages rely on', () => {
    it('getShelvesForDashboard returns counts and preview items', async () => {
      const me = await createTestUser();
      const shelf = await createTestShelf(me.id);
      await createItem(shelf.id, book('A', 0), me.id);
      await createItem(shelf.id, book('B', 1), me.id);

      const [dashboardShelf] = await getShelvesForDashboard(me.id);

      expect(dashboardShelf.item_count).toBe(2);
      expect(dashboardShelf.preview_items.map((item) => item.title)).toEqual(['A', 'B']);
    });

    it('getPublicShelves lists only published shelves (sitemap and llms.txt)', async () => {
      const me = await createTestUser();
      await createTestShelf(me.id, { name: 'Hidden Draft Shelf' });
      await createTestShelf(me.id, { name: 'Published Shelf', isPublic: true });

      const names = (await getPublicShelves()).map((shelf) => shelf.name);

      expect(names).toContain('Published Shelf');
      expect(names).not.toContain('Hidden Draft Shelf');
    });
  });
});
