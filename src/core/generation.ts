import { settingsManager } from './settings-manager';
import { buildJsonSchema } from './schema-builder';
import { schemaToExample } from './schema-to-example';
import { Language } from '../config/types';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

// Letzte N Nachrichten aus dem Chat als Kontext einsammeln.
function gatherContext(maxMessages = 6): ChatMsg[] {
  const ctx: any = SillyTavern.getContext();
  const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
  const slice = maxMessages > 0 ? chat.slice(-maxMessages) : chat;
  return slice
    .map((m: any) => ({
      role: m?.is_user ? 'user' : 'assistant',
      content: String(m?.mes ?? '').trim(),
    }))
    .filter((m: ChatMsg) => m.content.length > 0);
}

// Anweisung (Schema + Beispiel + Sprachregel) als letzten User-Turn.
function buildInstruction(schema: any, language: Language): string {
  const example = schemaToExample(schema, 'json');
  const schemaStr = JSON.stringify(schema, null, 2);

  if (language === 'en') {
    return [
      'You maintain a structured tracker for the roleplay above.',
      'Fill EVERY field based on the latest context. Never leave a field empty.',
      'Output ONLY a single valid JSON object inside a ```json code block. No commentary.',
      'JSON keys stay exactly as in the schema. Write the values in English.',
      '',
      'JSON schema:',
      '```json',
      schemaStr,
      '```',
      '',
      'Example shape:',
      '```json',
      example,
      '```',
    ].join('\n');
  }

  return [
    'Du fuehrst einen strukturierten Tracker fuer das obige Rollenspiel.',
    'Fuelle JEDES Feld basierend auf dem aktuellen Kontext. Lass kein Feld leer.',
    'Gib NUR ein einziges gueltiges JSON-Objekt in einem ```json-Codeblock aus. Kein weiterer Text.',
    'Die JSON-Keys bleiben exakt wie im Schema. Schreibe die Werte auf Deutsch.',
    '',
    'JSON-Schema:',
    '```json',
    schemaStr,
    '```',
    '',
    'Beispiel-Form:',
    '```json',
    example,
    '```',
  ].join('\n');
}

// Extrahiert das JSON aus der Modell-Antwort (mit oder ohne Codeblock).
function extractJson(content: string): any {
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  return JSON.parse(text);
}

// Kern: generiert einen Tracker und gibt das geparste JSON zurueck.
// Beruehrt NICHTS am DOM — reine Pipeline (Profil -> Modell -> Parsen).
export async function generateTrackerData(): Promise<object> {
  const ctx: any = SillyTavern.getContext();
  const settings = settingsManager.getSettings();

  if (!settings.profileId) {
    throw new Error('Kein Connection-Profil gewaehlt.');
  }

  const service = ctx?.ConnectionManagerRequestService;
  if (!service?.sendRequest) {
    throw new Error('ConnectionManagerRequestService nicht verfuegbar (ST-Version zu alt?).');
  }

  const preset = settings.presets[settings.activePreset];
  if (!preset) throw new Error('Kein aktives Preset gefunden.');

  const schema = buildJsonSchema(preset.fields, preset.name || 'Tracker');

  const context = gatherContext(6);
  if (context.length === 0) {
    throw new Error('Kein Chat-Kontext vorhanden. Schreib erst ein paar Nachrichten.');
  }

  const messages: ChatMsg[] = [
    ...context,
    { role: 'user', content: buildInstruction(schema, settings.language) },
  ];

  const res: any = await service.sendRequest(settings.profileId, messages, settings.maxResponseToken);
  const content: string = typeof res === 'string' ? res : res?.content ?? '';
  if (!content) throw new Error('Leere Antwort vom Modell erhalten.');

  let parsed: any;
  try {
    parsed = extractJson(content);
  } catch {
    throw new Error('Antwort liess sich nicht als JSON parsen.');
  }
  if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
    throw new Error('Antwort liess sich nicht als JSON parsen.');
  }
  return parsed;
}