'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { listUsers, setUserBan, setUserRole, type AdminUser } from '@/lib/services/admin';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Search, Ban, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const formatDate = (value: string | null) =>
  value ? format(new Date(value), 'yyyy-MM-dd HH:mm') : '-';

const isBanned = (user: AdminUser) =>
  !!user.banned_until && new Date(user.banned_until) > new Date();

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [myId, setMyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { users: data, error: loadError } = await listUsers();
    setUsers(data);
    setError(loadError);
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  const handleRole = async (user: AdminUser, role: AdminUser['role']) => {
    if (role === user.role) return;
    if (!confirm(`"${user.username}" 회원의 권한을 ${user.role} → ${role}(으)로 변경하시겠습니까?`)) return;

    const { error: roleError } = await setUserRole(user.id, role);
    if (roleError) {
      alert('권한 변경 실패: ' + roleError);
    }
    load();
  };

  const handleBan = async (user: AdminUser) => {
    const banned = !isBanned(user);
    const message = banned
      ? `"${user.username}" 회원을 정지하시겠습니까?\n로그인이 차단되고 현재 세션이 종료됩니다.`
      : `"${user.username}" 회원의 정지를 해제하시겠습니까?`;
    if (!confirm(message)) return;

    const { error: banError } = await setUserBan(user.id, banned);
    if (banError) {
      alert('처리 실패: ' + banError);
      return;
    }
    load();
  };

  const keyword = query.trim().toLowerCase();
  const filtered = keyword
    ? users.filter(
        (u) => u.username.toLowerCase().includes(keyword) || u.email.toLowerCase().includes(keyword)
      )
    : users;

  return (
    <>
      <Header title="회원 관리" />

      <main className="max-w-screen-lg mx-auto p-6 pb-24 bg-gray-50 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">회원 관리</h1>
            <p className="text-gray-600">전체 {users.length}명</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="닉네임 또는 이메일"
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 rounded-xl p-4">{error}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-gray-900">{user.username}</span>
                    {user.role !== 'user' && (
                      <span className="px-2 py-0.5 bg-forest-100 text-forest-700 rounded-full text-xs font-semibold">
                        {user.role}
                      </span>
                    )}
                    {isBanned(user) && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        정지됨
                      </span>
                    )}
                    {!user.email_confirmed_at && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                        이메일 미인증
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 truncate">{user.email}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    가입 {formatDate(user.created_at)} · 최근 로그인 {formatDate(user.last_sign_in_at)} · 게시글{' '}
                    {user.posts_count}
                  </div>
                </div>
                {user.id !== myId && (
                  <select
                    value={user.role}
                    onChange={(e) => handleRole(user, e.target.value as AdminUser['role'])}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white"
                    title="권한 변경"
                  >
                    <option value="user">일반 회원</option>
                    <option value="moderator">운영자</option>
                    <option value="admin">관리자</option>
                  </select>
                )}
                {user.role === 'user' && (
                  <button
                    onClick={() => handleBan(user)}
                    className={`flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      isBanned(user)
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    {isBanned(user) ? (
                      <>
                        <CheckCircle className="w-4 h-4" /> 정지 해제
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4" /> 정지
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
