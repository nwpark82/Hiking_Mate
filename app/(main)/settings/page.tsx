'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/lib/hooks/useAuth';
import { signOut } from '@/lib/services/auth';
import { User, Bell, Shield, HelpCircle, LogOut, ChevronRight, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      router.push('/');
      router.refresh();
    }
  };

  if (loading) {
    return (
      <>
        <Header title="설정" />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="설정" />

      <main className="max-w-screen-lg mx-auto p-4">
        {/* Profile Section */}
        <section className="bg-white rounded-xl p-4 shadow-sm mb-4">
          {user ? (
            <Link href="/profile" className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{user.email}</p>
                <p className="text-sm text-gray-500">프로필 보기</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ) : (
            <Link href="/auth/login" className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">로그인이 필요합니다</p>
                <p className="text-sm text-gray-500">등산 기록을 저장하고 공유하세요</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          )}
        </section>

        {/* Settings Menu */}
        <section className="bg-white rounded-xl shadow-sm divide-y divide-gray-100 mb-4">
          <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="flex-1 text-left text-gray-900">알림 설정</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition">
            <Shield className="w-5 h-5 text-gray-600" />
            <span className="flex-1 text-left text-gray-900">개인정보 보호</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition">
            <HelpCircle className="w-5 h-5 text-gray-600" />
            <span className="flex-1 text-left text-gray-900">도움말</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </section>

        {/* App Info */}
        <section className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="text-center text-sm text-gray-500">
            <p className="mb-1">하이킹메이트 v1.0.0</p>
            <p>© 2024 HikingMate. All rights reserved.</p>
          </div>
        </section>

        {/* Logout Button */}
        {user && (
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-red-100 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">로그아웃</span>
          </button>
        )}
      </main>
    </>
  );
}
