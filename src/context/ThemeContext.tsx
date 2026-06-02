'use client';

import { ThemeContextType, ThemeType } from '@/lib/types';
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Solusi Sempurna: Ambil fungsi inisialisasi state langsung dari localStorage agar tidak kedap-kedip saat refresh
  const [theme, setThemeState] = useState<ThemeType>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as ThemeType) || 'system';
    }
    return 'dark'; // Fallback saat Server-Side Rendering
  });

  const applyTheme = (targetTheme: ThemeType) => {
    const root = document.documentElement;
    let finalTheme: 'light' | 'dark' = 'dark';

    if (targetTheme === 'system') {
      const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      finalTheme = systemIsDark ? 'dark' : 'light';
    } else {
      finalTheme = targetTheme;
    }

    root.setAttribute('data-theme', finalTheme);
  };

  // Terapkan tema setiap kali state 'theme' berubah
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Pantau perubahan preferensi sistem (jika pakai mode 'system')
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook agar panggilnya gampang di komponen lain
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme harus digunakan di dalam ThemeProvider');
  }
  return context;
}