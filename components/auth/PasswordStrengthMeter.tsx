'use client';

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number;
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;

  if (!password) {
    return { strength: 'weak', score: 0 };
  }

  // 길이 점수
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 25;

  // 문자 조합 점수
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 25;
  if (/[0-9]/.test(password)) score += 15;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;

  // 강도 계산
  if (score < 40) return { strength: 'weak', score };
  if (score < 70) return { strength: 'medium', score };
  return { strength: 'strong', score };
}

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

export function PasswordStrengthMeter({ password, className = '' }: PasswordStrengthMeterProps) {
  const { strength, score } = getPasswordStrength(password);

  const colors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const textColors = {
    weak: 'text-red-600',
    medium: 'text-yellow-600',
    strong: 'text-green-600',
  };

  const labels = {
    weak: '약함',
    medium: '보통',
    strong: '강함',
  };

  if (!password) {
    return null;
  }

  return (
    <div className={`mt-3 ${className}`}>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-semibold text-gray-700">비밀번호 강도</span>
        <span className={`text-xs font-bold ${textColors[strength]}`}>
          {labels[strength]}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${colors[strength]}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
