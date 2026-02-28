'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { DLQMessage } from '@/types/queue';
import { formatNumber } from '@/lib/utils';
import { ChevronDown, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface Props {
  processorName: string;
  messageCount: number;
}

const PAGE_SIZE = 10;

export default function DLQMessageViewer({ processorName, messageCount }: Props) {
  const [messages, setMessages] = useState<DLQMessage[]>([]);
  const [totalInQueue, setTotalInQueue] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [expandedHeaders, setExpandedHeaders] = useState<Set<number>>(new Set());
  const toast = useToast();

  const totalPages = Math.ceil(messages.length / PAGE_SIZE);
  const pageMessages = messages.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const fetchMessages = async (count: number = 100) => {
    setLoading(true);
    try {
      const result = await api.getDlqMessages(processorName, count);
      setMessages(result.messages);
      setTotalInQueue(result.totalInQueue);
      setLoadedCount(count);
      setLoaded(true);
      setPage(0);
      setExpandedIndex(null);
      setExpandedHeaders(new Set());
    } catch {
      toast.error('Failed to load DLQ messages');
    } finally {
      setLoading(false);
    }
  };

  const toggleHeaders = (index: number) => {
    setExpandedHeaders((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const formatPayload = (payload: string): { formatted: string; isJson: boolean } => {
    try {
      const parsed = JSON.parse(payload);
      return { formatted: JSON.stringify(parsed, null, 2), isJson: true };
    } catch {
      return { formatted: payload, isJson: false };
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (messageCount === 0) return null;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          DLQ Messages
        </h2>
        {!loaded ? (
          <button
            onClick={() => fetchMessages()}
            disabled={loading}
            className="text-sm h-8 px-3 rounded-md bg-foreground text-background font-medium transition-all duration-150 disabled:opacity-50 hover:opacity-90 active:scale-[0.97] flex items-center gap-2"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {loading ? 'Loading...' : 'View Messages'}
          </button>
        ) : (
          <button
            onClick={() => fetchMessages(loadedCount)}
            disabled={loading}
            className="text-sm h-8 px-3 rounded-md border border-gray-200 dark:border-[#252525] font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] flex items-center gap-2"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Refresh
          </button>
        )}
      </div>

      {loaded && (
        <>
          {totalInQueue > messages.length && (
            <div className="flex items-center justify-between rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 mb-4">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Showing {formatNumber(messages.length)} of {formatNumber(totalInQueue)} messages
              </p>
              {loadedCount < 500 && (
                <button
                  onClick={() => fetchMessages(500)}
                  disabled={loading}
                  className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50"
                >
                  Load more (up to 500)
                </button>
              )}
            </div>
          )}

          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No messages in DLQ
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {pageMessages.map((msg) => {
                  const isExpanded = expandedIndex === msg.index;
                  const headersExpanded = expandedHeaders.has(msg.index);
                  const { formatted, isJson } = formatPayload(msg.payload);
                  const hasHeaders = Object.keys(msg.properties.headers).length > 0;

                  return (
                    <div
                      key={msg.index}
                      className="border border-gray-200 dark:border-[#252525] rounded-md overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedIndex(isExpanded ? null : msg.index)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-[#111] transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        )}
                        <span className="text-xs font-mono text-muted-foreground w-8 shrink-0">
                          #{msg.index}
                        </span>
                        <span className="text-sm font-mono truncate flex-1 text-muted-foreground">
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatBytes(msg.payloadBytes)}
                        </span>
                        {msg.redelivered && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium shrink-0">
                            redelivered
                          </span>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-200 dark:border-[#252525] px-3 py-3 space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">
                              Payload {isJson && <span className="text-emerald-500">JSON</span>}
                            </p>
                            <pre className="text-xs font-mono bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1a1a1a] rounded-md p-3 overflow-x-auto max-h-80 whitespace-pre-wrap break-all">
                              {formatted}
                            </pre>
                          </div>

                          {hasHeaders && (
                            <div>
                              <button
                                onClick={() => toggleHeaders(msg.index)}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {headersExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                                Headers ({Object.keys(msg.properties.headers).length})
                              </button>
                              {headersExpanded && (
                                <pre className="text-xs font-mono bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1a1a1a] rounded-md p-3 overflow-x-auto max-h-60 mt-1.5 whitespace-pre-wrap break-all">
                                  {JSON.stringify(msg.properties.headers, null, 2)}
                                </pre>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Exchange: {msg.exchange || '(default)'}</span>
                            {msg.routingKey && <span>Routing Key: {msg.routingKey}</span>}
                            {msg.properties.contentType && (
                              <span>Content-Type: {msg.properties.contentType}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-[#252525]">
                  <p className="text-xs text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 dark:border-[#252525] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 dark:border-[#252525] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
