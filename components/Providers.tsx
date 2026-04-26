'use client';

import { useEffect } from 'react';
import { ToastProvider } from '@/components/ui/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const revealElements = new Set<Element>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -8% 0px',
      }
    );

    const observePending = () => {
      document.querySelectorAll('[data-reveal]').forEach((element) => {
        if (!revealElements.has(element)) {
          revealElements.add(element);
          observer.observe(element);
        }
      });
    };

    observePending();

    const mutationObserver = new MutationObserver(() => {
      observePending();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
      revealElements.clear();
    };
  }, []);

  return <ToastProvider>{children}</ToastProvider>;
}
