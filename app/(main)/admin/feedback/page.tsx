'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { getAllFeedback, updateFeedbackStatus, type Feedback } from '@/lib/services/feedback';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORY_LABELS: Record<Feedback['category'], string> = {
  bug: '버그',
  feature: '기능 요청',
  question: '질문',
  improvement: '개선 제안',
  other: '기타',
};

const STATUS_LABELS: Record<Feedback['status'], string> = {
  new: '새 피드백',
  in_progress: '처리 중',
  resolved: '해결됨',
  closed: '종료',
};

const STATUS_STYLES: Record<Feedback['status'], string> = {
  new: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
};

type Filter = 'open' | 'all';

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('open');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const data = await getAllFeedback();
    setItems(data);
    setNotes(Object.fromEntries(data.map((f) => [f.id, f.admin_note || ''])));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (item: Feedback, status: Feedback['status']) => {
    const { success, error } = await updateFeedbackStatus(item.id, status, notes[item.id]);
    if (!success) {
      alert('저장 실패: ' + error);
      return;
    }
    load();
  };

  const visible =
    filter === 'open' ? items.filter((f) => f.status === 'new' || f.status === 'in_progress') : items;

  return (
    <>
      <Header title="피드백 관리" />

      <main className="max-w-screen-lg mx-auto p-6 pb-24 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">피드백 관리</h1>
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            {(['open', 'all'] as Filter[]).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 text-sm rounded-md transition ${
                  filter === value ? 'bg-forest-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {value === 'open' ? '미처리' : '전체'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-soft text-gray-500">
            {filter === 'open' ? '처리할 피드백이 없습니다.' : '접수된 피드백이 없습니다.'}
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[item.status]}`}>
                    {STATUS_LABELS[item.status]}
                  </span>
                  <span className="px-2 py-0.5 bg-forest-100 text-forest-700 rounded-full text-xs font-semibold">
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}
                  </span>
                  {item.email && <span className="text-xs text-gray-500">· {item.email}</span>}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-700 whitespace-pre-wrap mb-4">{item.message}</p>

                <textarea
                  value={notes[item.id] ?? ''}
                  onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                  placeholder="답변 (로그인한 작성자에게 문의하기 화면에서 표시됩니다)"
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(STATUS_LABELS) as Feedback['status'][]).map((status) => (
                    <button
                      key={status}
                      onClick={() => save(item, status)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                        item.status === status
                          ? 'border-forest-600 bg-forest-50 text-forest-700 font-semibold'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
