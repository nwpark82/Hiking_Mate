'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function SearchSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-forest-500 via-forest-600 to-forest-700 rounded-3xl p-8 text-white mb-6 overflow-hidden shadow-soft-lg">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
            당신의 다음 산행을
            <br />
            계획하세요 🏔️
          </h1>
          <p className="text-forest-100 text-lg font-medium">
            전국 663개 등산로 정보와 실시간 날씨를 확인하세요
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" />
            <input
              type="text"
              placeholder="등산로, 산 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-white/30 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-white focus:bg-white transition-all duration-300 font-medium shadow-lg"
            />
          </div>
        </form>

        <Link
          href="/explore"
          className="inline-flex items-center gap-2 bg-white text-forest-600 px-6 py-3 rounded-xl font-bold hover:bg-forest-50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <MapPin className="w-5 h-5" />
          등산로 탐색하기
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
