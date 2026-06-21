import { openSettingsWindow } from './SettingsWindow';
import { togglePanel } from './panel/mount';
import { t } from '../i18n';

function addWandEntry(id: string, icon: string, label: string, onClick: () => void): void {
  const menu = document.querySelector('#extensionsMenu');
  if (!menu || document.getElementById(id)) return;
  const btn = document.createElement('div');
  btn.id = id;
  btn.className = 'list-group-item flex-container flexGap5 interactable';
  btn.tabIndex = 0;
  btn.innerHTML = `<div class="fa-solid ${icon} extensionsMenuExtensionButton"></div><span>${label}</span>`;
  btn.addEventListener('click', onClick);
  menu.appendChild(btn);
}

function addSettingsPanelEntry(): void {
  const panel = document.querySelector('#extensions_settings');
  if (!panel || document.getElementById('areko-tracker-settings-block')) return;
  const block = document.createElement('div');
  block.id = 'areko-tracker-settings-block';
  block.innerHTML =
    '<div class="inline-drawer">' +
    '<div class="inline-drawer-toggle inline-drawer-header"><b>Areko Tracker</b>' +
    '<div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div></div>' +
    '<div class="inline-drawer-content">' +
    '<div class="menu_button menu_button_icon areko-open-window"><i class="fa-solid fa-table-list"></i><span>' +
    t('window.open') +
    '</span></div></div></div>';
  panel.appendChild(block);
  block.querySelector('.areko-open-window')?.addEventListener('click', () => openSettingsWindow());
}

export function addLauncherButton(): void {
  addWandEntry('areko-tracker-launcher', 'fa-table-list', 'Areko Tracker', () => openSettingsWindow());
  addWandEntry('areko-panel-launcher', 'fa-table-columns', t('panel.title'), () => togglePanel());
  addSettingsPanelEntry();
}
