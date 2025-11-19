'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/lib/hooks/useAuth';
import { getPost, deletePost, Post } from '@/lib/services/posts';
import { getComments, createComment, deleteComment, Comment } from '@/lib/services/comments';
import { getLikesCount, checkUserLiked, toggleLike } from '@/lib/services/likes';
import {
  Loader2,
  Eye,
  Heart,
  MessageCircle,
  MoreVertical,
  Edit,
  Trash2,
  Share2,
  Send,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const CATEGORIES = [
  { id: 'review', label: '후기' },
  { id: 'question', label: '질문' },
  { id: 'gear', label: '장비' },
  { id: 'info', label: '정보' },
  { id: 'companion', label: '동행찾기' },
];

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadPost(params.id as string);
      loadComments(params.id as string);
      loadLikes(params.id as string);
    }
  }, [params.id, user]);

  const loadPost = async (id: string) => {
    setLoading(true);
    const { post: data, error } = await getPost(id);

    if (error) {
      console.error('Failed to load post:', error);
      alert('게시글을 불러오는데 실패했습니다.');
      router.push('/community');
    } else {
      setPost(data);
    }

    setLoading(false);
  };

  const loadComments = async (postId: string) => {
    const { comments: data, error } = await getComments(postId);
    if (!error && data) {
      setComments(data);
    }
  };

  const loadLikes = async (postId: string) => {
    const { count } = await getLikesCount(postId);
    setLikesCount(count);

    if (user) {
      const { liked } = await checkUserLiked(postId, user.id);
      setIsLiked(liked);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      router.push('/auth/login');
      return;
    }

    if (!post) return;

    const { liked, error } = await toggleLike(post.id, user.id);

    if (error) {
      console.error('Failed to toggle like:', error);
      return;
    }

    setIsLiked(liked);
    setLikesCount((prev) => (liked ? prev + 1 : prev - 1));
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('로그인이 필요합니다.');
      router.push('/auth/login');
      return;
    }

    if (!post || !newComment.trim()) return;

    setIsSubmittingComment(true);

    const { comment, error } = await createComment(post.id, user.id, newComment.trim());

    if (error) {
      alert('댓글 작성에 실패했습니다: ' + error);
    } else if (comment) {
      setComments([...comments, comment]);
      setNewComment('');
    }

    setIsSubmittingComment(false);
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!user) return;

    const confirmed = confirm('댓글을 삭제하시겠습니까?');
    if (!confirmed) return;

    const { error } = await deleteComment(commentId, user.id);

    if (error) {
      alert('댓글 삭제에 실패했습니다: ' + error);
    } else {
      setComments(comments.filter((c) => c.id !== commentId));
    }
  };

  const handleEdit = () => {
    router.push(`/community/${params.id}/edit`);
  };

  const handleDelete = async () => {
    if (!user || !post) return;

    const confirmed = confirm('정말 삭제하시겠습니까?');
    if (!confirmed) return;

    setIsDeleting(true);
    const { error } = await deletePost(post.id, user.id);

    if (error) {
      alert('삭제에 실패했습니다: ' + error);
      setIsDeleting(false);
    } else {
      router.push('/community');
    }
  };

  const handleShare = async () => {
    if (!post) return;

    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100) + '...',
          url: url,
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다!');
    }
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find((c) => c.id === category)?.label || category;
  };

  const formatTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
  };

  if (loading) {
    return (
      <>
        <Header title="게시글" />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header title="게시글" />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">게시글을 찾을 수 없습니다.</p>
        </div>
      </>
    );
  }

  const isAuthor = user && post.user_id === user.id;

  return (
    <>
      <Header
        title="게시글"
        rightIcon={
          <button onClick={handleShare}>
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
        }
      />

      <main className="max-w-screen-lg mx-auto p-4 pb-24">
        {/* Post Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                  {getCategoryLabel(post.category)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(post.created_at)}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">
                    {post.users?.username?.[0] || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {post.users?.username || '익명'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {post.view_count}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {isAuthor && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-[120px]">
                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition text-left"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">수정</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition text-left border-t border-gray-100"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm text-red-600">삭제</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {post.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Image ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg"
                />
              ))}
            </div>
          )}
        </div>

        {/* Interaction Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-around">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition"
            >
              <Heart
                className={`w-5 h-5 ${
                  isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600'
                }`}
              />
              <span className="text-sm font-medium text-gray-700">
                좋아요 {likesCount > 0 && `(${likesCount})`}
              </span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition">
              <MessageCircle className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                댓글 {comments.length > 0 && `(${comments.length})`}
              </span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">공유</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">
            댓글 {comments.length > 0 && `(${comments.length})`}
          </h3>

          {/* Comment Input */}
          {user && (
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmittingComment ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">첫 댓글을 작성해보세요</p>
              {!user && (
                <button
                  onClick={() => router.push('/auth/login')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  로그인하고 댓글 남기기
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-semibold text-sm">
                      {comment.users?.username?.[0] || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm">
                          {comment.users?.username || '익명'}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      {user && comment.user_id === user.id && (
                        <button
                          onClick={() => handleCommentDelete(comment.id)}
                          className="p-1 hover:bg-gray-100 rounded transition"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
