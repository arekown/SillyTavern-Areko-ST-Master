import { settingsManager } from './settings-manager';
import { buildJsonSchema } from './schema-builder';
import { schemaToExample } from './schema-to-example';
import { Language } from '../config/types';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

interface InstructionOpts {
  playerName: string;
  excluded: string[];
}

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

function buildInstruction(schema: any, language: Language, opts: InstructionOpts): string {
  const example = schemaToExample(schema, 'json');
  const schemaStr = JSON.stringify(schema, null, 2);

  if (language === 'en') {
    const lines = [
      'You maintain a structured tracker for the roleplay above.',
      'Fill EVERY field based on the latest context. Never leave a field empty unless told otherwise.',
      'Fields defined as an array of objects are PER CHARACTER: add one entry per participating character',
      `(including the player), using the "character" field as the name. The player character is "${opts.playerName}".`,
      'Respect the notes in the descriptions about which fields apply only to NPCs or only to the player.',
    ];
    if (opts.excluded.length) lines.push(`Do NOT list these characters: ${opts.excluded.join(', ')}.`);
    lines.push(
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
    );
    return lines.join('\n');
  }

  const lines = [
    'Du fuehrst einen strukturierten Tracker fuer das obige Rollenspiel.',
    'Fuelle JEDES Feld basierend auf dem aktuellen Kontext. Lass kein Feld leer, ausser es ist anders angegeben.',
    'Felder, die als Array von Objekten definiert sind, sind PRO CHARAKTER: lege je einen Eintrag pro beteiligtem',
    `Charakter an (inklusive Spieler), mit dem Feld "character" als Name. Der Spieler-Charakter ist "${opts.playerName}".`,
    'Beachte die Hinweise in den Beschreibungen, welche Felder nur fuer NPCs bzw. nur fuer den Spieler gelten.',
  ];
  if (opts.excluded.length) lines.push(`Liste folgende Charaktere NICHT auf: ${opts.excluded.join(', ')}.`);
  lines.push(
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
  );
  return lines.join('\n');
}

function extractJson(content: string): any {
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  return JSON.parse(text);
}

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

  const schema = buildJsonSchema(preset.categories ?? [], preset.name || 'Tracker');
  if (!schema.properties || Object.keys(schema.properties).length === 0) {
    throw new Error('Das aktive Preset hat keine aktiven Felder.');
  }

  const context = gatherContext(6);
  if (context.length === 0) {
    throw new Error('Kein Chat-Kontext vorhanden. Schreib erst ein paar Nachrichten.');
  }

  const playerName = String(ctx?.name1 || (settings.language === 'en' ? 'the user' : 'der Nutzer'));
  const excluded = preset.characterRules?.excludedCharacters ?? [];

  const messages: ChatMsg[] = [
    ...context,
    { role: 'user', content: buildInstruction(schema, settings.language, { playerName, excluded }) },
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