import { settingsManager } from './settings-manager';
import { buildJsonSchema } from './schema-builder';
import { schemaToExample } from './schema-to-example';
import { setTrackerFor, notifyUpdated, recentTrackerBlocks } from './tracker-store';
import { renderTemplate } from './prompts';
import { buildPrompt } from 'sillytavern-utils-lib';

export interface Msg { role: string; content: string; }

function languageWord(): string {
  return settingsManager.getSettings().language === 'en' ? 'English' : 'German';
}

export async function buildContextMessages(upToIndex: number): Promise<Msg[]> {
  const ctx: any = SillyTavern.getContext();
  const settings = settingsManager.getSettings();
  const profiles = ctx?.extensionSettings?.connectionManager?.profiles ?? [];
  const profile = profiles.find((p: any) => p.id === settings.profileId);
  const apiMap = profile?.api ? ctx?.CONNECT_API_MAP?.[profile.api] : null;
  const includeLastX = settings.includeLastXMessages ?? 0;
  const start = includeLastX > 0 ? Math.max(0, upToIndex - includeLastX) : 0;
  try {
    const res: any = await buildPrompt(apiMap?.selected, {
      messageIndexesBetween: { end: upToIndex, start },
      presetName: profile?.preset,
      contextName: profile?.context,
      instructName: profile?.instruct,
      syspromptName: profile?.sysprompt,
      includeNames: !!ctx?.selected_group,
    });
    const arr = res?.result;
    if (Array.isArray(arr) && arr.length) {
      return arr.map((m: any) => ({ role: m.role || 'user', content: String(m.content ?? '') })).filter((m: Msg) => m.content);
    }
  } catch (e) {
    console.warn('[Areko Tracker] buildPrompt nicht verfuegbar, nutze Fallback-Kontext:', e);
  }
  return fallbackContext(upToIndex);
}

function fallbackContext(upToIndex: number): Msg[] {
  const ctx: any = SillyTavern.getContext();
  const settings = settingsManager.getSettings();
  const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
  const includeLastX = settings.includeLastXMessages ?? 0;
  const startIdx = includeLastX > 0 ? Math.max(0, upToIndex + 1 - includeLastX) : 0;
  const out: Msg[] = [];
  const charId = ctx?.characterId;
  const card = ctx?.characters && charId != null ? ctx.characters[charId] : null;
  const intro: string[] = [];
  if (card?.name && card?.description) intro.push(`Character "${card.name}":\n${card.description}`);
  if (card?.personality) intro.push(`Personality: ${card.personality}`);
  if (card?.scenario) intro.push(`Scenario: ${card.scenario}`);
  if (ctx?.name1) intro.push(`The user plays: ${ctx.name1}`);
  if (intro.length) out.push({ role: 'system', content: intro.join('\n\n') });
  for (let i = startIdx; i <= upToIndex && i < chat.length; i++) {
    const content = String(chat[i]?.mes ?? '').trim();
    if (content) out.push({ role: chat[i]?.is_user ? 'user' : 'assistant', content });
  }
  return out;
}

function extractJson(content: string): any {
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  try { return JSON.parse(text); } catch { return null; }
}

export async function generateTrackerData(upToIndex?: number): Promise<object> {
  const ctx: any = SillyTavern.getContext();
  const settings = settingsManager.getSettings();
  if (!settings.profileId) throw new Error('Kein Connection-Profil gewaehlt.');
  const service = ctx?.ConnectionManagerRequestService;
  if (!service?.sendRequest) throw new Error('ConnectionManagerRequestService nicht verfuegbar.');
  const preset = settings.presets[settings.activePreset];
  if (!preset) throw new Error('Kein aktives Preset.');

  const schema = buildJsonSchema(preset.categories ?? [], preset.name || 'Tracker');
  if (!schema.properties || Object.keys(schema.properties).length === 0) throw new Error('Das aktive Preset hat keine aktiven Felder.');

  const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
  const endIndex = typeof upToIndex === 'number' ? upToIndex : chat.length - 1;
  if (endIndex < 0) throw new Error('Kein Chat-Kontext vorhanden.');

  const context = await buildContextMessages(endIndex);

  const count = settings.includeLastXTrackers ?? 1;
  for (const b of recentTrackerBlocks(endIndex - 1, count)) context.push({ role: 'user', content: b });

  const example = schemaToExample(schema, 'json');
  const behavior = renderTemplate(settings.prompt, { language: languageWord() });
  const format = renderTemplate(settings.promptJson, { schema: JSON.stringify(schema, null, 2), example_response: example });
  context.push({ role: 'user', content: behavior + '\n\n' + format });

  const res: any = await service.sendRequest(settings.profileId, context, settings.maxResponseToken);
  const content: string = typeof res === 'string' ? res : res?.content ?? '';
  if (!content) throw new Error('Leere Antwort vom Modell.');

  const parsed = extractJson(content);
  if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) throw new Error('Antwort liess sich nicht als JSON parsen.');
  return parsed;
}

export async function generateForMessage(messageId: number): Promise<object> {
  const data = await generateTrackerData(messageId);
  setTrackerFor(messageId, data);
  notifyUpdated();
  return data;
}
