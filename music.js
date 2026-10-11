// Erste Tasten – reine Musik-Logik ohne DOM (wird auch von music.test.js genutzt).
const NOTE_NAMES = ["C", "Cis", "D", "Dis", "E", "F", "Fis", "G", "Gis", "A", "B", "H"];
const NOTE_ALIASES = { Des: "Cis", Es: "Dis", Ges: "Fis", As: "Gis", Ais: "B" };
const FLAT_SPELLING = { Des: "D", Es: "E", Ges: "G", As: "A", B: "H" }; // Be-Namen → Stammton, vor den das ♭ kommt
const LETTERS = "CDEFGAH";
const DIATONIC = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]; // Halbton → Stammton (C=0 … H=6)
const BLACK_KEYS = [1, 3, 6, 8, 10];
// t = Zweiunddreißigstel, s = Sechzehntel, te = Triolen-Achtel, e = Achtel, ed = punktierte Achtel, q = Viertel …
const DURATIONS = { t: 0.125, s: 0.25, te: 1 / 3, e: 0.5, ed: 0.75, q: 1, qd: 1.5, h: 2, hd: 3, w: 4 };
const FLAT_NAME_OF = { 1: "Des", 3: "Es", 6: "Ges", 8: "As", 10: "B" }; // schwarze Tasten in Be-Tonarten
const DYNAMICS = ["pp", "p", "mp", "mf", "f", "ff"];
const DYN_LEVEL = { pp: 0.07, p: 0.12, mp: 0.18, mf: 0.25, f: 0.4, ff: 0.5 }; // Lautstärke beim Vorspielen
const TIMING = { perfect: 60, good: 120, windowMax: 220 }; // Takt-Modus, in Millisekunden

function parseNote(name) {
  const match = /^([A-H][a-z]*)(\d)$/.exec(name);
  const pc = match ? NOTE_NAMES.indexOf(NOTE_ALIASES[match[1]] ?? match[1]) : -1;
  if (pc < 0) throw new Error(`Unbekannte Note: ${name}`);
  return (Number(match[2]) + 1) * 12 + pc; // C4 = 60
}

const octaveOf = (midi) => Math.floor(midi / 12) - 1;
const pitchName = (midi) => NOTE_NAMES[midi % 12];
const midiName = (midi) => pitchName(midi) + octaveOf(midi);
const isBlack = (midi) => BLACK_KEYS.includes(midi % 12);

// Taktart → Schläge (Viertel) pro Takt: 4/4 → 4, 3/4 → 3, 6/8 → 3, 3/8 → 1.5
function meterBeats(meter = "4/4") {
  const [count, unit] = meter.split("/").map(Number);
  return (count * 4) / unit;
}

// Position im Notensystem: Stammton-Nummer (C4 = 28, E4 = 30) und Vorzeichen.
// Mit Schreibweise (z. B. "Es") steht ein ♭ vor dem Stammton darüber, sonst ein ♯ vor dem darunter.
function staffStep(midi, spelling) {
  const flatOf = FLAT_SPELLING[spelling];
  if (flatOf) return { step: octaveOf(midi + 1) * 7 + LETTERS.indexOf(flatOf), accidental: "flat" };
  return { step: octaveOf(midi) * 7 + DIATONIC[midi % 12], accidental: isBlack(midi) ? "sharp" : null };
}

const tokensOf = (text) => text.split(/\s+/).filter((t) => t && t !== "|");

function durationOf(token) {
  const code = token.split(":")[1] ?? "q";
  if (!(code in DURATIONS)) throw new Error(`Unbekannte Dauer: ${token}`);
  return DURATIONS[code];
}

// "531" bei einem Dreiklang = Finger pro Ton, in der geschriebenen Reihenfolge
function fingerAt(fingers, index, count) {
  if (!fingers) return null;
  if (count === 1) return Number(fingers);
  return fingers.length === count ? Number(fingers[index]) : null;
}

