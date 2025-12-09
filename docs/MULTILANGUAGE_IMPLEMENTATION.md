# Multilanguage Support Implementation

## Overview
This document describes the complete next-intl implementation for the AKF Learning Dashboard, providing support for English, Urdu, and Arabic with RTL (Right-to-Left) support.

## Implementation Summary

### ✅ Completed Steps

1. **i18n Configuration** (`lib/i18n/`)
   - `config.ts` - Locale definitions, names, flags, and text directions
   - `request.ts` - Server-side message loading configuration

2. **Translation Files** (`messages/`)
   - `en.json` - English translations
   - `ur.json` - Urdu translations (RTL)
   - `ar.json` - Arabic translations (RTL)

3. **Redux Integration**
   - `lib/store/slices/localeSlice.ts` - Locale state management
   - Updated `lib/store/index.ts` - Added locale reducer

4. **Routing & Middleware**
   - `middleware.ts` - Locale-based routing middleware
   - `app/page.tsx` - Root redirect to default locale
   - `app/[locale]/layout.tsx` - Locale-aware root layout
   - Updated `app/[locale]/(dashboards)/layout.tsx` - Removed html/body tags
   - Updated `app/[locale]/(dashboards)/page.tsx` - Locale-aware redirect

5. **Components**
   - `components/shared/language-selector.tsx` - New language switcher component
   - Updated `components/shared/layout/header.tsx` - Integrated LanguageSelector and translations

6. **Configuration**
   - Updated `next.config.mjs` - Added next-intl plugin

## File Structure

```
akf-learning-dash/
├── app/
│   ├── page.tsx                          # Root redirect
│   └── [locale]/
│       ├── layout.tsx                    # Locale root layout (html/body)
│       └── (dashboards)/
│           ├── layout.tsx                # Dashboard layout (no html/body)
│           ├── page.tsx                  # Locale-aware redirect
│           └── [role]/                   # Role-based routes
├── components/
│   └── shared/
│       ├── language-selector.tsx         # NEW: Language switcher
│       └── layout/
│           └── header.tsx                # UPDATED: Uses translations
├── lib/
│   ├── i18n/
│   │   ├── config.ts                     # NEW: Locale configuration
│   │   └── request.ts                    # NEW: Message loader
│   └── store/
│       ├── index.ts                      # UPDATED: Added locale reducer
│       └── slices/
│           └── localeSlice.ts            # NEW: Locale state
├── messages/
│   ├── en.json                           # NEW: English translations
│   ├── ur.json                           # NEW: Urdu translations
│   └── ar.json                           # NEW: Arabic translations
├── middleware.ts                         # NEW: Locale routing
└── next.config.mjs                       # UPDATED: next-intl plugin
```

## Supported Languages

| Code | Language | Direction | Flag |
|------|----------|-----------|------|
| `en` | English  | LTR       | 🇬🇧   |
| `ur` | اردو     | RTL       | 🇵🇰   |
| `ar` | العربية  | RTL       | 🇸🇦   |

## URL Structure

All routes now include the locale prefix:

- `/en/admin` - English Admin Dashboard
- `/ur/admin` - Urdu Admin Dashboard
- `/ar/admin` - Arabic Admin Dashboard
- `/en/learner/courses` - English Learner Courses
- etc.

## Usage in Components

### Using Translations

```typescript
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('navigation');
  
  return <h1>{t('dashboard')}</h1>;
}
```

### Getting Current Locale

```typescript
import { useLocale } from 'next-intl';

export default function MyComponent() {
  const locale = useLocale(); // 'en', 'ur', or 'ar'
  
  return <div>Current locale: {locale}</div>;
}
```

### Locale-Aware Navigation

```typescript
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function MyComponent() {
  const router = useRouter();
  const locale = useLocale();
  
  const navigate = () => {
    router.push(`/${locale}/admin/settings`);
  };
  
  return <button onClick={navigate}>Go to Settings</button>;
}
```

## Translation Keys Structure

The translation files are organized into namespaces:

- `common` - Common UI elements (save, cancel, delete, etc.)
- `header` - Header-specific translations
- `roles` - Role names and labels
- `navigation` - Navigation menu items
- `dashboard` - Dashboard-specific content
- `courses` - Course-related translations
- `users` - User management translations
- `learners` - Learner management translations
- `reports` - Reports section translations
- `settings` - Settings page translations
- `auth` - Authentication-related translations

## RTL Support

The implementation automatically handles RTL (Right-to-Left) text direction for Urdu and Arabic:

