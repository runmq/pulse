'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

interface Props {
  processorName: string;
  messageCount: number;
  shovelPluginEnabled: boolean;
  disabled?: boolean;
  onReprocess?: () => void;
}

export default function ReprocessDLQButton({ processorName, messageCount, shovelPluginEnabled, disabled: externalDisabled, onReprocess }: Props) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const disabled = !shovelPluginEnabled || messageCount === 0 || externalDisabled;

  const handleReprocess = async () => {
    if (disabled) return;
    setLoading(true);
    try {
      await api.reprocessDlq(processorName);
      toast.success(`Reprocessing ${formatNumber(messageCount)} DLQ message${messageCount !== 1 ? 's' : ''}`);
      onReprocess?.();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Failed to reprocess DLQ';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">Reprocess DLQ</p>
        <p className="text-xs text-muted-foreground">
          {!shovelPluginEnabled
            ? 'RabbitMQ shovel plugin is not enabled'
            : messageCount > 0
              ? `${formatNumber(messageCount)} message${messageCount !== 1 ? 's' : ''} in DLQ`
              : 'No messages in DLQ'}
        </p>
      </div>
      <button
        onClick={handleReprocess}
        disabled={loading || disabled}
        className="text-sm h-8 px-3 rounded-md bg-foreground text-background font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.97]"
      >
        {loading ? 'Processing...' : 'Reprocess'}
      </button>
    </div>
  );
}
