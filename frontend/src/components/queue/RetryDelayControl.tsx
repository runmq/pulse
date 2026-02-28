'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface Props {
  processorName: string;
  currentDelay: number | null;
  onUpdate: () => void;
  disabled?: boolean;
}

export default function RetryDelayControl({ processorName, currentDelay, onUpdate, disabled: externalDisabled }: Props) {
  const [editing, setEditing] = useState(false);
  const [delayMs, setDelayMs] = useState(currentDelay?.toString() || '5000');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    const value = parseInt(delayMs, 10);
    if (isNaN(value) || value < 0) {
      toast.error('Delay must be a positive number');
      return;
    }

    setLoading(true);
    try {
      await api.updateRetryDelay(processorName, value);
      toast.success(`Retry delay set to ${value}ms`);
      onUpdate();
      setEditing(false);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Failed to update retry delay';
      toast.error(msg);
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
        <p className="text-xs text-muted-foreground">
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
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
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
            className="text-xs h-8 px-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          disabled={externalDisabled}
          className="text-xs h-8 px-3 rounded-md glass-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentDelay !== null ? 'Edit' : 'Set'}
        </button>
      )}
    </div>
  );
}
