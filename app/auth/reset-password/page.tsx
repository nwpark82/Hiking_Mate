'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updatePassword } from '@/lib/services/auth';
import { Lock, CheckCircle, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { PasswordRequirements, validatePassword } from '@/components/auth/PasswordRequirements';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Check if we have the access token from the email link
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (!accessToken || type !== 'recovery') {
      setError('유효하지 않은 링크입니다. 비밀번호 재설정을 다시 요청해주세요.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (!newPassword || !confirmPassword) {
      setValidationError('비밀번호를 입력해주세요.');
      return;
    }

    const { isValid, errors } = validatePassword(newPassword);
    if (!isValid) {
      setValidationError(`비밀번호 요구사항을 확인해주세요: ${errors.join(', ')}`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('비밀번호가 일치하지 않습니다. 다시 한 번 확인해주세요.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await updatePassword(newPassword);
      if (updateError) throw new Error(updateError);

      setSuccess(true);
    } catch (error: any) {
      setValidationError(error.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            비밀번호가 변경되었습니다
          </h1>

          <p className="text-gray-600 mb-8">
            새로운 비밀번호로 로그인하실 수 있습니다.
          </p>

          <button
            onClick={() => router.push('/auth/login')}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl py-3 font-semibold hover:from-primary-600 hover:to-primary-700 transition"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            링크가 만료되었습니다
          </h1>

          <p className="text-gray-600 mb-8">
            {error}
          </p>

          <Link
            href="/auth/forgot-password"
            className="inline-block w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl py-3 font-semibold hover:from-primary-600 hover:to-primary-700 transition"
          >
            비밀번호 재설정 다시 요청
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
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            새 비밀번호 설정
          </h1>
          <p className="text-gray-600">
            새로운 비밀번호를 입력해주세요.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {validationError}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              새 비밀번호
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호"
                className="w-full px-4 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                autoFocus
                aria-describedby="password-requirements"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showNewPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <PasswordStrengthMeter password={newPassword} />
            <PasswordRequirements password={newPassword} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              비밀번호 확인
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 확인"
                className="w-full px-4 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl py-3 font-semibold hover:from-primary-600 hover:to-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                변경 중...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                비밀번호 변경
              </>
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="text-gray-600 hover:text-gray-900 transition text-sm"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
