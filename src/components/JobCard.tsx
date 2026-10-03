'use client';

import { useEffect, useState, useCallback } from 'react';

interface Job {
  id:           string;
  type:         string;
  status:       'pending' | 'processing' | 'completed' | 'failed';
  progress:     number;
  output_url:   string | null;
  error_msg:    string | null;
  created_at:   string;
  completed_at: string | null;
  input_data:   Record<string, unknown>;
}

interface JobCardProps {
  jobId:     string;
  onComplete?: (job: Job) => void;
}

const STATUS_LABEL: Record<string, string> = {
  pending:    'Đang chờ',
  processing: 'Đang xử lý',
  completed:  'Hoàn thành',
  failed:     'Thất bại',
};

const TYPE_LABEL: Record<string, string> = {
  'motion-copy':    'Motion Copy',
  'image-to-video': 'Image to Video',
  'clothes-change': 'Thay Trang Phục',
};

export default function JobCard({ jobId, onComplete }: JobCardProps) {
  const [job, setJob]   = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      const res  = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json() as Job;
      if (!res.ok) throw new Error(data as any);
      setJob(data);
      if (data.status === 'completed') onComplete?.(data);
    } catch (e: any) {
      setError(e.message);
    }
  }, [jobId, onComplete]);

  useEffect(() => {
    fetchJob();
    const id = setInterval(() => {
      fetchJob().then(() => {
        if (job?.status === 'completed' || job?.status === 'failed') clearInterval(id);
      });
    }, 3000);
    return () => clearInterval(id);
  }, [fetchJob, job?.status]);

  if (error) return (
    <div className="card p-4 border-red-500/30 animate-fade-in">
      <p className="text-sm text-red-400">⚠ Không thể tải kết quả: {error}</p>
    </div>
  );

  if (!job) return (
    <div className="card p-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full shimmer" />
        <div className="h-4 w-32 rounded shimmer" />
      </div>
    </div>
  );

  const isActive = job.status === 'pending' || job.status === 'processing';
  const progress = job.status === 'completed' ? 100 : job.status === 'processing' ? Math.max(job.progress, 15) : 0;

  return (
    <div className="card p-5 space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`badge-${job.status}`}>
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-slow" />}
            {STATUS_LABEL[job.status]}
          </span>
          <span className="text-xs text-gray-600">{TYPE_LABEL[job.type] || job.type}</span>
        </div>
        <span className="text-xs text-gray-600">{job.id.slice(0, 8)}…</span>
      </div>

      {/* Progress */}
      {(isActive || job.status === 'completed') && (
        <div className="space-y-1.5">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>{isActive ? 'AI đang xử lý…' : 'Hoàn thành'}</span>
            <span>{progress}%</span>
          </div>
        </div>
      )}

      {/* Error */}
      {job.status === 'failed' && job.error_msg && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <p className="text-sm text-red-400">{job.error_msg}</p>
        </div>
      )}

      {/* Result */}
      {job.status === 'completed' && job.output_url && (
        <div className="space-y-3">
          <ResultPreview url={job.output_url} type={job.type} />
          <a
            href={job.output_url}
            download
            className="btn-primary w-full justify-center"
          >
            ⬇ Tải xuống kết quả
          </a>
        </div>
      )}

      <p className="text-xs text-gray-700">
        {new Date(job.created_at).toLocaleString('vi-VN')}
      </p>
    </div>
  );
}

function ResultPreview({ url, type }: { url: string; type: string }) {
  const isVideo = type !== 'clothes-change';
  return isVideo ? (
    <video src={url} controls className="w-full rounded-xl max-h-72 bg-black object-contain" />
  ) : (
    <img src={url} alt="Result" className="w-full rounded-xl max-h-72 object-contain bg-black" />
  );
}
