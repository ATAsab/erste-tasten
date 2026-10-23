// Erste Tasten – Kern: Navigation, Eingabe (USB-MIDI, Mikrofon, Maus) und Modus „Schritt für Schritt“.
const LESSONS = CHAPTERS.flatMap((c, ci) => c.lessons.map((l, li) => ({
  ...l, chapterNo: ci + 1, chapter: c.title, number: `${ci + 1}.${li + 1}`, see: LESSON_SEE[l.id] ?? [],
})));
const PRACTICE_SECTIONS = ["ueben", "stueck"];
const READER_SECTIONS = ["theorie", "geschichte"];

const $ = (sel) => document.querySelector(sel);
const store = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn("Konnte nicht gespeichert werden", err);
      return false;
    }
  },
};

const DEFAULT_SETTINGS = {
  view: "both", mode: "wait", micSens: 0.012, taktTempo: 0.7, metronome: true, latencyMs: 0, dynSplit: 64, recViaKeyboard: false,
  dailyGoal: 15, loop: "off", loopFaster: false, huntLevel: "leicht", accompany: true,
};
let settings = { ...DEFAULT_SETTINGS, ...store.get("et-settings", {}) };
let progress = store.get("et-progress", {});
let section = "ueben";
let lesson, steps, helps, run;
let stepX = [];
let staffXAt = () => 0; // Schlag → x im Notenbild (für den gleitenden Cursor im Takt-Modus)
let staffZoom = 1; // im Vollbild größer, siehe applyStaffZoom()
let currentRests = []; // Pausen des aktuellen (ggf. ausgeschnittenen) Notenbilds
let playback = null;
let mic = null;
let quietUntil = 0; // Mikrofon kurz taub nach dem Vorspielen (Nachhall)
let audioCtx = null;
let colors = {};

// ---------- Ton ----------

