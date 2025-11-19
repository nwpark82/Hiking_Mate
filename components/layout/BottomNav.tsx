'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Activity, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

const navItems = [
  { href: '/', label: '홈', icon: Home, color: 'forest' },
  { href: '/explore', label: '탐색', icon: Search, color: 'sky' },
  { href: '/record', label: '기록', icon: Activity, color: 'sunset' },
  { href: '/community', label: '커뮤니티', icon: MessageCircle, color: 'mountain' },
];

const colorConfig = {
  forest: {
    active: 'text-forest-600 bg-forest-50',
    inactive: 'text-gray-500',
  },
  sky: {
    active: 'text-sky-600 bg-sky-50',
    inactive: 'text-gray-500',
  },
  sunset: {
    active: 'text-sunset-600 bg-sunset-50',
    inactive: 'text-gray-500',
  },
  mountain: {
    active: 'text-mountain-600 bg-mountain-50',
    inactive: 'text-gray-500',
  },
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 safe-area-bottom z-50 shadow-soft">
      <div className="flex justify-around items-center h-18 max-w-screen-lg mx-auto px-2">
        {navItems.map(({ href, label, icon: Icon, color }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          const colors = colorConfig[color as keyof typeof colorConfig];

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 rounded-2xl transition-all duration-300',
                isActive
                  ? colors.active
                  : colors.inactive + ' hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <div className={cn(
                'relative mb-1 transition-transform duration-300',
                isActive && 'scale-110'
              )}>
                <Icon className={cn(
                  'w-6 h-6 transition-all duration-300',
                  isActive && 'drop-shadow-sm'
                )} />
                {isActive && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current" />
                )}
              </div>
              <span className={cn(
                'text-2xs font-semibold transition-all duration-300',
                isActive && 'scale-105'
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
