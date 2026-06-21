import { settingsManager } from './core/settings-manager';
import { injectLatestTracker } from './core/interceptor';
import { wireAutoMode } from './core/events';
import { addLauncherButton } from './ui/launcher';
import { mountTrackerPanel } from './ui/TrackerPanel';
import { INTERCEPTOR_NAME } from './config/constants';

// Interceptor global registrieren — Manifest verweist auf diesen Namen.
(globalThis as any)[INTERCEPTOR_NAME] = (chat: any[]) => injectLatestTracker(chat);

settingsManager
  .initializeSettings()
  .then(() => {
    addLauncherButton();
    wireAutoMode();
    mountTrackerPanel();
    console.log('[Areko Tracker] geladen.');
  })
  .catch((e) => console.error('[Areko Tracker] init error', e));
