'use client';

import Link from 'next/link';
import { Mountain, Clock, MapPin, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Trail {
  id: number;
  name: string;
  difficulty: string;
  duration: number;
  region: string;
  distance?: number;
}

interface TrailCardProps {
  trail: Trail;
  rank?: number;
  variant?: 'default' | 'featured' | 'compact';
}

const difficultyConfig = {
  '초급': { color: 'bg-green-500', bgLight: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
  '중급': { color: 'bg-yellow-500', bgLight: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
  '고급': { color: 'bg-red-500', bgLight: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
  '전문가': { color: 'bg-red-600', bgLight: 'bg-red-50', textColor: 'text-red-800', borderColor: 'border-red-200' },
};

export function TrailCard({ trail, rank, variant = 'default' }: TrailCardProps) {
  const difficulty = difficultyConfig[trail.difficulty as keyof typeof difficultyConfig] || difficultyConfig['초급'];
  const hours = Math.floor(trail.duration / 60);
  const minutes = trail.duration % 60;

  if (variant === 'compact') {
    return (
      <Link href={`/explore/${trail.id}`}>
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {rank && (
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-forest-500 to-forest-600 text-white rounded-xl font-bold text-lg shadow-sm group-hover:scale-110 transition-transform">
                  {rank}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground mb-1.5 group-hover:text-forest-600 transition-colors truncate">
                  {trail.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficulty.bgLight} ${difficulty.textColor}`}>
                    {trail.difficulty}
                  </span>
                  <span className="text-xs">•</span>
                  <span className="text-xs">{trail.region}</span>
                  <span className="text-xs">•</span>
                  <span className="text-xs">{hours}h {minutes}m</span>
                </div>
              </div>
              <TrendingUp className="w-5 h-5 text-muted-foreground group-hover:text-forest-600 transition-colors flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link href={`/explore/${trail.id}`} className="block h-full">
        <Card className="group h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border overflow-hidden">
          <div className="relative aspect-[4/3] bg-gradient-to-br from-forest-100 via-mountain-100 to-sky-100 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <Mountain className="w-24 h-24 text-forest-300 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="absolute top-3 right-3">
              <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${difficulty.bgLight} ${difficulty.textColor} backdrop-blur-sm border ${difficulty.borderColor} shadow-sm`}>
                {trail.difficulty}
              </span>
            </div>
            {trail.distance && (
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{trail.distance.toFixed(1)}km</span>
                </div>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-forest-600 transition-colors line-clamp-1">
              {trail.name}
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{trail.region}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{hours}h {minutes}m</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/explore/${trail.id}`} className="block h-full">
      <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border overflow-hidden">
        <div className="aspect-[4/3] bg-gradient-to-br from-forest-50 to-mountain-50 flex items-center justify-center overflow-hidden">
          <Mountain className="w-16 h-16 text-forest-200 group-hover:scale-110 transition-transform duration-300" />
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-foreground mb-1.5 group-hover:text-forest-600 transition-colors line-clamp-1">
            {trail.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficulty.bgLight} ${difficulty.textColor}`}>
              {trail.difficulty}
            </span>
            <span>•</span>
            <span>{hours}h {minutes}m</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
