'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface Props {
  processorName: string;
  enabled: boolean;
  onToggle: () => void;
}

export default function DLQToggle({ processorName, enabled, onToggle }: Props) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (enabled) {
        await api.disableDlq(processorName);
      } else {
        await api.enableDlq(processorName);
      }
      onToggle();
    } catch {
      // SWR will refresh
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#1a1a1a] last:border-0">
      <div>
        <p className="text-sm font-medium">Dead Letter Queue</p>
        <p className="text-xs text-gray-500 dark:text-[#636E7E]">
          Route failed messages to DLQ for inspection after exhausting all retries.
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative w-9 h-5 rounded-full transition-colors duration-150 ${
          enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-[#333]'
        } ${loading ? 'opacity-50' : ''}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-150 ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
