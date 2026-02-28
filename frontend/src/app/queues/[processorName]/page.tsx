'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { QueueDetails } from '@/types/queue';
import Navbar from '@/components/layout/Navbar';
import QueueMetrics from '@/components/queue/QueueMetrics';
import QueueTopology from '@/components/queue/QueueTopology';
import RetryToggle from '@/components/queue/RetryToggle';
import DLQToggle from '@/components/queue/DLQToggle';
import ReprocessDLQButton from '@/components/queue/ReprocessDLQButton';
import RetryDelayControl from '@/components/queue/RetryDelayControl';
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: {
    processorName: string;
  };
}

export default function QueueDetailsPage({ params }: Props) {
  const { processorName } = params;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const {
    data: queue,
    error,
    isLoading,
    mutate,
  } = useSWR<QueueDetails>(
    user ? `/queues/${processorName}` : null,
    () => api.getQueueDetails(processorName)
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link
          href="/queues"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-[#636E7E] hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Queues
        </Link>

        {/* Loading */}
        {isLoading && !queue && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass-card p-6 text-center">
            <p className="text-sm text-red-500 dark:text-red-400">
              Failed to load queue details. Queue may not exist.
            </p>
          </div>
        )}

        {/* Details */}
        {queue && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{queue.processorName}</h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs ${queue.state === 'running' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {queue.state}
                  </span>
                  <span className="text-[#333] dark:text-[#555]">&middot;</span>
                  <span className="text-xs text-gray-500 dark:text-[#636E7E]">
                    {queue.consumers} consumer{queue.consumers !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <button
                onClick={() => mutate()}
                className="glass-button flex items-center gap-2 text-sm h-9 px-3"
                disabled={isLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Metrics */}
            <QueueMetrics queue={queue} />

            {/* Topology */}
            <QueueTopology topology={queue.topology} />

            {/* Controls */}
            <div className="glass-card p-5">
              <h2 className="text-sm font-medium text-gray-500 dark:text-[#636E7E] uppercase tracking-wider mb-4">Controls</h2>

              <div className="space-y-1">
                <RetryToggle
                  processorName={queue.processorName}
                  enabled={queue.retriesEnabled}
                  onToggle={mutate}
                />
                <DLQToggle
                  processorName={queue.processorName}
                  enabled={queue.dlqEnabled}
                  onToggle={mutate}
                />
                <RetryDelayControl
                  processorName={queue.processorName}
                  currentDelay={queue.retryDelay}
                  onUpdate={mutate}
                />
                <ReprocessDLQButton
                  processorName={queue.processorName}
                  messageCount={queue.dlqMessageCount}
                  shovelPluginEnabled={queue.shovelPluginEnabled}
                />
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
