import { settingsManager } from '../core/settings-manager';
import { getLatestTracker, getPlayerName } from '../core/tracker-store';
import { categoryKey } from '../core/schema-builder';
import { buildContextMessages } from '../core/generation';
import { renderTemplate, DEFAULT_LOREBOOK_PROMPT } from '../core/prompts';
import { Category, FieldDef } from '../config/types';

function norm(s: any): string { return String(s ?? '').trim().toLowerCase(); }
function languageWord(): string { return settingsManager.getSettings().language === 'en' ? 'English' : 'German'; }

async function exec(cmd: string): Promise<string> {
  const ctx: any = SillyTavern.getContext();
  const fn = ctx?.executeSlashCommandsWithOptions || ctx?.executeSlashCommands;
  if (typeof fn !== 'function') throw new Error('Slash-Command-API nicht verfuegbar.');
  const res: any = await fn.call(ctx, cmd);
  return String((res && (res.pipe ?? res)) ?? '').trim();
}

function boundChatBook(): string {
  const ctx: any = SillyTavern.getContext();
  return ctx?.chatMetadata?.world_info || ctx?.chat_metadata?.world_info || '';
}
async function getOrCreateChatBook(): Promise<string> {
  const name = await exec('/getchatbook');
  if (!name) throw new Error('Konnte kein Chat-Lorebook ermitteln.');
  return name;
}
async function loadBook(book: string): Promise<any | null> {
  const ctx: any = SillyTavern.getContext();
  if (!book || typeof ctx.loadWorldInfo !== 'function') return null;
  try { return await ctx.loadWorldInfo(book); } catch { return null; }
}
function entriesList(data: any): any[] {
  const e = data?.entries; if (!e) return [];
  return Array.isArray(e) ? e : Object.values(e);
}
function findEntryObj(data: any, name: string): any | null {
  const n = norm(name);
  return entriesList(data).find((e: any) => norm(e?.comment) === n || (Array.isArray(e?.key) && e.key.some((k: any) => norm(k) === n))) || null;
}

// Lesende Stapel-Pruefung (keine Slash-Commands, keine Toasts, legt kein Buch an).
export async function lorebookExistsBatch(names: string[]): Promise<Record<string, boolean>> {
  const out: Record<string, boolean> = {};
  for (const n of names) out[n] = false;
  const data = await loadBook(boundChatBook());
  if (!data) return out;
  const list = entriesList(data);
  for (const name of names) {
    const n = norm(name);
    out[name] = list.some((e: any) => norm(e?.comment) === n || (Array.isArray(e?.key) && e.key.some((k: any) => norm(k) === n)));
  }
  return out;
}

function findPath(fields: FieldDef[], id: string, acc: string[]): string[] | null {
  for (const f of fields) {
    if (f.id === id) return [...acc, f.key];
    if (f.children) { const r = findPath(f.children, id, [...acc, f.key]); if (r) return r; }
  }
  return null;
}
function labelOf(fields: FieldDef[], id: string): string {
  for (const f of fields) {
    if (f.id === id) return f.label;
    if (f.children) { const r = labelOf(f.children, id); if (r) return r; }
  }
  return id;
}
function readPath(obj: any, path: string[]): any { return path.reduce((o, k) => (o == null ? o : o[k]), obj); }

function findCharEntry(name: string): { cat: Category; entry: any } | null {
  const s = settingsManager.getSettings();
  const cats = s.presets[s.activePreset]?.categories ?? [];
  const data = getLatestTracker();
  if (!data) return null;
  for (const cat of cats) {
    if (cat.scope !== 'perCharacter') continue;
    const arr = data[categoryKey(cat)];
    if (!Array.isArray(arr)) continue;
    const entry = arr.find((e: any) => norm(e?.character ?? e?.name) === norm(name));
    if (entry) return { cat, entry };
  }
  return null;
}

function sourceData(name: string): Record<string, any> {
  // Immer den KOMPLETTEN Charakter-Tracker mitschicken.
  const found = findCharEntry(name);
  if (!found) return {};
  const out: Record<string, any> = {};
  for (const f of found.cat.fields) out[f.label] = found.entry?.[f.key];
  return out;
}

// Optionale Betonung: das im Layout zugewiesene Feld/die Gruppe gesondert hervorheben.
function emphasisNote(name: string): string {
  const s = settingsManager.getSettings();
  const id = s.lorebookExport.sourceFieldId;
  if (!id) return '';
  const found = findCharEntry(name);
  if (!found) return '';
  const path = findPath(found.cat.fields, id, []);
  if (!path) return '';
  const val = readPath(found.entry, path);
  if (val == null || val === '') return '';
  const txt = typeof val === 'string' ? val : JSON.stringify(val);
  return 'When writing, give special weight to this field: ' + labelOf(found.cat.fields, id) + ' = ' + txt;
}

