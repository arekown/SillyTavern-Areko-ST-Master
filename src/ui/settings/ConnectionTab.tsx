import type { FC } from 'react';
import { settingsManager } from '../../core/settings-manager';
import { AutoMode, Timing, Language, ExtensionSettings } from '../../config/types';
import { useForceUpdate } from '../../hooks/useForceUpdate';

interface ConnectionProfile {
  id: string;
  name?: string;
}

// Connection-Profile direkt aus dem ST-Kontext lesen (kein Lib-Component).
function getConnectionProfiles(): ConnectionProfile[] {
  try {
    const ctx: any = SillyTavern.getContext();
    const profiles = ctx?.extensionSettings?.connectionManager?.profiles;
    return Array.isArray(profiles) ? profiles : [];
  } catch {
    return [];
  }
}

export const ConnectionTab: FC = () => {
  const forceUpdate = useForceUpdate();
  const settings = settingsManager.getSettings();
  const profiles = getConnectionProfiles();

  const update = (fn: (s: ExtensionSettings) => void) => {
    const s = settingsManager.getSettings();
    fn(s);
    settingsManager.saveSettings();
    forceUpdate();
  };

  const autoOff = settings.autoMode === AutoMode.OFF;

  return (
    <div className="areko-tab">
      <div className="areko-field">
        <label>Connection Profil</label>
        <select
          className="text_pole"
          value={settings.profileId}
          onChange={(e) =>
            update((s) => {
              s.profileId = e.target.value;
            })
          }
        >
          <option value="">— Profil wählen —</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name ?? p.id}
            </option>
          ))}
        </select>
        {profiles.length === 0 && (
          <span className="areko-hint">
            Keine Profile gefunden. Lege im ST-Connection-Manager eins an.
          </span>
        )}
      </div>

      <div className="areko-field">
        <label>Auto-Modus</label>
        <select
          className="text_pole"
          value={settings.autoMode}
          onChange={(e) =>
            update((s) => {
              s.autoMode = e.target.value as AutoMode;
            })
          }
        >
          <option value={AutoMode.OFF}>Aus</option>
          <option value={AutoMode.INPUTS}>Nur bei Eingaben</option>
          <option value={AutoMode.RESPONSES}>Nur bei Antworten</option>
          <option value={AutoMode.BOTH}>Beides</option>
        </select>
      </div>

      <div className="areko-field">
        <label>
          Timing
          {autoOff && <span className="areko-hint">(aktiv, sobald Auto-Modus an ist)</span>}
        </label>
        <select
          className="text_pole"
          value={settings.timing}
          disabled={autoOff}
          onChange={(e) =>
            update((s) => {
              s.timing = e.target.value as Timing;
            })
          }
        >
          <option value={Timing.BEFORE}>Vor der Antwort</option>
          <option value={Timing.AFTER}>Nach der Antwort</option>
        </select>
      </div>

      <div className="areko-field">
        <label>Sprache der Werte</label>
        <select
          className="text_pole"
          value={settings.language}
          onChange={(e) =>
            update((s) => {
              s.language = e.target.value as Language;
            })
          }
        >
          <option value="de">Deutsch</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
  );
};