'use client';

import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { TrailList } from '@/components/trails/TrailList';
import { TrailFilters } from '@/components/trails/TrailFilters';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import type { TrailFilters as Filters } from '@/lib/services/trails';

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search term to avoid too many API calls
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Build filters object
  const filters: Filters = {
    search: debouncedSearch || undefined,
    difficulty: selectedDifficulty || undefined,
    region: selectedRegion || undefined,
    sortBy: 'popular',
  };

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  return (
    <>
      <Header title="탐색" showSettings={true} />

      <main className="max-w-screen-lg mx-auto p-4 pb-24">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" />
            <input
              type="text"
              placeholder="등산로, 산 이름 검색..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-14 py-4 rounded-2xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 focus:ring-4 focus:ring-forest-50 transition-all duration-300 text-gray-900 placeholder:text-gray-400 shadow-soft"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-300 ${
                showFilters
                  ? 'bg-sky-500 text-white shadow-md scale-110'
                  : 'bg-sky-50 text-sky-600 hover:bg-sky-100 hover:scale-105'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 bg-gradient-to-br from-white to-sky-50/30 rounded-2xl p-5 shadow-soft border border-sky-100/50 animate-slide-up">
            <TrailFilters
              selectedDifficulty={selectedDifficulty}
              selectedRegion={selectedRegion}
              onDifficultyChange={setSelectedDifficulty}
              onRegionChange={setSelectedRegion}
            />
          </div>
        )}

        {/* Active Filters Summary */}
        {(selectedDifficulty || selectedRegion || debouncedSearch) && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">활성 필터:</span>
            {debouncedSearch && (
              <span className="px-3 py-1.5 bg-gradient-to-r from-forest-500 to-forest-600 text-white rounded-xl text-sm font-medium shadow-sm">
                "{debouncedSearch}"
              </span>
            )}
            {selectedDifficulty && (
              <span className="px-3 py-1.5 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-xl text-sm font-medium shadow-sm">
                {selectedDifficulty}
              </span>
            )}
            {selectedRegion && (
              <span className="px-3 py-1.5 bg-gradient-to-r from-mountain-500 to-mountain-600 text-white rounded-xl text-sm font-medium shadow-sm">
                {selectedRegion}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDifficulty('');
                setSelectedRegion('');
              }}
              className="ml-auto px-4 py-1.5 text-sm font-semibold text-gray-600 hover:text-forest-600 hover:bg-forest-50 rounded-xl transition-all duration-300"
            >
              초기화
            </button>
          </div>
        )}

        {/* Trail List */}
        <TrailList filters={filters} />
      </main>
    </>
  );
}
