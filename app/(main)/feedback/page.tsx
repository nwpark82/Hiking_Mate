'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/lib/hooks/useAuth';
import { createFeedback, type CreateFeedbackData } from '@/lib/services/feedback';
import { Bug, Lightbulb, HelpCircle, TrendingUp, MessageSquare, Send } from 'lucide-react';

const CATEGORIES = [
  { value: 'bug', label: '버그 제보', icon: Bug, description: '문제나 오류를 발견하셨나요?' },
  { value: 'feature', label: '기능 제안', icon: Lightbulb, description: '새로운 기능을 제안해주세요' },
  { value: 'improvement', label: '개선 요청', icon: TrendingUp, description: '기존 기능 개선 아이디어' },
  { value: 'question', label: '문의사항', icon: HelpCircle, description: '궁금한 점이 있으신가요?' },
  { value: 'other', label: '기타', icon: MessageSquare, description: '그 외 의견을 남겨주세요' },
] as const;

export default function FeedbackPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<CreateFeedbackData['category']>('other');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    if (!user && !email.trim()) {
      alert('이메일을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    const feedbackData: CreateFeedbackData = {
      category: selectedCategory,
      title: title.trim(),
      message: message.trim(),
    };

    if (!user) {
      feedbackData.email = email.trim();
    }

    const result = await createFeedback(feedbackData);

    setIsSubmitting(false);

    if (result.success) {
      setSubmitSuccess(true);
      setTitle('');
      setMessage('');
      setEmail('');
      setSelectedCategory('other');

      // 3초 후 자동으로 성공 메시지 숨김
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } else {
      alert(result.error || '피드백 전송에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <>
      <Header title="문의하기" />

      <main className="max-w-screen-lg mx-auto p-4 pb-24">
        {/* Success Message */}
        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 text-green-800">
              <Send className="w-5 h-5" />
              <p className="font-semibold">피드백이 성공적으로 전송되었습니다!</p>
            </div>
            <p className="text-sm text-green-600 mt-1">
              소중한 의견 감사합니다. 빠른 시일 내에 검토하겠습니다.
            </p>
          </div>
        )}

        {/* Intro */}
        <div className="mb-6 bg-gradient-to-br from-forest-50 via-forest-100/50 to-mountain-50 rounded-2xl p-6 border border-forest-200/50 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-6 h-6 text-forest-600" />
            <h2 className="text-xl font-bold text-gray-900">
              하이킹메이트를 더 좋게 만들어주세요
            </h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            버그 제보, 기능 제안, 문의사항 등 어떤 의견이든 환영합니다.
            {user ? ' 로그인된 계정으로 전송됩니다.' : ' 이메일을 입력해주시면 답변을 보내드립니다.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              카테고리 선택
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.value;

                return (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setSelectedCategory(category.value)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left shadow-sm hover:shadow-md ${
                      isSelected
                        ? 'border-forest-500 bg-gradient-to-br from-forest-50 to-forest-100/50 scale-[1.02]'
                        : 'border-gray-200 hover:border-forest-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-forest-100' : 'bg-gray-100'}`}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-forest-600' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <p className={`font-bold ${isSelected ? 'text-forest-700' : 'text-gray-900'}`}>
                          {category.label}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email (비로그인 사용자만) */}
          {!user && (
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="답변을 받을 이메일 주소"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required={!user}
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="간단하게 제목을 입력해주세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              maxLength={100}
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="자세한 내용을 입력해주세요. 스크린샷이나 예시를 함께 설명해주시면 더 빠르게 도움을 드릴 수 있습니다."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[200px] resize-y"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-4 px-6 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-forest-600 to-forest-500 text-white rounded-xl font-bold hover:from-forest-700 hover:to-forest-600 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  처리 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  전송하기
                </>
              )}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600">
            💡 <strong>팁:</strong> 버그를 제보할 때는 발생한 상황을 자세히 설명해주시면 빠르게 해결할 수 있습니다.
            (예: 어떤 페이지에서, 어떤 버튼을 눌렀을 때, 어떤 오류가 발생했는지)
          </p>
        </div>
      </main>
    </>
  );
}
