// Vollbild für die Übungsfläche und Tastenkürzel auf der Computertastatur.
const HELP_ORDER = ["names", "fingers", "keys", "keyNames"];
const HELP_LABELS = { names: "Notennamen", fingers: "Finger", keys: "Tasten leuchten", keyNames: "Tastennamen" };
const VIEW_ORDER = ["notes", "both", "fall"];
const VIEW_LABELS = { notes: "Noten", both: "Beides", fall: "Fallende Noten" };
const STAFF_ZOOM_MAX = 1.8;
const STAFF_SHARE = { notes: 0.45, both: 0.3 }; // Anteil der Fensterhöhe fürs Notenbild im Vollbild

const SHORTCUTS = [
  { keys: ["Leertaste"], match: [" "], label: "Im Takt: Start / Stopp · Schritt für Schritt: Vorspielen", run: () => (settings.mode === "takt" ? startTakt() : togglePlay()) },
  { keys: ["R"], match: ["r"], label: "Von vorn", run: () => { resetLoop(); restart(); } },
  { keys: ["L"], match: ["l"], label: "Wiederholen: aus → 3× → 5× → endlos", run: () => cycleLoop() },
  { keys: ["P"], match: ["p"], label: "Vorspielen / Stopp", run: () => togglePlay() },
  { keys: ["F"], match: ["f"], label: "Vollbild an / aus", run: () => toggleFullscreen() },
  { keys: ["M"], match: ["m"], label: "Modus wechseln: Schritt für Schritt ↔ Im Takt", run: () => setMode(settings.mode === "takt" ? "wait" : "takt") },
  { keys: ["V"], match: ["v"], label: "Ansicht wechseln: Noten → Beides → Fallend", run: () => cycleView() },
  { keys: ["H"], match: ["h"], label: "Alle Hilfen an / aus", run: () => toggleAllHelps() },
  { keys: ["G"], match: ["g"], label: "Hände getrennt: beide → rechts → links", run: () => cycleHands() },
  { keys: ["1", "2", "3", "4"], match: ["1", "2", "3", "4"], label: "Einzeln: Notennamen · Finger · Tasten leuchten · Tastennamen", run: (key) => toggleHelp(HELP_ORDER[Number(key) - 1]) },
  { keys: ["+", "−"], match: ["+", "=", "-"], label: "Tempo ±10 % (Im Takt)", run: (key) => changeTempo(key === "-" ? -0.1 : 0.1) },
  { keys: ["←", "→"], match: ["ArrowLeft", "ArrowRight"], label: "Vorherige / nächste Lektion", run: (key) => stepLesson(key === "ArrowRight" ? 1 : -1) },
  { keys: ["A"], match: ["a"], label: "Aufnahme starten / stoppen", run: () => toggleRecord() },
  { keys: ["W"], match: ["w"], label: "Meine Aufnahme anhören", run: () => toggleRecPlay() },
  { keys: ["Esc"], match: ["Escape"], label: "Vollbild verlassen", run: () => isFullscreen() && toggleFullscreen(false) },
  { keys: ["?"], match: ["?"], label: "Diese Übersicht", run: () => $("#keys").showModal() },
];

// ---------- Aktionen ----------

function cycleLoop() {
  const order = ["off", "3", "5", "inf"];
  saveSettings({ loop: order[(order.indexOf(settings.loop) + 1) % order.length] });
  resetLoop();
  say(settings.loop === "off" ? "Wiederholen: aus" : `Wiederholen: ${settings.loop === "inf" ? "endlos" : `${settings.loop}×`}`, "info");
}

function cycleView() {
  const next = VIEW_ORDER[(VIEW_ORDER.indexOf(settings.view) + 1) % VIEW_ORDER.length];
  setView(next);
  say(`Ansicht: ${VIEW_LABELS[next]}`, "info");
}

function toggleHelp(key) {
  setHelp(key, !helps[key]);
  say(`${HELP_LABELS[key]}: ${helps[key] ? "an" : "aus"}`, "info");
}

function toggleAllHelps() {
  const on = !HELP_ORDER.some((key) => helps[key]);
  HELP_ORDER.forEach((key) => setHelp(key, on));
  say(on ? "Alle Hilfen an" : "Alle Hilfen aus – jetzt zählt nur das Notenbild", "info");
}

