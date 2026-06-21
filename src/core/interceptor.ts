import { settingsManager } from './settings-manager';
import { Timing } from '../config/types';
import { EXTENSION_KEY, TRACKER_VALUE_KEY } from '../config/constants';

// Haengt die letzten X Tracker als JSON-Block in den ausgehenden Chat —
// NUR wenn Timing = "Vor der Antwort". Sonst bekommt das LLM den Tracker nicht mit.
export function injectLatestTracker(chat: any[]): void {
  if (!Array.isArray(chat)) return;
  let count = 1;
  let timing: Timing = Timing.AFTER;
  try {
    const s = settingsManager.getSettings();
    count = s.includeLastXTrackers ?? 1;
    timing = s.timing;
  } catch { /* defaults */ }

  if (timing !== Timing.BEFORE) return;
  if (count <= 0) return;

  const idxs: number[] = [];
  for (let i = chat.length - 1; i >= 0 && idxs.length < count; i--) {
    if (chat[i]?.extra?.[EXTENSION_KEY]?.[TRACKER_VALUE_KEY]) idxs.push(i);
  }
  for (const i of idxs) {
    const v = chat[i].extra[EXTENSION_KEY][TRACKER_VALUE_KEY];
    const content = 'Tracker:\n```json\n' + JSON.stringify(v, null, 2) + '\n```';
    chat.splice(i + 1, 0, { role: 'user', is_user: true, is_system: false, mes: content, extra: {} });
  }
}
