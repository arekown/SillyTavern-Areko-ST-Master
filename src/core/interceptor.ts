import { EXTENSION_KEY, TRACKER_VALUE_KEY } from '../config/constants';

// Injiziert NUR den juengsten Tracker als JSON-Block in den Prompt.
// (Timing "before": laeuft als generate_interceptor.)
export function injectLatestTracker(chat: any[]): void {
  if (!Array.isArray(chat)) return;
  for (let i = chat.length - 2; i >= 0; i--) {
    const value = chat[i]?.extra?.[EXTENSION_KEY]?.[TRACKER_VALUE_KEY];
    if (value) {
      const content = 'Tracker:\n```json\n' + JSON.stringify(value, null, 2) + '\n```';
      chat.splice(i + 1, 0, {
        role: 'user',
        is_user: true,
        is_system: false,
        mes: content,
        extra: {},
      });
      return; // nur das letzte Ergebnis
    }
  }
}
