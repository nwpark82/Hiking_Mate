'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/services/auth';
import { Mail, Lock, User, Loader2, Mountain, Eye, EyeOff } from 'lucide-react';
import { PasswordRequirements, validatePassword } from '@/components/auth/PasswordRequirements';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { validateEmail, validateEmailRealtime } from '@/lib/utils/email-validation';
import { EmailValidationFeedback } from '@/components/auth/EmailValidationFeedback';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{
    message?: string;
    type?: 'error' | 'warning' | 'success';
  }>({});

  // 이메일 변경 시 실시간 검증
  const handleEmailChange = (value: string) => {
    setEmail(value);
    const validation = validateEmailRealtime(value);
    setEmailValidation({
      message: validation.message,
      type: validation.type,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (username.length < 2) {
      setError('사용자 이름은 최소 2자 이상이어야 합니다.');
      return;
    }

    // 이메일 검증
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      setError(emailResult.error || '올바른 이메일을 입력해주세요.');
      return;
    }

    const { isValid, errors } = validatePassword(password);
    if (!isValid) {
      setError(`비밀번호 요구사항을 확인해주세요: ${errors.join(', ')}`);
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다. 다시 한 번 확인해주세요.');
      return;
    }

    setLoading(true);

    const { user, error: signUpError } = await signUp(email, password, username);

    if (signUpError) {
      setError(signUpError);
      setLoading(false);
      return;
    }

    if (user) {
      alert('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
      router.push('/auth/login');
    }

    setLoading(false);
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

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">회원가입</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                사용자 이름
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                  placeholder="홍길동"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                  placeholder="example@email.com"
                  aria-describedby="email-validation"
                />
              </div>
              <EmailValidationFeedback
                email={email}
                message={emailValidation.message}
                type={emailValidation.type}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 placeholder:text-gray-400"
                  style={{
                    WebkitTextFillColor: '#111827',
                    caretColor: '#111827'
                  }}
                  placeholder="••••••••"
                  aria-describedby="password-requirements"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <PasswordStrengthMeter password={password} />
              <PasswordRequirements password={password} />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 placeholder:text-gray-400"
                  style={{
                    WebkitTextFillColor: '#111827',
                    caretColor: '#111827'
                  }}
                  placeholder="••••••••"
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
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  회원가입 중...
                </>
              ) : (
                '회원가입'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">이미 계정이 있으신가요? </span>
            <Link href="/auth/login" className="text-primary-600 font-semibold hover:text-primary-700">
              로그인
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
