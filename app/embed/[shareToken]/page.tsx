import { Suspense } from 'react';
import type { Viewport } from 'next';
import { EmbedShelf } from './EmbedShelf';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function EmbedShelfPage() {
  return (
    <Suspense fallback={null}>
      <EmbedShelf />
    </Suspense>
  );
}
