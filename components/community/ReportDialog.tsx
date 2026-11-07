'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createReport, REPORT_REASONS, type ReportTargetType } from '@/lib/services/reports';

interface ReportDialogProps {
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
}

const TARGET_LABELS: Record<ReportTargetType, string> = {
  post: '게시글',
  comment: '댓글',
  user: '회원',
};

export function ReportDialog({ targetType, targetId, onClose }: ReportDialogProps) {
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await createReport(targetType, targetId, reason, description);

    setSubmitting(false);
    if (error) {
      alert(error);
      return;
    }

    alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{TARGET_LABELS[targetType]} 신고</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {REPORT_REASONS.map((item) => (
            <label
              key={item}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                reason === item ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={item}
                checked={reason === item}
                onChange={() => setReason(item)}
                className="accent-red-500"
              />
              <span className="text-sm text-gray-800">{item}</span>
            </label>
          ))}
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="상세 내용 (선택)"
          maxLength={500}
          rows={3}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-400"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          신고하기
        </button>
      </form>
    </div>
  );
}
