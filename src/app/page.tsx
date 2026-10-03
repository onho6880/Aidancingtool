'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Stats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

const FEATURES = [
  {
    href:  '/motion-copy',
    icon:  '🕺',
    title: 'Motion Copy',
    desc:  'Upload ảnh nhân vật + video chuyển động mẫu → AI tạo video nhân vật của bạn nhảy theo.',
    color: 'from-blue-600 to-cyan-500',
    badge: 'Video',
  },
  {
    href:  '/image-to-video',
    icon:  '🎬',
    title: 'Image to Video',
    desc:  'Biến một ảnh tĩnh thành video sống động với AI chỉ bằng một câu mô tả.',
    color: 'from-purple-600 to-pink-500',
    badge: 'Video',
  },
  {
    href:  '/clothes-change',
    icon:  '👗',
    title: 'AI Thay Trang Phục',
    desc:  'Upload ảnh người mẫu + ảnh trang phục → AI tạo ảnh người mẫu mặc trang phục mới.',
    color: 'from-amber-500 to-orange-500',
    badge: 'Ảnh',
  },
];

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/jobs?limit=1')
      .then(r => r.json())
      .then(d => setStats(d.stats))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-slow" />
          Powered by AI · Không cần kỹ năng thiết kế
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
          <span className="text-gradient">VidAI Studio</span>
          <br />
          <span className="text-white">Sáng tạo không giới hạn</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Công cụ AI tạo video & ảnh chuyên nghiệp ngay trên trình duyệt.
          Không cần phần mềm, không cần kinh nghiệm.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {FEATURES.map(f => (
          <Link key={f.href} href={f.href} className="group card p-6 hover:border-brand-500/40 transition-all duration-300 hover:-translate-y-1 block animate-slide-up">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300`}>
              {f.icon}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-bold text-white">{f.title}</h2>
              <span className="badge bg-surface-border text-gray-400 text-xs">{f.badge}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">{f.desc}</p>
            <span className="text-brand-400 text-sm font-semibold group-hover:underline">
              Dùng ngay →
            </span>
          </Link>
        ))}
      </div>

      {/* Stats */}
      {stats && (
        <div className="card p-6 animate-fade-in">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Thống kê tổng quan</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Tổng jobs', value: stats.total,      color: 'text-white' },
              { label: 'Đang chờ',  value: stats.pending,    color: 'text-yellow-400' },
              { label: 'Đang xử lý', value: stats.processing, color: 'text-blue-400' },
              { label: 'Hoàn thành', value: stats.completed,  color: 'text-green-400' },
              { label: 'Thất bại',  value: stats.failed,     color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick start */}
      <div className="mt-16 text-center">
        <p className="text-gray-500 text-sm mb-4">Bắt đầu chỉ trong 3 bước</p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
          {['① Upload ảnh hoặc video', '② Cài đặt & gửi yêu cầu', '③ Tải kết quả về'].map((s, i) => (
            <span key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-card border border-surface-border">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
