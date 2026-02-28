'use client';

import Link from 'next/link';
import { QueueSummary } from '@/types/queue';
import { formatNumber } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

interface Props {
  queue: QueueSummary;
}

export default function QueueCard({ queue }: Props) {
  return (
    <Link href={`/queues/${encodeURIComponent(queue.processorName)}`}>
      <div className="glass-card p-5 hover:border-gray-300 dark:hover:border-[#333] transition-colors cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0">
            <h3 className="text-sm font-medium truncate group-hover:text-primary-500 transition-colors">
              {queue.processorName}
            </h3>
            <span className={`inline-block mt-1 text-xs ${queue.state === 'running' ? 'text-emerald-500' : 'text-amber-500'}`}>
              {queue.state}
            </span>
          </div>
          <ArrowUpRight className="h-4 w-4 text-gray-300 dark:text-[#333] group-hover:text-gray-500 dark:group-hover:text-[#636E7E] transition-colors shrink-0" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-[#636E7E]">Messages</p>
            <p className="text-lg font-semibold tabular-nums">{formatNumber(queue.messages)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-[#636E7E]">Consumers</p>
            <p className="text-lg font-semibold tabular-nums">{formatNumber(queue.consumers)}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-[#1a1a1a]">
          {queue.retriesEnabled && (
            <span className="text-[11px] text-gray-500 dark:text-[#555] bg-gray-100 dark:bg-[#111] px-2 py-0.5 rounded">
              retries
            </span>
          )}
          {queue.dlqEnabled && (
            <span className="text-[11px] text-gray-500 dark:text-[#555] bg-gray-100 dark:bg-[#111] px-2 py-0.5 rounded">
              dlq
            </span>
          )}
          {!queue.retriesEnabled && !queue.dlqEnabled && (
            <span className="text-[11px] text-gray-400 dark:text-[#444]">basic</span>
          )}
        </div>
      </div>
    </Link>
  );
}
