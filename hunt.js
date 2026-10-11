// Notenjagd: 60 Sekunden lang Noten lesen und spielen – so viele wie möglich, mit Rekord je Stufe.
const HUNT_MS = 60000;
const HUNT_PENALTY_MS = 2000; // ein falscher Ton kostet 2 Sekunden – sonst lohnt sich wildes Drücken
const HUNT_TICK_MS = 100;
const HUNT_LOW_MS = 10000; // die letzten 10 Sekunden färbt sich die Uhr
const HUNT_LETTERS = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, h: 11 }; // Computertastatur → Tonname
const HUNT_PAD_OCTAVE = 60; // Antipp-Tasten klingen in der eingestrichenen Oktave
const HUNT_WEAK_MIN = 2; // so viele verwechselte Noten braucht die Stufe „Schwächen“
const HUNT_WEAK_SHOWN = 5;
const CLEF_LABELS = { treble: "Violinschlüssel", bass: "Bassschlüssel" };

const huntSpan = (from, to) => Array.from({ length: parseNote(to) - parseNote(from) + 1 }, (_, i) => parseNote(from) + i);
const huntWhites = (from, to) => huntSpan(from, to).filter((m) => !isBlack(m));

const HUNT_LEVELS = {
  leicht: { label: "Leicht", text: "Violinschlüssel · C4 bis C5", pools: [{ clef: "treble", notes: huntWhites("C4", "C5") }] },
  mittel: {
    label: "Mittel", text: "Violin- und Bassschlüssel · zwei Oktaven",
    pools: [{ clef: "treble", notes: huntWhites("C4", "A5") }, { clef: "bass", notes: huntWhites("E2", "C4") }],
  },
  schwer: {
    label: "Schwer", text: "Beide Schlüssel, Hilfslinien, ♯ und ♭",
    pools: [{ clef: "treble", notes: huntSpan("A3", "C6") }, { clef: "bass", notes: huntSpan("C2", "E4") }],
  },
  schwaechen: { label: "Schwächen", text: "Deine häufigsten Verwechsler", pools: [], weak: true },
};

const spellOf = (midi, random) => (isBlack(midi) && random() < 0.5 ? FLAT_NAME_OF[midi % 12] : null);
const sameNote = (a, b) => Boolean(a && b && a.midi === b.midi && a.clef === b.clef);

// Zufällige Note der Stufe – nie zweimal dieselbe hintereinander; schwarze Tasten mal mit ♯, mal mit ♭.
// „Schwächen“ zieht aus der eigenen Statistik: je öfter verwechselt, desto häufiger.
function pickHuntNote(levelId, prev = null, random = Math.random, weak = []) {
  if (HUNT_LEVELS[levelId].weak) return pickWeakNote(weak, prev, random);
  const { pools } = HUNT_LEVELS[levelId];
  for (;;) {
    const pool = pools[Math.floor(random() * pools.length)];
    const midi = pool.notes[Math.floor(random() * pool.notes.length)];
    if (sameNote(prev, { midi, clef: pool.clef })) continue;
    return { midi, clef: pool.clef, spell: spellOf(midi, random) };
  }
}

function pickWeakNote(weak, prev, random) {
  const options = weak.filter((w) => !sameNote(prev, w));
  const pool = options.length ? options : weak;
  let left = random() * pool.reduce((sum, w) => sum + w.weight, 0);
  const pick = pool.find((w) => (left -= w.weight) < 0) ?? pool.at(-1);
  return { midi: pick.midi, clef: pick.clef, spell: spellOf(pick.midi, random) };
}

// Statistik je Note ("bass:53"): Treffer, Fehler und womit verwechselt (Tonname 0–11 oder "okt" = falsche Oktave).
function countHuntNote(stats, note, played) {
  const key = `${note.clef}:${note.midi}`;
  const entry = stats[key] ?? { hit: 0, miss: 0, as: {} };
  const next = played === null
    ? { ...entry, hit: entry.hit + 1 }
    : { ...entry, miss: entry.miss + 1, as: { ...entry.as, [played]: (entry.as[played] ?? 0) + 1 } };
  return { ...stats, [key]: next };
}

