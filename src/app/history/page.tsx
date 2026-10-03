import JobHistory from '@/components/JobHistory';

export const dynamic = 'force-dynamic';

export default function HistoryPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="section-title">📋 Lịch sử tạo</h1>
        <p className="section-desc">Tất cả các yêu cầu AI của bạn, cập nhật real-time</p>
      </div>
      <JobHistory />
    </div>
  );
}
