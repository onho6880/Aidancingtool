'use client';

import { useEffect, useState } from 'react';

interface Job {
  id:           string;
  type:         string;
  status:       string;
  progress:     number;
  output_url:   string | null;
  error_msg:    string | null;
  created_at:   string;
  completed_at: string | null;
  input_data:   Record<string, unknown>;
}

interface Stats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

const STATUS_LABEL: Record<string, string> = {
  pending:    'Đang chờ',
  processing: 'Đang xử lý',
  completed:  'Hoàn thành',
  failed:     'Thất bại',
};

const TYPE_LABEL: Record<string, string> = {
  'motion-copy':    '🕺 Motion Copy',
  'image-to-video': '🎬 Image to Video',
  'clothes-change': '👗 Thay Trang Phục',
};

export default function JobHistory() {
  const [jobs, setJobs]   = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchJobs = () => {
    fetch('/api/jobs?limit=50')
      .then(r => r.json())
      .then(d => { setJobs(d.jobs); setStats(d.stats); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
    const id = setInterval(fetchJobs, 5000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-4">
            <div className="h-4 w-full rounded shimmer" />
          </div>
        ))}
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div className="card p-12 text-center">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-gray-400">Chưa có lịch sử tạo. Hãy tạo video hoặc ảnh đầu tiên!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Tổng', value: stats.total,      cls: 'text-white' },
            { label: 'Chờ',  value: stats.pending,    cls: 'text-yellow-400' },
            { label: 'Xử lý', value: stats.processing, cls: 'text-blue-400' },
            { label: 'Xong', value: stats.completed,  cls: 'text-green-400' },
            { label: 'Lỗi',  value: stats.failed,     cls: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
              <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Job list */}
      <div className="space-y-3">
        {jobs.map(job => (
          <div key={job.id} className="card p-4 flex items-center gap-4 animate-fade-in">
            {/* Type */}
            <div className="shrink-0 text-sm font-medium text-gray-300 w-40">
              {TYPE_LABEL[job.type] || job.type}
            </div>

            {/* Status */}
            <div className="shrink-0">
              <span className={`badge-${job.status}`}>
                {STATUS_LABEL[job.status] || job.status}
              </span>
            </div>

            {/* Progress */}
            <div className="flex-1 min-w-0">
              {(job.status === 'processing') && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.max(job.progress, 15)}%` }} />
                </div>
              )}
              {job.status === 'failed' && (
                <p className="text-xs text-red-400 truncate">{job.error_msg}</p>
              )}
            </div>

            {/* Date */}
            <div className="shrink-0 text-xs text-gray-600 hidden md:block">
              {new Date(job.created_at).toLocaleString('vi-VN')}
            </div>

            {/* Actions */}
            <div className="shrink-0 flex gap-2">
              {job.output_url && (
                <a href={job.output_url} download className="btn-secondary py-1.5 px-3 text-xs">
                  ⬇ Tải
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
