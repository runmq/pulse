'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { QueueSummary } from '@/types/queue';
import Navbar from '@/components/layout/Navbar';
import QueueCard from '@/components/queue/QueueCard';
import RefreshSelect from '@/components/ui/RefreshSelect';
import { useRefreshInterval } from '@/hooks/useRefreshInterval';
import { Loader2 } from 'lucide-react';

export default function QueuesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { intervalSeconds, refreshInterval, setIntervalSeconds } = useRefreshInterval();

  const {
    data: queues,
    error,
    isLoading,
    mutate,
  } = useSWR<QueueSummary[]>(user ? '/queues' : null, () => api.getQueues(), { refreshInterval });

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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Queues</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor and manage your message queues
            </p>
          </div>

          <RefreshSelect
            intervalSeconds={intervalSeconds}
            onIntervalChange={setIntervalSeconds}
            onRefresh={() => mutate()}
            loading={isLoading}
          />
        </div>

        {/* Loading */}
        {isLoading && !queues && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass-card p-6 text-center">
            <p className="text-sm text-red-500 dark:text-red-400">
              Failed to load queues. Please try again.
            </p>
          </div>
        )}

        {/* Empty */}
        {queues && queues.length === 0 && (
          <div className="glass-card p-12 text-center">
            <p className="text-base font-medium mb-1">No queues found</p>
            <p className="text-sm text-muted-foreground">
              No RunMQ-managed queues detected in your RabbitMQ instance.
            </p>
          </div>
        )}

        {/* Grid */}
        {queues && queues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queues.map((queue) => (
              <QueueCard key={queue.name} queue={queue} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
