'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import JobCard from '@/components/JobCard';

interface UploadResult { id: string; url: string; }

export default function ClothesChangePage() {
  const [modelImage,   setModelImage]   = useState<UploadResult | null>(null);
  const [garmentImage, setGarmentImage] = useState<UploadResult | null>(null);
  const [jobId,        setJobId]        = useState<string | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [formError,    setFormError]    = useState<string | null>(null);

  const reset = () => {
    setJobId(null);
    setModelImage(null);
    setGarmentImage(null);
    setFormError(null);
  };

  const submit = async () => {
    if (!modelImage || !garmentImage) {
      setFormError('Vui lòng upload đủ ảnh người mẫu và ảnh trang phục.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const res  = await fetch('/api/generate/clothes-change', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          modelImageUrl:   modelImage.url,
          garmentImageUrl: garmentImage.url,
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xl">
            👗
          </div>
          <div>
            <h1 className="section-title">AI Thay Trang Phục</h1>
            <p className="section-desc">Upload người mẫu + trang phục → AI ghép tự nhiên</p>
          </div>
        </div>
      </div>

      {jobId ? (
        <div className="space-y-4">
          <JobCard jobId={jobId} />
          <button onClick={reset} className="btn-ghost w-full">← Tạo ảnh mới</button>
        </div>
      ) : (
        <div className="card p-6 space-y-6">
          {/* Side-by-side uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-3">Ảnh người mẫu</div>
              <FileUpload
                label="Ảnh người mẫu"
                accept="image"
                hint="Người đứng thẳng, ảnh toàn thân hoặc nửa người"
                onUploaded={r => setModelImage(r)}
                onClear={() => setModelImage(null)}
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">Ảnh trang phục</div>
              <FileUpload
                label="Ảnh trang phục"
                accept="image"
                hint="Ảnh trang phục trên nền trắng cho kết quả tốt nhất"
                onUploaded={r => setGarmentImage(r)}
                onClear={() => setGarmentImage(null)}
              />
            </div>
          </div>

          {/* Preview arrow */}
          {modelImage && garmentImage && (
            <div className="flex items-center justify-center gap-4 py-2">
              <span className="text-sm text-gray-500">Người mẫu + Trang phục</span>
              <span className="text-2xl text-brand-400">→</span>
              <span className="text-sm text-gray-500">Ảnh kết quả</span>
            </div>
          )}

          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-sm text-red-400">⚠ {formError}</p>
            </div>
          )}

          <button
            onClick={submit}
            disabled={submitting || !modelImage || !garmentImage}
            className="btn-primary w-full"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang gửi yêu cầu…
              </>
            ) : '✨ Thay Trang Phục'}
          </button>

          <p className="text-xs text-center text-gray-600">
            Thường xong trong 2–5 phút
          </p>
        </div>
      )}

      <div className="mt-8 card p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Để có kết quả chân thực nhất</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">👤 Ảnh người mẫu</p>
            <ul className="space-y-1.5 text-sm text-gray-500">
              <li>• Tư thế đứng thẳng, nhìn thẳng</li>
              <li>• Thấy rõ phần thân trên (torso)</li>
              <li>• Nền đơn giản, ánh sáng đều</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">👗 Ảnh trang phục</p>
            <ul className="space-y-1.5 text-sm text-gray-500">
              <li>• Nền trắng hoặc xám nhạt</li>
              <li>• Trang phục phẳng hoặc treo trên mannequin</li>
              <li>• Ảnh rõ nét, thấy đủ chi tiết</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
