'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { getReports, updateReport, deleteReportedContent, type Report } from '@/lib/services/admin';
import { Loader2, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const TARGET_LABELS: Record<Report['target_type'], string> = {
  post: '게시글',
  comment: '댓글',
  user: '회원',
};

const STATUS_LABELS: Record<Report['status'], string> = {
  pending: '대기',
  reviewing: '검토 중',
  resolved: '조치 완료',
  dismissed: '기각',
};

const STATUS_STYLES: Record<Report['status'], string> = {
  pending: 'bg-red-100 text-red-700',
  reviewing: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-600',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { reports: data, error: loadError } = await getReports();
    setReports(data);
    setError(loadError);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const changeStatus = async (report: Report, status: Report['status']) => {
    const { error: updateError } = await updateReport(report.id, status);
    if (updateError) {
      alert('저장 실패: ' + updateError);
      return;
    }
    load();
  };

  const removeContent = async (report: Report) => {
    if (report.target_type === 'user') return;
    const label = TARGET_LABELS[report.target_type];
    if (!confirm(`신고된 ${label}을(를) 삭제하시겠습니까? 되돌릴 수 없습니다.`)) return;

    const { error: deleteError } = await deleteReportedContent(report.target_type, report.target_id);
    if (deleteError) {
      alert('삭제 실패: ' + deleteError);
      return;
    }
    await updateReport(report.id, 'resolved', `${label} 삭제`);
    load();
  };

  return (
    <>
      <Header title="신고 관리" />

      <main className="max-w-screen-lg mx-auto p-6 pb-24 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">신고 관리</h1>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 rounded-xl p-4">{error}</div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-soft text-gray-500">
            접수된 신고가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[report.status]}`}>
                    {STATUS_LABELS[report.status]}
                  </span>
                  <span className="px-2 py-0.5 bg-forest-100 text-forest-700 rounded-full text-xs font-semibold">
                    {TARGET_LABELS[report.target_type]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(report.created_at), 'yyyy-MM-dd HH:mm')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{report.reason}</h3>
                {report.description && (
                  <p className="text-gray-700 whitespace-pre-wrap mb-3">{report.description}</p>
                )}
                {report.admin_note && (
                  <p className="text-sm text-gray-500 mb-3">메모: {report.admin_note}</p>
                )}

                <div className="flex gap-2 flex-wrap items-center">
                  {report.target_type === 'post' && (
                    <Link
                      href={`/community/${report.target_id}`}
                      target="_blank"
                      className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      <ExternalLink className="w-4 h-4" /> 게시글 보기
                    </Link>
                  )}
                  {(Object.keys(STATUS_LABELS) as Report['status'][]).map((status) => (
                    <button
                      key={status}
                      onClick={() => changeStatus(report, status)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                        report.status === status
                          ? 'border-forest-600 bg-forest-50 text-forest-700 font-semibold'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                  {report.target_type !== 'user' && (
                    <button
                      onClick={() => removeContent(report)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" /> 콘텐츠 삭제
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
