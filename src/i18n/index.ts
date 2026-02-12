/**
 * Internationalization system — PT-BR / EN
 * Usage: import { t, setLanguage, getLanguage } from '../i18n';
 *        t('menu.play')  // "▶  PLAY NOW" or "▶  ENTRAR AGORA"
 *        t('hud.level', { level: 5 })  // "Lv 5"
 */

import { pt } from './pt';
import { en } from './en';

export type Language = 'pt' | 'en';
type TranslationMap = Record<string, string>;

const STORAGE_KEY = 'poke-language';

const LANGS: Record<Language, TranslationMap> = { pt, en };

let current: Language = 'en';
let isFirstTime = false;

/** Initialize from localStorage (call once at boot) */
export function initLanguage(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && saved in LANGS) {
      current = saved;
      isFirstTime = false;
    } else {
      current = 'en';
      isFirstTime = true;
    }
  } catch { /* localStorage blocked */ }
}

export function getLanguage(): Language {
  return current;
}

/** Returns true if no language was saved yet (first visit) */
export function isFirstVisit(): boolean {
  return isFirstTime;
}

/** Mark first visit as handled (after user picks language) */
export function clearFirstVisit(): void {
  isFirstTime = false;
}

export function setLanguage(lang: Language): void {
  current = lang;
  isFirstTime = false;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* */ }
}

/**
 * Translate a key with optional interpolation.
 * `t('hud.kills', { count: 42 })` → "Kills: 42"
 * Falls back to EN if key missing in current language, then to key itself.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  let text = LANGS[current][key] ?? LANGS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{{${k}}}`, String(v));
    }
  }
  return text;
}
