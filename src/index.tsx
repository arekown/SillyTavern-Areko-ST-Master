import { settingsManager } from './core/settings-manager';
import { trackerInterceptor } from './core/interceptor';
import { addLauncherButton } from './ui/launcher';
import { initChatRender } from './ui/chat-render';
import { mountPanel } from './ui/panel/mount';
import { wireAutoMode } from './core/events';
import { INTERCEPTOR_NAME, VERSION } from './config/constants';
import { buildPreset } from './config/defaults';
import { DEFAULT_TRACKER_PROMPT, DEFAULT_JSON_PROMPT, DEFAULT_IMAGE_PROMPT } from './core/prompts';

(globalThis as any)[INTERCEPTOR_NAME] = (chat: any[]) => trackerInterceptor(chat);

// Einmalige Migration: System-Presets (DE/EN) frisch aus dem Code aufbauen,
// damit alte (faelschlich deutsche) gespeicherte Versionen ueberschrieben werden.
function migrate(): void {
  const s: any = settingsManager.getSettings();
  if (s.version === VERSION) return;
  s.presets = s.presets || {};
  s.presets.default_de = buildPreset('Default DE', 'de');
  s.presets.default_en = buildPreset('Default EN', 'en');
  if (!s.prompt) s.prompt = DEFAULT_TRACKER_PROMPT;
  if (!s.promptJson) s.promptJson = DEFAULT_JSON_PROMPT;
  if (!s.imagePrompt) s.imagePrompt = DEFAULT_IMAGE_PROMPT;
  if (!s.activePreset || !s.presets[s.activePreset]) s.activePreset = 'default_de';
  s.lorebookPrompt = DEFAULT_LOREBOOK_PROMPT;
  s.version = VERSION;
  settingsManager.saveSettings();
}

settingsManager
  .initializeSettings()
  .then(() => {
    migrate();
    addLauncherButton();
    mountPanel();
    initChatRender();
    wireAutoMode();
    console.log('[Areko Tracker] geladen.');
  })
  .catch((e) => console.error('[Areko Tracker] init error', e));
