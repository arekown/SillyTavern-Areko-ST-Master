import { Language } from '../config/types';
import { settingsManager } from '../core/settings-manager';
import { STRINGS } from './strings';

// Liest die aktuell gewaehlte Sprache aus den Settings.
function currentLanguage(): Language {
  try {
    return settingsManager.getSettings().language ?? 'de';
  } catch {
    return 'de';
  }
}

// Uebersetzt einen Key. Fehlt er, kommt der Key selbst zurueck (faellt im UI auf).
export function t(key: string): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  const lang = currentLanguage();
  return entry[lang] ?? entry.de ?? key;
}