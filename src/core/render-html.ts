import { Category, FieldDef } from '../config/types';

function esc(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeKey(raw: string): string {
  const k = String(raw ?? '').trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '');
  return k || 'category';
}

function isEmpty(v: any): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v).length === 0;
  return false;
}

function norm(s: any): string {
  return String(s ?? '').trim().toLowerCase();
}

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
  if ((field.displayStyle ?? 'chip') === 'text') {
    return `<span class="areko-val">${items.map(esc).join(', ')}</span>`;
  }
  return `<span class="areko-chips">${items.map((v) => `<span class="areko-chip">${esc(v)}</span>`).join('')}</span>`;
}

function renderField(field: FieldDef, value: any): string {
  if (field.enabled === false) return '';
  if (isEmpty(value)) return '';

  if (field.type === 'group') {
    const inner = renderFields(field.children ?? [], value ?? {});
    if (!inner) return '';
    return `<div class="areko-group"><div class="areko-group__title">${esc(field.label)}</div>${inner}</div>`;
  }

  if (field.type === 'objectList') {
    const arr = Array.isArray(value) ? value : [];
    const cards = arr
      .map((item) => {
        const inner = renderFields(field.children ?? [], item ?? {});
        return inner ? `<div class="areko-objitem">${inner}</div>` : '';
      })
      .filter(Boolean)
      .join('');
    if (!cards) return '';
    return `<div class="areko-group"><div class="areko-group__title">${esc(field.label)}</div>${cards}</div>`;
  }

  if (field.type === 'list') {
    const html = renderList(field, value);
    if (!html) return '';
    return `<div class="areko-row"><span class="areko-label">${esc(field.label)}</span>${html}</div>`;
  }

  return `<div class="areko-row"><span class="areko-label">${esc(field.label)}</span>${renderPrimitive(field, value)}</div>`;
}

export function renderFields(fields: FieldDef[], data: any): string {
  return (fields || [])
    .map((f) => renderField(f, data?.[f.key]))
    .filter(Boolean)
    .join('');
}

function getCatData(data: any, cat: Category): any {
  return data?.[sanitizeKey(cat.name)];
}

function characterCard(catFields: FieldDef[], entry: any): string {
  const name = entry?.character ?? entry?.name ?? '?';
  const inner = renderFields(catFields, entry ?? {});
  return `<div class="areko-charcard"><div class="areko-charcard__name">${esc(name)}</div>${inner || '<div class="areko-empty">—</div>'}</div>`;
}

export function renderGeneral(categories: Category[], data: any): string {
  const out: string[] = [];
  for (const cat of categories) {
    if (cat.hidden || cat.scope === 'perCharacter') continue;
    const inner = renderFields(cat.fields, getCatData(data, cat) ?? {});
    if (inner) out.push(`<div class="areko-cat-block"><div class="areko-cat-block__title">${esc(cat.name)}</div>${inner}</div>`);
  }
  return out.join('') || '<div class="areko-empty">—</div>';
}

export function renderCharacters(categories: Category[], data: any, mode: 'player' | 'npc', playerName: string): string {
  const out: string[] = [];
  const pn = norm(playerName);
  for (const cat of categories) {
    if (cat.hidden || cat.scope !== 'perCharacter') continue;
    const arr = getCatData(data, cat);
    if (!Array.isArray(arr)) continue;
    for (const entry of arr) {
      const isPlayer = norm(entry?.character ?? entry?.name) === pn;
      if (mode === 'player' && !isPlayer) continue;
      if (mode === 'npc' && isPlayer) continue;
      out.push(characterCard(cat.fields, entry));
    }
  }
  return out.join('') || '<div class="areko-empty">—</div>';
}

export function renderFullTracker(categories: Category[], data: any): string {
  const parts: string[] = [];
  for (const cat of categories) {
    if (cat.hidden) continue;
    const cd = getCatData(data, cat);
    if (cat.scope === 'perCharacter') {
      if (!Array.isArray(cd) || cd.length === 0) continue;
      const cards = cd.map((e) => characterCard(cat.fields, e)).join('');
      parts.push(`<div class="areko-cat-block"><div class="areko-cat-block__title">${esc(cat.name)}</div>${cards}</div>`);
    } else {
      const inner = renderFields(cat.fields, cd ?? {});
      if (inner) parts.push(`<div class="areko-cat-block"><div class="areko-cat-block__title">${esc(cat.name)}</div>${inner}</div>`);
    }
  }
  return parts.join('') || '<div class="areko-empty">—</div>';
}
