'use client';

interface Props {
  countdown: number;
}

export default function ActionToast({ countdown }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
      <div className="bg-[#111] border border-[#2A2A2A] rounded-lg px-4 py-3 shadow-lg">
        <p className="text-sm text-gray-300">
          Action triggered. Refreshing in {countdown}s...
        </p>
      </div>
    </div>
  );
}
