import { EXTENSION_KEY, TRACKER_VALUE_KEY } from '../config/constants';

function saveChat(ctx: any): void {
  if (typeof ctx.saveChat === 'function') ctx.saveChat();
  else if (typeof ctx.saveChatDebounced === 'function') ctx.saveChatDebounced();
}

export function getTrackerFor(messageId: number): any | null {
  const ctx: any = SillyTavern.getContext();
  return ctx?.chat?.[messageId]?.extra?.[EXTENSION_KEY]?.[TRACKER_VALUE_KEY] ?? null;
}

export function setTrackerFor(messageId: number, value: any): void {
  const ctx: any = SillyTavern.getContext();
  const msg = ctx?.chat?.[messageId];
  if (!msg) return;
  if (!msg.extra) msg.extra = {};
  if (!msg.extra[EXTENSION_KEY]) msg.extra[EXTENSION_KEY] = {};
  msg.extra[EXTENSION_KEY][TRACKER_VALUE_KEY] = value;
  saveChat(ctx);
}

export function clearTrackerFor(messageId: number): void {
  const ctx: any = SillyTavern.getContext();
  const msg = ctx?.chat?.[messageId];
  if (msg?.extra?.[EXTENSION_KEY]) {
    delete msg.extra[EXTENSION_KEY];
    saveChat(ctx);
  }
}

export function getLatestTracker(): any | null {
  const ctx: any = SillyTavern.getContext();
  const chat = ctx?.chat;
  if (!Array.isArray(chat)) return null;
  for (let i = chat.length - 1; i >= 0; i--) {
    const v = chat[i]?.extra?.[EXTENSION_KEY]?.[TRACKER_VALUE_KEY];
    if (v) return v;
  }
  return null;
}

export function getPlayerName(): string {
  const ctx: any = SillyTavern.getContext();
  return String(ctx?.name1 || 'You');
}

export function notifyUpdated(): void {
  window.dispatchEvent(new CustomEvent('areko:updated'));
}
