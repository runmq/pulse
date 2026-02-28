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
import ClearDLQButton from '@/components/queue/ClearDLQButton';
import DLQMessageViewer from '@/components/queue/DLQMessageViewer';
import RetryMessageViewer from '@/components/queue/RetryMessageViewer';
import RetryDelayControl from '@/components/queue/RetryDelayControl';
import RefreshSelect from '@/components/ui/RefreshSelect';
import { useActionRefresh } from '@/hooks/useActionRefresh';
import { useRefreshInterval } from '@/hooks/useRefreshInterval';
import { Loader2, ArrowLeft } from 'lucide-react';
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

  const { actionPending, scheduleRefresh } = useActionRefresh();
  const { intervalSeconds, refreshInterval, setIntervalSeconds } = useRefreshInterval();

  const {
    data: queue,
    error,
    isLoading,
    mutate,
  } = useSWR<QueueDetails>(
    user ? `/queues/${processorName}` : null,
    () => api.getQueueDetails(processorName),
    { refreshInterval }
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
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
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
                  <span className="text-muted-foreground">&middot;</span>
                  <span className="text-xs text-muted-foreground">
                    {queue.consumers} consumer{queue.consumers !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <RefreshSelect
                intervalSeconds={intervalSeconds}
                onIntervalChange={setIntervalSeconds}
                onRefresh={() => mutate()}
                loading={isLoading}
              />
            </div>

            {/* Metrics */}
            <QueueMetrics queue={queue} />

            {/* Topology */}
            <QueueTopology topology={queue.topology} />

            {/* Controls */}
            <div className="glass-card p-5">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Controls</h2>

              <div className="space-y-1">
                <RetryToggle
                  processorName={queue.processorName}
                  enabled={queue.retriesEnabled}
                  onToggle={() => scheduleRefresh(mutate)}
                  disabled={actionPending}
                />
                <DLQToggle
                  processorName={queue.processorName}
                  enabled={queue.dlqEnabled}
                  onToggle={() => scheduleRefresh(mutate)}
                  disabled={actionPending}
                />
                <RetryDelayControl
                  processorName={queue.processorName}
                  currentDelay={queue.retryDelay}
                  onUpdate={() => scheduleRefresh(mutate)}
                  disabled={actionPending}
                />
                <ReprocessDLQButton
                  processorName={queue.processorName}
                  messageCount={queue.dlqMessageCount}
                  shovelPluginEnabled={queue.shovelPluginEnabled}
                  disabled={actionPending}
                  onReprocess={() => scheduleRefresh(mutate)}
                />
                <ClearDLQButton
                  processorName={queue.processorName}
                  messageCount={queue.dlqMessageCount}
                  onClear={() => scheduleRefresh(mutate)}
                  disabled={actionPending}
                />
              </div>
            </div>

            {/* Retry Message Viewer */}
            {queue.retriesEnabled && (
              <RetryMessageViewer
                processorName={queue.processorName}
                messageCount={queue.retryQueueMessageCount}
              />
            )}

            {/* DLQ Message Viewer */}
            {queue.dlqEnabled && (
              <DLQMessageViewer
                processorName={queue.processorName}
                messageCount={queue.dlqMessageCount}
              />
            )}

          </div>
        )}
      </main>
    </div>
  );
}