// Schwächen: nur Noten mit Fehlern, sortiert nach (Fehler + 1) / (Versuche + 2) – wenige Versuche zählen vorsichtig.
function weakNotes(stats, limit = 8) {
  return Object.entries(stats)
    .filter(([, e]) => e.miss > 0)
    .map(([key, e]) => {
      const [clef, midi] = key.split(":");
      const top = Object.entries(e.as).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return { key, clef, midi: Number(midi), hit: e.hit, miss: e.miss, top, weight: (e.miss + 1) / (e.hit + e.miss + 2) };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}

// USB-Keyboard: genaue Oktave. Mikrofon (Obertöne!) und Antipp-Tasten: der Tonname reicht.
const huntMatches = (target, midi, src) => (src === "midi" ? midi === target.midi : midi % 12 === target.midi % 12);
const huntXp = (score, record) => Math.min(30, Math.ceil(score / 2)) + (record && score > 0 ? 10 : 0);
const huntName = (note) => `${note.spell ?? pitchName(note.midi)}${octaveOf(note.midi)}`;

// ---------- Oberfläche ----------
let hunt = null; // laufende Runde
let huntLast = null; // Ergebnis der letzten Runde

const huntRecords = () => store.get("et-hunt", {});
const huntStats = () => store.get("et-hunt-notes", {});
const weakAvailable = () => weakNotes(huntStats()).length >= HUNT_WEAK_MIN;
const huntLevel = () => {
  const id = settings.huntLevel;
  if (!(id in HUNT_LEVELS) || (HUNT_LEVELS[id].weak && !weakAvailable())) return "leicht";
  return id;
};
const huntBest = (id) => huntRecords()[id]?.best ?? 0;

function huntStaffSvg(note) {
  const hand = note.clef === "bass" ? "lh" : "rh";
  const step = { beat: 0, notes: [{ midi: note.midi, spell: note.spell, dur: 4, durCode: "w", finger: null, hand, beat: 0, dyn: null }] };
  return staffSvg([step], note.clef, "4/4").svg;
}

function huntPadHtml() {
  const whites = [0, 2, 4, 5, 7, 9, 11];
  const blacks = [[1, 1, "Cis/Des"], [3, 2, "Dis/Es"], [6, 4, "Fis/Ges"], [8, 5, "Gis/As"], [10, 6, "Ais/B"]];
  return `<div class="hunt-pad" role="group" aria-label="Tasten zum Antippen">
    ${whites.map((pc) => `<button type="button" class="pad-key white" data-pc="${pc}">${pitchName(pc)}</button>`).join("")}
    ${blacks.map(([pc, at, label]) => `<button type="button" class="pad-key black" data-pc="${pc}" aria-label="${label}" style="left:calc(${at} * 100% / 7)"></button>`).join("")}
  </div>`;
}

function huntStageHtml() {
  if (hunt) return huntStaffSvg(hunt.note);
  if (!huntLast) {
    return `<div class="hunt-ready"><b>Bereit?</b><span>Die Uhr startet mit „Los“. Lies die Note – und spiel sie.</span></div>`;
  }
  const { score, wrong, bestStreak, record, level } = huntLast;
  const accuracy = score + wrong ? Math.round((score / (score + wrong)) * 100) : 0;
  return `<div class="hunt-ready done">
    ${record ? `<em class="hunt-record">Neuer Rekord!</em>` : ""}
    <b>${score}</b><span>${score === 1 ? "Note" : "Noten"} in 60 Sekunden · ${HUNT_LEVELS[level].label}</span>
    <ul class="stats"><li><b>${accuracy} %</b>Treffer</li><li><b>${wrong}</b>falsch</li><li><b>${bestStreak}</b>längste Serie</li><li><b>${huntBest(level)}</b>Rekord</li></ul>
  </div>`;
}

function renderHunt() {
  const level = huntLevel();
  const records = huntRecords();
  $("#hunt").innerHTML = `
    <header class="hunt-head">
      <p class="eyebrow">Spiel · Noten lesen</p>
      <h1>Notenjagd</h1>
      <p>Lies die Note und spiel sie – so viele wie möglich in 60 Sekunden. Ein falscher Ton kostet 2 Sekunden.</p>
    </header>
    <fieldset class="hunt-levels">
      <legend class="sr-only">Stufe wählen</legend>
      ${Object.entries(HUNT_LEVELS).map(([id, l]) => {
        const locked = l.weak && !weakAvailable();
        return `<label class="hunt-level ${l.weak ? "weak" : ""}">
          <input type="radio" name="hunt-level" value="${id}" ${id === level ? "checked" : ""} ${locked ? "disabled" : ""}>
          <span><b>${l.label}</b><small>${l.text}</small><em>${locked ? "erst ein paar Runden spielen" : records[id]?.best ? `Rekord ${records[id].best}` : "noch kein Rekord"}</em></span>
        </label>`;
      }).join("")}
    </fieldset>
    <section class="hunt-board" aria-label="Spielfeld">
      <div class="hunt-hud">
        <div class="hunt-score"><b id="hunt-score">${hunt?.score ?? huntLast?.score ?? 0}</b><small>Noten</small></div>
        <div class="hunt-clock"><span class="hunt-time"><i id="hunt-time"></i></span><small id="hunt-seconds">60 s</small></div>
        <div class="hunt-side"><span>Serie <b id="hunt-streak">0</b></span><span>Rekord <b>${huntBest(level)}</b></span></div>
      </div>
      <div id="hunt-stage" class="hunt-stage">${huntStageHtml()}</div>
      <p id="hunt-feedback" class="feedback" role="status" aria-live="polite"></p>
      <div class="hunt-actions"><button id="hunt-start" class="btn accent" type="button">${huntLast ? "↻ Nochmal" : "▶ Los"}</button></div>
      ${huntPadHtml()}
      <p class="fine">Mit USB-Keyboard zählt die genaue Oktave. Mit Mikrofon, den Tasten oben oder der Computertastatur (C D E F G A H) reicht der Notenname.</p>
    </section>
    ${weakListHtml()}`;
}

function weakListHtml() {
  const weak = weakNotes(huntStats(), HUNT_WEAK_SHOWN);
  const asLabel = (top) => (top === "okt" ? "oft in der falschen Oktave" : `oft als ${pitchName(Number(top))} gespielt`);
  return `<section class="card weak-notes" aria-labelledby="weak-title">
    <h2 id="weak-title">Deine Schwachstellen</h2>
    ${weak.length ? `<ol class="weak-list">${weak.map((w) => `<li>
        <b>${midiName(w.midi)}</b><span>${CLEF_LABELS[w.clef]}</span>
        <span class="bar small" role="img" aria-label="${w.miss} von ${w.hit + w.miss} falsch"><i style="width:${(w.miss / (w.hit + w.miss)) * 100}%"></i></span>
        <small>${w.miss} von ${w.hit + w.miss} falsch${w.top ? ` · ${asLabel(w.top)}` : ""}</small>
      </li>`).join("")}</ol>
      <p class="fine">Die Stufe „Schwächen“ zeigt genau diese Noten öfter – bis sie sitzen. Jeder Treffer lässt eine Note nach unten rutschen.</p>`
    : `<p class="fine">Noch keine – die App merkt sich bei jeder Runde, welche Noten du verwechselst.</p>`}
  </section>`;
}

function renderHuntLink() {
  const best = Math.max(0, ...Object.keys(HUNT_LEVELS).map(huntBest));
  $("#hunt-link-best").textContent = best ? `Rekord ${best}` : "Lesespiel";
}

function showHuntNote(state) {
  const stage = $("#hunt-stage");
  stage.innerHTML = huntStaffSvg(hunt.note);
  stage.dataset.state = state ?? "";
}

function startHunt() {
  if (hunt) return stopHunt();
  huntLast = null;
  renderHunt();
  const level = huntLevel();
  const weak = weakNotes(huntStats()); // ponytail: Schwächen für die ganze Runde festhalten – neue Fehler zählen ab der nächsten
  hunt = { level, weak, score: 0, wrong: 0, streak: 0, bestStreak: 0, endsAt: performance.now() + HUNT_MS, note: pickHuntNote(level, null, Math.random, weak) };
  hunt.timer = setInterval(huntTick, HUNT_TICK_MS);
  $("#hunt").classList.add("running");
  $("#hunt-start").textContent = "■ Abbrechen";
  showHuntNote();
  huntTick();
  huntSay("Los! Spiel die Note.", "info");
}

// Abbrechen ohne Wertung (auch beim Verlassen der Seite)
function stopHunt() {
  if (!hunt) return;
  clearInterval(hunt.timer);
  hunt = null;
  if (section === "jagd") renderHunt();
}

function huntTick() {
  const left = Math.max(0, hunt.endsAt - performance.now());
  const bar = $("#hunt-time");
  bar.style.transform = `scaleX(${left / HUNT_MS})`;
  bar.parentElement.classList.toggle("low", left < HUNT_LOW_MS);
  $("#hunt-seconds").textContent = `${Math.ceil(left / 1000)} s`;
  if (left <= 0) finishHunt();
}

function huntSay(text, tone) {
  const el = $("#hunt-feedback");
  el.textContent = text;
  el.dataset.tone = tone;
}

function huntInput(midi, src, time) {
  if (!hunt) return huntSay("Drück auf „Los“ – dann läuft die Uhr.", "info");
  trackNote(time);
  const target = hunt.note;
  const octaveOff = !huntMatches(target, midi, src) && midi % 12 === target.midi % 12;
  store.set("et-hunt-notes", countHuntNote(huntStats(), target, huntMatches(target, midi, src) ? null : octaveOff ? "okt" : midi % 12));
  if (huntMatches(target, midi, src)) {
    const streak = hunt.streak + 1;
    hunt = { ...hunt, score: hunt.score + 1, streak, bestStreak: Math.max(hunt.bestStreak, streak), note: pickHuntNote(hunt.level, target, Math.random, hunt.weak) };
    showHuntNote("hit");
    huntSay(`✓ ${huntName(target)}${streak >= 5 && streak % 5 === 0 ? ` – ${streak} in Folge!` : ""}`, "ok");
  } else if (octaveOff) {
    hunt = { ...hunt, streak: 0 };
    huntSay(`Richtiger Name, falsche Oktave – such genau diese Note (${midiName(midi)} war zu ${midi < target.midi ? "tief" : "hoch"}).`, "info");
  } else {
    hunt = { ...hunt, wrong: hunt.wrong + 1, streak: 0, endsAt: hunt.endsAt - HUNT_PENALTY_MS };
    const stage = $("#hunt-stage");
    stage.dataset.state = "";
    void stage.offsetWidth; // Animation neu starten
    stage.dataset.state = "miss";
    huntSay(`Das war ${pitchName(midi)} – −2 Sekunden.`, "bad");
  }
  $("#hunt-score").textContent = hunt.score;
  $("#hunt-streak").textContent = hunt.streak;
  huntTick(); // die Zeitstrafe kann die Runde beenden
}

function finishHunt() {
  const { level, score, wrong, bestStreak, timer } = hunt;
  clearInterval(timer);
  hunt = null;
  $("#hunt").classList.remove("running");
  const records = huntRecords();
  const before = records[level] ?? { best: 0, runs: 0, total: 0 };
  const record = score > before.best;
  store.set("et-hunt", {
    ...records,
    [level]: { best: Math.max(before.best, score), runs: before.runs + 1, total: before.total + score, last: score, date: dateKey() },
  });
  huntLast = { level, score, wrong, bestStreak, record };
  renderHunt();
  renderHuntLink();
  huntSay(record && before.runs ? `Neuer Rekord – ${score - before.best} mehr als bisher!` : "Zeit um!", record ? "ok" : "info");
  const xp = huntXp(score, record);
  if (xp) awardXp(xp, record ? "Notenjagd – neuer Rekord!" : "Notenjagd");
  checkBadges();
}

function playPadTone(midi) {
  const ctx = audio();
  tone(midi, ctx.currentTime, 0.4, ctx.destination);
}

function bindHunt() {
  const box = $("#hunt");
  box.addEventListener("click", (e) => {
    if (e.target.closest("#hunt-start")) startHunt();
  });
  box.addEventListener("change", (e) => {
    if (e.target.name !== "hunt-level") return;
    saveSettings({ huntLevel: e.target.value });
    huntLast = null;
    renderHunt();
  });
  box.addEventListener("pointerdown", (e) => {
    const key = e.target.closest(".pad-key");
    if (!key) return;
    const midi = HUNT_PAD_OCTAVE + Number(key.dataset.pc);
    playPadTone(midi);
    huntInput(midi, "taste", e.timeStamp);
  });
  document.addEventListener("keydown", (e) => {
    if (section !== "jagd" || e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.target.closest("input, textarea, select")) return;
    const pc = HUNT_LETTERS[e.key.toLowerCase()];
    if (pc === undefined) return;
    e.preventDefault();
    playPadTone(HUNT_PAD_OCTAVE + pc);
    huntInput(HUNT_PAD_OCTAVE + pc, "taste", e.timeStamp);
  });
  renderHuntLink();
}

if (typeof module !== "undefined") module.exports = { HUNT_LEVELS, pickHuntNote, huntMatches, huntXp, huntName, countHuntNote, weakNotes };
