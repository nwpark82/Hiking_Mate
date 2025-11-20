'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { resetPassword } from '@/lib/services/auth';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { validateEmail } from '@/lib/utils/email-validation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    // Email validation
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      setError(emailResult.error || '올바른 이메일을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) throw new Error(resetError);

      setSent(true);
    } catch (error: any) {
      setError(error.message || '이메일 전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center" role="status" aria-live="polite">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            이메일을 확인하세요
          </h1>

          <p className="text-gray-600 mb-6 leading-relaxed">
            <span className="font-semibold text-gray-900">{email}</span>로
            비밀번호 재설정 링크를 보냈습니다.
            <br />
            <br />
            이메일을 확인하고 링크를 클릭하여 비밀번호를 재설정하세요.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6" role="note">
            <p className="text-sm text-blue-800">
              💡 이메일이 오지 않았나요?
              <br />
              스팸 메일함을 확인해보세요.
            </p>
          </div>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h1 id="forgot-password-title" className="text-2xl font-bold text-gray-900 mb-2">
            비밀번호 재설정
          </h1>
          <p className="text-gray-600">
            가입하신 이메일 주소를 입력하세요.
            <br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6" aria-labelledby="forgot-password-title">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hiking@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
              autoFocus
              aria-label="이메일 주소"
              aria-required="true"
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl py-3 font-semibold hover:from-primary-600 hover:to-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                전송 중...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" aria-hidden="true" />
                재설정 링크 보내기
              </>
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
