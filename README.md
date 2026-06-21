# SillyTavern Areko ST Master

Flexibler, menuegesteuerter Daten-Tracker fuer SillyTavern.

## Build
npm install
npm run build   # bzw. npm run dev fuers Watch-Mode

dist/ muss committed werden, damit ST die Extension direkt laden kann.


Vollständige geplante Feature-Liste
A — Connection & Auslösung

A1 Auswahl eines in ST angelegten Connection-Profils.
A2 Auto-Mode-Dropdown: Aus / Nur bei Eingaben / Nur bei Antworten / Beides.
A3 Timing-Regler (Vor Antwort / Nach Antwort), nur aktiv wenn A2 ≠ Aus. „Vor" = Interceptor, „Nach" = Render-Events.
A4 Sprachwahl der Feld-Werte: Deutsch / Englisch (Keys bleiben immer Englisch).
A5 Max-Response-Tokens, und nur das letzte Tracking-Ergebnis wird in den Prompt injiziert.

B — Schema-Builder (das CMS-Herzstück)

B1 Kategorien/Variablen anlegen im Menü, ein-/ausklappbar — kein roher JSON-/HTML-Text.
B2 Feldtypen: Text, Zahl, Boolean, Liste, Gruppe (verschachtelt), Objekt-Liste.
B3 Pro Feld: Key, Label, Beschreibung (= zugleich LLM-Anweisung), „Pflichtfeld".
B4 Im Hintergrund baut der Builder daraus das JSON-Schema fürs LLM.

C — Profile & Presets

C1 (neu) Mehrere Konfigurations-Profile der Extension speichern, benennen, umschalten, löschen, duplizieren. Eigenständig zusätzlich zu A1.
C2 Profil-Zuordnung pro Chat (welches Setup gilt in welchem Chat).

D — Charakter-Logik

D1 Charaktere ausschließen (z. B. den Spieler) vom Tracking.
D2 Loop über alle Charaktere — definierte Felder werden pro Charakter durchlaufen (wie das characters-Array in WTracker).

E — Optik & Layout

E1 Drag-&-Drop-Reihenfolge der angezeigten Felder/Kategorien.
E2 Generischer Auto-Renderer (kein handgeschriebenes HTML-Template mehr) — zeigt das Schema automatisch an.
E3 Anzeige im eigenen großen Fenster (Overlay), nicht im Extensions-Drawer. In-Chat ggf. zusätzlich kompakt unter der Nachricht.

F — Zusatz-Features

F1 Bild-Generierung pro Charakter (Portrait via /sd), als Option an-/abschaltbar.
F2 Lorebook-Eintrag aus dem Tracker erzeugen — per Checkbox wählbar, welche Variablen reinwandern.

G — Pro-Tracker-Aktionen (an jeder Nachricht)

G1 Manuell generieren / regenerieren.
G2 Tracker-Daten bearbeiten.
G3 Tracker löschen.