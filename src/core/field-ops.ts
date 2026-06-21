import { FieldDef } from '../config/types';

export function genId(): string {
  return 'f_' + Math.random().toString(36).slice(2, 9);
}

export function newField(): FieldDef {
  return { id: genId(), key: 'feld', label: 'Feld', type: 'string', description: '', required: false };
}

// Rekursiv: finde Feld per id und wende fn an. Gibt true, wenn gefunden.
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

// Rekursiv: entferne Feld per id.
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

// Kind zu einem group/objectList-Feld hinzufuegen.
export function addChild(fields: FieldDef[], parentId: string): boolean {
  return mutateField(fields, parentId, (f) => {
    if (!f.children) f.children = [];
    f.children.push(newField());
  });
}

// Key auf erlaubte Zeichen begrenzen (JSON-Key, keine Leerzeichen).
export function sanitizeKey(raw: string): string {
  return raw.trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '');
}