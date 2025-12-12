"use client";

import Image from "next/image";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/lib/i18n/config';
import { useAppDispatch } from '@/lib/store/hooks';
import { setLocale } from '@/lib/store/slices/localeSlice';
import { useTransition } from 'react';

export default function LanguageSelector() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: Locale) => {
    // Update Redux state
    dispatch(setLocale(newLocale));
    
    // Update URL - replace the locale segment
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    
    startTransition(() => {
      router.replace(newPath);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-9 rounded-md border-0"
          style={{ backgroundColor: '#F7F7F7' }}
          disabled={isPending}
        >
          <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center">
            <Image
              src={`/flags/${currentLocale}.svg`}
              alt={localeNames[currentLocale]}
              width={24}
              height={24}
              className="h-full w-auto object-cover"
            />
          </div>
          <span className="uppercase text-sm font-medium text-gray-700">
            {currentLocale}
          </span>
          <ChevronDown className="w-3 h-3 text-gray-600" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center">
                <Image
                  src={`/flags/${locale}.svg`}
                  alt={localeNames[locale]}
                  width={24}
                  height={24}
                  className="h-full w-auto object-cover"
                />
              </div>
              <span>{localeNames[locale]}</span>
            </div>
            {currentLocale === locale && (
              <Check className="w-4 h-4 text-[#00B87C]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
