'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TrailCard } from './TrailCard';
import { Button } from '@/components/ui/button';
import type { Trail } from '@/types';

interface TrailCarouselProps {
  trails: Trail[];
  variant?: 'default' | 'featured' | 'compact';
}

export function TrailCarousel({ trails, variant = 'featured' }: TrailCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [trails]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  if (trails.length === 0) {
    return null;
  }

  return (
    <div className="relative group">
      {/* Scroll Buttons - Desktop */}
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm shadow-lg border-border opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      )}
      {canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm shadow-lg border-border opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      )}

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {trails.map((trail) => (
          <div
            key={trail.id}
            className="flex-none w-[280px] sm:w-[320px] snap-start"
          >
            <TrailCard trail={trail} variant={variant} />
          </div>
        ))}
      </div>

      {/* Scroll Indicator Dots - Mobile */}
      <div className="flex justify-center gap-2 mt-4 md:hidden">
        {trails.map((_, index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-full bg-gray-300 transition-colors"
            style={{
              backgroundColor: canScrollLeft && index > 0 ? '#16a34a' : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
