import { it } from 'vitest';
import { promises as fs } from 'fs';
import { GET as landingGET } from '@/app/api/og/landing/route';
import { GET as shelfGET } from '@/app/api/og/[shareToken]/route';

it('generate og images for review (landing + shelf fallback) - writes to tmp/', async () => {
  // Landing
  const landingRes = await landingGET();
  const landingBuf = Buffer.from(await (landingRes as any).arrayBuffer());
  await fs.writeFile('tmp/og-landing.png', landingBuf);

  // Shelf (fallback using a token that is unlikely to exist)
  const shelfRes = await shelfGET(new Request('http://localhost/'), { params: Promise.resolve({ shareToken: 'this-token-does-not-exist' }) as any });
  const shelfBuf = Buffer.from(await (shelfRes as any).arrayBuffer());
  await fs.writeFile('tmp/og-shelf-fallback.png', shelfBuf);

  // Intentionally not asserting — this test's purpose is production of files for manual review.
});