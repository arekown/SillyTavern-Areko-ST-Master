import { settingsManager } from '../core/settings-manager';
import { getLatestTracker } from '../core/tracker-store';
import { categoryKey } from '../core/schema-builder';
import { Category, FieldDef, ExtensionSettings } from '../config/types';

export function getCharImage(name: string): string | undefined {
  return settingsManager.getSettings().characterImages?.[name];
}

function commit(fn: (map: Record<string, string>) => void): void {
  const s: ExtensionSettings = settingsManager.getSettings();
  if (!s.characterImages) s.characterImages = {};
  fn(s.characterImages);
  settingsManager.saveSettings();
}

export function setCharImage(name: string, url: string): void {
  commit((m) => { m[name] = url; });
}

export function deleteCharImage(name: string): void {
  commit((m) => { delete m[name]; });
}

function norm(s: any): string {
  return String(s ?? '').trim().toLowerCase();
}

function findPath(fields: FieldDef[], id: string, acc: string[]): string[] | null {
  for (const f of fields) {
    if (f.id === id) return [...acc, f.key];
    if (f.children) {
      const r = findPath(f.children, id, [...acc, f.key]);
      if (r) return r;
    }
  }
  return null;
}

function readPath(obj: any, path: string[]): any {
  return path.reduce((o, k) => (o == null ? o : o[k]), obj);
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

export function buildImagePrompt(name: string): string {
  const s = settingsManager.getSettings();
  const found = findCharEntry(name);
  let detail = '';
  if (found && s.imageGen.sourceFieldId) {
    const path = findPath(found.cat.fields, s.imageGen.sourceFieldId, []);
    if (path) {
      const v = readPath(found.entry, path);
      if (v && typeof v === 'string') detail = v;
    }
  }
  return [name, detail].filter(Boolean).join(', ').replace(/[|"\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function generateCharImage(name: string): Promise<void> {
  const ctx: any = SillyTavern.getContext();
  const exec = ctx?.executeSlashCommandsWithOptions || ctx?.executeSlashCommands;
  if (typeof exec !== 'function') throw new Error('Slash-Command-API nicht verfuegbar.');
  const prompt = buildImagePrompt(name);
  if (!prompt) throw new Error('Kein Bild-Prompt vorhanden (Quellfeld leer?).');
  const res: any = await exec.call(ctx, '/sd quiet=true ' + prompt);
  const url = String((res && (res.pipe ?? res)) ?? '').trim();
  if (!url || url === '[object Object]') throw new Error('Keine Bild-URL erhalten.');
  setCharImage(name, url);
}