function audio() {
  audioCtx ??= new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function tone(midi, start, dur, out, level = 0.3) {
  const ctx = out.context;
  const env = ctx.createGain();
  env.connect(out);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(level, start + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur + 0.7);
  [[1, "triangle", 0.6], [2, "sine", 0.22], [3, "sine", 0.08]].forEach(([harmonic, type, amount]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = midiToFreq(midi) * harmonic;
    gain.gain.value = amount;
    osc.connect(gain).connect(env);
    osc.start(start);
    osc.stop(start + dur + 0.8);
  });
}

// Plant alle Töne einer Schrittfolge ein (laut/leise nach Dynamikzeichen); über den Ausgang lässt sich alles stoppen.
function scheduleSteps(list, tempo, level) {
  const ctx = audio();
  const out = ctx.createGain();
  out.connect(ctx.destination);
  const spb = 60 / tempo;
  const t0 = ctx.currentTime + 0.12;
  list.forEach((s) => s.notes.forEach((n) => tone(n.midi, t0 + s.beat * spb, n.dur * spb, out, level ?? DYN_LEVEL[n.dyn])));
  return { out, t0, spb };
}

function fadeOut(out) {
  out.gain.setTargetAtTime(0, out.context.currentTime, 0.03);
  setTimeout(() => out.disconnect(), 300);
}

function togglePlay() {
  if (playback) return stopPlay();
  stopTakt();
  stopRecPlay();
  const tempo = lesson.tempo * (settings.mode === "takt" ? settings.taktTempo : 1);
  const { out, t0, spb } = scheduleSteps(steps, tempo);
  const end = endBeat(steps);
  playback = { out, idx: -1, beat: () => (out.context.currentTime - t0) / spb };
  playback.timer = setInterval(() => {
    const beat = playback.beat();
    if (beat > end + 0.3) return stopPlay();
    const idx = steps.findLastIndex((s) => s.beat <= beat);
    if (idx !== playback.idx) {
      playback = { ...playback, idx };
      paint();
    }
  }, 40);
  $("#play").textContent = "■ Stopp";
  paint();
}

function stopPlay() {
  if (!playback) return;
  clearInterval(playback.timer);
  fadeOut(playback.out);
  playback = null;
  quietUntil = performance.now() + 700;
  $("#play").textContent = "▶ Vorspielen";
  paint();
}

function tick() {
  requestAnimationFrame(tick);
  if (takt) moveTaktCursor();
  drawFall();
}

// ---------- Modus „Schritt für Schritt“ ----------

const currentIndex = () => (playback ? playback.idx : takt ? takt.idx : run.idx);
const helpActive = () =>
  helps.keys || helps.keyNames || settings.view !== "notes" || (lesson.clef !== null && helps.names);
const hasDynamics = (item) => Boolean(item.tracks && Object.values(item.tracks).some((t) => t.includes("!")));

function dynamicMessage(hit, fits, src) {
  const name = pitchName(hit.midi);
  if (!hit.dyn) return `✓ ${name}`;
  const soft = ["pp", "p", "mp"].includes(hit.dyn);
  if (fits === null) return src === "midi" ? `✓ ${name}` : `✓ ${name} – laut/leise wird nur mit USB-Keyboard bewertet`;
  if (fits) return `✓ ${name} – schön ${soft ? "leise" : "laut"}`;
  return `${name} stimmt – aber zu ${soft ? "laut" : "leise"}. Hier steht ${hit.dyn} (${soft ? "leise" : "laut"}).`;
}

function handleNote(midi, src, time = performance.now(), velocity = null) {
  if (section === "jagd") return huntInput(midi, src, time);
  if (!PRACTICE_SECTIONS.includes(section)) return;
  if (playback || recPlay) return flash(midi, "tap");
  trackNote(time);
  if (settings.mode === "takt") {
    if (takt) return taktNote(midi, src, time, velocity);
    flash(midi, "tap");
    return say("Drück auf „Start“ – dann zählt die App einen Takt ein.", "info");
  }
  if (run.done) return flash(midi, "tap");
  const step = steps[run.idx];
  const mine = mineOf(step);
  // ponytail: Mikrofon verwechselt oft Oktaven (Obertöne) – dort zählt nur der Tonname
  const hit = mine.find((n) => n.midi === midi || (src === "mic" && n.midi % 12 === midi % 12));
  if (!hit) return miss(midi, step);
  if (!run.startedAt) closeTune();
  run.startedAt ??= performance.now();
  run.pressed.add(hit.midi);
  run.wrongStreak = 0;
  if (helpActive()) run.usedHelp = true;
  const fits = dynamicFits(hit.dyn, velocity, settings.dynSplit);
  if (fits !== null) {
    run.dynTotal++;
    if (fits) run.dynHits++;
  }
  flash(midi, fits === false ? "tap" : "ok");
  say(dynamicMessage(hit, fits, src), fits === false ? "info" : "ok");
  // ponytail: Mikrofon erkennt keine Akkorde sicher – dort genügt ein Ton des Schritts
  const complete = src === "mic" || mine.every((n) => run.pressed.has(n.midi));
  if (!complete) return paint();
  advanceStep();
  run.pressed = new Set();
  run.hint = false;
  if (run.idx >= steps.length) return finish();
  paint();
}

function miss(midi, step) {
  if (run.startedAt) {
    run.errors++;
    noteError(step.beat);
  }
  run.wrongStreak++;
  flash(midi, "bad");
  document.querySelectorAll(`#staff [data-step="${run.idx}"]`).forEach((g) => {
    g.classList.remove("shake");
    void g.getBBox();
    g.classList.add("shake");
  });
  if (run.wrongStreak >= 2) {
    run.hint = true;
    say(`Das war ${pitchName(midi)}. Tipp: gesucht ist ${mineOf(step).map((n) => midiName(n.midi)).join(" + ")} – die Taste leuchtet jetzt.`, "bad");
  } else {
    say(`Das war ${pitchName(midi)} – versuch's nochmal.`, "bad");
  }
  paint();
}

function finish() {
  run.done = true;
  const scored = scoreRun(steps.filter((s) => mineOf(s).length).length, run.errors, run.usedHelp);
  const dynWeak = run.dynTotal > 0 && run.dynHits / run.dynTotal < 0.8;
  const stars = Math.max(1, scored.stars - (dynWeak ? 1 : 0));
  const fullRun = !practiceRange && practiceHands === "both"; // Ausschnitt oder eine Hand: XP, aber keine Sterne fürs ganze Stück
  const entry = progress[lesson.id] ?? {};
  if (fullRun) {
    progress = { ...progress, [lesson.id]: { ...entry, stars: Math.max(stars, entry.stars ?? 0) } };
    store.set("et-progress", progress);
    if (lesson.isPiece) renderLibrarySide(lesson.id);
    else renderList();
  }
  saveErrors();
  paint();
  say("Geschafft!", "ok");
  recordRun({ id: lesson.id, mode: "wait", stars, firstTime: !entry.stars, fullRun });
  if (continueLoop(`Runde ${loopRound} geschafft (${Math.round(scored.accuracy * 100)} % Treffer)`, scored.accuracy)) return;
  const stats = [
    [`${Math.round(scored.accuracy * 100)} %`, "Treffer"],
    [run.errors, "Fehler"],
    [`${Math.round((performance.now() - run.startedAt) / 1000)} s`, "Zeit"],
  ];
  if (run.dynTotal) stats.push([`${run.dynHits}/${run.dynTotal}`, "laut/leise"]);
  if (looping()) stats.push([loopRound, loopRound === 1 ? "Runde" : "Runden"]);
  showResult({
    eyebrow: practiceLabel() ? `Geübt · ${practiceLabel()}` : lesson.isPiece ? "Stück geschafft" : "Lektion geschafft",
    title: "Gut gemacht!",
    stars,
    stats,
    tip: practiceHands !== "both" ? "Sitzt diese Hand? Dann übe die andere – und erst danach beide zusammen. Sterne gibt es für beide Hände."
      : dynWeak ? "Achte noch mehr auf laut und leise – mindestens 80 % sollten passen. Die Grenze kannst du unter „Feinjustierung“ einstellen."
      : stars === 3 ? "Perfekt – ganz ohne Hilfen. Probier es jetzt „Im Takt“!"
        : run.usedHelp ? "Dritter Stern: Spiel es nochmal ohne Hilfen – nur mit der Ansicht „Noten“."
          : "Mehr Sterne gibt's bei weniger als 10 % Fehlern. Langsam und richtig schlägt schnell und falsch!",
    middle: stars < 3 && run.usedHelp ? { value: "nohelp", label: "Ohne Hilfen" } : { value: "takt", label: "Im Takt üben" },
  });
}

function showResult({ eyebrow, title, stars, stats, tip, middle }) {
  const last = LESSONS.at(-1).id === lesson.id;
  $("#result-eyebrow").textContent = eyebrow;
  $("#result-title").textContent = title;
  $("#stars").setAttribute("aria-label", `${stars} von 3 Sternen`);
  $("#stars").innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? "on" : ""}">★</span>`).join("");
  $("#result-stats").innerHTML = stats.map(([value, label]) => `<li><b>${value}</b>${label}</li>`).join("");
  $("#result-tip").textContent = tip + (last && stars ? " Du hast den ganzen Kurs geschafft! 🎉" : "");
  $("#mid-btn").hidden = !middle;
  if (middle) {
    $("#mid-btn").value = middle.value;
    $("#mid-btn").textContent = middle.label;
  }
  const next = $("#next-btn");
  next.value = lesson.isPiece ? "library" : "next";
  next.textContent = lesson.isPiece ? "Zur Bibliothek →" : "Nächste Lektion →";
  next.hidden = !lesson.isPiece && last;
  $("#result").returnValue = ""; // sonst wiederholt „Escape“ die letzte Auswahl
  $("#result").showModal();
}

