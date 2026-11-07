'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { searchTrails, type AdminTrail, type TrailPublishFilter } from '@/lib/services/admin';
import { Loader2, Search, Edit, ExternalLink } from 'lucide-react';

export default function AdminTrailsPage() {
  const [search, setSearch] = useState('');
  const [trails, setTrails] = useState<AdminTrail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TrailPublishFilter>('all');

  const load = async (keyword = search) => {
    setLoading(true);
    const result = await searchTrails(keyword, filter);
    setTrails(result.trails);
    setError(result.error);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [filter]);

  return (
    <>
      <Header title="등산로 관리" />

      <main className="max-w-screen-lg mx-auto p-6 pb-24 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">등산로 관리</h1>
        <p className="text-gray-600 mb-6">
          이름·난이도·소요시간·설명·주의사항 등을 수정합니다. GPS 경로 데이터는 스크립트로 관리합니다.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          비공개 등산로는 사용자에게 보이지 않습니다. 신뢰도 판정 기준은 docs/TRAIL_DATA_REVIEW.md 참고.
        </p>

        <div className="flex bg-white rounded-lg border border-gray-200 p-1 w-fit mb-4">
          {(
            [
              ['all', '전체'],
              ['published', '공개'],
              ['hidden', '비공개'],
            ] as [TrailPublishFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-1.5 text-sm rounded-md transition ${
                filter === value ? 'bg-forest-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="relative mb-6"
        >
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="등산로 이름 또는 산 이름 검색 (Enter)"
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 rounded-xl p-4">{error}</div>
        ) : trails.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-soft text-gray-500">검색 결과가 없습니다.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 divide-y divide-gray-100">
            {trails.map((trail) => (
              <div key={trail.id} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                        trail.is_published ? 'bg-forest-100 text-forest-700' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {trail.is_published ? '공개' : '비공개'}
                    </span>
                    <span className="font-medium text-gray-900 truncate">{trail.name}</span>
                  </div>
                  {trail.quality_note && <div className="text-xs text-amber-700 truncate">{trail.quality_note}</div>}
                  <div className="text-xs text-gray-500">
                    {trail.region} · {trail.mountain} · {trail.difficulty} · {trail.distance?.toFixed(1)}km ·{' '}
                    {Math.floor(trail.duration / 60)}시간 {trail.duration % 60}분
                  </div>
                </div>
                <Link href={`/explore/${trail.id}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-lg" title="보기">
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                </Link>
                <Link href={`/admin/trails/${trail.id}`} className="p-2 hover:bg-gray-100 rounded-lg" title="수정">
                  <Edit className="w-4 h-4 text-gray-600" />
                </Link>
              </div>
            ))}
          </div>
        )}
        {!loading && trails.length === 50 && (
          <p className="text-xs text-gray-500 mt-3">최대 50개까지 표시됩니다. 검색어를 더 구체적으로 입력하세요.</p>
        )}
      </main>
    </>
  );
}
