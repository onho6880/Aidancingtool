'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import JobCard from '@/components/JobCard';

interface UploadResult { id: string; url: string; }

const PROMPT_EXAMPLES = [
  'Cô gái mỉm cười nhẹ nhàng, gió thổi mái tóc',
  'Cảnh biển lúc hoàng hôn, sóng vỗ nhẹ nhàng',
  'Bông hoa nở dần trong nắng sớm',
  'Thành phố về đêm, đèn nhấp nháy lung linh',
];

export default function ImageToVideoPage() {
  const [image, setImage]           = useState<UploadResult | null>(null);
  const [prompt, setPrompt]         = useState('');
  const [duration, setDuration]     = useState(5);
  const [jobId, setJobId]           = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);

  const reset = () => {
    setJobId(null);
    setImage(null);
    setPrompt('');
    setFormError(null);
  };

  const submit = async () => {
    if (!image)          { setFormError('Vui lòng upload ảnh.'); return; }
    if (!prompt.trim())  { setFormError('Vui lòng nhập mô tả video.'); return; }
    setFormError(null);
    setSubmitting(true);
    try {
      const res  = await fetch('/api/generate/image-to-video', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ imageUrl: image.url, prompt: prompt.trim(), duration }),
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-xl">
            🎬
          </div>
          <div>
            <h1 className="section-title">Image to Video</h1>
            <p className="section-desc">Biến ảnh tĩnh thành video sống động với AI</p>
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
          {/* Upload */}
          <FileUpload
            label="Ảnh đầu vào"
            accept="image"
            hint="JPG, PNG hoặc WebP · Tỷ lệ 16:9 cho kết quả đẹp nhất"
            onUploaded={r => setImage(r)}
            onClear={() => setImage(null)}
          />

          <div className="border-t border-surface-border" />

          {/* Prompt */}
          <div>
            <label className="label">Mô tả video (prompt)</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Mô tả chuyển động và cảnh vật bạn muốn tạo…"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
            {/* Examples */}
            <div className="mt-2 flex flex-wrap gap-2">
              {PROMPT_EXAMPLES.map(ex => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="text-xs px-3 py-1 rounded-full bg-surface-border text-gray-400 hover:text-white hover:bg-surface-hover transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="label">Độ dài video: <span className="text-brand-400 font-bold">{duration}s</span></label>
            <input
              type="range"
              min={3} max={10} step={1}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>3 giây (nhanh hơn)</span>
              <span>10 giây (chi tiết hơn)</span>
            </div>
          </div>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-sm text-red-400">⚠ {formError}</p>
            </div>
          )}

          <button
            onClick={submit}
            disabled={submitting || !image || !prompt.trim()}
            className="btn-primary w-full"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang gửi yêu cầu…
              </>
            ) : '🎬 Tạo Video'}
          </button>

          <p className="text-xs text-center text-gray-600">
            Xử lý thường mất 3–8 phút. Bạn có thể đóng tab và quay lại sau.
          </p>
        </div>
      )}

      <div className="mt-8 card p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Mẹo để có kết quả tốt nhất</h3>
        <ul className="space-y-2 text-sm text-gray-500">
          <li className="flex gap-2"><span>🖼️</span> Ảnh rõ nét, độ phân giải cao</li>
          <li className="flex gap-2"><span>✍️</span> Prompt cụ thể: mô tả chuyển động, ánh sáng, tốc độ</li>
          <li className="flex gap-2"><span>🌐</span> Prompt tiếng Anh cho kết quả ổn định hơn</li>
          <li className="flex gap-2"><span>📐</span> Tỷ lệ ảnh 16:9 hoặc 1:1 cho video đẹp nhất</li>
        </ul>
      </div>
    </div>
  );
}
