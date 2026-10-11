// Sicherung: Fortschritt als Datei exportieren und wieder einspielen (z. B. auf einem anderen Rechner).
const BACKUP_APP = "erste-tasten";
const BACKUP_VERSION = 1;
const BACKUP_MAX_BYTES = 8 * 1024 * 1024;
const BACKUP_REMIND_DAYS = 14;
const BACKUP_LABELS = {
  "et-settings": "Einstellungen", "et-last": "letzte Lektion", "et-progress": "Sterne", "et-read": "gelesene Kapitel",
  "et-quiz": "Quiz-Ergebnisse", "et-rec": "Aufnahmen", "et-own": "eigene Stücke", "et-days": "Übungstage",
  "et-review": "Wiederholungsplan", "et-badges": "Abzeichen", "et-errors": "Fehlerstellen", "et-hunt": "Notenjagd-Rekorde",
  "et-meta": "Sicherungsdatum", "et-hunt-notes": "Notenjagd-Statistik", "et-learned": "Lerndaten",
};
const BACKUP_KEYS = Object.keys(BACKUP_LABELS);

// ---------- Prüfung (rein, auch von music.test.js genutzt) ----------
// Eine Sicherungsdatei kann von irgendwoher kommen – jeder Teil wird streng geprüft, sonst wird nichts eingespielt.
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isCount = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const isDayKey = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isPrimitive = (v) => ["string", "number", "boolean"].includes(typeof v) && String(v).length <= 200;
const isIntIn = (lo, hi) => (v) => Number.isInteger(v) && v >= lo && v <= hi;
const isPlainText = (v) => typeof v === "string" && v.length <= 300 && !/[<>"]/.test(v); // landet teils als HTML auf der Seite
const mapOf = (check, keyCheck = () => true) => (v) => isPlainObject(v) && Object.entries(v).every(([k, x]) => keyCheck(k) && check(x));
const shapeOf = (spec) => (v) => isPlainObject(v) && Object.entries(v).every(([k, x]) => k in spec && spec[k](x));

const isRecEvent = (e) => Array.isArray(e) && e.length === 4 && isIntIn(0, 1)(e[0]) && isIntIn(0, 127)(e[1]) && isIntIn(0, 127)(e[2]) && Number.isFinite(e[3]);
const isOwnNote = (n) => Array.isArray(n) && n.length === 4 && isIntIn(0, 127)(n[0]) && isCount(n[1]) && n[2] in DURATIONS && ["rh", "lh"].includes(n[3]);
const isOwnPiece = shapeOf({
  id: (v) => typeof v === "string" && /^u-\d+$/.test(v),
  title: (v) => typeof v === "string" && v.length <= 200, // wird überall maskiert angezeigt
  composer: isPlainText, year: isPlainText, about: isPlainText,
  genres: (v) => Array.isArray(v) && v.length === 1 && v[0] === "eigene",
  level: isIntIn(1, 3),
  meter: (v) => typeof v === "string" && /^([1-9]|1[0-9]|2[0-4])\/(1|2|4|8|16|32)$/.test(v),
  key: isIntIn(-7, 7),
  flats: (v) => typeof v === "boolean",
  tempo: (v) => isCount(v) && v >= 1 && v <= 1000,
  clef: (v) => ["treble", "bass", "grand"].includes(v),
  notes: (v) => Array.isArray(v) && v.length > 0 && v.length <= 4000 && v.every(isOwnNote),
});

const BACKUP_SCHEMA = {
  "et-settings": mapOf(isPrimitive),
  "et-last": (v) => typeof v === "string" && v.length <= 100,
  "et-progress": mapOf(shapeOf({ stars: isIntIn(0, 3), takt: isIntIn(0, 3) })),
  "et-read": mapOf(isPrimitive),
  "et-quiz": mapOf(shapeOf({ right: isCount, total: isCount })),
  "et-rec": mapOf(shapeOf({
    date: isCount, events: (v) => Array.isArray(v) && v.length <= 20000 && v.every(isRecEvent),
    range: (v) => v === null || shapeOf({ from: isIntIn(1, 9999), to: isIntIn(1, 9999) })(v),
    hands: (v) => ["both", "rh", "lh"].includes(v),
  })),
  "et-own": (v) => Array.isArray(v) && v.length <= 200 && v.every(isOwnPiece),
  "et-days": mapOf(shapeOf({ ms: isCount, notes: isCount, xp: isCount, runs: isCount }), isDayKey),
  "et-review": mapOf(shapeOf({ stage: isIntIn(0, 20), due: isDayKey, last: isDayKey, reviews: isCount })),
  "et-badges": mapOf(isDayKey),
  "et-errors": mapOf(mapOf(isCount, (k) => /^\d+$/.test(k))),
  "et-hunt": mapOf(shapeOf({ best: isCount, runs: isCount, total: isCount, last: isCount, date: isDayKey })),
  "et-meta": shapeOf({ lastBackup: isDayKey }),
  "et-hunt-notes": mapOf(shapeOf({ hit: isCount, miss: isCount, as: mapOf(isCount, (k) => /^(\d+|okt)$/.test(k)) }), (k) => /^(treble|bass):\d+$/.test(k)),
  "et-learned": mapOf(isDayKey),
};

// → { data, created } oder Fehler mit verständlicher Meldung. Unbekannte Teile werden ignoriert.
function checkBackup(file) {
  if (!isPlainObject(file) || file.app !== BACKUP_APP || !isPlainObject(file.data)) {
    throw new Error("Das ist keine Sicherung von „Erste Tasten“.");
  }
  if (!Number.isInteger(file.version) || file.version > BACKUP_VERSION) {
    throw new Error("Diese Sicherung stammt aus einer neueren Version der App.");
  }
  const data = {};
  for (const key of BACKUP_KEYS) {
    if (!(key in file.data)) continue;
    if (!BACKUP_SCHEMA[key](file.data[key])) throw new Error(`Der Teil „${BACKUP_LABELS[key]}“ ist beschädigt – es wurde nichts verändert.`);
    data[key] = file.data[key];
  }
  if (!Object.keys(data).length) throw new Error("Die Sicherung ist leer.");
  return { data, created: typeof file.created === "string" ? file.created : null };
}

// ---------- Oberfläche ----------

function backupFile() {
  const data = Object.fromEntries(BACKUP_KEYS.map((k) => [k, store.get(k, null)]).filter(([, v]) => v !== null));
  return { app: BACKUP_APP, version: BACKUP_VERSION, created: new Date().toISOString(), data };
}

function exportBackup(name = "sicherung") {
  flushActivity();
  store.set("et-meta", { ...store.get("et-meta", {}), lastBackup: dateKey() });
  const blob = new Blob([JSON.stringify(backupFile())], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `erste-tasten-${name}-${dateKey()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  checkBadges();
}

function backupSummary(data) {
  const days = data["et-days"] ?? {};
  const xp = totals(days).xp;
  const stars = Object.values(data["et-progress"] ?? {}).filter((p) => p.stars).length;
  const dayCount = Object.keys(days).length;
  return `Level ${levelInfo(xp).level} (${xp} XP), ${stars} ${stars === 1 ? "Lektion/Stück" : "Lektionen/Stücke"} mit Sternen, ` +
    `${dayCount} ${dayCount === 1 ? "Übungstag" : "Übungstage"}`;
}

async function importBackup(file) {
  const status = $("#backup-status");
  try {
    if (file.size > BACKUP_MAX_BYTES) throw new Error("Die Datei ist zu groß für eine Sicherung.");
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      throw new Error("Die Datei lässt sich nicht lesen – ist es wirklich eine Sicherung (.json)?");
    }
    const { data, created } = checkBackup(parsed);
    const when = created ? new Date(created).toLocaleString("de-DE", { dateStyle: "long", timeStyle: "short" }) : "unbekannt";
    const ok = confirm(`Sicherung vom ${when} einspielen?\n\nSie enthält: ${backupSummary(data)}.\n\n` +
      "Dein jetziger Stand wird ersetzt. Zur Sicherheit wird er vorher als Datei heruntergeladen.");
    if (!ok) return;
    exportBackup("vor-dem-einspielen");
    const before = Object.fromEntries(BACKUP_KEYS.map((k) => [k, localStorage.getItem(k)]));
    BACKUP_KEYS.forEach((k) => localStorage.removeItem(k));
    if (!Object.entries(data).every(([k, v]) => store.set(k, v))) {
      Object.entries(before).forEach(([k, v]) => (v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v)));
      throw new Error("Der Speicher im Browser ist zu voll – dein bisheriger Stand ist unverändert.");
    }
    location.reload();
  } catch (err) {
    console.warn("Sicherung einspielen fehlgeschlagen", err);
    status.textContent = err.message;
    status.dataset.tone = "bad";
  }
}

function backupCardHtml() {
  const last = store.get("et-meta", {}).lastBackup;
  const stale = !last || addDays(last, BACKUP_REMIND_DAYS) < dateKey();
  return `<section class="card backup">
    <h2>Sicherung</h2>
    <p class="fine">Dein Fortschritt liegt nur in diesem Browser. Sichere ihn ab und zu als Datei – damit kannst du ihn auch auf einen anderen Rechner mitnehmen.</p>
    <p class="backup-last ${stale ? "stale" : ""}">${!last ? "Noch keine Sicherung – leg am besten gleich eine an." : `Letzte Sicherung: ${formatDay(last)}${stale ? " – Zeit für eine neue!" : ""}`}</p>
    <div class="actions">
      <button class="btn" type="button" data-backup="export">⤓ Sicherung herunterladen</button>
      <button class="btn ghost" type="button" data-backup="import">⤒ Sicherung einspielen …</button>
      <input id="backup-file" type="file" accept=".json,application/json" hidden>
    </div>
    <p id="backup-status" class="feedback" role="status" aria-live="polite"></p>
  </section>`;
}

function bindBackup() {
  const box = $("#dashboard");
  box.addEventListener("click", (e) => {
    const action = e.target.closest("[data-backup]")?.dataset.backup;
    if (action === "export") {
      exportBackup();
      renderDashboard();
      $("#backup-status").textContent = "Gesichert – die Datei liegt in deinen Downloads.";
      $("#backup-status").dataset.tone = "ok";
    }
    if (action === "import") $("#backup-file").click();
  });
  box.addEventListener("change", (e) => {
    if (e.target.id !== "backup-file" || !e.target.files[0]) return;
    importBackup(e.target.files[0]);
    e.target.value = "";
  });
}

if (typeof module !== "undefined") module.exports = { checkBackup, BACKUP_KEYS };
