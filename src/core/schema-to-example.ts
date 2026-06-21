function jsonToXml(json: any, indent = 0): string {
  let xml = '';
  const pad = '  '.repeat(indent);
  for (const key in json) {
    if (!Object.prototype.hasOwnProperty.call(json, key)) continue;
    const value = json[key];
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item && typeof item === 'object') {
          xml += pad + '<' + key + '>\n' + jsonToXml(item, indent + 1) + pad + '</' + key + '>\n';
        } else {
          xml += pad + '<' + key + '>' + item + '</' + key + '>\n';
        }
      });
    } else if (value && typeof value === 'object') {
      xml += pad + '<' + key + '>\n' + jsonToXml(value, indent + 1) + pad + '</' + key + '>\n';
    } else {
      xml += pad + '<' + key + '>' + value + '</' + key + '>\n';
    }
  }
  return xml;
}

function generateExample(schema: any): any {
  if (schema.example) return schema.example;
  switch (schema.type) {
    case 'object': {
      const obj: Record<string, any> = {};
      if (schema.properties) for (const k in schema.properties) obj[k] = generateExample(schema.properties[k]);
      return obj;
    }
    case 'array':
      return schema.items ? [generateExample(schema.items)] : [];
    case 'string':
      return schema.description || 'string';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    default:
      return null;
  }
}

export function schemaToExample(schema: any, format: 'json' | 'xml'): string {
  const example = generateExample(schema);
  return format === 'xml' ? jsonToXml(example).trim() : JSON.stringify(example, null, 2);
}
