import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEME_PRESETS = [
  {
    id: 'ironnest',
    name: 'IronNest Classic (Sesuai Referensi)',
    description: 'Dark Navy dengan aksen emas industri hangat, sesuai screenshot referensi.',
    primaryHex: '#F59E0B',
    primaryRgb: { r: 245, g: 158, b: 11 },
    sidebarBg: '#16374A',
    activePillBg: '#F59E0B',
    activePillText: '#0F172A',
    mode: 'light',
    previewGradient: 'from-[#16374A] via-[#1E3A5F] to-[#F59E0B]'
  },
  {
    id: 'corporate-red',
    name: 'Digitech Red (Resmi)',
    description: 'Warna korporat merah Digitech dan slate pekat.',
    primaryHex: '#DC2626',
    primaryRgb: { r: 220, g: 38, b: 38 },
    sidebarBg: '#0F172A',
    activePillBg: '#DC2626',
    activePillText: '#FFFFFF',
    mode: 'light',
    previewGradient: 'from-[#0F172A] via-[#991B1B] to-[#DC2626]'
  },
  {
    id: 'emerald-mine',
    name: 'Mining Emerald (Hijau Tambang)',
    description: 'Nuansa hijau tambang ramah lingkungan dengan emerald vivid.',
    primaryHex: '#059669',
    primaryRgb: { r: 5, g: 150, b: 105 },
    sidebarBg: '#064E3B',
    activePillBg: '#10B981',
    activePillText: '#FFFFFF',
    mode: 'light',
    previewGradient: 'from-[#064E3B] via-[#047857] to-[#10B981]'
  },
  {
    id: 'royal-cyan',
    name: 'Electric Cyan (Teknologi Modern)',
    description: 'Aksen biru elektrik modern untuk command center digital.',
    primaryHex: '#0284C7',
    primaryRgb: { r: 2, g: 132, b: 199 },
    sidebarBg: '#0B192C',
    activePillBg: '#0EA5E9',
    activePillText: '#FFFFFF',
    mode: 'light',
    previewGradient: 'from-[#0B192C] via-[#0369A1] to-[#0EA5E9]'
  },
  {
    id: 'obsidian-dark',
    name: 'Obsidian High-Contrast Dark',
    description: 'Mode gelap pekat dengan aksen ruby crimson untuk kenyamanan malam.',
    primaryHex: '#E11D48',
    primaryRgb: { r: 225, g: 29, b: 72 },
    sidebarBg: '#09090B',
    activePillBg: '#E11D48',
    activePillText: '#FFFFFF',
    mode: 'dark',
    previewGradient: 'from-[#09090B] via-[#18181B] to-[#E11D48]'
  }
];

export const FONT_OPTIONS = [
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans (Korporat Elegan)' },
  { id: 'Outfit', name: 'Outfit (Modern & Clean)' },
  { id: 'Inter', name: 'Inter (Standar UI Internasional)' },
  { id: 'JetBrains Mono', name: 'JetBrains Mono (Industrial & Tech)' },
];

export const SCALE_OPTIONS = [
  { id: 0.9, label: 'Ringkas (90%)', desc: 'Cocok untuk monitor padat / banyak kolom' },
  { id: 1.0, label: 'Standar (100%)', desc: 'Ukuran default ideal untuk semua layar' },
  { id: 1.1, label: 'Luas (110%)', desc: 'Teks lebih besar dan tombol lebih lega' },
  { id: 1.2, label: 'Sentuh Site (120%)', desc: 'Ideal untuk tablet rugged & layar sentuh' },
];

export const FONT_SIZE_OPTIONS = [
  { id: 'sm', label: 'Kecil (Compact)', baseSize: '15px' },
  { id: 'base', label: 'Sedang (Normal)', baseSize: '16px' },
  { id: 'lg', label: 'Besar (Comfort)', baseSize: '17.5px' },
];

const DEFAULT_PREFERENCES = {
  activePresetId: 'ironnest', // Default to IronNest layout & colors as requested!
  primaryHex: '#F59E0B',
  primaryRgb: { r: 245, g: 158, b: 11 },
  sidebarBg: '#16374A',
  activePillBg: '#F59E0B',
  activePillText: '#0F172A',
  colorMode: 'light',
  screenScale: 1.0,
  fontFamily: 'Plus Jakarta Sans',
  fontSize: 'base',
  buttonShape: 'rounded-xl',
};

