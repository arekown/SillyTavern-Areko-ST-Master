import { settingsManager } from './settings-manager';
import { AutoMode } from '../config/types';
import { generateForMessage } from './generation';

const inFlight = new Set<number>();

// WTracker-Guard: Bild-/Leer-Nachrichten NIE tracken.
function shouldSkip(messageId: number): boolean {
  const ctx: any = SillyTavern.getContext();
  const m = ctx?.chat?.[messageId];
  if (!m) return true;
  if (m.extra?.image) return true;
  if (!String(m.mes ?? '').trim()) return true;
  return false;
}

async function trigger(messageId: number): Promise<void> {
  if (typeof messageId !== 'number' || isNaN(messageId)) return;
  if (inFlight.has(messageId) || shouldSkip(messageId)) return;
  inFlight.add(messageId);
  try { await generateForMessage(messageId); }
  catch (e) { console.error('[Areko Tracker] auto-gen error', e); }
  finally { inFlight.delete(messageId); }
}

// Tracker entsteht immer NACH der gerenderten Nachricht:
// "Nur bei Eingaben" -> Nutzer-Nachricht; "Nur bei Antworten" -> KI-Nachricht.
export function wireAutoMode(): void {
  const ctx: any = SillyTavern.getContext();
  const es = ctx?.eventSource;
  const et = ctx?.eventTypes || ctx?.event_types || {};
  if (!es?.on) return;

  if (et.USER_MESSAGE_RENDERED) {
    es.on(et.USER_MESSAGE_RENDERED, (id: number) => {
      const am = settingsManager.getSettings().autoMode;
      if (am === AutoMode.INPUTS || am === AutoMode.BOTH) trigger(id);
    });
  }
  if (et.CHARACTER_MESSAGE_RENDERED) {
    es.on(et.CHARACTER_MESSAGE_RENDERED, (id: number) => {
      const am = settingsManager.getSettings().autoMode;
      if (am === AutoMode.RESPONSES || am === AutoMode.BOTH) trigger(id);
    });
  }
}
