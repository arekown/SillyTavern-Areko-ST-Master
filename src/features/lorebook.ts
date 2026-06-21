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

export async function getChatBook(): Promise<string> {
  const name = await exec('/getchatbook');
  if (!name) throw new Error('Konnte kein Chat-Lorebook ermitteln.');
  return name;
}

async function findEntryUid(book: string, name: string): Promise<string> {
  let uid = await exec(`/findentry file="${book}" field=comment ${name}`);
  if (!uid) uid = await exec(`/findentry file="${book}" field=key ${name}`);
  return /^\d+$/.test(uid) ? uid : '';
}

export async function lorebookEntryExists(name: string): Promise<boolean> {
  try {
    const book = await getChatBook();
    return !!(await findEntryUid(book, name));
  } catch {
    return false;
  }
}

function pickFields(fields: FieldDef[], wanted: Set<string>, entry: any, into: Record<string, any>, prefix = ''): void {
  for (const f of fields) {
    if (f.enabled === false) continue;
    const label = prefix ? prefix + ' › ' + f.label : f.label;
    if (f.type === 'group' || f.type === 'objectList') {
      if (wanted.has(f.id)) into[label] = entry?.[f.key];
      else if (f.children) pickFields(f.children, wanted, entry?.[f.key] ?? {}, into, label);
    } else if (wanted.has(f.id)) {
      into[label] = entry?.[f.key];
    }
  }
}

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

function selectedCharData(name: string): Record<string, any> {
  const s = settingsManager.getSettings();
  const wanted = new Set(s.lorebookExport.enabledFieldIds ?? []);
  const found = findCharEntry(name);
  const out: Record<string, any> = {};
  if (found) {
    if (wanted.size > 0) pickFields(found.cat.fields, wanted, found.entry, out);
    else for (const f of found.cat.fields) out[f.label] = found.entry?.[f.key];
  }
  return out;
}

function extractJson(content: string): any {
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  try { return JSON.parse(text); } catch { return null; }
}

export async function generateLorebookEntry(name: string): Promise<void> {
  const ctx: any = SillyTavern.getContext();
  const settings = settingsManager.getSettings();
  if (!settings.profileId) throw new Error('Kein Connection-Profil gewaehlt.');
  const service = ctx?.ConnectionManagerRequestService;
  if (!service?.sendRequest) throw new Error('ConnectionManagerRequestService nicht verfuegbar.');

  const book = await getChatBook();
  const existingUid = await findEntryUid(book, name);
  let existingContent = '';
  let existingKeys = '';
  if (existingUid) {
    existingContent = await exec(`/getentryfield file="${book}" field=content ${existingUid}`);
    existingKeys = await exec(`/getentryfield file="${book}" field=key ${existingUid}`);
  }

  const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
  const endIndex = chat.length - 1;
  const context = await buildContextMessages(endIndex);

  const charData = selectedCharData(name);
  const dataBlock =
    'Structured data for "' + name + '" (player is "' + getPlayerName() + '"):\n```json\n' +
    JSON.stringify(charData, null, 2) + '\n```';
  context.push({ role: 'user', content: dataBlock });

  if (existingUid) {
    const ex = 'An existing lorebook entry already exists. Keys: ' + (existingKeys || '(none)') +
      '\nExisting content:\n"""\n' + existingContent + '\n"""\nUpdate and extend it; do not discard established facts.';
    context.push({ role: 'user', content: ex });
  }

  const prompt = renderTemplate(settings.lorebookPrompt || DEFAULT_LOREBOOK_PROMPT, { name, language: languageWord() });
  context.push({ role: 'user', content: prompt });

  const res: any = await service.sendRequest(settings.profileId, context, settings.maxResponseToken);
  const content: string = typeof res === 'string' ? res : res?.content ?? '';
  if (!content) throw new Error('Leere Antwort vom Modell.');

  const parsed = extractJson(content);
  const entryText = String(parsed?.content ?? '').trim();
  let keys: string[] = Array.isArray(parsed?.keys) ? parsed.keys.map((k: any) => String(k).trim()).filter(Boolean) : [];
  if (!entryText) throw new Error('Antwort enthielt keinen Lorebook-Text.');
  if (!keys.some((k) => norm(k) === norm(name))) keys.unshift(name);
  keys = Array.from(new Set(keys)).slice(0, 12);

  await exec('/setvar key=arekoLoreContent ' + JSON.stringify(entryText));

  let uid = existingUid;
  if (!uid) {
    uid = await exec(`/createentry file="${book}" key="${keys.join(',')}" {{getvar::arekoLoreContent}}`);
    if (!/^\d+$/.test(uid)) uid = await findEntryUid(book, name);
    if (uid) await exec(`/setentryfield file="${book}" uid=${uid} field=comment ${name}`);
  } else {
    await exec(`/setentryfield file="${book}" uid=${uid} field=key ${keys.join(',')}`);
    await exec(`/setentryfield file="${book}" uid=${uid} field=content {{getvar::arekoLoreContent}}`);
  }
  await exec('/flushvar arekoLoreContent');

  if (!uid) throw new Error('Eintrag konnte nicht angelegt werden.');
}
