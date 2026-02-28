'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

interface Props {
  processorName: string;
  messageCount: number;
  shovelPluginEnabled: boolean;
}

export default function ReprocessDLQButton({ processorName, messageCount, shovelPluginEnabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const disabled = !shovelPluginEnabled || messageCount === 0;

  const handleReprocess = async () => {
    if (disabled) return;
    setLoading(true);
    setSuccess(false);
    try {
      await api.reprocessDlq(processorName);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">Reprocess DLQ</p>
        <p className="text-xs text-gray-500 dark:text-[#636E7E]">
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
        className="text-sm h-8 px-3 rounded-md bg-foreground text-background font-medium transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.97]"
      >
        {loading ? 'Processing...' : success ? 'Started' : 'Reprocess'}
      </button>
    </div>
  );
}