// Token: "E4:q:3" = E4, Viertel, Finger 3 · "C3+E3+G3:w:531" = Akkord · "R:q" = Pause · "!p" = ab hier leise
function parseVoice(text, hand) {
  let beat = 0;
  let dyn = null;
  return tokensOf(text).flatMap((token) => {
    if (token.startsWith("!")) {
      dyn = token.slice(1);
      if (!DYNAMICS.includes(dyn)) throw new Error(`Unbekanntes Dynamikzeichen: ${token}`);
      return [];
    }
    const [names, durCode = "q", fingers = ""] = token.split(":");
    const dur = durationOf(token);
    const start = beat;
    beat += dur;
    if (names === "R") return [];
    const list = names.split("+");
    return list.map((name, i) => ({
      midi: parseNote(name), spell: name.replace(/\d+$/, ""), dur, durCode,
      finger: fingerAt(fingers, i, list.length), hand, beat: start, dyn,
    }));
  });
}

const parseToken = (token, hand) => parseVoice(token, hand)[0];

// Pausen einer Stimme – nur fürs Notenbild
function parseRests(text, hand) {
  let beat = 0;
  return tokensOf(text).filter((t) => !t.startsWith("!")).flatMap((token) => {
    const start = beat;
    beat += durationOf(token);
    const [name, durCode = "q"] = token.split(":");
    return name === "R" ? [{ beat: start, dur: DURATIONS[durCode], durCode, hand }] : [];
  });
}

// Akkordsymbole über den Noten: "C:w | Am:h F:h" → [{ beat, name }]; "R" = Strecke ohne Symbol.
function parseChordSymbols(text = "") {
  let beat = 0;
  return tokensOf(text).flatMap((token) => {
    const name = token.split(":")[0];
    const entry = name === "R" ? [] : [{ beat, name }];
    beat += durationOf(token);
    return entry;
  });
}

const restsOf = (tracks) => Object.entries(tracks).flatMap(([hand, text]) => parseRests(text, hand));

// Gesamtlänge einer Stimme in Schlägen, Pausen eingeschlossen.
const voiceLength = (text) =>
  tokensOf(text).filter((t) => !t.startsWith("!")).reduce((sum, t) => sum + durationOf(t), 0);

// Alle Noten, die gleichzeitig beginnen, bilden einen Schritt (Akkord oder beide Hände).
function groupSteps(notes) {
  const byBeat = new Map();
  notes.forEach((n) => byBeat.set(n.beat, [...(byBeat.get(n.beat) ?? []), n]));
  return [...byBeat.entries()].sort((a, b) => a[0] - b[0]).map(([beat, list]) => ({ beat, notes: list }));
}

const buildSteps = (tracks) =>
  groupSteps(Object.entries(tracks).flatMap(([hand, text]) => parseVoice(text, hand)));

// Importierte Stücke speichern Noten kompakt: [midi, beat, durCode, hand]. flats: Tonart mit Be-Vorzeichen.
const stepsFromNotes = (notes, flats = false) =>
  groupSteps(notes.map(([midi, beat, durCode, hand]) => ({
    midi, spell: flats ? FLAT_NAME_OF[midi % 12] ?? null : null, dur: DURATIONS[durCode], durCode, finger: null, hand, beat, dyn: null,
  })));

// Zufällige Viertelnoten aus einem Pool, nie zweimal derselbe Ton hintereinander.
function drillSteps({ pool, count, hand = "rh" }, random = Math.random) {
  const options = pool.map((token) => parseToken(token, hand));
  if (options.length < 2) throw new Error("Drill braucht mindestens zwei Töne");
  const picks = [];
  while (picks.length < count) {
    const pick = options[Math.floor(random() * options.length)];
    if (pick !== picks[picks.length - 1]) picks.push(pick);
  }
  return groupSteps(picks.map((n, i) => ({ ...n, dur: 1, durCode: "q", beat: i })));
}

const endBeat = (steps) => Math.max(...steps.flatMap((s) => s.notes.map((n) => s.beat + n.dur)));

const midiToFreq = (midi) => 440 * 2 ** ((midi - 69) / 12);
const freqToMidi = (freq) => Math.round(69 + 12 * Math.log2(freq / 440));

