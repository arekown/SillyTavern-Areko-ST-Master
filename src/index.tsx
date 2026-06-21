import { settingsManager } from './core/settings-manager';
import { injectLatestTracker } from './core/interceptor';
import { addLauncherButton } from './ui/launcher';
import { initChatRender } from './ui/chat-render';
import { mountPanel } from './ui/panel/mount';
import { INTERCEPTOR_NAME } from './config/constants';

(globalThis as any)[INTERCEPTOR_NAME] = (chat: any[]) => injectLatestTracker(chat);

settingsManager
  .initializeSettings()
  .then(() => {
    addLauncherButton();
    mountPanel();
    initChatRender();
    console.log('[Areko Tracker] geladen.');
  })
  .catch((e) => console.error('[Areko Tracker] init error', e));
