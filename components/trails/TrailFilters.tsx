'use client';

import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';
import { DIFFICULTY_LEVELS, REGIONS } from '@/lib/utils/constants';

interface TrailFiltersProps {
  selectedDifficulty: string;
  selectedRegion: string;
  onDifficultyChange: (difficulty: string) => void;
  onRegionChange: (region: string) => void;
}

export function TrailFilters({
  selectedDifficulty,
  selectedRegion,
  onDifficultyChange,
  onRegionChange,
}: TrailFiltersProps) {
  return (
    <div className="space-y-5">
      {/* Difficulty Filter */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <div className="p-1.5 bg-sky-100 rounded-lg">
            <Filter className="w-4 h-4 text-sky-600" />
          </div>
          난이도
        </h4>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => onDifficultyChange('')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300',
              selectedDifficulty === ''
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md scale-105'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-sky-300 hover:bg-sky-50 hover:scale-105'
            )}
          >
            전체
          </button>
          {DIFFICULTY_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => onDifficultyChange(level)}
              className={cn(
                'px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300',
                selectedDifficulty === level
                  ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md scale-105'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-sky-300 hover:bg-sky-50 hover:scale-105'
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Region Filter */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <div className="p-1.5 bg-mountain-100 rounded-lg">
            <Filter className="w-4 h-4 text-mountain-600" />
          </div>
          지역
        </h4>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => onRegionChange('')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300',
              selectedRegion === ''
                ? 'bg-gradient-to-r from-mountain-500 to-mountain-600 text-white shadow-md scale-105'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-mountain-300 hover:bg-mountain-50 hover:scale-105'
            )}
          >
            전체
          </button>
          {REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => onRegionChange(region)}
              className={cn(
                'px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300',
                selectedRegion === region
                  ? 'bg-gradient-to-r from-mountain-500 to-mountain-600 text-white shadow-md scale-105'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-mountain-300 hover:bg-mountain-50 hover:scale-105'
              )}
            >
              {region}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
