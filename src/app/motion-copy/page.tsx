'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import JobCard from '@/components/JobCard';

interface UploadResult { id: string; url: string; }

export default function MotionCopyPage() {
  const [charImage, setCharImage]   = useState<UploadResult | null>(null);
  const [motionVideo, setMotionVideo] = useState<UploadResult | null>(null);
  const [prompt, setPrompt]         = useState('');
  const [jobId, setJobId]           = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);

  const reset = () => {
    setJobId(null);
    setCharImage(null);
    setMotionVideo(null);
    setPrompt('');
    setFormError(null);
  };

  const submit = async () => {
    if (!charImage || !motionVideo) {
      setFormError('Vui lòng upload đủ ảnh nhân vật và video chuyển động.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const res  = await fetch('/api/generate/motion-copy', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          characterImageUrl: charImage.url,
          motionVideoUrl:    motionVideo.url,
          prompt:            prompt.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo job');
      setJobId(data.id);
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-xl">
            🕺
          </div>
          <div>
            <h1 className="section-title">Motion Copy</h1>
            <p className="section-desc">Nhân vật của bạn nhảy theo video mẫu nhờ AI</p>
          </div>
        </div>
      </div>

      {jobId ? (
        <div className="space-y-4">
          <JobCard jobId={jobId} />
          <button onClick={reset} className="btn-ghost w-full">← Tạo video mới</button>
        </div>
      ) : (
        <div className="card p-6 space-y-6">
          {/* Step 1: Character image */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">Bước 1</div>
            <FileUpload
              label="Ảnh nhân vật (người, nhân vật hoạt hình…)"
              accept="image"
              hint="Nên dùng ảnh toàn thân, nền đơn giản"
              onUploaded={r => setCharImage(r)}
              onClear={() => setCharImage(null)}
            />
          </div>

          <div className="border-t border-surface-border" />

          {/* Step 2: Motion video */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">Bước 2</div>
            <FileUpload
              label="Video chuyển động mẫu (video múa/nhảy)"
              accept="video"
              hint="MP4 hoặc MOV, tối đa 100MB. Chọn video có chuyển động rõ ràng"
              onUploaded={r => setMotionVideo(r)}
              onClear={() => setMotionVideo(null)}
            />
          </div>

          <div className="border-t border-surface-border" />

          {/* Step 3: Optional prompt */}
          <div>
            <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-3">Bước 3 (tuỳ chọn)</div>
            <label className="label">Mô tả thêm (prompt)</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="VD: nhảy điệu K-pop năng động, ánh đèn sân khấu…"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
          </div>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-sm text-red-400">⚠ {formError}</p>
            </div>
          )}

          <button
            onClick={submit}
            disabled={submitting || !charImage || !motionVideo}
            className="btn-primary w-full"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang gửi yêu cầu…
              </>
            ) : '✨ Tạo Motion Copy'}
          </button>

          <p className="text-xs text-center text-gray-600">
            Thời gian xử lý thường từ 2–10 phút tuỳ độ phức tạp
          </p>
        </div>
      )}

      {/* Info */}
      <div className="mt-8 card p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Hướng dẫn chọn ảnh & video tốt nhất</h3>
        <ul className="space-y-2 text-sm text-gray-500">
          <li className="flex gap-2"><span>📸</span> Ảnh nhân vật: toàn thân, nền trắng hoặc đơn màu</li>
          <li className="flex gap-2"><span>🎥</span> Video mẫu: quay rõ ràng, không bị mờ, người đứng chính diện</li>
          <li className="flex gap-2"><span>⏱</span> Video 5–30 giây cho kết quả tốt nhất</li>
          <li className="flex gap-2"><span>💡</span> Ánh sáng đều, không bị tối quá hoặc sáng quá</li>
        </ul>
      </div>
    </div>
  );
}
