'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function GA4PageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof window.gtag !== 'function') return;

    const pagePath = window.location.pathname + window.location.search;
    const pageLocation = window.location.href;
    const pageTitle = document.title || '';

    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_location: pageLocation,
      page_title: pageTitle
    });
  }, [pathname, searchParams]);

  return null;
}