function onResultClose() {
  const choice = $("#result").returnValue;
  resetLoop();
  if (choice === "hotspot") {
    practiceHotspot();
    if (settings.mode === "takt") startTakt();
    return;
  }
  if (choice === "next") {
    location.hash = `#/ueben/${LESSONS[LESSONS.findIndex((l) => l.id === lesson.id) + 1].id}`;
    return;
  }
  if (choice === "library") {
    location.hash = "#/stuecke";
    return;
  }
  if (choice === "nohelp") {
    helps = { ...helps, names: false, keys: false, keyNames: false };
    saveSettings({ view: "notes" });
  }
  if (choice === "takt") saveSettings({ mode: "takt" });
  if (choice === "faster" || choice === "slower") {
    const next = settings.taktTempo + (choice === "faster" ? 0.1 : -0.1);
    saveSettings({ taktTempo: Math.round(Math.min(1.2, Math.max(0.5, next)) * 10) / 10 });
  }
  syncControls();
  restart();
  if (settings.mode === "takt" && ["again", "faster", "slower"].includes(choice)) startTakt();
}

function restart() {
  stopPlay();
  stopTakt();
  stopRecPlay();
  const full = lesson.drill ? drillSteps(lesson.drill) : lesson.notes ? stepsFromNotes(lesson.notes, lesson.flats) : buildSteps(lesson.tracks);
  const bars = barsOf(full, lesson.meter);
  const sliced = applyRange(full, lesson.tracks ? restsOf(lesson.tracks) : [], lesson.meter);
  steps = sliced.steps;
  currentRests = sliced.rests;
  barErrors = {};
  $(".range-field").hidden = Boolean(lesson.drill);
  $("#range-from").max = bars;
  $("#range-to").max = bars;
  $("#range-from").value = practiceRange?.from ?? 1;
  $("#range-to").value = practiceRange?.to ?? bars;
  if (!steps.some((s) => mineOf(s).length)) practiceHands = "both"; // im Ausschnitt spielt die gewählte Hand gar nicht
  updateHandsUi(full);
  run = {
    idx: nextOwnStep(steps, 0, practiceHands), errors: 0, wrongStreak: 0, startedAt: null, pressed: new Set(),
    usedHelp: false, hint: false, done: false, dynHits: 0, dynTotal: 0,
  };
  setKeyboardRange(steps);
  fallBeat = steps[0].beat - 4;
  renderStaff();
  paint();
  updateLoopUi();
  const part = practiceLabel() ? ` (${practiceLabel()})` : "";
  say(settings.mode === "takt"
    ? `Drück „Start“: Die App zählt einen Takt ein, dann läuft das Stück${part} mit ${taktBpm()} BPM.`
    : `Spiel die erste Note${part} – dann geht's los. Die App wartet immer auf dich.`, "info");
}

