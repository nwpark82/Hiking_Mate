/**
 * 이메일 유효성 검증 유틸리티
 */

// 일회용 이메일 도메인 목록 (자주 사용되는 것들)
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  'throwaway.email',
  'guerrillamail.com',
  '10minutemail.com',
  'mailinator.com',
  'trashmail.com',
  'temp-mail.org',
  'yopmail.com',
];

// 이메일 형식 검증을 위한 정규식 (RFC 5322 기반)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * 이메일 형식 유효성 검증
 */
export function validateEmail(email: string): EmailValidationResult {
  const warnings: string[] = [];

  // 빈 값 체크
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      error: '이메일을 입력해주세요.',
    };
  }

  // 공백 체크
  if (email.includes(' ')) {
    return {
      isValid: false,
      error: '이메일에 공백을 포함할 수 없습니다.',
    };
  }

  // 길이 체크 (최대 254자)
  if (email.length > 254) {
    return {
      isValid: false,
      error: '이메일이 너무 깁니다.',
    };
  }

  // 기본 형식 검증
  if (!EMAIL_REGEX.test(email)) {
    return {
      isValid: false,
      error: '올바른 이메일 형식이 아닙니다.',
    };
  }

  // @ 기호 체크
  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) {
    return {
      isValid: false,
      error: '올바른 이메일 형식이 아닙니다.',
    };
  }

  // 도메인 추출
  const [localPart, domain] = email.split('@');

  // 로컬 파트 검증
  if (!localPart || localPart.length === 0) {
    return {
      isValid: false,
      error: '이메일 주소가 올바르지 않습니다.',
    };
  }

  if (localPart.length > 64) {
    return {
      isValid: false,
      error: '이메일 주소가 너무 깁니다.',
    };
  }

  // 도메인 검증
  if (!domain || domain.length === 0) {
    return {
      isValid: false,
      error: '이메일 도메인이 올바르지 않습니다.',
    };
  }

  // 도메인에 최소 하나의 점이 있어야 함
  if (!domain.includes('.')) {
    return {
      isValid: false,
      error: '이메일 도메인이 올바르지 않습니다.',
    };
  }

  // 도메인이 점으로 시작하거나 끝나면 안됨
  if (domain.startsWith('.') || domain.endsWith('.')) {
    return {
      isValid: false,
      error: '이메일 도메인이 올바르지 않습니다.',
    };
  }

  // 일회용 이메일 체크
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain.toLowerCase())) {
    warnings.push('일회용 이메일 주소는 권장하지 않습니다.');
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * 실시간 이메일 검증 (입력 중)
 */
export function validateEmailRealtime(email: string): {
  isValid: boolean;
  message?: string;
  type?: 'error' | 'warning' | 'success';
} {
  if (!email || email.trim() === '') {
    return { isValid: true }; // 빈 값은 실시간에서는 에러로 표시하지 않음
  }

  const result = validateEmail(email);

  if (!result.isValid && result.error) {
    return {
      isValid: false,
      message: result.error,
      type: 'error',
    };
  }

  if (result.warnings && result.warnings.length > 0) {
    return {
      isValid: true,
      message: result.warnings[0],
      type: 'warning',
    };
  }

  return {
    isValid: true,
    message: '올바른 이메일 형식입니다.',
    type: 'success',
  };
}
