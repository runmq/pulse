'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'runmq_refresh_interval';
const DEFAULT_INTERVAL = 5;

export const REFRESH_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '1s', value: 1 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '15s', value: 15 },
  { label: '20s', value: 20 },
  { label: '30s', value: 30 },
];

export function useRefreshInterval() {
  const [interval, setInterval] = useState<number>(DEFAULT_INTERVAL);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (REFRESH_OPTIONS.some((o) => o.value === parsed)) {
        setInterval(parsed);
      }
    }
  }, []);

  const setAndPersist = (seconds: number) => {
    setInterval(seconds);
    localStorage.setItem(STORAGE_KEY, String(seconds));
  };

  return {
    intervalSeconds: interval,
    refreshInterval: interval > 0 ? interval * 1000 : 0,
    setIntervalSeconds: setAndPersist,
  };
}