function rms(buf) {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

// YIN-Tonhöhenerkennung (de Cheveigné & Kawahara 2002). Liefert Hz oder 0.
function yin(buf, sampleRate, threshold = 0.15) {
  const maxTau = Math.min(buf.length >> 1, Math.floor(sampleRate / 50));
  const minTau = Math.floor(sampleRate / 2100);
  const diff = new Float32Array(maxTau);
  for (let tau = 1; tau < maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < maxTau; i++) {
      const d = buf[i] - buf[i + tau];
      sum += d * d;
    }
    diff[tau] = sum;
  }
  // kumulierte, normierte Differenz – macht den Algorithmus robust gegen Oktavfehler
  let running = 0;
  diff[0] = 1;
  for (let tau = 1; tau < maxTau; tau++) {
    running += diff[tau];
    diff[tau] = running ? (diff[tau] * tau) / running : 1;
  }
  let tau = minTau;
  while (tau < maxTau && diff[tau] >= threshold) tau++;
  if (tau >= maxTau) return 0;
  while (tau + 1 < maxTau && diff[tau + 1] < diff[tau]) tau++;
  // Parabel-Interpolation zwischen den Samples
  const a = diff[tau - 1];
  const b = diff[tau];
  const c = diff[tau + 1] ?? b;
  const curve = a - 2 * b + c;
  return sampleRate / (tau + (curve ? (a - c) / (2 * curve) : 0));
}

// 1 Stern fürs Schaffen, +1 für ≥ 90 % Treffer, +1 wenn ohne Hilfen gespielt.
function scoreRun(stepCount, errors, usedHelp) {
  const accuracy = stepCount / (stepCount + errors);
  return { accuracy, stars: 1 + (accuracy >= 0.9 ? 1 : 0) + (usedHelp ? 0 : 1) };
}

// Laut/leise: Anschlagstärke (MIDI-Velocity 1–127) gegen die einstellbare Grenze.
// Liefert null, wenn nichts zu prüfen ist (kein Zeichen oder keine Velocity, z. B. Mikrofon).
function dynamicFits(dyn, velocity, split) {
  if (!dyn || velocity == null) return null;
  const soft = ["pp", "p", "mp"].includes(dyn);
  return soft ? velocity < split : velocity >= split;
}

// ---------- Takt-Modus ----------

// Sucht die zeitlich nächste, noch unbewertete Note mit passender Tonhöhe innerhalb des Zeitfensters.
function judgeHit(notes, results, midi, time, windowMs, samePitchClass = false) {
  let best = -1;
  notes.forEach((n, i) => {
    const fits = n.midi === midi || (samePitchClass && n.midi % 12 === midi % 12);
    if (results[i] || !fits || Math.abs(time - n.time) > windowMs) return;
    if (best < 0 || Math.abs(time - n.time) < Math.abs(time - notes[best].time)) best = i;
  });
  return best < 0 ? null : { index: best, offset: time - notes[best].time };
}

function rateOffset(offsetMs) {
  const abs = Math.abs(offsetMs);
  return abs <= TIMING.perfect ? "perfekt" : abs <= TIMING.good ? "gut" : "knapp";
}

// Pünktlich (perfekt/gut) zählt voll, knapp halb; falsche Töne verschlechtern die Quote.
// "auto" = Ton der anderen Hand beim getrennten Üben – zählt nicht mit.
function rhythmScore(results, wrong) {
  const judged = results.filter((r) => r !== "auto");
  const count = (kind) => judged.filter((r) => r === kind).length;
  const counts = { perfekt: count("perfekt"), gut: count("gut"), knapp: count("knapp"), verpasst: count("verpasst") };
  const score = (counts.perfekt + counts.gut + counts.knapp * 0.5) / (judged.length + wrong);
  const stars = score >= 0.95 ? 3 : score >= 0.8 ? 2 : score >= 0.5 ? 1 : 0;
  return { score, stars, counts };
}

if (typeof module !== "undefined") {
  module.exports = {
    DURATIONS, DYNAMICS, DYN_LEVEL, TIMING, FLAT_NAME_OF, parseNote, octaveOf, pitchName, midiName, isBlack, meterBeats, staffStep,
    parseVoice, parseRests, restsOf, parseChordSymbols, voiceLength, groupSteps, buildSteps, stepsFromNotes, drillSteps, endBeat,
    midiToFreq, freqToMidi, rms, yin, scoreRun, dynamicFits, judgeHit, rateOffset, rhythmScore,
  };
}
