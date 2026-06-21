import { Category, FieldDef } from '../config/types';
import { categoryKey } from './schema-builder';
import { t } from '../i18n';

// Vom Panel gepflegter Cache: Charaktername -> hat bereits einen Lorebook-Eintrag
export const loreExists: Record<string, boolean> = {};

function esc(s: any): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function isEmpty(v: any): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v).length === 0;
  return false;
}
function norm(s: any): string { return String(s ?? '').trim().toLowerCase(); }

interface CardOpts { open?: boolean; panelActions?: boolean; imageOf?: (name: string) => string | undefined; }

function renderPrimitive(field: FieldDef, value: any): string {
  const style = field.displayStyle ?? 'text';
  const text = esc(value);
  if (style === 'chip') return `<span class="areko-chip">${text}</span>`;
  if (style === 'badge') return `<span class="areko-badge">${text}</span>`;
  if (style === 'bar' && field.type === 'number') {
    const num = Number(value);
    const min = typeof field.min === 'number' ? field.min : 0;
    const max = typeof field.max === 'number' ? field.max : 100;
    const pct = max > min ? Math.max(0, Math.min(100, ((num - min) / (max - min)) * 100)) : 0;
    return `<span class="areko-bar"><span class="areko-bar__fill" style="width:${pct}%"></span><span class="areko-bar__txt">${text}</span></span>`;
  }
  return `<span class="areko-val">${text}</span>`;
}
function renderList(field: FieldDef, value: any[]): string {
  const items = (value ?? []).filter((v) => !isEmpty(v));
  if (items.length === 0) return '';
  if ((field.displayStyle ?? 'chip') === 'text') return `<span class="areko-val">${items.map(esc).join(', ')}</span>`;
  return `<span class="areko-chips">${items.map((v) => `<span class="areko-chip">${esc(v)}</span>`).join('')}</span>`;
}
function renderField(field: FieldDef, value: any): string {
  if (field.enabled === false || isEmpty(value)) return '';
  if (field.type === 'group') {
    const inner = renderFields(field.children ?? [], value ?? {});
    return inner ? `<details class="areko-group" open><summary class="areko-group__title">${esc(field.label)}</summary>${inner}</details>` : '';
  }
  if (field.type === 'objectList') {
    const arr = Array.isArray(value) ? value : [];
    const cards = arr.map((item) => { const inner = renderFields(field.children ?? [], item ?? {}); return inner ? `<div class="areko-objitem">${inner}</div>` : ''; }).filter(Boolean).join('');
    return cards ? `<details class="areko-group" open><summary class="areko-group__title">${esc(field.label)}</summary>${cards}</details>` : '';
  }
  if (field.type === 'list') {
    const html = renderList(field, value);
    return html ? `<div class="areko-row"><span class="areko-label">${esc(field.label)}</span>${html}</div>` : '';
  }
  return `<div class="areko-row"><span class="areko-label">${esc(field.label)}</span>${renderPrimitive(field, value)}</div>`;
}
export function renderFields(fields: FieldDef[], data: any): string {
  return (fields || []).map((f) => renderField(f, data?.[f.key])).filter(Boolean).join('');
}

