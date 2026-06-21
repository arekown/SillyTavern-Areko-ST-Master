import { Category, FieldDef } from '../config/types';

export function genId(prefix = 'f'): string {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

export function newField(): FieldDef {
  return { id: genId('f'), key: 'feld', label: 'Feld', type: 'string', description: '', required: false, enabled: true };
}

export function newCategory(name = 'Neue Kategorie'): Category {
  return { id: genId('c'), name, collapsed: false, hidden: false, fields: [] };
}

export function mutateField(fields: FieldDef[], id: string, fn: (f: FieldDef) => void): boolean {
  for (const f of fields) {
    if (f.id === id) {
      fn(f);
      return true;
    }
    if (f.children && mutateField(f.children, id, fn)) return true;
  }
  return false;
}

export function removeField(fields: FieldDef[], id: string): boolean {
  const idx = fields.findIndex((f) => f.id === id);
  if (idx >= 0) {
    fields.splice(idx, 1);
    return true;
  }
  for (const f of fields) {
    if (f.children && removeField(f.children, id)) return true;
  }
  return false;
}

export function addChild(fields: FieldDef[], parentId: string): boolean {
  return mutateField(fields, parentId, (f) => {
    if (!f.children) f.children = [];
    f.children.push(newField());
  });
}

function findArrayContaining(fields: FieldDef[], id: string): { arr: FieldDef[]; idx: number } | null {
  const idx = fields.findIndex((f) => f.id === id);
  if (idx >= 0) return { arr: fields, idx };
  for (const f of fields) {
    if (f.children) {
      const r = findArrayContaining(f.children, id);
      if (r) return r;
    }
  }
  return null;
}

export function moveFieldById(categories: Category[], id: string, dir: -1 | 1): boolean {
  for (const cat of categories) {
    const r = findArrayContaining(cat.fields, id);
    if (r) {
      const j = r.idx + dir;
      if (j < 0 || j >= r.arr.length) return false;
      const tmp = r.arr[r.idx];
      r.arr[r.idx] = r.arr[j];
      r.arr[j] = tmp;
      return true;
    }
  }
  return false;
}

export function moveFieldToCategory(categories: Category[], fieldId: string, targetCatId: string): boolean {
  for (const cat of categories) {
    const idx = cat.fields.findIndex((f) => f.id === fieldId);
    if (idx >= 0) {
      if (cat.id === targetCatId) return false;
      const target = categories.find((c) => c.id === targetCatId);
      if (!target) return false;
      const [f] = cat.fields.splice(idx, 1);
      target.fields.push(f);
      return true;
    }
  }
  return false;
}

export function moveCategory(categories: Category[], catId: string, dir: -1 | 1): boolean {
  const idx = categories.findIndex((c) => c.id === catId);
  if (idx < 0) return false;
  const j = idx + dir;
  if (j < 0 || j >= categories.length) return false;
  const tmp = categories[idx];
  categories[idx] = categories[j];
  categories[j] = tmp;
  return true;
}

export function sanitizeKey(raw: string): string {
  return raw.trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '');
}

export interface ValidationIssue {
  message: string;
}

export function validatePreset(categories: Category[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const catKeys = new Map<string, number>();
  for (const cat of categories) {
    const ck = sanitizeKey(cat.name) || '(leer)';
    catKeys.set(ck, (catKeys.get(ck) ?? 0) + 1);
    walk(cat.fields, cat.name, issues);
  }
  catKeys.forEach((n, k) => {
    if (n > 1) issues.push({ message: `Doppelter Kategorie-Key: "${k}" (${n}×)` });
  });
  return issues;
}

function walk(fields: FieldDef[], path: string, issues: ValidationIssue[]): void {
  const keys = new Map<string, number>();
  for (const f of fields) {
    if (f.enabled === false) continue;
    const k = f.key || '(leer)';
    keys.set(k, (keys.get(k) ?? 0) + 1);
    if (!f.key) issues.push({ message: `Leerer Key in "${path}" (Feld "${f.label}")` });
    if (f.children) walk(f.children, path + ' › ' + f.label, issues);
  }
  keys.forEach((n, k) => {
    if (n > 1) issues.push({ message: `Doppelter Key in "${path}": "${k}" (${n}×)` });
  });
}