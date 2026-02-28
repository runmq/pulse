'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';

export function useQueues() {
  const { data, error, isLoading, mutate } = useSWR('queues', () => api.getQueues());

  return {
    queues: data || [],
    error,
    isLoading,
    refresh: mutate,
  };
}

export function useQueueDetails(processorName: string) {
  const { data, error, isLoading, mutate } = useSWR(
    processorName ? `queue-${processorName}` : null,
    () => api.getQueueDetails(processorName)
  );

  return {
    queue: data,
    error,
    isLoading,
    refresh: mutate,
  };
}
