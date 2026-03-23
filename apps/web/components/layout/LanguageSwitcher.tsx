'use client';

import { useState } from 'react';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'fr', name: 'French', flag: 'FR' },
  { code: 'es', name: 'Spanish', flag: 'ES' },
  { code: 'pt', name: 'Portuguese', flag: 'PT' },
  { code: 'ar', name: 'Arabic', flag: 'AR' },
  { code: 'yo', name: 'Yoruba', flag: 'YO' },
  { code: 'sw', name: 'Swahili', flag: 'SW' },
];

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(languages[0]);

  const handleSelect = (lang: Language) => {
    setSelected(lang);
    setIsOpen(false);
    // In production: update cookie and trigger locale change
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 rounded-brand border px-2 py-1 text-xs font-medium text-gray-600 transition hover:border-brand-primary"
      >
        {selected.flag}
        <span className="hidden sm:inline">{selected.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-brand border bg-white py-1 shadow-lg">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition hover:bg-gray-50 ${
                selected.code === lang.code ? 'text-brand-primary' : 'text-gray-700'
              }`}
            >
              <span className="w-6 text-center text-xs font-bold">{lang.flag}</span>
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
