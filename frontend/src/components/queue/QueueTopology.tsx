'use client';

interface Props {
  topology: {
    retriesEnabled: boolean;
    dlqEnabled: boolean;
    retryDelay: number | null;
    maxRetries: number | null;
    description: string;
  };
}

export default function QueueTopology({ topology }: Props) {
  return (
    <div className="glass-card p-5">
      <h2 className="text-sm font-medium text-gray-500 dark:text-[#636E7E] uppercase tracking-wider mb-3">Topology</h2>
      <p className="text-sm text-gray-600 dark:text-[#88909B] mb-4">{topology.description}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-[#636E7E] mb-0.5">Retries</p>
          <p className={`text-sm font-medium ${topology.retriesEnabled ? 'text-emerald-500' : 'text-gray-400 dark:text-[#555]'}`}>
            {topology.retriesEnabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-[#636E7E] mb-0.5">DLQ</p>
          <p className={`text-sm font-medium ${topology.dlqEnabled ? 'text-emerald-500' : 'text-gray-400 dark:text-[#555]'}`}>
            {topology.dlqEnabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>
        {topology.retryDelay !== null && (
          <div>
            <p className="text-xs text-gray-500 dark:text-[#636E7E] mb-0.5">Delay</p>
            <p className="text-sm font-medium tabular-nums">{topology.retryDelay}ms</p>
          </div>
        )}
        {topology.maxRetries !== null && (
          <div>
            <p className="text-xs text-gray-500 dark:text-[#636E7E] mb-0.5">Max Retries</p>
            <p className="text-sm font-medium tabular-nums">{topology.maxRetries}</p>
          </div>
        )}
      </div>
    </div>
  );
}
