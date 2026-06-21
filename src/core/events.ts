import { settingsManager } from './settings-manager';
import { AutoMode } from '../config/types';
import { generateForMessage } from './generation';

const inFlight = new Set<number>();

// WTracker-Guard: Bild- oder Leer-Nachrichten NIEMALS tracken.
function shouldSkip(messageId: number): boolean {
  const ctx: any = SillyTavern.getContext();
  const m = ctx?.chat?.[messageId];
  if (!m) return true;
  if (m.extra?.image) return true; // angehaengtes Bild (/sd, Zauberstab, Background) -> skip
  const text = String(m.mes ?? '').trim();
  if (!text) return true;
  return false;
}

async function trigger(messageId: number): Promise<void> {
  if (typeof messageId !== 'number' || isNaN(messageId)) return;
  if (inFlight.has(messageId)) return;
  if (shouldSkip(messageId)) return;
  inFlight.add(messageId);
  try {
    await generateForMessage(messageId);
  } catch (e) {
    console.error('[Areko Tracker] auto-gen error', e);
  } finally {
    inFlight.delete(messageId);
  }
}

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
