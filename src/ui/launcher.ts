import { openSettingsWindow } from './SettingsWindow';

// Kleiner Button im Extensions-Menue -> oeffnet das eigene Fenster.
export function addLauncherButton(): void {
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
