'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

export type ColorThemeName = 'ocean' | 'forest' | 'sun' | 'rose' | 'custom';

interface ColorTheme {
  primary: string;
  secondary: string;
  accent: string;
}

const presetThemes: Record<Exclude<ColorThemeName, 'custom'>, ColorTheme> = {
  ocean: {
    primary: '200 90% 50%',
    secondary: '190 80% 45%',
    accent: '210 85% 55%',
  },
  forest: {
    primary: '140 70% 45%',
    secondary: '120 65% 40%',
    accent: '160 75% 50%',
  },
  sun: {
    primary: '45 95% 55%',
    secondary: '35 90% 50%',
    accent: '25 85% 55%',
  },
  rose: {
    primary: '330 80% 60%',
    secondary: '320 75% 55%',
    accent: '340 85% 65%',
  },
};

interface ColorThemeContextType {
  colorTheme: ColorThemeName;
  setColorTheme: (theme: ColorThemeName) => void;
  customColors: ColorTheme;
  setCustomColors: (colors: ColorTheme) => void;
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorThemeName>('ocean');
  const [customColors, setCustomColorsState] = useState<ColorTheme>({
    primary: '200 90% 50%',
    secondary: '190 80% 45%',
    accent: '210 85% 55%',
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem('colorTheme') as ColorThemeName | null;
    const storedCustom = localStorage.getItem('customColors');

    if (storedTheme && ['ocean', 'forest', 'sun', 'rose', 'custom'].includes(storedTheme)) {
      setColorThemeState(storedTheme);
    }

    if (storedCustom) {
      try {
        const parsed = JSON.parse(storedCustom);
        setCustomColorsState(parsed);
      } catch (e) {
        console.error('Failed to parse custom colors');
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const colors = colorTheme === 'custom' ? customColors : presetThemes[colorTheme];

    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-secondary', colors.secondary);
    root.style.setProperty('--theme-accent', colors.accent);
  }, [colorTheme, customColors, mounted]);

  const setColorTheme = useCallback((theme: ColorThemeName) => {
    setColorThemeState(theme);
    localStorage.setItem('colorTheme', theme);
  }, []);

  const setCustomColors = useCallback((colors: ColorTheme) => {
    setCustomColorsState(colors);
    localStorage.setItem('customColors', JSON.stringify(colors));
    if (colorTheme === 'custom') {
      const root = document.documentElement;
      root.style.setProperty('--theme-primary', colors.primary);
      root.style.setProperty('--theme-secondary', colors.secondary);
      root.style.setProperty('--theme-accent', colors.accent);
    }
  }, [colorTheme]);

  const value = useMemo(
    () => ({ colorTheme, setColorTheme, customColors, setCustomColors }),
    [colorTheme, setColorTheme, customColors, setCustomColors]
  );

  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider');
  }
  return context;
}
