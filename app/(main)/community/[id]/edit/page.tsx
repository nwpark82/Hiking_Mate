'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/lib/hooks/useAuth';
import { getPost, updatePost } from '@/lib/services/posts';
import { uploadMultipleImages } from '@/lib/services/storage';
import { Loader2, Image as ImageIcon, X } from 'lucide-react';

const CATEGORIES = [
  { id: 'review', label: '후기' },
  { id: 'question', label: '질문' },
  { id: 'gear', label: '장비' },
  { id: 'info', label: '정보' },
  { id: 'companion', label: '동행찾기' },
];

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('question');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user && postId) {
      loadPost();
    }
  }, [user, authLoading, postId, router]);

  const loadPost = async () => {
    try {
      const { post, error } = await getPost(postId);

      if (error) throw new Error(error);
      if (!post) throw new Error('게시글을 찾을 수 없습니다.');

      // Check if user is the author
      if (post.user_id !== user?.id) {
        alert('본인의 게시글만 수정할 수 있습니다.');
        router.back();
        return;
      }

      // Load post data
      setCategory(post.category);
      setTitle(post.title);
      setContent(post.content);
      setImages(post.images || []);
    } catch (error: any) {
      console.error('Error loading post:', error);
      alert(error.message || '게시글을 불러오는데 실패했습니다.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleImageAdd = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      alert('이미지는 최대 5장까지 업로드할 수 있습니다.');
      return;
    }

    setUploadingImages(true);
    try {
      const fileArray = Array.from(files);
      const { urls, errors } = await uploadMultipleImages(fileArray, 'post-images', user?.id);

      if (errors.length > 0) {
        alert(`일부 이미지 업로드 실패: ${errors.join(', ')}`);
      }

      if (urls.length > 0) {
        setImages(prev => [...prev, ...urls]);
      }
    } catch (error: any) {
      alert('이미지 업로드에 실패했습니다: ' + error.message);
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    const { error } = await updatePost(
      postId,
      user.id,
      title.trim(),
      content.trim(),
      category,
      images
    );

    if (error) {
      alert('게시글 수정에 실패했습니다: ' + error);
      setIsSubmitting(false);
      return;
    }

    alert('게시글이 수정되었습니다.');
    router.push(`/community/${postId}`);
  };

  if (authLoading || loading) {
    return (
      <>
        <Header title="게시글 수정" />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="게시글 수정" />

      <main className="max-w-screen-lg mx-auto p-4 pb-24">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg border transition ${
                    category === cat.id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              제목
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              내용
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={12}
              required
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지 {images.length > 0 && `(${images.length}/5)`}
            </label>

            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <img
                    src={image}
                    alt={`Image ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {images.length < 5 && (
                <button
                  type="button"
                  onClick={handleImageAdd}
                  disabled={uploadingImages}
                  className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary-600 hover:text-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImages ? (
                    <Loader2 className="w-6 h-6 mb-1 animate-spin" />
                  ) : (
                    <ImageIcon className="w-6 h-6 mb-1" />
                  )}
                  <span className="text-xs">{uploadingImages ? '업로드 중...' : '추가'}</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-4 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  수정 중...
                </>
              ) : (
                '수정하기'
              )}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
