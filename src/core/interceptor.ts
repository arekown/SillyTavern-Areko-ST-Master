import { settingsManager } from './settings-manager';
import { EXTENSION_KEY, TRACKER_VALUE_KEY } from '../config/constants';

// Laeuft VOR der normalen Generierung. Haengt die letzten X Tracker als JSON-Block
// in den ausgehenden Chat (jeweils nach ihrer Quell-Nachricht, wie WTracker),
// damit die KI den aktuellen Stand mitbekommt.
export function trackerInterceptor(chat: any[]): void {
  if (!Array.isArray(chat)) return;
  let count = 1;
  try { count = settingsManager.getSettings().includeLastXTrackers ?? 1; } catch { count = 1; }
  if (count <= 0) return;

  const idxs: number[] = [];
  for (let i = chat.length - 1; i >= 0 && idxs.length < count; i--) {
    if (chat[i]?.extra?.[EXTENSION_KEY]?.[TRACKER_VALUE_KEY]) idxs.push(i);
  }
  for (const i of idxs) {
    const v = chat[i].extra[EXTENSION_KEY][TRACKER_VALUE_KEY];
    const content = 'Tracker:\n```json\n' + JSON.stringify(v, null, 2) + '\n```';
    chat.splice(i + 1, 0, { role: 'user', is_user: true, is_system: false, mes: content, content, extra: {} });
  }
}
