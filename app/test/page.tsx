'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('연결 테스트 중...');

  useEffect(() => {
    async function testConnection() {
      try {
        // Supabase 연결 테스트
        const { data, error } = await supabase.from('_test_').select('*').limit(1);

        // 테이블이 없어도 연결은 성공한 것
        if (error && error.code !== 'PGRST116') {
          // PGRST116은 "테이블 없음" 에러 (연결은 성공)
          throw error;
        }

        setStatus('success');
        setMessage('✅ Supabase 연결 성공!');
      } catch (error: any) {
        setStatus('error');
        setMessage(`❌ 연결 실패: ${error.message}`);
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4">Supabase 연결 테스트</h1>

        <div className={`p-4 rounded-lg ${
          status === 'loading' ? 'bg-blue-50' :
          status === 'success' ? 'bg-green-50' :
          'bg-red-50'
        }`}>
          <p className={`text-lg ${
            status === 'loading' ? 'text-blue-700' :
            status === 'success' ? 'text-green-700' :
            'text-red-700'
          }`}>
            {message}
          </p>
        </div>

        {status === 'success' && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h2 className="font-semibold mb-2">환경변수 확인:</h2>
            <ul className="text-sm space-y-1">
              <li>
                ✅ NEXT_PUBLIC_SUPABASE_URL: {
                  process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)
                }...
              </li>
              <li>
                ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: {
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30)
                }...
              </li>
              <li>
                ✅ NEXT_PUBLIC_KAKAO_MAP_KEY: {
                  process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ? '설정됨' : '❌ 없음'
                }
              </li>
            </ul>
          </div>
        )}

        <div className="mt-6">
          <a
            href="/"
            className="block text-center bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
