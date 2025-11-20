'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/services/auth';
import { signInWithGoogle, signInWithKakao, signInWithNaver } from '@/lib/services/social-auth';
import { Mail, Lock, Loader2, Mountain, Eye, EyeOff } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // URL 파라미터에서 에러 확인 (소셜 로그인 에러)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get('error');

      if (errorParam) {
        const errorMessages: { [key: string]: string } = {
          'google_auth_failed': 'Google 로그인에 실패했습니다.',
          'kakao_cancelled': 'Kakao 로그인이 취소되었습니다.',
          'kakao_no_code': 'Kakao 로그인에 실패했습니다.',
          'kakao_csrf': 'Kakao 로그인 보안 오류가 발생했습니다.',
          'kakao_failed': 'Kakao 로그인에 실패했습니다.',
          'naver_cancelled': 'Naver 로그인이 취소되었습니다.',
          'naver_no_code': 'Naver 로그인에 실패했습니다.',
          'naver_csrf': 'Naver 로그인 보안 오류가 발생했습니다.',
          'naver_failed': 'Naver 로그인에 실패했습니다.',
        };

        setError(
          errorMessages[errorParam] ||
          decodeURIComponent(errorParam) ||
          '로그인에 실패했습니다.'
        );
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { user, error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError);
      setLoading(false);
      return;
    }

    if (user) {
      router.push('/');
      router.refresh();
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Mountain className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">하이킹메이트</h1>
          <p className="text-gray-600 mt-2">등산의 모든 것</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 id="login-title" className="text-2xl font-bold text-gray-900 mb-6">로그인</h2>

          {error && (
            <div role="alert" aria-live="assertive" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="login-title">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                  placeholder="example@email.com"
                  aria-label="이메일 주소"
                  aria-required="true"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                  placeholder="••••••••"
                  aria-label="비밀번호"
                  aria-required="true"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link href="/auth/forgot-password" className="text-primary-600 hover:text-primary-700">
                비밀번호 찾기
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          {/* 소셜 로그인 구분선 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* 소셜 로그인 버튼들 */}
          <div className="space-y-3">
            {/* Google 로그인 */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google로 시작하기
            </button>

            {/* Kakao 로그인 */}
            <button
              type="button"
              onClick={signInWithKakao}
              className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#000000] py-3 rounded-lg font-semibold hover:bg-[#FDD835] transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 0C4.477 0 0 3.58 0 8c0 2.86 1.847 5.37 4.633 6.867l-.933 3.467c-.067.25.2.467.433.333l4.233-2.8c.533.067 1.067.133 1.634.133 5.523 0 10-3.58 10-8s-4.477-8-10-8z"
                  fill="#000000"
                />
              </svg>
              카카오로 시작하기
            </button>

            {/* Naver 로그인 */}
            <button
              type="button"
              onClick={signInWithNaver}
              className="w-full flex items-center justify-center gap-3 bg-[#03C75A] text-white py-3 rounded-lg font-semibold hover:bg-[#02B350] transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="white">
                <path d="M13.6 10.8L6.4 0H0v20h6.4V9.2L13.6 20H20V0h-6.4v10.8z" />
              </svg>
              네이버로 시작하기
            </button>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">계정이 없으신가요? </span>
            <Link href="/auth/signup" className="text-primary-600 font-semibold hover:text-primary-700">
              회원가입
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
