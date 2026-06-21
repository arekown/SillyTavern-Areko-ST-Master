import { openSettingsWindow } from './SettingsWindow';

// Eintrag im Zauberstab-Menue (unten an der Eingabeleiste).
function addWandMenuEntry(): void {
  const menu = document.querySelector('#extensionsMenu');
  if (!menu || document.getElementById('areko-tracker-launcher')) return;

  const btn = document.createElement('div');
  btn.id = 'areko-tracker-launcher';
  btn.className = 'list-group-item flex-container flexGap5 interactable';
  btn.tabIndex = 0;
  btn.innerHTML =
    '<div class="fa-solid fa-table-list extensionsMenuExtensionButton"></div><span>Areko Tracker</span>';
  btn.addEventListener('click', () => openSettingsWindow());
  menu.appendChild(btn);
}

// Block im Erweiterungen-Einstellungspanel (Zahnrad-Bereich).
function addSettingsPanelEntry(): void {
  const panel = document.querySelector('#extensions_settings');
  if (!panel || document.getElementById('areko-tracker-settings-block')) return;

  const block = document.createElement('div');
  block.id = 'areko-tracker-settings-block';
  block.innerHTML = `
    <div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header">
        <b>Areko Tracker</b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
      </div>
      <div class="inline-drawer-content">
        <div class="menu_button menu_button_icon areko-open-window">
          <i class="fa-solid fa-table-list"></i>
          <span>Einstellungen öffnen</span>
        </div>
      </div>
    </div>
  `;
  panel.appendChild(block);

  block.querySelector('.areko-open-window')?.addEventListener('click', () => openSettingsWindow());
}

export function addLauncherButton(): void {
  addWandMenuEntry();
  addSettingsPanelEntry();
}