// Gemeinsamer Einstieg für Kurs-Lektionen und Bibliotheksstücke.
function openPractice(item) {
  lesson = item;
  practiceRange = null;
  practiceHands = "both";
  resetLoop();
  helps = { names: true, fingers: true, keys: true, keyNames: true, ...item.helps };
  $("#lesson-eyebrow").textContent = item.isPiece
    ? `Bibliothek · ${item.chapter} — ${item.composer}${item.year ? `, ${item.year}` : ""}`
    : `Kapitel ${item.chapterNo} · ${item.chapter} — Lektion ${item.number}`;
  $("#lesson-title").textContent = item.title;
  // Texte sind statische, eigene Inhalte (lessons.js, library.js, Import-Hinweis) – daher innerHTML
  const back = item.isPiece ? '<p class="see"><a class="see-chip" href="#/stuecke"><small>Bibliothek</small>Alle Stücke</a></p>' : "";
  $("#lesson-text").innerHTML = item.text.map((p) => `<p>${p}</p>`).join("") + seeHtml(item.see) + back;
  $("#lesson-task").textContent = item.task;
  showExplanation(item);
  $("#stage-number").textContent = item.isPiece ? "Bibliothek" : `Lektion ${item.number}`;
  $("#stage-title").textContent = item.title;
  $("#vel-box").hidden = !hasDynamics(item);
  syncControls();
  if (item.isPiece) renderLibrarySide(item.id);
  else renderList();
  restart();
  updateRecUi();
  window.scrollTo({ top: 0 });
}

function loadLesson(id) {
  const found = LESSONS.find((l) => l.id === id) ?? LESSONS[0];
  store.set("et-last", found.id);
  openPractice(found);
}

function openPiece(id) {
  const piece = allPieces().find((p) => p.id === id);
  if (!piece) {
    location.hash = "#/stuecke";
    return;
  }
  if (piece.lesson) {
    location.hash = `#/ueben/${piece.lesson}`;
    return;
  }
  openPractice(pieceAsLesson(piece));
}