function extractJson(content: string): any {
  let text = String(content ?? '').trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  // 1) direkter Versuch
  try { return JSON.parse(text); } catch { /* weiter */ }
  // 2) groesstes {...}-Objekt aus dem Text herausschneiden
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) {
    const slice = text.slice(first, last + 1);
    try { return JSON.parse(slice); } catch { /* weiter */ }
  }
  return null;
}

function pickField(obj: any, names: string[]): any {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const n of names) {
    for (const k of Object.keys(obj)) {
      if (k.toLowerCase() === n) return obj[k];
    }
  }
  return undefined;
}

export async function generateLorebookEntry(name: string): Promise<void> {
  const ctx: any = SillyTavern.getContext();
  const settings = settingsManager.getSettings();
  if (!settings.profileId) throw new Error('Kein Connection-Profil gewaehlt.');
  const service = ctx?.ConnectionManagerRequestService;
  if (!service?.sendRequest) throw new Error('ConnectionManagerRequestService nicht verfuegbar.');
  if (typeof ctx.loadWorldInfo !== 'function' || typeof ctx.saveWorldInfo !== 'function') {
    throw new Error('World-Info-API (loadWorldInfo/saveWorldInfo) nicht verfuegbar.');
  }

  const book = await getOrCreateChatBook();
  const pre = await loadBook(book);
  const existing = pre ? findEntryObj(pre, name) : null;

  const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
  const context = await buildContextMessages(chat.length - 1);

  const dataBlock = 'Structured data for "' + name + '" (player is "' + getPlayerName() + '"):\n```json\n' +
    JSON.stringify(sourceData(name), null, 2) + '\n```';
  context.push({ role: 'user', content: dataBlock });

  const emph = emphasisNote(name);
  if (emph) context.push({ role: 'user', content: emph });

  if (existing) {
    const keysStr = Array.isArray(existing.key) ? existing.key.join(', ') : '';
    context.push({ role: 'user', content: 'An existing lorebook entry already exists. Keys: ' + (keysStr || '(none)') +
      '\nExisting content:\n"""\n' + String(existing.content ?? '') + '\n"""\nUpdate and extend it; do not discard established facts.' });
  }

  const prompt = renderTemplate(settings.lorebookPrompt || DEFAULT_LOREBOOK_PROMPT, { name, language: languageWord() });
  context.push({ role: 'user', content: prompt });

  const res: any = await service.sendRequest(settings.profileId, context, settings.maxResponseToken);
  const content: string = typeof res === 'string' ? res : res?.content ?? '';
  if (!content) throw new Error('Leere Antwort vom Modell.');

  const parsed = extractJson(content);

  let entryText = '';
  let rawKeys: any = undefined;
  if (parsed && typeof parsed === 'object') {
    entryText = String(pickField(parsed, ['content', 'entry', 'text', 'description', 'body', 'lore']) ?? '').trim();
    rawKeys = pickField(parsed, ['keys', 'keywords', 'triggers', 'key']);
  }
  // Fallback: kein brauchbares JSON -> rohe Textantwort als Inhalt verwenden
  if (!entryText) {
    const rawFallback = String(content ?? '').replace(/```[a-z]*\n?|```/gi, '').trim();
    if (rawFallback.length >= 20) {
      console.warn('[Areko Tracker] Lorebook: kein JSON-content erkannt, nutze Rohtext. Rohantwort:', content);
      entryText = rawFallback;
    }
  }
  if (!entryText) {
    console.error('[Areko Tracker] Lorebook-Rohantwort ohne verwertbaren Text:', content);
    throw new Error('Antwort enthielt keinen Lorebook-Text. (Rohantwort in der Konsole)');
  }

  let keys: string[] = Array.isArray(rawKeys)
    ? rawKeys.map((k: any) => String(k).trim()).filter(Boolean)
    : (typeof rawKeys === 'string' ? rawKeys.split(',').map((k) => k.trim()).filter(Boolean) : []);
  if (!keys.some((k) => norm(k) === norm(name))) keys.unshift(name);
  keys = Array.from(new Set(keys)).slice(0, 12);

  // Schreiben ueber die World-Info-API -> kein Slash-Escaping fuer langen Text.
  let data = await ctx.loadWorldInfo(book);
  if (!data || !data.entries) data = { entries: {} };
  let entry = findEntryObj(data, name);
  if (!entry) {
    const safeKey = name.replace(/["\\,]/g, ' ').trim() || name;
    const uidStr = await exec(`/createentry file="${book}" key="${safeKey}"`);
    data = await ctx.loadWorldInfo(book);
    const uid = parseInt(uidStr, 10);
    entry = (data?.entries && (data.entries[uid] ?? data.entries[String(uid)])) || findEntryObj(data, name) || entriesList(data).slice(-1)[0] || null;
  }
  if (!entry) throw new Error('Eintrag konnte nicht angelegt werden.');
  entry.key = keys;
  entry.comment = name;
  entry.content = entryText;
  await ctx.saveWorldInfo(book, data, true);
}
