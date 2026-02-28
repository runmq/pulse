'use client';

import { QueueDetails } from '@/types/queue';
import { formatNumber } from '@/lib/utils';

interface Props {
  queue: QueueDetails;
}

export default function QueueMetrics({ queue }: Props) {
  const metrics = [
    { label: 'Total', value: queue.messages },
    { label: 'Ready', value: queue.messagesReady },
    { label: 'Unacked', value: queue.messagesUnacknowledged },
    { label: 'DLQ', value: queue.dlqMessageCount, alert: queue.dlqMessageCount > 0 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div key={m.label} className="glass-card p-4">
          <p className="text-xs text-gray-500 dark:text-[#636E7E] mb-1">{m.label}</p>
          <p className={`text-2xl font-semibold tabular-nums ${m.alert ? 'text-red-500' : ''}`}>
            {formatNumber(m.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
