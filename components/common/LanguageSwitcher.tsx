'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useState } from 'react';

const languages = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Get current locale from pathname
  const currentLocale = pathname.split('/')[1];
  const currentLang = languages.find((lang) => lang.code === currentLocale) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    // Set cookie
    document.cookie = `NEXT_LOCALE=${langCode}; path=/; max-age=31536000`;

    // Redirect to new locale
    const segments = pathname.split('/').filter(Boolean);
    const newPathname = segments[0] === currentLocale
      ? `/${langCode}/${segments.slice(1).join('/')}`
      : `/${langCode}${pathname}`;

    router.push(newPathname);
    router.refresh();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Change language"
      >
        <Globe className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{currentLang.flag}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                  lang.code === currentLang.code ? 'bg-forest-50' : ''
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className={`text-sm font-medium ${
                  lang.code === currentLang.code ? 'text-forest-600' : 'text-gray-700'
                }`}>
                  {lang.name}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
