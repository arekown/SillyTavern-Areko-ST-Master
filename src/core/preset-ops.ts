import { ExtensionSettings, Preset, Language } from '../config/types';
import { genId } from './field-ops';
import { makeDefaultPreset } from '../config/defaults';

export function createPreset(s: ExtensionSettings, name: string): string {
  const key = genId('p');
  s.presets[key] = { name: name || 'Neu', categories: [], characterRules: { loopOverCharacters: false, excludedCharacters: [] } };
  s.activePreset = key;
  return key;
}
export function duplicatePreset(s: ExtensionSettings, key: string): string {
  const src = s.presets[key];
  if (!src) return key;
  const newKey = genId('p');
  const clone: Preset = structuredClone(src);
  clone.name = src.name + ' (Kopie)';
  s.presets[newKey] = clone;
  s.activePreset = newKey;
  return newKey;
}
export function deletePreset(s: ExtensionSettings, key: string): void {
  if (Object.keys(s.presets).length <= 1) return;
  delete s.presets[key];
  if (s.activePreset === key) s.activePreset = Object.keys(s.presets)[0];
}
export function renamePreset(s: ExtensionSettings, key: string, name: string): void {
  const p = s.presets[key];
  if (p) p.name = name;
}
export function resetPreset(s: ExtensionSettings, key: string): void {
  const p = s.presets[key];
  if (!p) return;
  const lang: Language = /en/i.test(key) || /\ben\b/i.test(p.name) ? 'en' : 'de';
  const def = makeDefaultPreset(p.name, lang);
  p.categories = def.categories;
  p.characterRules = def.characterRules;
}
export function exportPreset(p: Preset): string { return JSON.stringify(p, null, 2); }
export function importPreset(s: ExtensionSettings, json: string): string {
  const parsed = JSON.parse(json) as Preset;
  if (!parsed || !Array.isArray(parsed.categories)) throw new Error('Ungueltiges Preset-Format.');
  const key = genId('p');
  s.presets[key] = { name: parsed.name || 'Importiert', categories: parsed.categories, characterRules: parsed.characterRules ?? { loopOverCharacters: false, excludedCharacters: [] } };
  s.activePreset = key;
  return key;
}