function changeTempo(delta) {
  if (takt) return say("Das Tempo lässt sich nach dem Stopp ändern.", "info");
  setTempo(settings.taktTempo + delta);
  say(`Tempo ${Math.round(settings.taktTempo * 100)} % · ${taktBpm()} BPM`, "info");
}

// Im Kurs: vorige/nächste Lektion. In der Bibliothek: voriges/nächstes eigenständiges Stück.
function stepLesson(delta) {
  const list = lesson.isPiece ? allPieces().filter((p) => !p.lesson) : LESSONS;
  const next = list[list.findIndex((l) => l.id === lesson.id) + delta];
  if (next) location.hash = `#/${lesson.isPiece ? "stueck" : "ueben"}/${next.id}`;
}

// ---------- Vollbild ----------

const isFullscreen = () => $(".stage").classList.contains("fs");

// Die Übungsfläche füllt das Fenster; zusätzlich wird – falls erlaubt – der Browser-Vollbildmodus aktiviert.
function toggleFullscreen(on = !isFullscreen()) {
  $(".stage").classList.toggle("fs", on);
  document.documentElement.classList.toggle("locked", on);
  if (on && !document.fullscreenElement && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch((err) =>
      console.warn("Browser-Vollbild nicht erlaubt – die Übungsfläche füllt trotzdem das Fenster", err));
  }
  if (!on && document.fullscreenElement) document.exitFullscreen();
  applyStaffZoom();
  paint();
}

// Im Vollbild wächst das Notenbild mit der Fensterhöhe – in „Beides“ so, dass die fallenden Noten genug Platz behalten.
function applyStaffZoom() {
  const svg = $("#staff svg");
  if (!svg) return;
  const share = settings.view === "notes" ? STAFF_SHARE.notes : STAFF_SHARE.both;
  staffZoom = isFullscreen()
    ? Math.min(STAFF_ZOOM_MAX, Math.max(1, (innerHeight * share) / svg.height.baseVal.value))
    : 1;
  svg.style.width = `${svg.width.baseVal.value * staffZoom}px`;
  svg.style.height = `${svg.height.baseVal.value * staffZoom}px`;
}

// ---------- Tastatur ----------

function onShortcut(e) {
  if (!PRACTICE_SECTIONS.includes(section) || e.metaKey || e.ctrlKey || e.altKey || document.querySelector("dialog[open]")) return;
  // Hat ein Bedienelement per Tastatur den Fokus, behalten Leertaste, Enter und Pfeile ihre normale Funktion.
  const onControl = e.target instanceof Element && e.target.closest("input, select, textarea, button, a, summary");
  if (onControl && (e.key === " " || e.key === "Enter" || e.key.startsWith("Arrow"))) return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const shortcut = SHORTCUTS.find((s) => s.match.includes(key));
  if (!shortcut) return;
  e.preventDefault();
  shortcut.run(key);
}

function bindShortcuts() {
  $("#keys-list").innerHTML = SHORTCUTS.map((s) =>
    `<div><dt>${s.keys.map((k) => `<kbd>${k}</kbd>`).join("")}</dt><dd>${s.label}</dd></div>`).join("");
  document.addEventListener("keydown", onShortcut);
  $("#fullscreen").addEventListener("click", () => toggleFullscreen());
  $("#keys-btn").addEventListener("click", () => $("#keys").showModal());
  $("#fs-exit").addEventListener("click", () => toggleFullscreen(false));
  window.addEventListener("resize", () => {
    if (!isFullscreen()) return;
    applyStaffZoom();
    paint();
  });
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && isFullscreen()) toggleFullscreen(false); // z. B. mit Esc verlassen
  });
  // Nach Mausklicks auf Bedienelemente den Fokus lösen, damit Leertaste und Pfeile als Kürzel ankommen.
  // Wer per Tab-Taste bedient, behält den Fokus.
  let pointerUsed = false;
  document.addEventListener("pointerdown", () => { pointerUsed = true; }, true);
  document.addEventListener("keydown", () => { pointerUsed = false; }, true);
  $(".stage").addEventListener("click", () => {
    if (pointerUsed) document.activeElement?.blur?.();
  });
}
