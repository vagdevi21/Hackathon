/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Theme Manager (Dark, Light, System)
 */

export type ThemeMode = 'dark' | 'light' | 'system';

export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('dw_theme') as ThemeMode;
  if (saved && ['dark', 'light', 'system'].includes(saved)) {
    return saved;
  }
  return 'dark'; // Dark mode default for Cyber SOC HUD
}

export function applyTheme(mode: ThemeMode) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effectiveTheme = mode === 'system' ? (isSystemDark ? 'dark' : 'light') : mode;

  if (effectiveTheme === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
    document.body.classList.add('light');
    document.body.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
    document.body.classList.add('dark');
    document.body.classList.remove('light');
  }

  localStorage.setItem('dw_theme', mode);
}
