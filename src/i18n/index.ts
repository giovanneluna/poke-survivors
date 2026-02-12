/**
 * Internationalization system — PT-BR / EN
 * Usage: import { t, setLanguage, getLanguage } from '../i18n';
 *        t('menu.play')  // "▶  ENTRAR AGORA" or "▶  PLAY NOW"
 *        t('hud.level', { level: 5 })  // "Lv 5"
 */

import { pt } from './pt';
import { en } from './en';

export type Language = 'pt' | 'en';
type TranslationMap = Record<string, string>;

const STORAGE_KEY = 'poke-language';

const LANGS: Record<Language, TranslationMap> = { pt, en };

let current: Language = 'pt';

/** Initialize from localStorage (call once at boot) */
export function initLanguage(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && saved in LANGS) current = saved;
  } catch { /* localStorage blocked */ }
}

export function getLanguage(): Language {
  return current;
}

export function setLanguage(lang: Language): void {
  current = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* */ }
}

/**
 * Translate a key with optional interpolation.
 * `t('hud.kills', { count: 42 })` → "Kills: 42"
 * Falls back to PT if key missing in current language, then to key itself.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  let text = LANGS[current][key] ?? LANGS.pt[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{{${k}}}`, String(v));
    }
  }
  return text;
}
