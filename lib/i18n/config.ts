export const locales = ['en', 'pt', 'fr', 'hi', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
  fr: 'Français',
  hi: 'हिन्दी',
  ar: 'العربية',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  pt: '🇵🇹',
  fr: '🇫🇷',
  hi: '🇮🇳',
  ar: '🇸🇦',
};

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  pt: 'ltr',
  fr: 'ltr',
  hi: 'ltr',
  ar: 'rtl',
};
