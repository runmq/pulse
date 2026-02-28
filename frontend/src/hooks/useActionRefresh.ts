import { useState, useRef, useCallback } from 'react';

interface UseActionRefreshReturn {
  actionPending: boolean;
  scheduleRefresh: (mutateFn: () => void) => void;
}

export function useActionRefresh(): UseActionRefreshReturn {
  const [actionPending, setActionPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback((mutateFn: () => void) => {
    if (actionPending) return;

    mutateFn();
    setActionPending(true);

    timerRef.current = setTimeout(() => {
      mutateFn();
      setActionPending(false);
      timerRef.current = null;
    }, 3000);
  }, [actionPending]);

  return { actionPending, scheduleRefresh };
}
