'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ArrowRight, Mountain } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    <section className="relative bg-gradient-to-br from-forest-500 via-forest-600 to-forest-700 rounded-3xl p-8 md:p-10 text-white mb-6 overflow-hidden shadow-soft-lg">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
        <Mountain className="absolute top-1/2 right-8 w-32 h-32 text-white/5 -translate-y-1/2 hidden md:block" />
      </div>

      <div className="relative z-10">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-white">전국 663개 등산로</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight animate-fade-in">
            당신의 다음 산행을
            <br />
            계획하세요 🏔️
          </h1>
          <p className="text-forest-100 text-base md:text-lg font-medium">
            실시간 날씨 정보와 상세한 등산로 가이드를 확인하세요
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400 group-focus-within:text-forest-600 transition-colors" />
            <input
              type="text"
              placeholder="등산로, 산 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-white/30 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20 transition-all duration-300 font-medium shadow-lg"
            />
          </div>
        </form>

        <Button
          asChild
          size="lg"
          className="bg-white text-forest-600 hover:bg-forest-50 hover:text-forest-700 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Link href="/explore" className="inline-flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            등산로 탐색하기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
