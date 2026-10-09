'use client';
import { useEffect } from 'react';

/** Guards hard navigation (refresh/close/external). App Router has no route-change veto: confirm in-app Cancel/Back explicitly. */
export function useUnsavedChangesGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
