/**
 * Multi-Factor Authentication (MFA) 서비스
 * Supabase MFA를 사용한 2단계 인증 구현
 */

import { supabase } from '@/lib/supabase/client';

/**
 * MFA 등록 시작
 * QR 코드와 시크릿 키를 반환
 */
export async function enrollMFA() {
  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: '하이킹메이트 인증',
    });

    if (error) throw error;

    // data 구조:
    // {
    //   id: "factor-id",
    //   type: "totp",
    //   totp: {
    //     qr_code: "data:image/svg+xml;...",  // QR 코드 이미지
    //     secret: "SECRET_KEY_HERE",          // 수동 입력용 시크릿
    //     uri: "otpauth://totp/..."           // URI
    //   }
    // }

    return { data, error: null };
  } catch (error: any) {
    console.error('MFA enroll error:', error);
    return { data: null, error: error.message || 'MFA 등록에 실패했습니다.' };
  }
}

/**
 * MFA 검증 및 활성화
 * 사용자가 입력한 6자리 코드로 MFA 활성화
 */
export async function verifyAndEnableMFA(factorId: string, code: string) {
  try {
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) throw challenge.error;

    const verify = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code,
    });

    if (verify.error) throw verify.error;

    return { data: verify.data, error: null };
  } catch (error: any) {
    console.error('MFA verify error:', error);
    return { data: null, error: error.message || 'MFA 인증에 실패했습니다.' };
  }
}

/**
 * 로그인 시 MFA 챌린지 생성
 * 로그인 후 MFA가 활성화된 경우 호출
 */
export async function createMFAChallenge(factorId: string) {
  try {
    const { data, error } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (error) throw error;

    // data 구조:
    // {
    //   id: "challenge-id",
    //   expires_at: 1234567890
    // }

    return { data, error: null };
  } catch (error: any) {
    console.error('MFA challenge error:', error);
    return { data: null, error: error.message || 'MFA 챌린지 생성에 실패했습니다.' };
  }
}

/**
 * MFA 코드 검증 (로그인 시)
 * 사용자가 입력한 6자리 코드로 로그인 완료
 */
export async function verifyMFACode(factorId: string, challengeId: string, code: string) {
  try {
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('MFA code verify error:', error);
    return { data: null, error: error.message || 'MFA 코드 검증에 실패했습니다.' };
  }
}

/**
 * 활성화된 MFA 요소 목록 가져오기
 */
export async function listMFAFactors() {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) throw error;

    // data 구조:
    // {
    //   all: [...],         // 모든 요소
    //   totp: [...]         // TOTP 요소만
    // }

    return { data, error: null };
  } catch (error: any) {
    console.error('MFA list error:', error);
    return { data: null, error: error.message || 'MFA 목록 조회에 실패했습니다.' };
  }
}

/**
 * MFA 해제
 * 특정 MFA 요소 제거
 */
export async function unenrollMFA(factorId: string) {
  try {
    const { data, error } = await supabase.auth.mfa.unenroll({
      factorId,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('MFA unenroll error:', error);
    return { data: null, error: error.message || 'MFA 해제에 실패했습니다.' };
  }
}

/**
 * 사용자에게 MFA가 활성화되어 있는지 확인
 */
export async function isMFAEnabled(): Promise<boolean> {
  try {
    const { data } = await listMFAFactors();
    return !!(data?.totp && data.totp.length > 0);
  } catch (error) {
    return false;
  }
}

/**
 * 현재 사용자 세션 확인
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

/**
 * AAL (Authenticator Assurance Level) 확인
 * AAL1: 단일 인증 (이메일/비밀번호만)
 * AAL2: 다중 인증 (MFA 완료)
 */
export async function getAssuranceLevel() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!session || error) return null;

    // Supabase는 aal (Authenticator Assurance Level)을 제공
    return (session as any).aal || 'aal1';
  } catch (error) {
    return null;
  }
}
