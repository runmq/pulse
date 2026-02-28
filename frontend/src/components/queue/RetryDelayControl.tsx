'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface Props {
  processorName: string;
  currentDelay: number | null;
  onUpdate: () => void;
}

export default function RetryDelayControl({ processorName, currentDelay, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [delayMs, setDelayMs] = useState(currentDelay?.toString() || '5000');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const value = parseInt(delayMs, 10);
    if (isNaN(value) || value < 0) return;

    setLoading(true);
    try {
      await api.updateRetryDelay(processorName, value);
      onUpdate();
      setEditing(false);
    } catch {
      // SWR will refresh
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setDelayMs(currentDelay?.toString() || '5000');
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#1a1a1a] last:border-0">
      <div>
        <p className="text-sm font-medium">Retry Delay</p>
        <p className="text-xs text-gray-500 dark:text-[#636E7E]">
          {currentDelay !== null ? `${currentDelay}ms between retries` : 'No delay configured'}
        </p>
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={delayMs}
            onChange={(e) => setDelayMs(e.target.value)}
            className="glass-input w-24 h-8 text-sm px-2 text-right tabular-nums"
            placeholder="ms"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={loading}
            className="text-xs h-8 px-3 rounded-md bg-foreground text-background font-medium transition-all duration-150 disabled:opacity-50 hover:opacity-90 active:scale-[0.97]"
          >
            {loading ? '...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            className="text-xs h-8 px-2 rounded-md text-gray-500 hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-xs h-8 px-3 rounded-md glass-button"
        >
          {currentDelay !== null ? 'Edit' : 'Set'}
        </button>
      )}
    </div>
  );
}
