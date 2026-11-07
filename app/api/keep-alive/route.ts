import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel Cron에서 호출되는 Keep-Alive 엔드포인트
// Supabase Free tier는 1주일 동안 활동이 없으면 일시 중지됨
// 이 엔드포인트를 매일 실행하여 DB 연결 유지

// DB 장애 시 Discord로 알림 (DB가 죽어 있을 수 있으므로 웹훅 URL은 Vercel 환경변수로 관리)
async function notifyFailure(reason: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `⚠️ **DB 상태 점검 실패** — ${reason.slice(0, 500)}
Supabase 대시보드에서 프로젝트 상태(일시정지 여부)를 확인하세요.`,
        allowed_mentions: { parse: [] },
      }),
    });
  } catch (error) {
    console.error('Failed to send failure notification:', error);
  }
}

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
      await notifyFailure(error.message);
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
    await notifyFailure(error instanceof Error ? error.message : 'Unknown error');
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
