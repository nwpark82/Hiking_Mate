'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  checkUsernameAvailability,
  type UserProfile,
} from '@/lib/services/users';
import {
  User,
  Camera,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Form fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');

  // Validation states
  const [usernameError, setUsernameError] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameValid, setUsernameValid] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, authLoading, router]);

  const loadProfile = async () => {
    try {
      const { profile: data, error } = await getMyProfile();
      if (error) throw new Error(error);

      if (data) {
        setProfile(data);
        setUsername(data.username);
        setFullName(data.full_name || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
        setAvatarPreview(data.avatar_url || '');
        setUsernameValid(true); // Current username is valid
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      alert('프로필을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = async (newUsername: string) => {
    setUsername(newUsername);
    setUsernameError('');
    setUsernameValid(false);

    // Basic validation
    if (newUsername.length < 3) {
      setUsernameError('사용자명은 3자 이상이어야 합니다.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setUsernameError('사용자명은 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.');
      return;
    }

    // Skip check if username hasn't changed
    if (newUsername === profile?.username) {
      setUsernameValid(true);
      return;
    }

    // Check availability
    setUsernameChecking(true);
    try {
      const { isAvailable, error } = await checkUsernameAvailability(
        newUsername,
        user?.id
      );

      if (error) throw new Error(error);

      if (!isAvailable) {
        setUsernameError('이미 사용 중인 사용자명입니다.');
      } else {
        setUsernameValid(true);
      }
    } catch (error) {
      console.error('Failed to check username:', error);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB를 초과할 수 없습니다.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingAvatar(true);
    try {
      const { url, error } = await uploadAvatar(file);
      if (error) throw new Error(error);

      if (url) {
        setAvatarUrl(url);
        alert('프로필 사진이 업로드되었습니다.');
      }
    } catch (error: any) {
      console.error('Failed to upload avatar:', error);
      alert(error.message || '프로필 사진 업로드에 실패했습니다.');
      // Revert preview
      setAvatarPreview(avatarUrl);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    // Validate username
    if (!usernameValid) {
      alert('사용자명을 확인해주세요.');
      return;
    }

    setSaving(true);
    try {
      const { profile: updatedProfile, error } = await updateMyProfile({
        username: username !== profile?.username ? username : undefined,
        full_name: fullName,
        bio: bio,
        avatar_url: avatarUrl !== profile?.avatar_url ? avatarUrl : undefined,
      });

      if (error) throw new Error(error);

      alert('프로필이 저장되었습니다.');
      router.push('/profile');
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      alert(error.message || '프로필 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Header title="프로필 수정" />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="프로필 수정" />

      <main className="max-w-screen-lg mx-auto p-4 pb-24">
        {/* Avatar Section */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">프로필 사진</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-primary-600" />
                )}
              </div>
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition disabled:bg-gray-400"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm text-gray-700 mb-1">
                JPG, PNG, GIF, WEBP (최대 5MB)
              </p>
              <p className="text-xs text-gray-500">
                권장 크기: 400x400 픽셀 이상
              </p>
            </div>
          </div>
        </section>

        {/* Username */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <label className="block mb-2">
            <span className="text-sm font-semibold text-gray-700">
              사용자명 <span className="text-red-500">*</span>
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="username123"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
            />
            {usernameChecking && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
            )}
            {!usernameChecking && usernameValid && username && (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
            )}
            {!usernameChecking && usernameError && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
            )}
          </div>
          {usernameError && (
            <p className="text-sm text-red-500 mt-2">{usernameError}</p>
          )}
          {!usernameError && usernameValid && username !== profile?.username && (
            <p className="text-sm text-green-500 mt-2">
              사용 가능한 사용자명입니다.
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            영문, 숫자, 밑줄(_)만 사용 가능 (최소 3자)
          </p>
        </section>

        {/* Full Name */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <label className="block mb-2">
            <span className="text-sm font-semibold text-gray-700">이름</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="홍길동"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
          />
        </section>

        {/* Bio */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <label className="block mb-2">
            <span className="text-sm font-semibold text-gray-700">소개</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="자기소개를 입력하세요..."
            rows={4}
            maxLength={200}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-gray-900"
          />
          <p className="text-xs text-gray-500 mt-2 text-right">
            {bio.length} / 200
          </p>
        </section>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            disabled={saving}
            className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !usernameValid || usernameChecking}
            className="flex-1 py-3 px-6 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                저장
              </>
            )}
          </button>
        </div>
      </main>
    </>
  );
}
