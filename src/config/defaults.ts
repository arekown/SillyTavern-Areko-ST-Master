import { ExtensionSettings, AutoMode, Timing, Preset, FieldDef } from './types';
import { VERSION } from './constants';

// Kleine Helfer, damit die Datei lesbar bleibt. required ist Default true.
const str = (id: string, key: string, label: string, description: string, opts: Partial<FieldDef> = {}): FieldDef =>
  ({ id, key, label, type: 'string', description, required: true, ...opts });
const lst = (id: string, key: string, label: string, description: string, opts: Partial<FieldDef> = {}): FieldDef =>
  ({ id, key, label, type: 'list', itemType: 'string', description, required: true, ...opts });
const grp = (id: string, key: string, label: string, description: string, children: FieldDef[], opts: Partial<FieldDef> = {}): FieldDef =>
  ({ id, key, label, type: 'group', description, required: true, children, ...opts });
const objList = (id: string, key: string, label: string, description: string, children: FieldDef[], opts: Partial<FieldDef> = {}): FieldDef =>
  ({ id, key, label, type: 'objectList', description, required: true, children, ...opts });

export function makeDefaultPreset(name = 'Default'): Preset {
  return {
    name,
    categories: [
      // ---------- GLOBAL: Szene ----------
      {
        id: 'c_scene',
        name: 'Szene',
        scope: 'global',
        collapsed: false,
        hidden: false,
        fields: [
          str('f_timeElapsed', 'timeElapsed', 'Vergangene Zeit',
            "Estimated real in-scene time passed since the previous tracker, WITH a short justification (e.g. 'ca. 15 Sekunden — kurzer Wortwechsel'). Reason this out BEFORE 'time'. Default to seconds."),
          str('f_time', 'time', 'Zeit',
            'Resulting clock time after adding timeElapsed. Format: HH:MM:SS; MM/DD/YYYY (Day Name)'),
          str('f_location', 'location', 'Ort',
            'Specific scene location with increasing specificity'),
          str('f_weather', 'weather', 'Wetter',
            'Current weather conditions and temperature'),
          str('f_changeLog', 'changeLog', 'Änderungen',
            "One or two sentences on what concretely changed since the previous tracker. Use 'Keine wesentlichen Änderungen' if nothing relevant changed."),
          grp('f_topics', 'topics', 'Themen', 'Themen der aktuellen Interaktion', [
            str('tp_primary', 'primaryTopic', 'Hauptthema', '1-2 word main topic of interaction'),
            str('tp_tone', 'emotionalTone', 'Emotionale Stimmung', 'Dominant emotional tone of scene'),
            str('tp_theme', 'interactionTheme', 'Interaktionsart', 'Type of character interaction'),
          ]),
          lst('f_charsPresent', 'charactersPresent', 'Anwesende Charaktere',
            'List of character names present in scene'),
        ],
      },

      // ---------- PRO CHARAKTER: Charakter ----------
      {
        id: 'c_char',
        name: 'Charakter',
        scope: 'perCharacter',
        collapsed: false,
        hidden: false,
        fields: [
          str('cf_age', 'age', 'Alter', "Character age, may be approximate (e.g. 'ca. 300 Jahre')"),
          str('cf_gender', 'gender', 'Geschlecht', 'Character gender (männlich, weiblich, divers, ...)'),
          str('cf_race', 'race', 'Spezies', 'Species/race (Mensch, Elf, Zwerg, Kemonomimi, ...)'),

          grp('cf_appearance', 'appearance', 'Aussehen', 'Physical appearance group', [
            str('ap_height', 'height', 'Größe', "Body height, e.g. 'ca. 175 cm'"),
            str('ap_build', 'build', 'Körperbau', 'Detailed physique/body type — used for image generation, be descriptive'),
            str('ap_hair', 'hair', 'Haare', 'Hairstyle, color and condition'),
            str('ap_eye', 'eyeColor', 'Augenfarbe', 'Eye color'),
            str('ap_makeup', 'makeup', 'Make-up', "Makeup description or 'Kein Make-up'"),
          ]),

          grp('cf_clothing', 'clothing', 'Kleidung', 'Clothing group', [
            str('cl_outfit', 'outfit', 'Outfit', 'Complete outfit including underwear'),
            str('cl_state', 'stateOfDress', 'Zustand der Kleidung', 'How put-together/disheveled the character appears'),
          ]),

          grp('cf_inventory', 'inventory', 'Inventar', 'Inventory group (slow-changing)', [
            str('inv_money', 'money', 'Geld', 'Money/currency currently held'),
            lst('inv_weapons', 'weapons', 'Waffen', 'Weapons carried'),
            lst('inv_belongings', 'belongings', 'Gegenstände', 'Other notable items carried'),
          ]),

          grp('cf_condition', 'condition', 'Zustand', 'Physical condition group', [
            str('co_posture', 'postureAndInteraction', 'Haltung & Interaktion', "Character's physical positioning and interaction"),
            str('co_physical', 'physicalState', 'Körperlicher Zustand', "Injuries, exhaustion, intoxication, hunger, pain, arousal. Persists across updates. 'Unversehrt' if nothing notable."),
          ]),

          // DEMONSTRATION: ganze mind-Gruppe nur fuer NPCs -> beim Spieler leer.
          grp('cf_mind', 'mind', 'Innerer Zustand', 'Inner state group — keep emotionalState, feeling and thoughts strictly distinct', [
            str('mi_emotional', 'emotionalState', 'Grundstimmung', 'SLOW underlying mood/baseline as a short phrase. Changes only gradually.'),
            str('mi_feeling', 'feeling', 'Akutes Gefühl', 'FAST, acute momentary feeling right now (one short sentence/phrase). What the character FEELS this instant — not what they think.'),
            str('mi_thoughts', 'thoughts', 'Gedanken', 'MUST be 3-4 FULL SENTENCES of concrete first-person inner monologue (reasoning, intentions, doubts, plans). NEVER a mood label, NEVER a single clause, NEVER bullet points. May diverge from outward behavior.'),
            str('mi_goals', 'goals', 'Ziele', 'Current short-term and long-term goals. Evolve logically.'),
            str('mi_knowledge', 'knowledgeState', 'Wissensstand', 'What the character knows AND does not know relevant to the scene.'),
            str('mi_secrets', 'secrets', 'Geheimnisse', 'Hidden info, with status tags (verborgen)/(angedeutet)/(aufgedeckt). \'Keine bekannt\' if none.'),
          ], { appliesTo: 'npc' }),

          objList('cf_relationships', 'relationships', 'Beziehungen', 'Relationship toward each other present character', [
            str('rel_target', 'target', 'Ziel', 'Name of the other character'),
            str('rel_status', 'status', 'Status', 'Short relationship label (Verbündeter, Rivalin, ...)'),
            str('rel_dynamic', 'dynamic', 'Dynamik', 'Current dynamic: trust, tension, recent shift'),
          ]),

          lst('cf_quests', 'quests', 'Quests', 'Active quests/objectives as short German lines'),
          lst('cf_skills', 'skills', 'Fähigkeiten', 'Notable abilities/skills as short German lines'),
        ],
      },
    ],
    characterRules: { loopOverCharacters: false, excludedCharacters: [] },
  };
}

export const defaultSettings: ExtensionSettings = {
  version: VERSION,
  profileId: '',
  autoMode: AutoMode.OFF,
  timing: Timing.AFTER,
  language: 'de',
  maxResponseToken: 16000,
  activePreset: 'default',
  presets: { default: makeDefaultPreset() },
  imageGen: { enabled: false, sourceFieldId: '' },
  lorebookExport: { enabledFieldIds: [] },
  prompt: '',
};