export function ThemeProvider({ children }) {
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('digitech_user_preferences');
      if (saved) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed reading preferences from localStorage:', e);
    }
    return DEFAULT_PREFERENCES;
  });

  const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);

  // Apply CSS custom properties dynamically to document.documentElement
  useEffect(() => {
    const root = document.documentElement;
    const { primaryHex, primaryRgb, screenScale, fontFamily, fontSize, colorMode, sidebarBg, activePillBg, activePillText } = preferences;

    // Primary Colors
    root.style.setProperty('--primary-color', primaryHex);
    root.style.setProperty('--primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    root.style.setProperty('--primary-light', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.12)`);
    root.style.setProperty('--primary-hover', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.85)`);
    
    // Sidebar & Navigation
    root.style.setProperty('--sidebar-bg', sidebarBg);
    root.style.setProperty('--active-pill-bg', activePillBg);
    root.style.setProperty('--active-pill-text', activePillText);

    // Font Family & Size
    root.style.setProperty('--font-body', `'${fontFamily}', sans-serif`);
    root.style.setProperty('--font-display', `'${fontFamily}', sans-serif`);
    
    const sizeConfig = FONT_SIZE_OPTIONS.find(s => s.id === fontSize) || FONT_SIZE_OPTIONS[1];
    root.style.fontSize = sizeConfig.baseSize;

    // Screen Scale (Zoom)
    if (screenScale && screenScale !== 1.0) {
      root.style.zoom = screenScale;
    } else {
      root.style.zoom = '1';
    }

    // Dark / Light class
    if (colorMode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // Persist to storage
    try {
      localStorage.setItem('digitech_user_preferences', JSON.stringify(preferences));
    } catch (e) {
      console.warn('Failed writing preferences to localStorage:', e);
    }
  }, [preferences]);

  // Helper functions
  const selectPreset = (presetId) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setPreferences(prev => ({
      ...prev,
      activePresetId: preset.id,
      primaryHex: preset.primaryHex,
      primaryRgb: preset.primaryRgb,
      sidebarBg: preset.sidebarBg,
      activePillBg: preset.activePillBg,
      activePillText: preset.activePillText,
      colorMode: preset.mode,
    }));
  };

  const setRgbColor = (r, g, b) => {
    // Clamp 0-255
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(Number(v) || 0)));
    const red = clamp(r);
    const green = clamp(g);
    const blue = clamp(b);

    const hex = `#${((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1).toUpperCase()}`;

    // Determine readable text color on this background
    const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
    const textOnPrimary = luminance > 0.55 ? '#0F172A' : '#FFFFFF';

    setPreferences(prev => ({
      ...prev,
      activePresetId: 'custom',
      primaryHex: hex,
      primaryRgb: { r: red, g: green, b: blue },
      activePillBg: hex,
      activePillText: textOnPrimary,
    }));
  };

  const setHexColor = (hex) => {
    // Parse hex to RGB
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      setRgbColor(r, g, b);
    }
  };

  const setScreenScale = (scale) => {
    setPreferences(prev => ({ ...prev, screenScale: Number(scale) }));
  };

  const setFontFamily = (font) => {
    setPreferences(prev => ({ ...prev, fontFamily: font }));
  };

  const setFontSize = (size) => {
    setPreferences(prev => ({ ...prev, fontSize: size }));
  };

  const toggleColorMode = () => {
    setPreferences(prev => ({
      ...prev,
      colorMode: prev.colorMode === 'dark' ? 'light' : 'dark'
    }));
  };

  const resetToDefault = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  const openPreferenceModal = () => setIsPreferenceModalOpen(true);
  const closePreferenceModal = () => setIsPreferenceModalOpen(false);

  return (
    <ThemeContext.Provider
      value={{
        preferences,
        selectPreset,
        setRgbColor,
        setHexColor,
        setScreenScale,
        setFontFamily,
        setFontSize,
        toggleColorMode,
        resetToDefault,
        isPreferenceModalOpen,
        openPreferenceModal,
        closePreferenceModal,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
