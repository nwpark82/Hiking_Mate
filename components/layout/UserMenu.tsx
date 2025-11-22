'use client';

import { useState, useEffect, useRef } from 'react';
import { User, LogIn, UserPlus, LogOut, Settings as SettingsIcon, ChevronDown, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 사용자 정보 가져오기
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 로그아웃 처리
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push('/');
    router.refresh();
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-full transition"
          aria-label="메뉴"
          aria-expanded={isOpen}
        >
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform hidden sm:block ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <div className="py-1">
              <Link
                href="/auth/login"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                onClick={() => setIsOpen(false)}
              >
                <LogIn className="w-4 h-4" />
                <span>로그인</span>
              </Link>

              <Link
                href="/auth/signup"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                onClick={() => setIsOpen(false)}
              >
                <UserPlus className="w-4 h-4" />
                <span>회원가입</span>
              </Link>

              <Link
                href="/feedback"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                onClick={() => setIsOpen(false)}
              >
                <MessageSquare className="w-4 h-4" />
                <span>문의하기</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 사용자 이름 가져오기 (이메일에서 @ 앞부분 또는 메타데이터)
  const displayName = user.user_metadata?.username || user.email?.split('@')[0] || '사용자';

  // 로그인한 경우 - 드롭다운 메뉴
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-full transition"
        aria-label="사용자 메뉴"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform hidden sm:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {/* 사용자 정보 */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          {/* 메뉴 항목 */}
          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4" />
              <span>프로필</span>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              onClick={() => setIsOpen(false)}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>설정</span>
            </Link>

            <Link
              href="/feedback"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              onClick={() => setIsOpen(false)}
            >
              <MessageSquare className="w-4 h-4" />
              <span>문의하기</span>
            </Link>
          </div>

          {/* 로그아웃 */}
          <div className="border-t border-gray-200 py-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
