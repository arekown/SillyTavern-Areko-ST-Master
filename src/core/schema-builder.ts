import { FieldDef } from '../config/types';

function fieldToSchema(field: FieldDef): any {
  switch (field.type) {
    case 'string':
      return { type: 'string', description: field.description };
    case 'number':
      return { type: 'number', description: field.description };
    case 'boolean':
      return { type: 'boolean', description: field.description };
    case 'list':
      return { type: 'array', description: field.description, items: { type: field.itemType ?? 'string' } };
    case 'group':
      return {
        type: 'object',
        description: field.description,
        properties: childrenToProps(field.children ?? []),
        required: requiredKeys(field.children ?? []),
      };
    case 'objectList':
      return {
        type: 'array',
        description: field.description,
        items: {
          type: 'object',
          properties: childrenToProps(field.children ?? []),
          required: requiredKeys(field.children ?? []),
        },
      };
    default:
      return { type: 'string' };
  }
}

function childrenToProps(children: FieldDef[]): Record<string, any> {
  const props: Record<string, any> = {};
  for (const c of children) props[c.key] = fieldToSchema(c);
  return props;
}

function requiredKeys(children: FieldDef[]): string[] {
  return children.filter((c) => c.required).map((c) => c.key);
}

// Baut aus dem Feld-Baum (UI) ein JSON-Schema (fuer das LLM).
export function buildJsonSchema(fields: FieldDef[], title = 'Tracker'): any {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title,
    type: 'object',
    properties: childrenToProps(fields),
    required: requiredKeys(fields),
  };
}
