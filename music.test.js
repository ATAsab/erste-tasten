// Ausführen mit: node music.test.js
const assert = require("node:assert/strict");
const m = require("./music.js");
Object.assign(globalThis, m); // staff.js und midi.js nutzen die Musik-Funktionen wie im Browser global
const { staffSvg } = require("./staff.js");
const { parseMidiFile, midiToPiece } = require("./midi.js");
const { CHAPTERS, LESSON_SEE } = require("./lessons.js");
const { THEORY } = require("./theory.js");
const { PEOPLE, ERAS } = require("./history.js");
const { QUIZ } = require("./quiz.js");
const { GENRES, LIBRARY } = require("./library.js");
const { MUTOPIA_PIECES } = require("./library-mutopia.js");

// Notennamen (deutsch, H statt B, Be-Namen als Alias)
assert.equal(m.parseNote("C4"), 60);
assert.equal(m.parseNote("A4"), 69);
assert.equal(m.parseNote("H3"), 59);
assert.equal(m.parseNote("Es4"), m.parseNote("Dis4"));
assert.equal(m.midiName(61), "Cis4");
assert.throws(() => m.parseNote("X4"));

// Notensystem: Kreuz an der Taste darunter, Be am Stammton darüber
assert.deepEqual(m.staffStep(64), { step: 30, accidental: null }); // E4 = unterste Linie im Violinschlüssel
assert.deepEqual(m.staffStep(m.parseNote("Fis4")), { step: 31, accidental: "sharp" }); // auf der F-Position
assert.deepEqual(m.staffStep(m.parseNote("Es4"), "Es"), { step: 30, accidental: "flat" }); // auf der E-Position
assert.deepEqual(m.staffStep(m.parseNote("B4"), "B"), { step: 34, accidental: "flat" }); // B = H mit ♭

// Taktarten
assert.equal(m.meterBeats("4/4"), 4);
assert.equal(m.meterBeats("3/4"), 3);
assert.equal(m.meterBeats("6/8"), 3);
assert.equal(m.meterBeats("3/8"), 1.5);

// Schritte: beide Hände auf demselben Schlag werden zu einem Akkord-Schritt
const steps = m.buildSteps({ rh: "C4:q:1 D4:h E4:qd F4:e", lh: "C3:w" });
assert.deepEqual(steps.map((s) => s.beat), [0, 1, 3, 4.5]);
assert.equal(steps[0].notes.length, 2);
assert.equal(m.endBeat(steps), 5);

// Akkorde mit Fingern je Ton, Pausen, Dynamikzeichen
const voice = m.parseVoice("!p C3+E3+G3:h:531 R:q !f G4:q:5", "lh");
assert.deepEqual(voice.map((n) => [n.beat, n.finger, n.dyn]), [[0, 5, "p"], [0, 3, "p"], [0, 1, "p"], [3, 5, "f"]]);
assert.equal(m.voiceLength("!p C3+E3+G3:h:531 R:q !f G4:q:5"), 4);
assert.deepEqual(m.parseRests("C4:h R:q G4:q", "rh"), [{ beat: 2, dur: 1, durCode: "q", hand: "rh" }]);
assert.throws(() => m.parseVoice("!xyz C4", "rh"));

// Laut/leise
assert.equal(m.dynamicFits("p", 40, 64), true);
assert.equal(m.dynamicFits("p", 90, 64), false);
assert.equal(m.dynamicFits("f", 90, 64), true);
assert.equal(m.dynamicFits("f", null, 64), null); // Mikrofon/Maus: nicht bewertbar
assert.equal(m.dynamicFits(null, 90, 64), null);

// Drill: richtige Länge, nie zweimal derselbe Ton hintereinander
const drill = m.drillSteps({ pool: ["C4", "D4"], count: 10 });
assert.equal(drill.length, 10);
drill.slice(1).forEach((s, i) => assert.notEqual(s.notes[0].midi, drill[i].notes[0].midi));

// Tonhöhe: synthetischer klavierähnlicher Ton mit Obertönen → richtige Taste
const SR = 48000;
for (const midi of [48, 55, 60, 64, 69, 84]) {
  const f = m.midiToFreq(midi);
  const buf = Float32Array.from({ length: 2048 }, (_, i) =>
    [1, 2, 3, 4, 5, 6].reduce((sum, h) => sum + Math.sin((2 * Math.PI * f * h * i) / SR) / h, 0) * 0.3);
  assert.equal(m.freqToMidi(m.yin(buf, SR)), midi, `YIN erkennt ${m.midiName(midi)}`);
}
assert.equal(m.yin(new Float32Array(2048), SR), 0); // Stille
// Mikrofon-Anschlag: ausklingender Ton mit wandernder Tonhöhe zählt nicht, echter Anschlag schon
assert.equal(m.isMicOnset({ midi: 67, held: 60, level: 0.05, low: 0.045, sinceLastMs: 400 }), false, "Verklingen ≠ neuer Ton");
assert.equal(m.isMicOnset({ midi: 67, held: 60, level: 0.08, low: 0.04, sinceLastMs: 400 }), true, "anderer Ton mit Anschlag");
assert.equal(m.isMicOnset({ midi: 60, held: 60, level: 0.08, low: 0.04, sinceLastMs: 400 }), false, "gleicher Ton braucht stärkeren Sprung");
assert.equal(m.isMicOnset({ midi: 60, held: 60, level: 0.12, low: 0.04, sinceLastMs: 400 }), true, "gleicher Ton nochmal angeschlagen");
assert.equal(m.isMicOnset({ midi: 67, held: 60, level: 0.2, low: 0.01, sinceLastMs: 80 }), false, "zu kurz nach dem letzten Ton");

