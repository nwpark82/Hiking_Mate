'use client';

import Link from 'next/link';
import { MapPin, Clock, TrendingUp, Eye, Mountain } from 'lucide-react';
import type { Trail } from '@/types';
import { formatDistance, cn } from '@/lib/utils/helpers';

interface TrailCardProps {
  trail: Trail;
}

const difficultyConfig = {
  'easy': {
    label: '초급',
    bg: 'bg-forest-50',
    text: 'text-forest-700',
    border: 'border-forest-200',
    icon: 'bg-forest-100',
  },
  'normal': {
    label: '중급',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    icon: 'bg-sky-100',
  },
  'hard': {
    label: '고급',
    bg: 'bg-sunset-50',
    text: 'text-sunset-700',
    border: 'border-sunset-200',
    icon: 'bg-sunset-100',
  },
  'expert': {
    label: '전문가',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: 'bg-red-100',
  },
};

export function TrailCard({ trail }: TrailCardProps) {
  const config = difficultyConfig[trail.difficulty as keyof typeof difficultyConfig] || difficultyConfig.easy;

  return (
    <Link href={`/explore/${trail.id}`}>
      <div className="group bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1">
        <div className="flex gap-0">
          {/* Trail Image/Icon */}
          <div className={cn(
            "w-32 h-32 flex items-center justify-center flex-shrink-0 relative overflow-hidden",
            "bg-gradient-to-br from-forest-400 via-forest-500 to-forest-600"
          )}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <Mountain className="w-12 h-12 text-white/90 relative z-10 group-hover:scale-110 transition-transform duration-300" />
            {/* 고도 표시 */}
            {trail.elevation_gain && trail.elevation_gain > 0 && (
              <div className="absolute bottom-2 left-2 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
                <p className="text-white text-2xs font-medium">↑{trail.elevation_gain}m</p>
              </div>
            )}
          </div>

          {/* Trail Info */}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg border-2',
                config.bg, config.text, config.border
              )}>
                {config.label}
              </span>
              {trail.region && (
                <span className="text-xs text-gray-500 font-medium">{trail.region}</span>
              )}
            </div>

            <h3 className="font-bold text-gray-900 mb-1 text-base group-hover:text-forest-600 transition-colors line-clamp-1">
              {trail.name}
            </h3>
            <p className="text-sm text-gray-600 mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-mountain-500" />
              <span className="line-clamp-1">{trail.mountain}</span>
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1.5 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
                {formatDistance(trail.distance)}
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-sunset-500" />
                {Math.floor(trail.duration / 60)}시간 {trail.duration % 60}분
              </span>
              {trail.view_count > 0 && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-gray-400" />
                    {trail.view_count}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        {trail.features && trail.features.length > 0 && (
          <div className="px-4 pb-4 flex flex-wrap gap-1.5">
            {(trail.features as string[]).slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="px-2.5 py-1 bg-mountain-50 text-mountain-700 text-2xs font-medium rounded-lg border border-mountain-100"
              >
                {feature}
              </span>
            ))}
            {(trail.features as string[]).length > 3 && (
              <span className="px-2.5 py-1 text-gray-400 text-2xs font-medium">
                +{(trail.features as string[]).length - 3}개
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
