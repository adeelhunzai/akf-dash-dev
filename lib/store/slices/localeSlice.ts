import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Locale } from '@/lib/i18n/config';

interface LocaleState {
  currentLocale: Locale;
}

const initialState: LocaleState = {
  currentLocale: 'en',
};

export const localeSlice = createSlice({
  name: 'locale',
  initialState,
  reducers: {
    setLocale: (state, action: PayloadAction<Locale>) => {
      state.currentLocale = action.payload;
    },
  },
});

export const { setLocale } = localeSlice.actions;
export default localeSlice.reducer;