// Sterne (Schritt für Schritt)
assert.equal(m.scoreRun(10, 0, false).stars, 3);
assert.equal(m.scoreRun(10, 5, true).stars, 1);

// Takt-Modus: nächstgelegene offene Note, Zeitfenster, Bewertung
const timed = [{ midi: 60, time: 1000 }, { midi: 60, time: 1500 }, { midi: 62, time: 2000 }];
assert.deepEqual(m.judgeHit(timed, [null, null, null], 60, 1480, 200), { index: 1, offset: -20 });
assert.deepEqual(m.judgeHit(timed, ["gut", null, null], 60, 1100, 200), null);
assert.equal(m.judgeHit(timed, [null, null, null], 62, 1500, 200), null);
assert.equal(m.judgeHit(timed, [null, null, null], 74, 2010, 200), null);
assert.equal(m.judgeHit(timed, [null, null, null], 74, 2010, 200, true).index, 2);
assert.equal(m.rateOffset(-40), "perfekt");
assert.equal(m.rateOffset(100), "gut");
assert.equal(m.rateOffset(-190), "knapp");
assert.equal(m.rhythmScore(["perfekt", "gut", "gut", "perfekt"], 0).stars, 3);
assert.equal(m.rhythmScore(["perfekt", "knapp", "verpasst", "gut"], 1).stars, 1);
assert.equal(m.rhythmScore(["verpasst", "verpasst"], 0).stars, 0);

