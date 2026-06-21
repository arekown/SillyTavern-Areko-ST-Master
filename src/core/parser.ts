import { XMLParser } from 'fast-xml-parser';

const xmlParser = new XMLParser({
  ignoreAttributes: true,
  textNodeName: '#text',
  trimValues: true,
  allowBooleanAttributes: true,
});

function ensureArray(data: any, schema: any): void {
  if (!schema || !data) return;
  for (const key in schema.properties) {
    const prop = schema.properties[key];
    if (prop.type === 'array' && data[key] && !Array.isArray(data[key])) {
      data[key] = [data[key]];
    }
    if (prop.type === 'object') ensureArray(data[key], prop);
    if (prop.type === 'array' && prop.items?.type === 'object') {
      if (Array.isArray(data[key])) data[key].forEach((it: any) => ensureArray(it, prop.items));
      else ensureArray(data[key], prop.items);
    }
  }
}

export function parseResponse(content: string, format: 'xml' | 'json', schema?: any): object {
  const codeBlock = content.match(/```(?:\w+\n|\n)([\s\S]*?)```/);
  const cleaned = (codeBlock ? codeBlock[1] : content).trim();

  if (format === 'xml') {
    let parsed = xmlParser.parse(cleaned);
    if (parsed.root) parsed = parsed.root;
    if (schema) ensureArray(parsed, schema);
    return parsed;
  }
  return JSON.parse(cleaned);
}
