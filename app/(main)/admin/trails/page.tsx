'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { searchTrails, type AdminTrail } from '@/lib/services/admin';
import { Loader2, Search, Edit, ExternalLink } from 'lucide-react';

export default function AdminTrailsPage() {
  const [search, setSearch] = useState('');
  const [trails, setTrails] = useState<AdminTrail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (keyword = search) => {
    setLoading(true);
    const result = await searchTrails(keyword);
    setTrails(result.trails);
    setError(result.error);
    setLoading(false);
  };

  useEffect(() => {
    load('');
  }, []);

  return (
    <>
      <Header title="등산로 관리" />

      <main className="max-w-screen-lg mx-auto p-6 pb-24 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">등산로 관리</h1>
        <p className="text-gray-600 mb-6">
          이름·난이도·소요시간·설명·주의사항 등을 수정합니다. GPS 경로 데이터는 스크립트로 관리합니다.
        </p>

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
                  <div className="font-medium text-gray-900 truncate">{trail.name}</div>
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
