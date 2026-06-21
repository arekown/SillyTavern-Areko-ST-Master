import { settingsManager } from './settings-manager';
import { AutoMode, Timing } from '../config/types';
import { generateForMessage } from './generation';

const inFlight = new Set<number>();

function shouldSkip(messageId: number): boolean {
  const ctx: any = SillyTavern.getContext();
  const m = ctx?.chat?.[messageId];
  if (!m) return true;
  if (m.extra?.image) return true; // /sd, Zauberstab, Background -> NIE tracken
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

export function wireAutoMode(): void {
  const ctx: any = SillyTavern.getContext();
  const es = ctx?.eventSource;
  const et = ctx?.eventTypes || ctx?.event_types || {};
  if (!es?.on) return;

  // Nur "Nach der Antwort": die Render-Events. "Vor der Antwort" laeuft im Interceptor.
  if (et.USER_MESSAGE_RENDERED) {
    es.on(et.USER_MESSAGE_RENDERED, (id: number) => {
      const s = settingsManager.getSettings();
      if (s.timing !== Timing.AFTER) return;
      if (s.autoMode === AutoMode.INPUTS || s.autoMode === AutoMode.BOTH) trigger(id);
    });
  }
  if (et.CHARACTER_MESSAGE_RENDERED) {
    es.on(et.CHARACTER_MESSAGE_RENDERED, (id: number) => {
      const s = settingsManager.getSettings();
      if (s.timing !== Timing.AFTER) return;
      if (s.autoMode === AutoMode.RESPONSES || s.autoMode === AutoMode.BOTH) trigger(id);
    });
  }
}
