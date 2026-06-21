import { createRoot, Root } from 'react-dom/client';
import { Panel } from './Panel';
import { settingsManager } from '../../core/settings-manager';

let root: Root | null = null;

export function mountPanel(): void {
  if (document.getElementById('areko-panel-root')) return;
  const container = document.createElement('div');
  container.id = 'areko-panel-root';
  document.body.appendChild(container);
  root = createRoot(container);
  root.render(<Panel />);
}

export function togglePanel(): void {
  const s = settingsManager.getSettings();
  s.panelOpen = !s.panelOpen;
  settingsManager.saveSettings();
  window.dispatchEvent(new CustomEvent('areko:updated'));
}
