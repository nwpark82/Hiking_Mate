'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import {
  getAdminStats,
  listUsers,
  getUsage,
  type AdminStats,
  type AdminUser,
  type AdminUsage,
} from '@/lib/services/admin';
import {
  Users,
  MessageSquare,
  AlertTriangle,
  FileText,
  BookOpen,
  Loader2,
  ChevronRight,
  Mountain,
  History,
  Database,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

// Supabase 무료 플랜 한도
const FREE_DB_BYTES = 500 * 1024 * 1024;
const FREE_STORAGE_BYTES = 1024 * 1024 * 1024;

const formatMB = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percent = Math.min(100, (used / limit) * 100);
  const color = percent > 80 ? 'bg-red-500' : percent > 60 ? 'bg-yellow-500' : 'bg-forest-600';
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">
          {formatMB(used)} / {formatMB(limit)} ({percent.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [usage, setUsage] = useState<AdminUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [statsData, { users }, { usage: usageData }] = await Promise.all([
        getAdminStats(),
        listUsers(),
        getUsage(),
      ]);
      setStats(statsData);
      setRecentUsers(users.slice(0, 5));
      setUsage(usageData);
      setLoading(false);
    };
    load();
  }, []);

  const cards = stats
    ? [
        { label: '전체 회원', value: stats.totalUsers, sub: `최근 7일 +${stats.newUsers7d}`, icon: Users, href: '/admin/users' },
        { label: '커뮤니티 글', value: stats.totalPosts, sub: '전체', icon: FileText, href: '/admin/content' },
        { label: '새 피드백', value: stats.newFeedback, sub: '미처리', icon: MessageSquare, href: '/admin/feedback', alert: stats.newFeedback > 0 },
        { label: '신고', value: stats.pendingReports, sub: '처리 대기', icon: AlertTriangle, href: '/admin/reports', alert: stats.pendingReports > 0 },
      ]
    : [];

  const menus = [
    { label: '회원 관리', desc: '회원 목록, 가입일, 최근 로그인, 정지', icon: Users, href: '/admin/users' },
    { label: '피드백 관리', desc: '문의/버그 제보 확인 및 답변 메모', icon: MessageSquare, href: '/admin/feedback' },
    { label: '신고 관리', desc: '신고된 게시글/댓글 처리', icon: AlertTriangle, href: '/admin/reports' },
    { label: '콘텐츠 관리', desc: '게시글/댓글 검색·삭제, 공지 작성', icon: FileText, href: '/admin/content' },
    { label: '등산로 관리', desc: '등산로 이름·난이도·설명·주의사항 수정', icon: Mountain, href: '/admin/trails' },
    { label: '작업 기록', desc: '삭제·정지·권한 변경 등 관리자 작업 이력', icon: History, href: '/admin/logs' },
    { label: '블로그 관리', desc: 'DB 블로그 (현재 사이트 미노출, 공개 블로그는 content/blog 파일로 관리)', icon: BookOpen, href: '/admin/blog' },
  ];

  return (
    <>
      <Header title="관리자" />

      <main className="max-w-screen-lg mx-auto p-6 pb-24 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">관리자 대시보드</h1>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {cards.map((card) => (
                <Link
                  key={card.label}
                  href={card.href}
                  className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">{card.label}</span>
                    <card.icon className={`w-5 h-5 ${card.alert ? 'text-red-500' : 'text-forest-600'}`} />
                  </div>
                  <div className={`text-3xl font-bold ${card.alert ? 'text-red-600' : 'text-gray-900'}`}>
                    {card.value}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{card.sub}</div>
                </Link>
              ))}
            </div>

            <section className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-forest-600" />
                <h2 className="text-lg font-bold text-gray-900">Supabase 사용량 (무료 플랜 기준)</h2>
              </div>
              {usage ? (
                <div className="space-y-4">
                  <UsageBar label="데이터베이스" used={usage.db_bytes} limit={FREE_DB_BYTES} />
                  <UsageBar
                    label={`파일 저장소 (${usage.storage_files}개)`}
                    used={usage.storage_bytes}
                    limit={FREE_STORAGE_BYTES}
                  />
                  <p className="text-xs text-gray-500">
                    등산로 {usage.trails}개 · 댓글 {usage.comments}개 · 산행 기록 {usage.tracking_sessions}개
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  사용량을 불러올 수 없습니다. DB 관리자 함수(admin_usage)가 설치되었는지 확인하세요.
                </p>
              )}
            </section>

            <div className="grid md:grid-cols-2 gap-6">
              <section className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">관리 메뉴</h2>
                <div className="space-y-2">
                  {menus.map((menu) => (
                    <Link
                      key={menu.href}
                      href={menu.href}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition"
                    >
                      <div className="bg-forest-50 p-2 rounded-lg">
                        <menu.icon className="w-5 h-5 text-forest-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{menu.label}</div>
                        <div className="text-sm text-gray-500">{menu.desc}</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </section>

              <section className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">최근 가입</h2>
                  <Link href="/admin/users" className="text-sm text-forest-600 hover:underline">
                    전체 보기
                  </Link>
                </div>
                {recentUsers.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    회원 정보를 불러올 수 없습니다. DB 관리자 함수(admin_list_users)가 설치되었는지 확인하세요.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {recentUsers.map((user) => (
                      <li key={user.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{user.username}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: ko })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </>
  );
}
