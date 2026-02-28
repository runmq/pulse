'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

interface Props {
  processorName: string;
  messageCount: number;
  onClear: () => void;
  disabled?: boolean;
}

export default function ClearDLQButton({ processorName, messageCount, onClear, disabled: externalDisabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const toast = useToast();

  const disabled = messageCount === 0 || externalDisabled;

  const handleClear = async () => {
    setLoading(true);
    try {
      await api.clearDlq(processorName);
      toast.success(`Cleared ${formatNumber(messageCount)} message${messageCount !== 1 ? 's' : ''} from DLQ`);
      setConfirming(false);
      onClear();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Failed to clear DLQ';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">Clear DLQ</p>
        <p className="text-xs text-muted-foreground">
          {messageCount > 0
            ? `Purge all ${formatNumber(messageCount)} message${messageCount !== 1 ? 's' : ''} from DLQ`
            : 'No messages in DLQ'}
        </p>
      </div>
      {confirming ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="text-sm h-8 px-3 rounded-md border border-gray-200 dark:border-[#252525] font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-[#1A1A1A]"
          >
            Cancel
          </button>
          <button
            onClick={handleClear}
            disabled={loading}
            className="text-sm h-8 px-3 rounded-md bg-red-600 text-white font-medium transition-all duration-150 disabled:opacity-50 hover:bg-red-700 active:scale-[0.97]"
          >
            {loading ? 'Clearing...' : 'Confirm'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          disabled={disabled}
          className="text-sm h-8 px-3 rounded-md bg-red-600/10 text-red-600 dark:text-red-400 font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600/20 active:scale-[0.97]"
        >
          Clear
        </button>
      )}
    </div>
  );
}
