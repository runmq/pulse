'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { QueueSummary } from '@/types/queue';
import Navbar from '@/components/layout/Navbar';
import QueueCard from '@/components/queue/QueueCard';
import RefreshSelect from '@/components/ui/RefreshSelect';
import { useRefreshInterval } from '@/hooks/useRefreshInterval';
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 12;

export default function QueuesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { intervalSeconds, refreshInterval, setIntervalSeconds } = useRefreshInterval();

  const {
    data: queues,
    error,
    isLoading,
    mutate,
  } = useSWR<QueueSummary[]>(user ? '/queues' : null, () => api.getQueues(), { refreshInterval });

  const filtered = useMemo(() => {
    if (!queues) return [];
    if (!search.trim()) return queues;
    const q = search.toLowerCase();
    return queues.filter((queue) => queue.processorName.toLowerCase().includes(q));
  }, [queues, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Clamp page if filtered results shrink
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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

        {/* Search */}
        {queues && queues.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#555]" />
            <input
              type="text"
              placeholder="Search queues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-lg focus:outline-none focus:border-gray-300 dark:focus:border-[#333] transition-colors placeholder:text-gray-400 dark:placeholder:text-[#555]"
            />
          </div>
        )}

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

        {/* No search results */}
        {queues && queues.length > 0 && filtered.length === 0 && (
          <div className="glass-card p-12 text-center">
            <p className="text-base font-medium mb-1">No matches</p>
            <p className="text-sm text-muted-foreground">
              No queues match &ldquo;{search}&rdquo;
            </p>
          </div>
        )}

        {/* Grid */}
        {paged.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paged.map((queue) => (
              <QueueCard key={queue.name} queue={queue} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-8">
            <p className="text-sm text-muted-foreground">
              {filtered.length} queue{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md border border-gray-200 dark:border-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#333] disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm tabular-nums text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-md border border-gray-200 dark:border-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#333] disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
