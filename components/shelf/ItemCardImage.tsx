'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

interface ItemCardImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  /** Shown in place of the image when it fails to load */
  fallback: ReactNode;
}

/**
 * Image for ItemCardStatic. The <img> stays in the server HTML so crawlers can
 * read it; this client wrapper only swaps in the fallback when loading fails.
 */
export function ItemCardImage({ src, alt, className, style, fallback }: ItemCardImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  // An image can fail before hydration, when its error event has no listener yet.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  if (failed) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- plain <img> for SSR compatibility
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
