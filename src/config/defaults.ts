import { ExtensionSettings, AutoMode, Preset, FieldDef, Language } from './types';
import { VERSION } from './constants';
import { DEFAULT_TRACKER_PROMPT, DEFAULT_JSON_PROMPT, DEFAULT_IMAGE_PROMPT, DEFAULT_LOREBOOK_PROMPT } from '../core/prompts';

const str = (id: string, key: string, label: string, description: string, opts: Partial<FieldDef> = {}): FieldDef =>
  ({ id, key, label, type: 'string', description, required: true, ...opts });
const lst = (id: string, key: string, label: string, description: string, opts: Partial<FieldDef> = {}): FieldDef =>
  ({ id, key, label, type: 'list', itemType: 'string', description, required: true, ...opts });
const grp = (id: string, key: string, label: string, description: string, children: FieldDef[], opts: Partial<FieldDef> = {}): FieldDef =>
  ({ id, key, label, type: 'group', description, required: true, children, ...opts });
const objList = (id: string, key: string, label: string, description: string, children: FieldDef[], opts: Partial<FieldDef> = {}): FieldDef =>
  ({ id, key, label, type: 'objectList', description, required: true, children, ...opts });

export function buildPreset(name: string, lang: Language): Preset {
  const de = lang === 'de';
  return {
    name,
    categories: [
      {
        id: 'c_scene', name: de ? 'Szene' : 'Scene', scope: 'global', collapsed: false, hidden: false,
        fields: [
          str('f_timeElapsed', 'timeElapsed', de ? 'Vergangene Zeit' : 'Time elapsed', "Estimated in-scene time passed since the previous tracker, with a short justification. Reason BEFORE 'time'. Default to seconds."),
          str('f_time', 'time', de ? 'Zeit' : 'Time', 'Resulting clock time after adding timeElapsed. Format: HH:MM:SS; MM/DD/YYYY (Day Name)'),
          str('f_location', 'location', de ? 'Ort' : 'Location', 'Specific scene location with increasing specificity'),
          str('f_weather', 'weather', de ? 'Wetter' : 'Weather', 'Current weather conditions and temperature'),
          str('f_changeLog', 'changeLog', de ? 'Änderungen' : 'Changes', 'One or two sentences on what concretely changed since the previous tracker.'),
          grp('f_topics', 'topics', de ? 'Themen' : 'Topics', 'Topics of the current interaction', [
            str('tp_primary', 'primaryTopic', de ? 'Hauptthema' : 'Primary topic', '1-2 word main topic of interaction'),
            str('tp_tone', 'emotionalTone', de ? 'Emotionale Stimmung' : 'Emotional tone', 'Dominant emotional tone of scene'),
            str('tp_theme', 'interactionTheme', de ? 'Interaktionsart' : 'Interaction theme', 'Type of character interaction'),
          ]),
          lst('f_charsPresent', 'charactersPresent', de ? 'Anwesende Charaktere' : 'Characters present', 'List of character names present in scene'),
        ],
      },
      {
        id: 'c_char', name: de ? 'Charakter' : 'Character', scope: 'perCharacter', collapsed: false, hidden: false,
        fields: [
          str('cf_age', 'age', de ? 'Alter' : 'Age', 'Character age, may be approximate'),
          str('cf_gender', 'gender', de ? 'Geschlecht' : 'Gender', 'Character gender'),
          str('cf_race', 'race', de ? 'Spezies' : 'Species', 'Species/race (human, elf, dwarf, ...)'),
          grp('cf_appearance', 'appearance', de ? 'Aussehen' : 'Appearance', 'Physical appearance group', [
            str('ap_height', 'height', de ? 'Größe' : 'Height', 'Body height'),
            str('ap_build', 'build', de ? 'Körperbau' : 'Build', 'Detailed physique/body type — used for image generation, be descriptive'),
            str('ap_hair', 'hair', de ? 'Haare' : 'Hair', 'Hairstyle, color and condition'),
            str('ap_eye', 'eyeColor', de ? 'Augenfarbe' : 'Eye color', 'Eye color'),
            str('ap_makeup', 'makeup', de ? 'Make-up' : 'Makeup', 'Makeup description, or state none'),
          ]),
          grp('cf_clothing', 'clothing', de ? 'Kleidung' : 'Clothing', 'Clothing group', [
            str('cl_outfit', 'outfit', de ? 'Outfit' : 'Outfit', 'Complete outfit including underwear'),
            str('cl_state', 'stateOfDress', de ? 'Zustand der Kleidung' : 'State of dress', 'How put-together/disheveled the character appears'),
          ]),
          grp('cf_inventory', 'inventory', de ? 'Inventar' : 'Inventory', 'Inventory group (slow-changing)', [
            str('inv_money', 'money', de ? 'Geld' : 'Money', 'Money/currency currently held'),
            lst('inv_weapons', 'weapons', de ? 'Waffen' : 'Weapons', 'Weapons carried'),
            lst('inv_belongings', 'belongings', de ? 'Gegenstände' : 'Belongings', 'Other notable items carried'),
          ]),
          grp('cf_condition', 'condition', de ? 'Zustand' : 'Condition', 'Physical condition group', [
            str('co_posture', 'postureAndInteraction', de ? 'Haltung & Interaktion' : 'Posture & interaction', "Character's physical positioning and interaction"),
            str('co_physical', 'physicalState', de ? 'Körperlicher Zustand' : 'Physical state', 'Injuries, exhaustion, intoxication, hunger, pain, arousal. Persists across updates.'),
          ]),
          grp('cf_mind', 'mind', de ? 'Innerer Zustand' : 'Inner state', 'Inner state group — keep emotionalState, feeling and thoughts strictly distinct', [
            str('mi_emotional', 'emotionalState', de ? 'Grundstimmung' : 'Baseline mood', 'SLOW underlying mood/baseline as a short phrase.'),
            str('mi_feeling', 'feeling', de ? 'Akutes Gefühl' : 'Acute feeling', 'FAST acute momentary feeling right now. What the character FEELS this instant — not what they think.'),
            str('mi_thoughts', 'thoughts', de ? 'Gedanken' : 'Thoughts', 'MUST be 3-4 FULL SENTENCES of first-person inner monologue. NEVER a mood label, NEVER a single clause, NEVER bullet points.'),
            str('mi_goals', 'goals', de ? 'Ziele' : 'Goals', 'Current short-term and long-term goals.'),
            str('mi_knowledge', 'knowledgeState', de ? 'Wissensstand' : 'Knowledge state', 'What the character knows AND does not know relevant to the scene.'),
            str('mi_secrets', 'secrets', de ? 'Geheimnisse' : 'Secrets', 'Hidden info, with status tags (hidden)/(hinted)/(revealed).'),
          ], { appliesTo: 'npc' }),
          objList('cf_relationships', 'relationships', de ? 'Beziehungen' : 'Relationships', 'Relationship toward each other present character', [
            str('rel_target', 'target', de ? 'Ziel' : 'Target', 'Name of the other character'),
            str('rel_status', 'status', de ? 'Status' : 'Status', 'Short relationship label'),
            str('rel_dynamic', 'dynamic', de ? 'Dynamik' : 'Dynamic', 'Current dynamic: trust, tension, recent shift'),
          ]),
          lst('cf_quests', 'quests', de ? 'Quests' : 'Quests', 'Active quests/objectives as short lines'),
          lst('cf_skills', 'skills', de ? 'Fähigkeiten' : 'Skills', 'Notable abilities/skills as short lines'),
        ],
      },
    ],
    characterRules: { loopOverCharacters: false, excludedCharacters: [] },
  };
}

export function makeDefaultPreset(name = 'Default', lang: Language = 'de'): Preset {
  return buildPreset(name, lang);
}

export const defaultSettings: ExtensionSettings = {
  version: VERSION,
  profileId: '',
  autoMode: AutoMode.OFF,
  language: 'de',
  maxResponseToken: 16000,
  includeLastXMessages: 0,
  includeLastXTrackers: 1,
  activePreset: 'default_de',
  presets: { default_de: buildPreset('Default DE', 'de'), default_en: buildPreset('Default EN', 'en') },
  imageGen: { enabled: true, sourceFieldId: 'cf_appearance' },
  lorebookExport: { sourceFieldId: '' },
  characterImages: {},
  prompt: DEFAULT_TRACKER_PROMPT,
  promptJson: DEFAULT_JSON_PROMPT,
  imagePrompt: DEFAULT_IMAGE_PROMPT,
  lorebookPrompt: DEFAULT_LOREBOOK_PROMPT,
  panelOpen: false,
};
