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
    { label: 'Retry', value: queue.retryQueueMessageCount, alert: queue.retryQueueMessageCount > 0, alertColor: 'text-amber-500' },
    { label: 'DLQ', value: queue.dlqMessageCount, alert: queue.dlqMessageCount > 0, alertColor: 'text-red-500' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((m) => (
        <div key={m.label} className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
          <p className={`text-2xl font-semibold tabular-nums ${m.alert ? m.alertColor : ''}`}>
            {formatNumber(m.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
