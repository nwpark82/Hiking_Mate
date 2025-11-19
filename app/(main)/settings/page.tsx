'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/lib/hooks/useAuth';
import { signOut, updatePassword } from '@/lib/services/auth';
import { deleteAccount } from '@/lib/services/users';
import {
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Loader2,
  Lock,
  Trash2,
  FileText,
  Info,
  Moon,
  X,
  AlertTriangle,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Settings states
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account states
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;

    const { error } = await signOut();
    if (!error) {
      router.push('/');
      router.refresh();
    }
  };

  const handlePasswordChange = async () => {
    // Validation
    if (!newPassword || !confirmPassword) {
      alert('새 비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw new Error(error);

      alert('비밀번호가 변경되었습니다.');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      alert(error.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '계정삭제') {
      alert('"계정삭제"를 정확히 입력해주세요.');
      return;
    }

    if (!confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await deleteAccount();
      if (error) throw new Error(error);

      alert('계정이 삭제되었습니다. 그동안 이용해주셔서 감사합니다.');
      await signOut();
      router.push('/');
      router.refresh();
    } catch (error: any) {
      alert(error.message || '계정 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
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

      <main className="max-w-screen-lg mx-auto p-4 pb-24">
        {/* Profile Section */}
        <section className="bg-white rounded-2xl p-4 shadow-soft mb-6">
          {user ? (
            <Link href="/profile" className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{user.email}</p>
                <p className="text-sm text-gray-500">프로필 보기 및 수정</p>
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

        {/* Account Settings */}
        {user && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 px-1">계정 설정</h2>
            <div className="bg-white rounded-2xl shadow-soft divide-y divide-gray-100">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition"
              >
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <span className="flex-1 text-left text-gray-900 font-medium">비밀번호 변경</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center gap-3 p-4 hover:bg-red-50 transition group"
              >
                <div className="p-2 bg-red-50 rounded-xl group-hover:bg-red-100 transition">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <span className="flex-1 text-left text-red-600 font-medium">계정 삭제</span>
                <ChevronRight className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </section>
        )}

        {/* App Settings */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 px-1">앱 설정</h2>
          <div className="bg-white rounded-2xl shadow-soft divide-y divide-gray-100">
            <div className="flex items-center gap-3 p-4">
              <div className="p-2 bg-green-50 rounded-xl">
                <Bell className="w-5 h-5 text-green-600" />
              </div>
              <span className="flex-1 text-gray-900 font-medium">푸시 알림</span>
              <button
                onClick={() => setPushNotifications(!pushNotifications)}
                className={`relative w-12 h-6 rounded-full transition ${
                  pushNotifications ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    pushNotifications ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center gap-3 p-4">
              <div className="p-2 bg-purple-50 rounded-xl">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <span className="flex-1 text-gray-900 font-medium">이메일 알림</span>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative w-12 h-6 rounded-full transition ${
                  emailNotifications ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    emailNotifications ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center gap-3 p-4 opacity-50">
              <div className="p-2 bg-gray-100 rounded-xl">
                <Moon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <span className="text-gray-900 font-medium">다크 모드</span>
                <p className="text-xs text-gray-500">곧 출시 예정</p>
              </div>
              <button
                disabled
                className="relative w-12 h-6 rounded-full bg-gray-300 cursor-not-allowed"
              >
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full" />
              </button>
            </div>
          </div>
        </section>

        {/* Info & Support */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 px-1">정보 및 지원</h2>
          <div className="bg-white rounded-2xl shadow-soft divide-y divide-gray-100">
            <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition">
              <div className="p-2 bg-sky-50 rounded-xl">
                <FileText className="w-5 h-5 text-sky-600" />
              </div>
              <span className="flex-1 text-left text-gray-900 font-medium">이용약관</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition">
              <div className="p-2 bg-orange-50 rounded-xl">
                <Shield className="w-5 h-5 text-orange-600" />
              </div>
              <span className="flex-1 text-left text-gray-900 font-medium">개인정보처리방침</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="flex-1 text-left text-gray-900 font-medium">도움말</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <div className="flex items-center gap-3 p-4">
              <div className="p-2 bg-gray-100 rounded-xl">
                <Info className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">앱 버전</p>
                <p className="text-sm text-gray-500">v1.0.0</p>
              </div>
            </div>
          </div>
        </section>

        {/* Logout Button */}
        {user && (
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-50 to-red-100 text-red-600 rounded-2xl p-4 flex items-center justify-center gap-2 hover:from-red-100 hover:to-red-200 transition shadow-soft"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold">로그아웃</span>
          </button>
        )}

        {/* Copyright */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>© 2024 HikingMate. All rights reserved.</p>
        </div>
      </main>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">비밀번호 변경</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 (최소 6자)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 확인"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  disabled={changingPassword}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      변경 중...
                    </>
                  ) : (
                    '변경'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-bold text-gray-900">계정 삭제</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-800 font-medium mb-2">
                경고: 이 작업은 되돌릴 수 없습니다!
              </p>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                <li>모든 산행 기록이 삭제됩니다</li>
                <li>작성한 게시글과 댓글이 삭제됩니다</li>
                <li>프로필 정보가 영구적으로 삭제됩니다</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  계속하려면 <span className="text-red-600">"계정삭제"</span>를 입력하세요
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="계정삭제"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmText !== '계정삭제'}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      계정 삭제
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
