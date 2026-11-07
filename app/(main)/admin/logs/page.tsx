'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { getAdminLogs, type AdminLog } from '@/lib/services/admin';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const ACTION_LABELS: Record<string, string> = {
  delete_post: '게시글 삭제',
  delete_comment: '댓글 삭제',
  ban_user: '회원 정지',
  unban_user: '정지 해제',
  change_role: '권한 변경',
  update_trail: '등산로 수정',
};

const describe = (log: AdminLog) => {
  const d = log.detail || {};
  switch (log.action) {
    case 'delete_post':
      return d.title;
    case 'delete_comment':
      return d.content;
    case 'change_role':
      return `${d.username}: ${d.from} → ${d.to}`;
    case 'update_trail':
      return d.name;
    default:
      return d.username || log.target_id;
  }
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const result = await getAdminLogs();
      setLogs(result.logs);
      setError(result.error);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <>
      <Header title="작업 기록" />

      <main className="max-w-screen-lg mx-auto p-6 pb-24 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 작업 기록</h1>
        <p className="text-gray-600 mb-6">최근 200건 · 삭제·정지·권한 변경·등산로 수정이 자동으로 기록됩니다.</p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 rounded-xl p-4">{error}</div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-soft text-gray-500">기록이 없습니다.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-start gap-3">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold flex-shrink-0">
                  {ACTION_LABELS[log.action] || log.action}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 truncate">{describe(log)}</div>
                  <div className="text-xs text-gray-500">
                    {log.admin_name || '알 수 없음'} · {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
