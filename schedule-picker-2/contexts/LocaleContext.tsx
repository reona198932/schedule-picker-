'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Locale, getTranslation, detectLocale } from '@/i18n/translations';

interface LocaleContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: ReturnType<typeof getTranslation>;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectLocale());
  const t = getTranslation(locale);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
}
