'use client';

import { RefreshCw } from 'lucide-react';
import { REFRESH_OPTIONS } from '@/hooks/useRefreshInterval';

interface Props {
  intervalSeconds: number;
  onIntervalChange: (seconds: number) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export default function RefreshSelect({ intervalSeconds, onIntervalChange, onRefresh, loading }: Props) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={intervalSeconds}
        onChange={(e) => onIntervalChange(Number(e.target.value))}
        className="h-9 px-2 pr-7 text-sm rounded-md border border-gray-200 dark:border-[#252525] bg-transparent appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-[#444]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23636E7E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 6px center',
        }}
      >
        {REFRESH_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.value === 0 ? 'Auto: Off' : `Auto: ${opt.label}`}
          </option>
        ))}
      </select>

      <button
        onClick={onRefresh}
        className="glass-button flex items-center gap-2 text-sm h-9 px-3"
        disabled={loading}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>
  );
}
