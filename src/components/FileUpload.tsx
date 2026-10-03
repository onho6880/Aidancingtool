'use client';

import { useCallback, useRef, useState } from 'react';

interface UploadResult {
  id:       string;
  url:      string;
  filename: string;
  original: string;
  type:     string;
  size:     number;
}

interface FileUploadProps {
  label:         string;
  accept:        'image' | 'video' | 'image+video';
  onUploaded:    (result: UploadResult) => void;
  onClear?:      () => void;
  maxSizeMB?:    number;
  hint?:         string;
  currentUrl?:   string;
  disabled?:     boolean;
}

const ACCEPT_MAP = {
  image:       'image/jpeg,image/png,image/webp',
  video:       'video/mp4,video/quicktime,video/webm',
  'image+video': 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm',
};

const LABEL_MAP = {
  image:       'JPG, PNG, WebP',
  video:       'MP4, MOV, WebM',
  'image+video': 'JPG, PNG, MP4, WebM',
};

export default function FileUpload({
  label, accept, onUploaded, onClear, maxSizeMB = 100, hint, currentUrl, disabled = false,
}: FileUploadProps) {
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [preview, setPreview]     = useState<{ url: string; type: string } | null>(
    currentUrl ? { url: currentUrl, type: accept === 'video' ? 'video' : 'image' } : null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File quá lớn. Tối đa ${maxSizeMB}MB`);
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview({ url: localUrl, type: file.type.startsWith('video') ? 'video' : 'image' });

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);

      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Lỗi tải file');

      onUploaded(data);
    } catch (e: any) {
      setError(e.message);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [maxSizeMB, onUploaded]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clear = () => {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onClear?.();
  };

  return (
    <div className="space-y-2">
      <label className="label">{label}</label>

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-surface-border bg-surface-card group">
          {preview.type === 'video' ? (
            <video src={preview.url} controls className="w-full max-h-48 object-contain bg-black" />
          ) : (
            <img src={preview.url} alt="preview" className="w-full max-h-48 object-contain bg-black" />
          )}
          {!disabled && (
            <button
              onClick={clear}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 border border-white/20 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          className={`drop-zone ${dragging ? 'active' : ''} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-brand-500/40 border-t-brand-500 rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Đang tải lên…</span>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-surface-border flex items-center justify-center text-2xl">
                {accept === 'video' ? '🎥' : accept === 'image' ? '🖼️' : '📁'}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-300">
                  Kéo thả file hoặc <span className="text-brand-400">chọn file</span>
                </p>
                <p className="text-xs text-gray-600 mt-1">{LABEL_MAP[accept]} · Tối đa {maxSizeMB}MB</p>
                {hint && <p className="text-xs text-gray-600 mt-0.5">{hint}</p>}
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MAP[accept]}
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        disabled={disabled}
      />
    </div>
  );
}
