'use client';

import { CheckCircle, Circle } from 'lucide-react';

export interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  required: boolean;
}

const requirements: PasswordRequirement[] = [
  { label: '최소 8자 이상', test: (p) => p.length >= 8, required: true },
  { label: '영문 대문자 포함', test: (p) => /[A-Z]/.test(p), required: true },
  { label: '영문 소문자 포함', test: (p) => /[a-z]/.test(p), required: true },
  { label: '숫자 포함', test: (p) => /[0-9]/.test(p), required: true },
  { label: '특수문자 포함 (권장)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p), required: false },
];

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

export function PasswordRequirements({ password, className = '' }: PasswordRequirementsProps) {
  return (
    <div className={`mt-3 space-y-2 ${className}`}>
      <p className="text-xs font-semibold text-gray-700">비밀번호 요구사항:</p>
      <div className="space-y-1.5">
        {requirements.map((req, idx) => {
          const met = password ? req.test(password) : false;
          return (
            <div key={idx} className="flex items-center gap-2">
              {met ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
              )}
              <span className={`text-xs ${met ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  requirements.forEach(req => {
    if (req.required && !req.test(password)) {
      errors.push(req.label);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
