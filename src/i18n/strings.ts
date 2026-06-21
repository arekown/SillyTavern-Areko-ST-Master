import { Language } from '../config/types';

type Entry = Record<Language, string>;

export const STRINGS: Record<string, Entry> = {
  'window.title': { de: 'Areko Tracker — Einstellungen', en: 'Areko Tracker — Settings' },

  'tab.connection': { de: 'Verbindung', en: 'Connection' },

  'connection.profile': { de: 'Connection Profil', en: 'Connection Profile' },
  'connection.profile.placeholder': { de: '— Profil wählen —', en: '— Select profile —' },
  'connection.profile.empty': {
    de: 'Keine Profile gefunden. Lege im ST-Connection-Manager eins an.',
    en: 'No profiles found. Create one in the ST Connection Manager.',
  },

  'connection.autoMode': { de: 'Auto-Modus', en: 'Auto Mode' },
  'connection.autoMode.off': { de: 'Aus', en: 'Off' },
  'connection.autoMode.inputs': { de: 'Nur bei Eingaben', en: 'On inputs only' },
  'connection.autoMode.responses': { de: 'Nur bei Antworten', en: 'On responses only' },
  'connection.autoMode.both': { de: 'Beides', en: 'Both' },

  'connection.timing': { de: 'Timing', en: 'Timing' },
  'connection.timing.hint': {
    de: '(aktiv, sobald Auto-Modus an ist)',
    en: '(active once Auto Mode is on)',
  },
  'connection.timing.before': { de: 'Vor der Antwort', en: 'Before the response' },
  'connection.timing.after': { de: 'Nach der Antwort', en: 'After the response' },

  'connection.language': { de: 'Sprache', en: 'Language' },

  'builder.heading': { de: 'Schema-Builder', en: 'Schema Builder' },
  'builder.empty': { de: 'Noch keine Felder. Leg unten welche an.', en: 'No fields yet. Add some below.' },
  'builder.addField': { de: 'Feld hinzufügen', en: 'Add field' },
  'builder.addChild': { de: 'Unterfeld hinzufügen', en: 'Add subfield' },
  'builder.label': { de: 'Label', en: 'Label' },
  'builder.key': { de: 'Key', en: 'Key' },
  'builder.description': {
    de: 'Beschreibung (Anweisung fürs LLM)',
    en: 'Description (instruction for the LLM)',
  },
  'builder.required': { de: 'Pflichtfeld', en: 'Required' },
  'builder.delete': { de: 'Löschen', en: 'Delete' },
  'builder.preview': { de: 'Schema-Vorschau', en: 'Schema preview' },
  'builder.type.string': { de: 'Text', en: 'Text' },
  'builder.type.number': { de: 'Zahl', en: 'Number' },
  'builder.type.boolean': { de: 'Ja/Nein', en: 'Yes/No' },
  'builder.type.list': { de: 'Liste', en: 'List' },
  'builder.type.group': { de: 'Gruppe', en: 'Group' },
  'builder.type.objectList': { de: 'Objekt-Liste', en: 'Object list' },

  'test.heading': { de: 'Test', en: 'Test' },
  'test.run': { de: 'Test-Generierung (letzter Chat)', en: 'Test generation (latest chat)' },
  'test.running': { de: 'Generiere…', en: 'Generating…' },
};