// Notenbild: jede Note bekommt genau einen Kopf; Balken, Pausen und Be erscheinen
const heads = (svg) => (svg.match(/class="head/g) ?? []).length;
const beamed = staffSvg(m.buildSteps({ rh: "C4:e D4:e E4:s F4:s G4:s A4:s R:h" }), "treble", "4/4", false, m.restsOf({ rh: "C4:e D4:e E4:s F4:s G4:s A4:s R:h" }));
assert.equal(heads(beamed.svg), 6);
assert.ok(beamed.svg.includes('class="beam"'), "Achtel werden mit Balken verbunden");
assert.ok(beamed.svg.includes('class="rest"'), "Halbe Pause wird gezeichnet");
assert.ok(staffSvg(m.buildSteps({ rh: "Es5:w" }), "treble").svg.includes("♭"));
assert.ok(beamed.xAt(0.5) > beamed.xAt(0) && beamed.xAt(1) > beamed.xAt(0.5), "x wächst mit der Zeit");

// MIDI-Import: kleine Datei bauen (C4 und E4 als Viertel, 120 BPM, 3/4) und zurücklesen
const vlq = (n) => (n < 128 ? [n] : [0x80 | (n >> 7), n & 0x7f]);
const events = [
  ...vlq(0), 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20, // Tempo 500000 µs = 120 BPM
  ...vlq(0), 0xff, 0x58, 0x04, 3, 2, 24, 8, // 3/4
  ...vlq(0), 0x90, 60, 90, ...vlq(480), 0x80, 60, 0,
  ...vlq(0), 0x90, 64, 70, ...vlq(480), 0x90, 64, 0, // Note-On mit Velocity 0 = Note-Off
  ...vlq(0), 0xff, 0x2f, 0x00,
];
const smf = new Uint8Array([
  0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0x01, 0xe0,
  0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, events.length, ...events,
]);
const parsed = parseMidiFile(smf.buffer);
assert.equal(parsed.tempo, 120);
assert.equal(parsed.meter, "3/4");
assert.deepEqual(parsed.notes.map((n) => [n.midi, n.start, n.end]), [[60, 0, 480], [64, 480, 960]]);
const piece = midiToPiece(parsed, "Test");
assert.deepEqual(piece.notes, [[60, 0, "q", "rh"], [64, 1, "q", "rh"]]);
assert.equal(piece.clef, "treble");
assert.throws(() => parseMidiFile(new Uint8Array([1, 2, 3]).buffer));

// MIDI-Import: Triolen, Be-Tonart (Es-Dur, 3 ♭) und vier Stimmen (Choralsatz) → obere zwei rechts
const smfOf = (tracks) => {
  const chunks = tracks.flatMap((t) => [0x4d, 0x54, 0x72, 0x6b, 0, 0, t.length >> 8, t.length & 0xff, ...t]);
  return new Uint8Array([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, tracks.length, 0x01, 0xe0, ...chunks]).buffer;
};
const noteEvents = (list) => [...list.flatMap(([midi, len]) => [...vlq(0), 0x90, midi, 80, ...vlq(len), 0x80, midi, 0]), 0, 0xff, 0x2f, 0];
const triplets = midiToPiece(parseMidiFile(smfOf([
  [0, 0xff, 0x59, 0x02, 0xfd, 0x00, ...noteEvents([[63, 160], [67, 160], [70, 160], [75, 480]])],
])), "Triole");
assert.deepEqual(triplets.notes.map((n) => [n[1], n[2]]), [[0, "te"], [1 / 3, "te"], [2 / 3, "te"], [1, "q"]]);
assert.equal(triplets.flats, true);
assert.equal(triplets.key, -3);

// Generalvorzeichen: In E-Dur (4 ♯) braucht Gis kein Zeichen, G bekommt ein Auflösungszeichen
const inE = staffSvg(m.buildSteps({ rh: "Gis4:q G4:q E4:h" }), "treble", "4/4", false, [], 4).svg;
assert.equal((inE.match(/class="acc key"/g) ?? []).length, 4, "vier Kreuze am Zeilenanfang");
assert.equal((inE.match(/class="acc"/g) ?? []).length, 1, "nur das G braucht ein Zeichen");
assert.ok(inE.includes("♮"));
assert.ok(staffSvg(m.stepsFromNotes(triplets.notes, true), "treble").svg.includes('class="tuplet"'), "Triole bekommt eine 3");
assert.equal(m.stepsFromNotes(triplets.notes, true)[0].notes[0].spell, "Es"); // Dis wird in Es-Dur als Es geschrieben
const chorale = midiToPiece(parseMidiFile(smfOf([
  noteEvents([[72, 480]]), noteEvents([[67, 480]]), noteEvents([[60, 480]]), noteEvents([[48, 480]]),
])), "Choral");
assert.deepEqual(chorale.notes.map((n) => [n[0], n[3]]), [[48, "lh"], [60, "lh"], [67, "rh"], [72, "rh"]]);

// Lehrplan: alles parsebar, jeder Takt passt zur Taktart, beide Hände gleich lang, Notenbild baut
const lessons = CHAPTERS.flatMap((c) => c.lessons);
const ids = new Set();
const checkTracks = (tracks, meter, where) => {
  const bar = m.meterBeats(meter);
  const lengths = Object.values(tracks).map((text) => {
    text.split("|").forEach((b, i) => assert.equal(m.voiceLength(b), bar, `${where}: Takt ${i + 1} („${b.trim()}“)`));
    return m.voiceLength(text);
  });
  assert.equal(new Set(lengths).size, 1, `${where}: Hände unterschiedlich lang`);
};
for (const lesson of lessons) {
  assert.ok(!ids.has(lesson.id), `doppelte id ${lesson.id}`);
  ids.add(lesson.id);
  if (lesson.drill) {
    m.drillSteps(lesson.drill);
    continue;
  }
  checkTracks(lesson.tracks, lesson.meter, lesson.id);
  if (lesson.clef) {
    const built = m.buildSteps(lesson.tracks);
    const svg = staffSvg(built, lesson.clef, lesson.meter, true, m.restsOf(lesson.tracks)).svg;
    assert.equal(heads(svg), built.reduce((n, s) => n + s.notes.length, 0), `${lesson.id}: Notenköpfe`);
  }
}

// Bibliothek: gültige Genres und Stufen, Verweise auf Lektionen existieren, Noten passen in die Taktart
const pieceIds = new Set();
for (const p of LIBRARY) {
  assert.ok(p.id.startsWith("s-") && !pieceIds.has(p.id), `Stück-id ${p.id}`);
  pieceIds.add(p.id);
  assert.ok(p.title && p.composer !== undefined, `${p.id}: Titel/Komponist`);
  assert.ok(p.genres.length && p.genres.every((g) => g in GENRES), `${p.id}: Genre`);
  assert.ok([1, 2, 3].includes(p.level), `${p.id}: Stufe`);
  if (p.lesson) {
    assert.ok(ids.has(p.lesson), `${p.id}: Lektion ${p.lesson} fehlt`);
    continue;
  }
  checkTracks(p.tracks, p.meter, p.id);
  staffSvg(m.buildSteps(p.tracks), p.clef, p.meter, true, m.restsOf(p.tracks));
}

// Akkordsymbole: gültige Namen, genau so lang wie das Stück
const withChords = [...lessons, ...LIBRARY].filter((x) => x.chords);
assert.ok(withChords.length >= 9, "Akkordsymbole in Kapitel 11 und den Balladen");
for (const x of withChords) {
  const syms = m.parseChordSymbols(x.chords);
  assert.ok(syms.every((c) => /^[A-H](is|es)?m?7?$/.test(c.name)), `${x.id}: Akkordname`);
  const tracks = x.tracks ?? lessons.find((l) => l.id === x.lesson).tracks;
  assert.equal(m.voiceLength(x.chords.replace(/[A-H](is|es)?m?7?:/g, "C4:")), m.voiceLength(Object.values(tracks)[0]), `${x.id}: Akkordsymbole so lang wie das Stück`);
}

// Tonleitern & Technik: erzeugte Übungen sind gültig, Fingersatz an jeder Note, richtige Vorzeichen
const { TECHNIK_PIECES } = require("./technik.js");
for (const p of TECHNIK_PIECES) {
  assert.ok(p.id.startsWith("t-") && !pieceIds.has(p.id), `Technik-id ${p.id}`);
  pieceIds.add(p.id);
  assert.ok(p.genres.includes("technik") && [1, 2, 3].includes(p.level) && p.about, `${p.id}: Genre/Stufe/Text`);
  checkTracks(p.tracks, p.meter, p.id);
  const built = m.buildSteps(p.tracks);
  assert.ok(built.every((s) => s.notes.every((n) => n.finger)), `${p.id}: Fingersatz fehlt`);
  assert.equal(heads(staffSvg(built, p.clef, p.meter, true, [], p.key).svg), built.reduce((n, s) => n + s.notes.length, 0), `${p.id}: Notenköpfe`);
}
const scale = (id) => TECHNIK_PIECES.find((p) => p.id === id);
assert.ok(TECHNIK_PIECES.filter((p) => p.id.startsWith("t-scale-")).length >= 9, "mindestens 9 Tonleitern");
assert.match(scale("t-scale-g").tracks.rh, /^G4:q:1 A4:q:2 H4:q:3 C5:q:1 \| D5:q:2 E5:q:3 Fis5:q:4 G5:q:5 \|/, "G-Dur rechts mit Daumenuntersatz");
assert.match(scale("t-scale-f").tracks.rh, /B4:q:4/, "F-Dur: B mit 4. Finger");
assert.match(scale("t-scale-dm").tracks.rh, /B4.*Cis5/, "d-Moll harmonisch: B und Cis");
assert.match(scale("t-scale-g").tracks.lh, /^G2:q:5/, "linke Hand tief genug für den Bassschlüssel");

// Stücke aus dem Internet (Mutopia): Quelle, Lizenz, gültige Noten, Notenbild mit einem Kopf je Note
for (const p of MUTOPIA_PIECES) {
  assert.ok(p.id.startsWith("m-") && !pieceIds.has(p.id), `Mutopia-id ${p.id}`);
  pieceIds.add(p.id);
  assert.ok(p.source?.url.startsWith("https://www.mutopiaproject.org/") && p.source.license, `${p.id}: Quelle/Lizenz`);
  if (p.source.license.startsWith("CC")) assert.ok(p.source.typesetter, `${p.id}: CC-Lizenz braucht Notensatz-Angabe`);
  assert.ok(p.genres.every((g) => g in GENRES) && [1, 2, 3].includes(p.level), `${p.id}: Genre/Stufe`);
  assert.ok(p.notes.every(([midi, beat, dur, hand]) => midi > 20 && midi < 109 && beat >= 0 && dur in m.DURATIONS && ["rh", "lh"].includes(hand)), `${p.id}: Noten`);
  const built = m.stepsFromNotes(p.notes, p.flats);
  assert.equal(heads(staffSvg(built, p.clef, p.meter, true).svg), p.notes.length, `${p.id}: Notenköpfe`);
}

// Fortschritt: Level, Serie, Wiederholungsplan, Wochenminuten, Abzeichen
const st = require("./stats.js");
assert.equal(st.levelInfo(0).level, 1);
assert.equal(st.levelInfo(99).level, 1);
assert.deepEqual([st.levelInfo(100).level, st.levelInfo(100).into, st.levelInfo(100).needed], [2, 0, 200]);
assert.equal(st.levelInfo(1000).level, 5);
assert.equal(st.levelInfo(1000).title, "Melodiemacher");
assert.equal(st.addDays("2026-12-31", 1), "2027-01-01");
assert.equal(st.addDays("2026-03-29", -1), "2026-03-28"); // Zeitumstellung
const goal = 15 * 60000;
const d = (ms) => ({ ms, notes: 0, xp: 0, runs: 0 });
const days = { "2026-10-07": d(goal), "2026-10-08": d(goal + 1), "2026-10-09": d(goal), "2026-10-10": d(60000) };
assert.equal(st.streakOf(days, goal, "2026-10-10"), 3, "heute noch nicht geschafft → Serie von gestern zählt");
assert.equal(st.streakOf({ ...days, "2026-10-10": d(goal) }, goal, "2026-10-10"), 4);
assert.equal(st.streakOf(days, goal, "2026-10-12"), 0, "Lücke → Serie vorbei");
assert.equal(st.bestStreak({ ...days, "2026-10-01": d(goal) }, goal), 3);
assert.deepEqual(st.totals(days), { ms: 3 * goal + 1 + 60000, notes: 0, xp: 0, runs: 0 });
const r1 = st.scheduleReview(undefined, true, "2026-10-10");
assert.deepEqual([r1.stage, r1.due], [0, "2026-10-11"]);
const r2 = st.scheduleReview(r1, true, "2026-10-11");
assert.deepEqual([r2.stage, r2.due, r2.reviews], [1, "2026-10-14", 1]);
assert.deepEqual(st.scheduleReview(r2, true, "2026-10-12").stage, 1, "zu früh geübt → keine Stufe vor");
assert.deepEqual([st.scheduleReview(r2, false, "2026-10-14").stage, st.scheduleReview(r2, false, "2026-10-14").due], [0, "2026-10-15"]);
assert.equal(st.scheduleReview(undefined, false, "2026-10-10"), null, "Misserfolg ohne Eintrag → nicht in den Plan");
assert.deepEqual(st.dueReviews({ a: r1, b: r2 }, "2026-10-11").map((x) => x.id), ["a"]);
const weeks = st.weeklyMinutes({ "2026-10-05": d(600000), "2026-10-11": d(300000), "2026-10-04": d(60000) }, "2026-10-11", 2);
assert.deepEqual(weeks.map((w) => [w.start, w.minutes]), [["2026-09-28", 1], ["2026-10-05", 15]]); // Mo–So
assert.equal(new Set(st.BADGES.map((b) => b.id)).size, st.BADGES.length, "Abzeichen-ids eindeutig");

// Monatsrückblick: Summen nur aus dem Monat, aktive Tage, längste Serie, bester Tag
const monthData = { "2026-10-01": d(600000), "2026-10-02": d(1200000), "2026-10-03": d(0), "2026-10-05": d(300000), "2026-09-30": d(900000) };
const october = st.monthSummary(monthData, "2026-10", 900000);
assert.deepEqual([october.minutes, october.activeDays, october.goalDays, october.longestRun, october.bestDay], [35, 3, 1, 2, { key: "2026-10-02", minutes: 20 }]);
assert.equal(st.monthSummary(monthData, "2026-08", 900000).bestDay, null, "leerer Monat");
assert.deepEqual([st.addMonths("2026-01", -1), st.addMonths("2026-12", 1), st.daysInMonth("2028-02")], ["2025-12", "2027-01", 29]);

// Wiederholen: Ausschnitt Takt 2–3 eines 4/4-Stücks beginnt bei Schlag 0
const { applyRange } = require("./loop.js");
const cut = applyRange(m.buildSteps({ rh: "C4:w | D4:h E4:h | F4:w | G4:w" }), [], "4/4", { from: 2, to: 3 });
assert.deepEqual(cut.steps.map((s) => [s.beat, m.midiName(s.notes[0].midi)]), [[0, "D4"], [2, "E4"], [4, "F4"]]);

// Fehlerstellen: alte Fehler verblassen nur in den gespielten Takten, Nachbartakte werden zusammengefasst
let errs = st.commitErrors({}, { 3: 2, 4: 1, 9: 1 });
assert.deepEqual(st.findHotspots(errs), [{ from: 3, to: 4, score: 3 }], "Takt 9 allein ist noch keine Fehlerstelle");
errs = st.commitErrors(errs, {}, { from: 3, to: 4 }); // sauber über Takt 3–4
assert.deepEqual(errs, { 3: 1.2, 4: 0.6, 9: 1 });
errs = st.commitErrors(st.commitErrors(errs, {}), {}); // zwei saubere Durchgänge über das ganze Stück
assert.deepEqual(errs, {}, "saubere Durchgänge lassen die Stellen verschwinden");
assert.deepEqual(st.findHotspots({ 1: 1, 2: 5, 3: 4, 4: 3, 5: 3, 6: 3, 10: 2 }).map((s) => [s.from, s.to]), [[2, 5], [6, 6], [10, 10]], "höchstens 4 Takte je Stelle");

// Akkordsymbole über den Noten: Schlag aus der Dauer, "R" = Lücke ohne Symbol
assert.deepEqual(m.parseChordSymbols("C:w | Am:h R:q G7:q"), [{ beat: 0, name: "C" }, { beat: 4, name: "Am" }, { beat: 7, name: "G7" }]);
assert.ok(staffSvg(m.buildSteps({ rh: "C4:w" }), "treble", "4/4", false, [], 0, 1, [{ beat: 0, name: "Am" }]).svg.includes('class="chord-sym"'));

// Hände getrennt: eigene Töne finden, Schritte nur der anderen Hand überspringen, Begleitung relativ zum Schritt
const handsLib = require("./hands.js");
const twoHands = m.buildSteps({ rh: "E4:q F4:q R:h", lh: "C3:h G2:q C3:q" }); // Schläge 0, 1, 2, 3
assert.deepEqual(twoHands.map((s) => handsLib.ownNotes(s, "rh").length), [1, 1, 0, 0]);
assert.equal(handsLib.nextOwnStep(twoHands, 2, "rh"), 4, "rechts: Schläge 2 und 3 gehören nur der linken Hand");
assert.equal(handsLib.nextOwnStep(twoHands, 1, "lh"), 2);
assert.equal(handsLib.nextOwnStep(twoHands, 0, "both"), 0);
assert.deepEqual(handsLib.accompanimentOf(twoHands, 1, 4, "rh").map((s) => [s.beat, s.notes.map((n) => m.midiName(n.midi))]),
  [[1, ["G2"]], [2, ["C3"]]], "Begleitung startet beim gespielten Schritt");
assert.deepEqual(handsLib.accompanimentOf(twoHands, 0, 1, "rh").map((s) => s.beat), [0], "gleichzeitige Töne klingen sofort mit");
assert.equal(m.rhythmScore(["perfekt", "auto", "auto", "gut"], 0).stars, 3, "Töne der anderen Hand zählen nicht");

// Aufnahme-Auswertung: Abgleich mit den Noten, Tempo, Schwankung, langsamster Takt
const { analyzeRecording } = require("./auswertung.js");
const scaleUp = [60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60, 62].map((midi, beat) => ({ midi, beat }));
const at60 = scaleUp.map((n) => ({ midi: n.midi, start: 500 + n.beat * 1000 }));
let report = analyzeRecording(scaleUp, at60, { barBeats: 4 });
assert.deepEqual([report.matched, report.missing, report.extra, Math.round(report.bpm), report.unevenMs, report.worst], [16, 0, 0, 60, 0, null]);
assert.deepEqual(report.bars.map((b) => b.bar), [1, 2, 3], "Tempo je Takt bis zum vorletzten Takt");
const slowBar3 = scaleUp.map((n) => ({ midi: n.midi, start: n.beat < 8 ? n.beat * 1000 : n.beat < 12 ? 8000 + (n.beat - 8) * 1500 : 14000 + (n.beat - 12) * 1000 }));
report = analyzeRecording(scaleUp, slowBar3, { barBeats: 4, firstBar: 5 });
assert.equal(report.worst.bar, 7, "Takt 3 des Ausschnitts = Takt 7 im Stück");
assert.ok(report.worst.deviation < -0.15, "dort deutlich langsamer");
// Ab Takt 3 durchgehend langsamer: die Stelle ist der Übergang in Takt 3, nicht der „zu schnelle“ Anfang
const slowerFrom3 = scaleUp.map((n) => ({ midi: n.midi, start: n.beat < 8 ? n.beat * 700 : 5600 + (n.beat - 8) * 1100 }));
report = analyzeRecording(scaleUp, slowerFrom3, { barBeats: 4 });
assert.equal(report.worst.bar, 3, "Tempo kippt in Takt 3");
assert.ok(report.drift < -0.15, "wird insgesamt langsamer");
assert.ok(Math.abs(analyzeRecording(scaleUp, at60, { barBeats: 4 }).drift) < 0.01, "gleichmäßig: kein Abdriften");
const sloppy = [...at60.slice(0, 3), { midi: 61, start: 3200 }, ...at60.slice(3, 5), ...at60.slice(6)];
report = analyzeRecording(scaleUp, sloppy, { barBeats: 4 });
assert.deepEqual([report.matched, report.extra, report.missing], [15, 1, 1], "ein Ton zu viel, einer fehlt");
const chord = [48, 52, 55].map((midi) => ({ midi, beat: 0 }));
const chordPlayed = [{ midi: 55, start: 0 }, { midi: 48, start: 12 }, { midi: 52, start: 25 }];
assert.equal(analyzeRecording(chord, chordPlayed).matched, 3, "Akkordtöne in beliebiger Reihenfolge");
assert.ok(analyzeRecording(chord, chordPlayed).tooShort, "zu wenig für eine Tempo-Auswertung");

// Neue Abzeichen: Notenjagd und Sicherung
const badgeIds = (state) => st.newBadges({
  progress: {}, days: {}, totals: st.totals({}), best: 0, review: {}, quiz: {}, read: {}, recordings: 0, theoryCount: 99, historyCount: 99,
  chapterDone: () => false, courseDone: () => false, hunt: {}, meta: {}, ...state,
}, {}).map((b) => b.id);
assert.deepEqual(badgeIds({}), []);
assert.deepEqual(badgeIds({ hunt: { leicht: { best: 31 } }, meta: { lastBackup: "2026-10-10" } }), ["notenjaeger", "gesichert"]);
assert.ok(badgeIds({ hunt: { mittel: { best: 30 } } }).includes("blitzleser"));

// Notenjagd: Noten aus der Stufe, nie zweimal dieselbe, ♭ richtig notiert
const hunt = require("./hunt.js");
let seed = 7;
const seeded = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (const [id, level] of Object.entries(hunt.HUNT_LEVELS)) {
  if (level.weak) continue; // „Schwächen“ zieht aus der eigenen Statistik, siehe unten
  let prev = null;
  for (let i = 0; i < 300; i++) {
    const n = hunt.pickHuntNote(id, prev, seeded);
    assert.ok(level.pools.find((p) => p.clef === n.clef).notes.includes(n.midi), `${id}: Note außerhalb der Stufe`);
    assert.ok(!(prev && prev.midi === n.midi && prev.clef === n.clef), `${id}: dieselbe Note zweimal`);
    if (id !== "schwer") assert.ok(!m.isBlack(n.midi), `${id}: nur weiße Tasten`);
    if (n.spell) assert.equal(m.staffStep(n.midi, n.spell).accidental, "flat");
    assert.ok(staffSvg([{ beat: 0, notes: [{ midi: n.midi, spell: n.spell, dur: 4, durCode: "w", hand: "rh", beat: 0 }] }], n.clef).svg.includes("note"));
    prev = n;
  }
}
assert.equal(hunt.HUNT_LEVELS.leicht.pools[0].notes.length, 8);
assert.ok(hunt.huntMatches({ midi: 60 }, 60, "midi") && !hunt.huntMatches({ midi: 60 }, 72, "midi"), "USB-Keyboard: genaue Oktave");
assert.ok(hunt.huntMatches({ midi: 60 }, 72, "mic") && hunt.huntMatches({ midi: 60 }, 48, "taste"), "Mikrofon/Tasten: Tonname reicht");
assert.deepEqual([0, 25, 100].map((s) => hunt.huntXp(s, false)), [0, 13, 30]);
assert.deepEqual([hunt.huntXp(25, true), hunt.huntXp(0, true)], [23, 0]);
assert.equal(hunt.huntName({ midi: 63, spell: "Es" }), "Es4");

// Notenjagd-Schwächen: Treffer/Fehler je Note, schlimmste zuerst, gewichtet gezogen
let huntStats = {};
const f3 = { midi: 53, clef: "bass" };
const e4 = { midi: 64, clef: "treble" };
[[f3, 9], [f3, 9], [f3, "okt"], [f3, null], [e4, null], [e4, null], [e4, 5], [{ midi: 67, clef: "treble" }, null]]
  .forEach(([note, played]) => { huntStats = hunt.countHuntNote(huntStats, note, played); });
assert.deepEqual(huntStats["bass:53"], { hit: 1, miss: 3, as: { 9: 2, okt: 1 } });
const weak = hunt.weakNotes(huntStats);
assert.deepEqual(weak.map((w) => w.key), ["bass:53", "treble:64"], "nur Noten mit Fehlern, schlimmste zuerst");
assert.equal(weak[0].top, "9", "F3 wird meist als A gespielt");
const picks = Array.from({ length: 400 }, () => hunt.pickHuntNote("schwaechen", null, seeded, weak));
assert.ok(picks.every((n) => weak.some((w) => w.midi === n.midi && w.clef === n.clef)), "nur Schwächen");
assert.ok(picks.filter((n) => n.midi === 53).length > picks.filter((n) => n.midi === 64).length, "die schwächste Note kommt öfter");
let prevPick = null;
for (let i = 0; i < 100; i++) {
  const n = hunt.pickHuntNote("schwaechen", prevPick, seeded, weak);
  assert.ok(!(prevPick && prevPick.midi === n.midi && prevPick.clef === n.clef), "Schwächen: nie zweimal dieselbe");
  prevPick = n;
}

// Sicherung: echte Daten gehen durch, kaputte oder fremde Dateien werden abgelehnt
const { checkBackup } = require("./backup.js");
const realData = {
  "et-settings": { view: "both", taktTempo: 0.7, metronome: true }, "et-last": "l1",
  "et-progress": { [lessons[0].id]: { stars: 3, takt: 2 } }, "et-read": { "theorie/noten": true }, "et-quiz": { "theorie/noten": { right: 4, total: 5 } },
  "et-rec": { l1: { date: 1760000000000, events: [[1, 60, 80, -3], [0, 60, 0, 350]] }, l2: { date: 1, events: [], range: { from: 2, to: 4 }, hands: "rh" } }, "et-own": [piece, triplets, chorale],
  "et-days": { "2026-10-10": { ms: 900000, notes: 300, xp: 120, runs: 4 } }, "et-review": { l1: r2 }, "et-badges": { "erster-ton": "2026-10-10" },
  "et-errors": { l1: { 3: 1.2 } }, "et-hunt": { leicht: { best: 21, runs: 2, total: 35, last: 21, date: "2026-10-10" } }, "et-meta": { lastBackup: "2026-10-10" },
  "et-hunt-notes": { "bass:53": { hit: 1, miss: 3, as: { 9: 2, okt: 1 } } }, "et-learned": { l1: "2026-10-10" },
};
const backupOf = (data, extra = {}) => ({ app: "erste-tasten", version: 1, created: "2026-10-10T12:00:00.000Z", data, ...extra });
assert.deepEqual(checkBackup(backupOf({ ...realData, "fremd": 1 })).data, realData, "unbekannte Teile werden ignoriert");
const rejects = (file, why) => assert.throws(() => checkBackup(file), Error, why);
rejects({ data: realData }, "fremde Datei");
rejects(backupOf(realData, { version: 2 }), "neuere Version");
rejects(backupOf({}), "leer");
rejects(backupOf({ "et-days": { gestern: { ms: 1 } } }), "Datum kaputt");
rejects(backupOf({ "et-progress": { l1: { stars: 9 } } }), "Sterne außerhalb 0–3");
rejects(backupOf({ "et-own": [{ ...piece, about: "<img src=x onerror=alert(1)>" }] }), "HTML in eigenem Stück");
rejects(backupOf({ "et-own": [{ ...piece, notes: [[60, 0, "zz", "rh"]] }] }), "unbekannte Dauer");
rejects(backupOf({ "et-settings": { view: { evil: true } } }), "Einstellung kein einfacher Wert");
rejects(backupOf({ "et-hunt-notes": { "<b>:1": { hit: 1, miss: 0, as: {} } } }), "Notenjagd-Statistik mit fremdem Schlüssel");

// Theorie & Geschichte: Blöcke gültig, Noten parsebar, alle Verweise lösen auf
const known = new Set([
  ...lessons.map((l) => `ueben/${l.id}`),
  ...THEORY.map((a) => `theorie/${a.id}`),
  ...PEOPLE.map((p) => `geschichte/${p.id}`),
]);
const checkRefs = (refs = [], where) => refs.forEach((r) => assert.ok(known.has(r), `${where}: Verweis ${r} fehlt`));
Object.entries(LESSON_SEE).forEach(([id, refs]) => {
  assert.ok(ids.has(id), `LESSON_SEE: unbekannte Lektion ${id}`);
  checkRefs(refs, id);
});
for (const article of [...THEORY, ...PEOPLE]) {
  checkRefs(article.see, article.id);
  if (article.era) assert.ok(article.era in ERAS, `${article.id}: unbekannte Epoche`);
  for (const block of article.body) {
    if (block.staff) checkTracks(block.staff.tracks, block.staff.meter, `${article.id} (Notenbeispiel)`);
    (block.play ?? []).forEach((clip) => assert.ok(m.parseVoice(clip.notes, "rh").length, `${article.id}: ${clip.label}`));
    const kinds = ["h", "list", "tip", "table", "staff", "play"];
    assert.ok(typeof block === "string" || kinds.some((k) => k in block), `${article.id}: unbekannter Block`);
  }
}

// Quiz: gehört zu einem Artikel, eindeutige Antworten, Erklärung vorhanden, Noten parsebar
let questions = 0;
for (const [key, items] of Object.entries(QUIZ)) {
  assert.ok(known.has(key) && !key.startsWith("ueben/"), `Quiz für unbekannten Artikel ${key}`);
  for (const item of items) {
    questions++;
    assert.ok(item.q && item.explain, `${key}: Frage oder Erklärung fehlt`);
    assert.ok(item.options.length >= 2, `${key}: „${item.q}“ braucht mindestens zwei Antworten`);
    assert.equal(new Set(item.options).size, item.options.length, `${key}: doppelte Antwort bei „${item.q}“`);
    if (item.play) assert.ok(m.parseVoice(item.play, "rh").length, `${key}: Hörbeispiel`);
    if (item.staff) assert.ok(m.parseVoice(item.staff.notes, "rh").length, `${key}: Notenbeispiel`);
  }
}
[...THEORY.map((a) => `theorie/${a.id}`), ...PEOPLE.map((p) => `geschichte/${p.id}`)]
  .forEach((key) => assert.ok(QUIZ[key], `${key}: kein Quiz`));

console.log(`ok – ${ids.size} Lektionen, ${LIBRARY.length} eigene + ${MUTOPIA_PIECES.length} Mutopia-Stücke, ${THEORY.length} Theorie-Themen, ` +
  `${PEOPLE.length} Geschichtskapitel, ${questions} Quizfragen geprüft`);