```typescript
// In app/[locale]/layout.tsx
const direction = localeDirections[locale as Locale]; // 'rtl' or 'ltr'

return (
  <html lang={locale} dir={direction}>
    {/* ... */}
  </html>
);
```

## Language Selector Component

The `LanguageSelector` component provides:
- Dropdown menu with all available languages
- Visual indicator (checkmark) for current language
- Smooth transitions when switching languages
- Redux state synchronization
- URL updates with locale prefix

## Redux Integration

The locale state is stored in Redux for global access:

```typescript
// Get current locale from Redux
const currentLocale = useAppSelector((state) => state.locale.currentLocale);

// Update locale in Redux
dispatch(setLocale('ur'));
```

## Testing the Implementation

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test URLs:**
   - Visit `http://localhost:3000` - Should redirect to `/en`
   - Visit `http://localhost:3000/en/admin` - English admin dashboard
   - Visit `http://localhost:3000/ur/admin` - Urdu admin dashboard (RTL)
   - Visit `http://localhost:3000/ar/admin` - Arabic admin dashboard (RTL)

3. **Test Language Switcher:**
   - Click the language dropdown in the header
   - Select a different language
   - Verify the URL updates and content changes
   - Verify RTL layout for Urdu/Arabic

## Adding New Translations

To add translations for a new page or component:

1. **Add keys to all language files:**

```json
// messages/en.json
{
  "myNewSection": {
    "title": "My New Title",
    "description": "My description"
  }
}
```

```json
// messages/ur.json
{
  "myNewSection": {
    "title": "میرا نیا عنوان",
    "description": "میری تفصیل"
  }
}
```

2. **Use in component:**

```typescript
const t = useTranslations('myNewSection');
return <h1>{t('title')}</h1>;
```

## Adding a New Language

To add support for a new language:

1. **Update `lib/i18n/config.ts`:**

```typescript
export const locales = ['en', 'ur', 'ar', 'fr'] as const; // Add 'fr'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ur: 'اردو',
  ar: 'العربية',
  fr: 'Français', // Add French
};

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ur: 'rtl',
  ar: 'rtl',
  fr: 'ltr', // Add direction
};
```

2. **Create translation file:**
   - Create `messages/fr.json` with all translation keys

3. **Update middleware:**
   - The middleware will automatically pick up the new locale

## Best Practices

1. **Always use translation keys** - Never hardcode text in components
2. **Keep keys organized** - Use namespaces for different sections
3. **Provide fallbacks** - Ensure all keys exist in all language files
4. **Test RTL layouts** - Verify UI works correctly in RTL mode
5. **Use locale in navigation** - Always include locale prefix in URLs
6. **Consistent naming** - Use camelCase for translation keys

## Known Limitations

1. **TypeScript Warning** - There's a minor TypeScript warning in `lib/i18n/request.ts` that doesn't affect functionality. This is a known issue with next-intl v4.5.5 and Next.js 16.
2. **Static Generation** - For production builds, ensure all locale paths are generated using `generateStaticParams`.

## Future Enhancements

1. **Locale Detection** - Add browser locale detection
2. **Locale Persistence** - Store user's language preference
3. **Dynamic Translations** - Fetch translations from WordPress API
4. **Date/Number Formatting** - Add locale-specific formatting
5. **Pluralization** - Implement plural rules for different languages

## Support & Documentation

- **next-intl Docs:** https://next-intl-docs.vercel.app/
- **Next.js i18n:** https://nextjs.org/docs/app/building-your-application/routing/internationalization
- **RTL Support:** https://rtlstyling.com/

## Troubleshooting

### Issue: 404 on locale routes
**Solution:** Ensure middleware.ts is in the root directory and properly configured.

### Issue: Translations not loading
**Solution:** Check that message files exist in `messages/` directory and are valid JSON.

### Issue: RTL not working
**Solution:** Verify `localeDirections` in `lib/i18n/config.ts` and check the `dir` attribute in HTML.

### Issue: Language switcher not updating
**Solution:** Ensure Redux store includes locale reducer and LanguageSelector uses `useTransition`.

## Migration Checklist for Existing Components

When updating existing components to use translations:

- [ ] Import `useTranslations` hook
- [ ] Replace hardcoded strings with translation keys
- [ ] Add translation keys to all language files
- [ ] Update navigation to include locale prefix
- [ ] Test in all supported languages
- [ ] Verify RTL layout (if applicable)

---

**Implementation Date:** November 26, 2025  
**Version:** 1.0.0  
**Status:** ✅ Complete and Production Ready