// ---------- Darstellung ----------

function say(text, tone) {
  const el = $("#feedback");
  el.textContent = text;
  el.dataset.tone = tone;
}

function renderStaff() {
  const box = $("#staff");
  box.hidden = !lesson.clef;
  if (!lesson.clef) return;
  const chords = lesson.chords ? applyRange([], parseChordSymbols(lesson.chords), lesson.meter).rests : []; // wie Pausen zuschneiden
  const result = staffSvg(steps, lesson.clef, lesson.meter ?? "4/4", true, currentRests, lesson.key ?? 0, practiceRange?.from ?? 1, chords);
  stepX = result.stepX;
  staffXAt = result.xAt;
  box.innerHTML = result.svg;
  applyStaffZoom();
  markHotBars();
}

function paint() {
  const at = currentIndex();
  const step = steps[at];
  const staff = $("#staff");
  staff.classList.toggle("hide-names", !helps.names);
  staff.classList.toggle("hide-fingers", !helps.fingers);
  staff.querySelectorAll("[data-step]").forEach((g) => {
    const i = Number(g.dataset.step);
    g.dataset.state = i === at ? "current" : !takt && i < at ? "done" : "";
  });
  const cursor = $("#staff .cursor");
  if (cursor && !takt) {
    cursor.style.opacity = step ? 1 : 0;
    cursor.classList.toggle("lh", step ? mineOf(step).every((n) => n.hand === "lh") : false);
    if (step) {
      cursor.style.transform = `translateX(${stepX[at] - 15}px)`;
      const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
      staff.scrollTo({ left: stepX[at] * staffZoom - staff.clientWidth / 3, behavior: smooth ? "smooth" : "auto" });
    }
  }

  const keyboard = $("#keyboard");
  keyboard.classList.toggle("show-names", helps.keyNames);
  keyboard.querySelectorAll(".target").forEach((k) => {
    k.classList.remove("target", "rh", "lh", "hint");
    k.querySelector(".kfinger").textContent = "";
  });
  if (step && (helps.keys || run.hint || playback)) {
    (playback ? step.notes : mineOf(step)).forEach((n) => {
      const key = keyEl(n.midi);
      if (!key) return;
      key.classList.add("target", n.hand);
      key.classList.toggle("hint", run.hint && !helps.keys);
      if (helps.fingers && n.finger) key.querySelector(".kfinger").textContent = n.finger;
    });
  }

  const prompt = $("#prompt");
  prompt.hidden = lesson.clef !== null || !step;
  if (!prompt.hidden) {
    prompt.innerHTML = step.notes.map((n) =>
      `<span class="${n.hand}"><b>${pitchName(n.midi)}<sub>${octaveOf(n.midi)}</sub></b>` +
      `${helps.fingers && n.finger ? `<small>Finger ${n.finger}</small>` : ""}</span>`).join("<i>+</i>");
  }

  $("#counter").textContent = `${Math.min(Math.max(at, 0) + 1, steps.length)} / ${steps.length}`;
  $("#errors").textContent = !takt && run.errors ? `· ${run.errors} Fehler` : "";
}

function renderList() {
  const nextId = LESSONS.find((l) => !progress[l.id]?.stars)?.id;
  $("#side-list").innerHTML = CHAPTERS.map((c, ci) => `
    <section>
      <h2><span>${ci + 1}</span>${c.title}</h2>
      <ol>${c.lessons.map((l) => {
        const { stars = 0, takt: taktStars = 0 } = progress[l.id] ?? {};
        return `<li><a href="#/ueben/${l.id}" class="${l.id === nextId ? "next" : ""}" ${l.id === lesson?.id ? 'aria-current="page"' : ""}>
          <span class="t">${l.title}</span>
          ${taktStars ? `<span class="tk" title="Im Takt" aria-label="Im Takt: ${taktStars} von 3 Sternen">♩${taktStars}</span>` : ""}
          <span class="s" aria-label="${stars} von 3 Sternen">${"★".repeat(stars)}<i>${"★".repeat(3 - stars)}</i></span>
        </a></li>`;
      }).join("")}</ol>
    </section>`).join("");
}

