'use client';

import { useEffect, useState } from 'react';
import { TrailCard } from './TrailCard';
import { getTrails, type TrailFilters } from '@/lib/services/trails';
import type { Trail } from '@/types';
import { Loader2, Mountain } from 'lucide-react';

interface TrailListProps {
  filters?: TrailFilters;
}

export function TrailList({ filters = {} }: TrailListProps) {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrails() {
      setLoading(true);
      const data = await getTrails(filters);
      setTrails(data);
      setLoading(false);
    }

    fetchTrails();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-forest-400 animate-spin" />
          <Mountain className="w-6 h-6 text-forest-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="mt-4 text-sm font-medium text-gray-600">등산로를 찾고 있습니다...</p>
      </div>
    );
  }

  if (trails.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-12 shadow-soft text-center border border-gray-100">
        <div className="bg-forest-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mountain className="w-10 h-10 text-forest-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">검색 결과가 없습니다</h3>
        <p className="text-sm text-gray-600 mb-1">다른 검색어나 필터를 사용해보세요</p>
        <p className="text-xs text-gray-500">663개의 등산로가 등록되어 있습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-700">
          총 <span className="text-forest-600 text-base">{trails.length}</span>개의 등산로
        </p>
      </div>
      {trails.map((trail) => (
        <TrailCard key={trail.id} trail={trail} />
      ))}
    </div>
  );
}
