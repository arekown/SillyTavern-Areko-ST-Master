import { Category, FieldDef, AppliesTo } from '../config/types';

function coerce(field: FieldDef, raw: string): any {
  if (field.type === 'number') {
    const n = Number(raw);
    return isNaN(n) ? raw : n;
  }
  if (field.type === 'boolean') return raw === 'true';
  return raw;
}

function fieldToSchema(field: FieldDef): any {
  const base: any = {};
  if (field.description) base.description = field.description;
  if (field.example !== undefined && field.example !== '') base.example = coerce(field, field.example);
  if (field.defaultValue !== undefined && field.defaultValue !== '') base.default = coerce(field, field.defaultValue);

  switch (field.type) {
    case 'string':
      base.type = 'string';
      if (field.enumValues && field.enumValues.length) base.enum = field.enumValues;
      if (typeof field.min === 'number') base.minLength = field.min;
      if (typeof field.max === 'number') base.maxLength = field.max;
      return base;
    case 'number':
      base.type = 'number';
      if (typeof field.min === 'number') base.minimum = field.min;
      if (typeof field.max === 'number') base.maximum = field.max;
      return base;
    case 'boolean':
      base.type = 'boolean';
      return base;
    case 'list':
      base.type = 'array';
      base.items = { type: field.itemType ?? 'string' };
      return base;
    case 'group':
      base.type = 'object';
      base.properties = childrenToProps(field.children ?? []);
      base.required = requiredKeys(field.children ?? []);
      return base;
    case 'objectList':
      base.type = 'array';
      base.items = {
        type: 'object',
        properties: childrenToProps(field.children ?? []),
        required: requiredKeys(field.children ?? []),
      };
      return base;
    default:
      base.type = 'string';
      return base;
  }
}

function enabledFields(fields: FieldDef[]): FieldDef[] {
  return fields.filter((f) => f.enabled !== false);
}

function childrenToProps(children: FieldDef[]): Record<string, any> {
  const props: Record<string, any> = {};
  for (const c of enabledFields(children)) props[c.key] = fieldToSchema(c);
  return props;
}

function requiredKeys(children: FieldDef[]): string[] {
  return enabledFields(children).filter((c) => c.required).map((c) => c.key);
}

function appliesHint(appliesTo?: AppliesTo): string {
  switch (appliesTo) {
    case 'npc':
      return ' (only fill for NPCs, leave empty for the player)';
    case 'player':
      return ' (only fill for the player character, leave empty for NPCs)';
    default:
      return '';
  }
}

function childrenToPropsPerChar(children: FieldDef[]): Record<string, any> {
  const props: Record<string, any> = {};
  for (const c of enabledFields(children)) {
    const s = fieldToSchema(c);
    const hint = appliesHint(c.appliesTo);
    if (hint) s.description = (s.description ?? '') + hint;
    props[c.key] = s;
  }
  return props;
}

function requiredKeysPerChar(children: FieldDef[]): string[] {
  return enabledFields(children).filter((c) => c.required && (c.appliesTo ?? 'all') === 'all').map((c) => c.key);
}

function sanitizeKey(raw: string): string {
  const k = String(raw ?? '').trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '');
  return k || 'category';
}

// Stabiler Kategorie-Schluessel aus der id (sprachunabhaengig).
export function categoryKey(cat: Category): string {
  return sanitizeKey(cat.id || cat.name);
}

export function buildJsonSchema(categories: Category[], title = 'Tracker'): any {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const cat of categories) {
    if (cat.hidden) continue;
    const fields = enabledFields(cat.fields);
    if (fields.length === 0) continue;
    const key = categoryKey(cat);

    if (cat.scope === 'perCharacter') {
      properties[key] = {
        type: 'array',
        description: cat.name + ' (one entry per character)',
        items: {
          type: 'object',
          properties: {
            character: { type: 'string', description: 'Name of the character' },
            ...childrenToPropsPerChar(fields),
          },
          required: ['character', ...requiredKeysPerChar(fields)],
        },
      };
    } else {
      properties[key] = {
        type: 'object',
        description: cat.name,
        properties: childrenToProps(fields),
        required: requiredKeys(fields),
      };
    }
    required.push(key);
  }

  return { $schema: 'http://json-schema.org/draft-07/schema#', title, type: 'object', properties, required };
}