function showVelocity(velocity) {
  const loud = velocity >= settings.dynSplit;
  $("#vel-meter").value = velocity;
  $("#vel-value").textContent = `${velocity} · ${loud ? "laut" : "leise"}`;
  $("#vel-live").textContent = `${velocity} (${loud ? "laut" : "leise"})`;
}

function syncControls() {
  document.querySelectorAll('input[name="view"]').forEach((r) => { r.checked = r.value === settings.view; });
  document.querySelectorAll('input[name="mode"]').forEach((r) => { r.checked = r.value === settings.mode; });
  document.querySelectorAll("[data-help]").forEach((c) => { c.checked = helps[c.dataset.help]; });
  $(".stage").dataset.view = settings.view;
  $(".stage").dataset.mode = settings.mode;
  $("#mic-sens").value = settings.micSens;
  $("#tempo").value = settings.taktTempo;
  $("#tempo-out").textContent = `${Math.round(settings.taktTempo * 100)} % · ${lesson ? taktBpm() : "–"} BPM`;
  $("#metronome").checked = settings.metronome;
  $("#latency").value = settings.latencyMs;
  $("#latency-out").textContent = `${settings.latencyMs > 0 ? "+" : settings.latencyMs < 0 ? "−" : "±"}${Math.abs(settings.latencyMs)} ms`;
  $("#dyn-split").value = settings.dynSplit;
  $("#dyn-split-out").textContent = settings.dynSplit;
  $("#vel-meter").low = settings.dynSplit;
  updateTuneSummary();
}

function saveSettings(patch) {
  settings = { ...settings, ...patch };
  store.set("et-settings", settings);
}

// Gemeinsame Einstiegspunkte für Bedienelemente und Tastenkürzel
function setView(view) {
  saveSettings({ view });
  syncControls();
  applyStaffZoom();
  paint();
}

function setMode(mode) {
  saveSettings({ mode });
  resetLoop();
  syncControls();
  restart();
}

function setHelp(key, on) {
  helps = { ...helps, [key]: on };
  syncControls();
  paint();
}

function setTempo(factor) {
  if (takt) return; // läuft gerade – Regler ist dann gesperrt
  saveSettings({ taktTempo: Math.round(Math.min(1.2, Math.max(0.5, factor)) * 10) / 10 });
  syncControls();
  restart();
}

// ---------- Navigation ----------
// #/heute (Start) · #/ueben/<id> · #/stuecke?g=… · #/stueck/<id> · #/theorie/<id> · #/geschichte/<id> · #/fortschritt · #/jagd

