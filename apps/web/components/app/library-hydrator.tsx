'use client';

import { useEffect } from 'react';
import { getLibraryOverview } from '@/lib/api';
import { useLibraryStore } from '@/store/library-store';
import { useSessionStore } from '@/store/session-store';

export function LibraryHydrator() {
  const userId = useSessionStore((state) => state.user?.id);
  const overview = useLibraryStore((state) => state.overview);
  const setOverview = useLibraryStore((state) => state.setOverview);
  const clearOverview = useLibraryStore((state) => state.clearOverview);

  useEffect(() => {
    if (!userId) {
      clearOverview();
      return;
    }

    if (overview) {
      return;
    }

    let isMounted = true;

    void getLibraryOverview()
      .then((nextOverview) => {
        if (isMounted) {
          setOverview(nextOverview);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [clearOverview, overview, setOverview, userId]);

  return null;
}
