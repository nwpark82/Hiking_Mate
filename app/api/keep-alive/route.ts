import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel Cron에서 호출되는 Keep-Alive 엔드포인트
// Supabase Free tier는 1주일 동안 활동이 없으면 일시 중지됨
// 이 엔드포인트를 매일 실행하여 DB 연결 유지

export async function GET(request: Request) {
  // Vercel Cron 인증 확인 (선택적 보안)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET이 설정되어 있으면 인증 확인
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    // 직접 클라이언트 생성 (인증 불필요)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 간단한 SELECT 쿼리로 연결 유지
    const { data, error } = await supabase
      .from('trails')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Keep-alive query failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    console.log('Keep-alive ping successful:', new Date().toISOString());

    return NextResponse.json({
      success: true,
      message: 'Supabase connection is alive',
      timestamp: new Date().toISOString(),
      trailsChecked: data?.length ?? 0
    });

  } catch (error) {
    console.error('Keep-alive error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
