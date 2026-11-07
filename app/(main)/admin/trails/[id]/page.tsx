'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { getTrail, updateTrail, TRAIL_DIFFICULTIES, type AdminTrail } from '@/lib/services/admin';
import { Loader2, ArrowLeft, ExternalLink } from 'lucide-react';

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-500';

export default function AdminTrailEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [trail, setTrail] = useState<AdminTrail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [accessInfo, setAccessInfo] = useState('');
  const [warnings, setWarnings] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { trail: data, error } = await getTrail(id);
      if (error || !data) {
        alert('등산로를 불러오지 못했습니다: ' + error);
        router.push('/admin/trails');
        return;
      }
      setTrail(data);
      setName(data.name);
      setDifficulty(data.difficulty);
      setDistance(String(data.distance ?? ''));
      setDuration(String(data.duration ?? ''));
      setDescription(data.description || '');
      setAccessInfo(data.access_info || '');
      setWarnings((data.warnings || []).join('\n'));
      setIsPublished(data.is_published);
      setLoading(false);
    };
    load();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const distanceValue = Number(distance);
    const durationValue = Number.parseInt(duration, 10);
    if (!name.trim() || !(distanceValue > 0) || !(durationValue > 0)) {
      alert('이름, 거리, 소요시간을 올바르게 입력해주세요.');
      return;
    }

    setSaving(true);
    const { error } = await updateTrail(id, {
      name: name.trim(),
      difficulty,
      distance: distanceValue,
      duration: durationValue,
      description: description.trim() || null,
      access_info: accessInfo.trim() || null,
      warnings: warnings
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      is_published: isPublished,
    });
    setSaving(false);

    if (error) {
      alert('저장 실패: ' + error);
      return;
    }
    alert('저장되었습니다.');
    router.push('/admin/trails');
  };

  if (loading || !trail) {
    return (
      <>
        <Header title="등산로 수정" />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="등산로 수정" />

      <main className="max-w-screen-md mx-auto p-6 pb-24 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <Link href="/admin/trails" className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> 목록
          </Link>
          <Link
            href={`/explore/${trail.id}`}
            target="_blank"
            className="flex items-center gap-1 text-sm text-forest-600 hover:underline"
          >
            사이트에서 보기 <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 space-y-5">
          <div className="text-sm text-gray-500">
            {trail.region} · {trail.mountain}
          </div>

          <div className="rounded-lg border border-gray-200 p-4 space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-5 h-5 accent-forest-600"
              />
              <span className="font-medium text-gray-800">사용자에게 공개</span>
            </label>
            {trail.quality_status && (
              <p className={`text-sm ${trail.quality_status === 'reliable' ? 'text-forest-700' : 'text-amber-700'}`}>
                자동 판정: {trail.quality_status === 'reliable' ? '신뢰' : '비신뢰'}
                {trail.quality_note && ` — ${trail.quality_note}`}
              </p>
            )}
            <p className="text-xs text-gray-500">
              경로 데이터(끊김·순서·반복)에 문제가 있는 등산로를 공개하면 사용자가 길을 잃을 수 있습니다.
            </p>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">이름</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>

          <div className="grid grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">난이도</span>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={inputClass}>
                {TRAIL_DIFFICULTIES.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">거리 (km)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">소요시간 (분)</span>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">설명</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">교통/접근 정보</span>
            <textarea
              value={accessInfo}
              onChange={(e) => setAccessInfo(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">주의사항 (한 줄에 하나씩)</span>
            <textarea
              value={warnings}
              onChange={(e) => setWarnings(e.target.value)}
              rows={4}
              className={inputClass}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-forest-600 text-white rounded-lg font-semibold hover:bg-forest-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            저장
          </button>
        </form>
      </main>
    </>
  );
}
