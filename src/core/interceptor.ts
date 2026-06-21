import { settingsManager } from './settings-manager';
import { AutoMode, Timing } from '../config/types';
import { EXTENSION_KEY, TRACKER_VALUE_KEY } from '../config/constants';
import { generateForMessage } from './generation';
import { recentTrackerBlocks } from './tracker-store';

function lastUserMsgIndex(): number {
  const ctx: any = SillyTavern.getContext();
  const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
  for (let i = chat.length - 1; i >= 0; i--) {
    const m = chat[i];
    if (m?.is_user && !m.extra?.image && String(m.mes ?? '').trim()) return i;
  }
  return -1;
}

function hasTrackerAt(i: number): boolean {
  const ctx: any = SillyTavern.getContext();
  return !!ctx?.chat?.[i]?.extra?.[EXTENSION_KEY]?.[TRACKER_VALUE_KEY];
}

// Laeuft VOR jeder normalen Generierung (manifest: generate_interceptor).
export async function trackerInterceptor(chat: any[]): Promise<void> {
  if (!Array.isArray(chat)) return;
  let s: any;
  try { s = settingsManager.getSettings(); } catch { return; }

  // Timing "Vor der Antwort": Tracker fuer die letzte Nutzer-Nachricht jetzt erzeugen,
  // bevor die KI antwortet — der Interceptor wird von ST abgewartet.
  if (s.autoMode !== AutoMode.OFF && s.timing === Timing.BEFORE) {
    const idx = lastUserMsgIndex();
    if (idx >= 0 && !hasTrackerAt(idx)) {
      try { await generateForMessage(idx); } catch (e) { console.error('[Areko Tracker] before-gen error', e); }
    }
  }

  // Immer: die letzten X Tracker ans Chat-Ende mitgeben.
  const count = s.includeLastXTrackers ?? 1;
  if (count > 0) {
    const ctx: any = SillyTavern.getContext();
    const blocks = recentTrackerBlocks((ctx?.chat?.length ?? 1) - 1, count);
    for (const b of blocks) chat.push({ role: 'user', is_user: true, is_system: false, mes: b, content: b, extra: {} });
  }
}