// Buttons links in zwei Reihen (1: Generieren+Hochladen, 2: Löschen).
function actionButtons(name: string): string {
  const n = esc(name);
  return `<div class="areko-charactions">` +
    `<div class="areko-charactions__row">` +
      `<span class="areko-iconbtn" data-areko-action="genimg" data-areko-name="${n}" title="${esc(t('panel.img.gen'))}"><i class="fa-solid fa-wand-magic-sparkles"></i></span>` +
      `<span class="areko-iconbtn" data-areko-action="upload" data-areko-name="${n}" title="${esc(t('panel.img.upload'))}"><i class="fa-solid fa-upload"></i></span>` +
    `</div>` +
    `<div class="areko-charactions__row">` +
      `<span class="areko-iconbtn" data-areko-action="delimg" data-areko-name="${n}" title="${esc(t('panel.img.delete'))}"><i class="fa-solid fa-trash"></i></span>` +
    `</div>` +
    `<div class="areko-charactions__row areko-lorerow">` +
      `<span class="areko-lorebtn" data-areko-action="lorebook" data-areko-name="${n}" title="${esc(t('lore.help'))}">` +
        `<i class="fa-solid ${loreExists[name] ? 'fa-book-bookmark' : 'fa-book-medical'}"></i> ` +
        `${esc(loreExists[name] ? t('lore.update') : t('lore.create'))}` +
        `<span class="areko-help" data-areko-action="lorehelp" title="${esc(t('lore.help'))}">?</span>` +
      `</span>` +
    `</div>` +
  `</div>`;
}
function characterCard(fields: FieldDef[], entry: any, opts: CardOpts): string {
  const name = entry?.character ?? entry?.name ?? '?';
  const inner = renderFields(fields, entry ?? {});
  let head = '';
  if (opts.panelActions) {
    const url = opts.imageOf ? opts.imageOf(name) : undefined;
    const img = url ? `<img class="areko-charimg" src="${esc(url)}" alt="${esc(name)}">` : `<div class="areko-charimg areko-charimg--empty">${esc(t('panel.img.none'))}</div>`;
    head = `<div class="areko-charimg-wrap">${actionButtons(name)}${img}</div>`;
  }
  const key = 'char:' + name;
  return `<details class="areko-charcard" data-areko-key="${esc(key)}"${opts.open ? ' open' : ''}><summary class="areko-charcard__name">${esc(name)}</summary>${head}${inner || '<div class="areko-empty">—</div>'}</details>`;
}
export function renderGeneral(categories: Category[], data: any): string {
  const out: string[] = [];
  for (const cat of categories) {
    if (cat.hidden || cat.scope === 'perCharacter') continue;
    const inner = renderFields(cat.fields, data?.[categoryKey(cat)] ?? {});
    if (inner) out.push(`<div class="areko-cat-block"><div class="areko-cat-block__title">${esc(cat.name)}</div>${inner}</div>`);
  }
  return out.join('') || '<div class="areko-empty">—</div>';
}
export function renderCharacters(categories: Category[], data: any, mode: 'player' | 'npc', playerName: string, opts: { imageOf?: (name: string) => string | undefined } = {}): string {
  const out: string[] = [];
  const pn = norm(playerName);
  for (const cat of categories) {
    if (cat.hidden || cat.scope !== 'perCharacter') continue;
    const arr = data?.[categoryKey(cat)];
    if (!Array.isArray(arr)) continue;
    for (const entry of arr) {
      const isPlayer = norm(entry?.character ?? entry?.name) === pn;
      if (mode === 'player' && !isPlayer) continue;
      if (mode === 'npc' && isPlayer) continue;
      out.push(characterCard(cat.fields, entry, { open: mode === 'player', panelActions: true, imageOf: opts.imageOf }));
    }
  }
  return out.join('') || '<div class="areko-empty">—</div>';
}
export function renderFullTracker(categories: Category[], data: any): string {
  const parts: string[] = [];
  for (const cat of categories) {
    if (cat.hidden) continue;
    const cd = data?.[categoryKey(cat)];
    if (cat.scope === 'perCharacter') {
      if (!Array.isArray(cd) || cd.length === 0) continue;
      const cards = cd.map((e) => characterCard(cat.fields, e, { open: true, panelActions: false })).join('');
      parts.push(`<div class="areko-cat-block"><div class="areko-cat-block__title">${esc(cat.name)}</div>${cards}</div>`);
    } else {
      const inner = renderFields(cat.fields, cd ?? {});
      if (inner) parts.push(`<div class="areko-cat-block"><div class="areko-cat-block__title">${esc(cat.name)}</div>${inner}</div>`);
    }
  }
  return parts.join('') || '<div class="areko-empty">—</div>';
}
