'use client';

import { useState, useEffect } from 'react';

interface QueueJob {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  description: string;
}

interface QueueMonitorProps {
  initialJobs?: QueueJob[];
  refreshInterval?: number;
}

export function QueueMonitor({ initialJobs = [], refreshInterval = 5000 }: QueueMonitorProps) {
  const [jobs, setJobs] = useState<QueueJob[]>(initialJobs);
  const [filter, setFilter] = useState<QueueJob['status'] | 'all'>('all');

  useEffect(() => {
    const interval = setInterval(() => {
      // In production: fetch updated queue data
      setJobs((prev) => prev);
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const filteredJobs = filter === 'all' ? jobs : jobs.filter((j) => j.status === filter);

  const statusColors: Record<QueueJob['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'pending', 'processing', 'completed', 'failed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-brand px-3 py-1 text-sm font-medium capitalize ${
              filter === status ? 'bg-brand-primary text-white' : 'border hover:border-brand-primary'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between rounded-brand border bg-white px-4 py-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[job.status]}`}>
                    {job.status}
                  </span>
                  <span className="text-sm font-medium">{job.description}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{job.type} &middot; {job.createdAt}</p>
              </div>
              {job.status === 'processing' && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-gray-200">
                    <div className="h-2 rounded-full bg-brand-primary" style={{ width: `${job.progress}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{job.progress}%</span>
                </div>
              )}
              {(job.status === 'pending' || job.status === 'processing') && (
                <button className="ml-4 text-xs text-red-500 hover:underline">Cancel</button>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-sm text-gray-500 py-8">No jobs match the selected filter.</p>
        )}
      </div>
    </div>
  );
}