function route() {
  const [path, query = ""] = location.hash.replace(/^#\/?/, "").split("?");
  const [sec, id] = path.split("/");
  section = [...READER_SECTIONS, "ueben", "stuecke", "stueck", "fortschritt", "jagd"].includes(sec) ? sec : "heute";
  resetLoop();
  flushActivity();
  stopPlay();
  stopTakt();
  stopClip();
  stopRecord();
  stopRecPlay();
  stopHunt();
  if (!PRACTICE_SECTIONS.includes(section) && isFullscreen()) toggleFullscreen(false);
  const tab = section === "stueck" ? "stuecke" : section;
  document.querySelectorAll(".toc [data-section]").forEach((a) => {
    if (a.dataset.section === tab) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  $("#practice").hidden = !PRACTICE_SECTIONS.includes(section);
  $("#reader").hidden = !READER_SECTIONS.includes(section);
  $("#library").hidden = section !== "stuecke";
  $("#dashboard").hidden = section !== "fortschritt";
  $("#hunt").hidden = section !== "jagd";
  $("#today").hidden = section !== "heute";
  $("#me-card").toggleAttribute("aria-current", section === "fortschritt");
  if (section === "ueben") return loadLesson(id ?? store.get("et-last", LESSONS[0].id));
  if (section === "stueck") return openPiece(id);
  if (["fortschritt", "jagd", "heute"].includes(section)) {
    ({ fortschritt: () => renderDashboard(new URLSearchParams(query).get("monat")), jagd: renderHunt, heute: renderToday })[section]();
    renderList();
    return window.scrollTo({ top: 0 });
  }
  if (section === "stuecke") {
    renderLibrary(new URLSearchParams(query));
    return window.scrollTo({ top: 0 });
  }
  renderArticle(section, id);
}

// ---------- Eingabe: USB-MIDI ----------

async function initMidi() {
  const status = $("#midi-status");
  const show = (text, state) => {
    status.textContent = text;
    status.dataset.state = state;
  };
  if (!navigator.requestMIDIAccess) return show("USB-Keyboard: nur in Chrome oder Edge", "bad");
  try {
    const access = await navigator.requestMIDIAccess();
    const bind = () => {
      const inputs = [...access.inputs.values()];
      const outputs = [...access.outputs.values()];
      inputs.forEach((input) => { input.onmidimessage = onMidi; });
      // Wiedergabe über das Keyboard: bevorzugt der Ausgang mit demselben Namen wie der Eingang
      midiOutput = outputs.find((o) => inputs.some((i) => i.name === o.name)) ?? outputs[0] ?? null;
      if (inputs.length) show(`USB-Keyboard: ${inputs.map((i) => i.name).join(", ")}`, "ok");
      else show("USB-Keyboard: nicht verbunden", "off");
      updateRecUi();
    };
    access.onstatechange = bind;
    bind();
  } catch (err) {
    console.warn("MIDI-Zugriff fehlgeschlagen", err);
    show("USB-Keyboard: Zugriff verweigert", "bad");
  }
}

function onMidi(event) {
  if (recPlay?.viaKeyboard) return; // die eigene Wiedergabe kann als Echo zurückkommen
  const [status, note, velocity] = event.data;
  const type = status & 0xf0;
  const time = event.timeStamp || performance.now();
  const key = keyEl(note);
  if (type === 0x90 && velocity > 0) {
    key?.classList.add("down");
    recordNote(note, velocity, time);
    showVelocity(velocity);
    handleNote(note, "midi", time, velocity);
  } else if (type === 0x80 || type === 0x90) {
    key?.classList.remove("down");
    recordRelease(note, time);
  }
}

// ---------- Eingabe: Mikrofon ----------

async function toggleMic() {
  if (mic) {
    mic.stream.getTracks().forEach((t) => t.stop());
    cancelAnimationFrame(mic.raf);
    mic = null;
    return updateMicUi();
  }
  try {
    const ctx = audio();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    // Bandpass auf den Klavier-Grundtonbereich: schneidet Lüfter-Brummen und Rauschen ab, YIN rät dann seltener daneben
    const highpass = new BiquadFilterNode(ctx, { type: "highpass", frequency: 50 });
    const lowpass = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 2200 });
    ctx.createMediaStreamSource(stream).connect(highpass).connect(lowpass).connect(analyser);
    mic = { stream, analyser, buf: new Float32Array(analyser.fftSize), held: null, cand: null, count: 0, low: 1, last: 0 };
    micLoop();
  } catch (err) {
    console.warn("Mikrofon nicht verfügbar", err);
    say("Kein Zugriff aufs Mikrofon – bitte im Browser erlauben.", "bad");
  }
  updateMicUi();
}

// Erkennt einen neuen Anschlag: stabile Tonhöhe über 2 Frames UND (neuer Ton ODER Lautstärke springt hoch).
// ponytail: kein Lautstärkesprung für einen neuen Ton nötig – legato wird der neue Ton nicht lauter als der alte.
function micLoop() {
  mic.raf = requestAnimationFrame(micLoop);
  const { analyser, buf } = mic;
  analyser.getFloatTimeDomainData(buf);
  const level = rms(buf);
  const now = performance.now();
  $("#mic-level").value = level;
  // Das Metronom im Takt-Modus ist leise und hoch genug, um unter der Schwelle zu bleiben – sonst Regler anpassen.
  if (level < settings.micSens || playback || clip || recPlay || now < quietUntil) {
    Object.assign(mic, { held: null, cand: null, low: level });
    return;
  }
  const attack = level > mic.low * 2.5 && now - mic.last > 120;
  mic.low = Math.min(mic.low, level);
  const freq = yin(buf, analyser.context.sampleRate);
  if (!freq) return;
  const midi = freqToMidi(freq);
  mic.count = midi === mic.cand ? mic.count + 1 : 1;
  mic.cand = midi;
  if (mic.count < 2 || (midi === mic.held && !attack)) return;
  Object.assign(mic, { held: midi, low: level, last: now });
  $("#mic-note").textContent = midiName(midi); // nur gezählte Töne – Zwischenwerte beim Verklingen verwirren
  recordNote(midi, null, now, TAP_MS);
  handleNote(midi, "mic", now);
}

function updateMicUi() {
  $("#mic-chip").textContent = mic ? "Mikrofon an" : "Mikrofon aus";
  $("#mic-chip").dataset.state = mic ? "ok" : "off";
  $("#mic-toggle").textContent = mic ? "Mikrofon ausschalten" : "Mikrofon einschalten";
}

// ---------- Start ----------

function bindControls() {
  $("#keyboard").addEventListener("pointerdown", (e) => {
    const key = e.target.closest(".key");
    if (!key) return;
    const midi = Number(key.dataset.midi);
    const ctx = audio();
    tone(midi, ctx.currentTime, 0.5, ctx.destination);
    key.classList.add("down");
    setTimeout(() => key.classList.remove("down"), 160);
    recordNote(midi, DEFAULT_VELOCITY, e.timeStamp, TAP_MS);
    handleNote(midi, "maus", e.timeStamp);
  });
  $("#play").addEventListener("click", togglePlay);
  $("#restart").addEventListener("click", () => {
    resetLoop();
    restart();
  });
  $("#takt-start").addEventListener("click", startTakt);
  $("#rec-btn").addEventListener("click", toggleRecord);
  $("#rec-play").addEventListener("click", toggleRecPlay);
  $("#rec-via").addEventListener("change", (e) => saveSettings({ recViaKeyboard: e.target.checked }));
  document.querySelectorAll('input[name="view"]').forEach((r) => r.addEventListener("change", () => setView(r.value)));
  document.querySelectorAll('input[name="mode"]').forEach((r) => r.addEventListener("change", () => setMode(r.value)));
  document.querySelectorAll("[data-help]").forEach((c) => c.addEventListener("change", () => setHelp(c.dataset.help, c.checked)));
  $("#tempo").addEventListener("input", (e) => setTempo(Number(e.target.value)));
  $("#metronome").addEventListener("change", (e) => saveSettings({ metronome: e.target.checked }));
  $("#latency").addEventListener("input", (e) => {
    saveSettings({ latencyMs: Number(e.target.value) });
    syncControls();
  });
  $("#dyn-split").addEventListener("input", (e) => {
    saveSettings({ dynSplit: Number(e.target.value) });
    syncControls();
  });
  $("#mic-toggle").addEventListener("click", toggleMic);
  $("#mic-sens").addEventListener("input", (e) => saveSettings({ micSens: Number(e.target.value) }));
  $("#result").addEventListener("close", onResultClose);
  $("#reader").addEventListener("click", onReaderClick);
  bindLibrary();
  window.addEventListener("hashchange", route);
}

function init() {
  const css = getComputedStyle(document.documentElement);
  const tokens = ["rh", "lh", "gold", "lane", "ok", "bad", "felt", "zone-knapp", "zone-good", "zone-perfect"];
  const read = Object.fromEntries(tokens.map((k) => [k, css.getPropertyValue(`--${k}`).trim()]));
  colors = {
    ...read,
    zoneKnapp: read["zone-knapp"], zoneGood: read["zone-good"], zonePerfect: read["zone-perfect"],
    perfekt: read.ok, gut: read.ok, knapp: read.gold, verpasst: read.bad,
  };
  bindControls();
  bindShortcuts();
  bindLoop();
  bindDashboard();
  bindBackup();
  bindHunt();
  bindHands();
  bindTune();
  bindRecReport();
  renderMeCard();
  checkBadges();
  route();
  initMidi();
  requestAnimationFrame(tick);
}

init();
