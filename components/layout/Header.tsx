'use client';

import { Bell, Settings } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  showNotification?: boolean;
  showSettings?: boolean;
  rightIcon?: React.ReactNode;
}

export function Header({ title, showNotification = false, showSettings = false, rightIcon }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between h-14 px-4 max-w-screen-lg mx-auto">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>

        <div className="flex items-center gap-2">
          {rightIcon}

          {showNotification && (
            <button className="p-2 hover:bg-gray-100 rounded-full transition">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {showSettings && (
            <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-full transition">
              <Settings className="w-5 h-5 text-gray-600" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
