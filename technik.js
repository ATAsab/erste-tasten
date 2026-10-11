// Tonleitern & Technik: Übungen werden aus Tonart und Fingersatz erzeugt statt von Hand notiert.
const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12];
const HARMONIC_MINOR = [0, 2, 3, 5, 7, 8, 11, 12]; // 7. Stufe erhöht
const C_MAJOR = [0, 2, 4, 5, 7, 9, 11];
const SCALE_FINGERS = {
  normal: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
  f: { rh: [1, 2, 3, 4, 1, 2, 3, 4], lh: [5, 4, 3, 2, 1, 3, 2, 1] }, // F-Dur: rechts kein Daumen auf dem B
};
const SCALES = [
  { id: "c", title: "C-Dur-Tonleiter", tonic: "C4", steps: MAJOR, key: 0, level: 1 },
  { id: "g", title: "G-Dur-Tonleiter", tonic: "G4", steps: MAJOR, key: 1, level: 1 },
  { id: "f", title: "F-Dur-Tonleiter", tonic: "F4", steps: MAJOR, key: -1, level: 1, fingers: "f" },
  { id: "am", title: "a-Moll-Tonleiter (harmonisch)", tonic: "A4", steps: HARMONIC_MINOR, key: 0, level: 1 },
  { id: "d", title: "D-Dur-Tonleiter", tonic: "D4", steps: MAJOR, key: 2, level: 2 },
  { id: "a", title: "A-Dur-Tonleiter", tonic: "A4", steps: MAJOR, key: 3, level: 2 },
  { id: "e", title: "E-Dur-Tonleiter", tonic: "E4", steps: MAJOR, key: 4, level: 2 },
  { id: "em", title: "e-Moll-Tonleiter (harmonisch)", tonic: "E4", steps: HARMONIC_MINOR, key: 1, level: 2 },
  { id: "dm", title: "d-Moll-Tonleiter (harmonisch)", tonic: "D4", steps: HARMONIC_MINOR, key: -1, level: 2 },
];
const PRACTICE_HINT = "So übst du: erst jede Hand einzeln (oben „Rechts“ / „Links“), dann beide zusammen. Danach „Im Takt“ mit „Wiederholen 5×“ und „Tempo steigern“ unter ⚙ Anpassen – so wird es Runde für Runde flüssiger.";

// Taktstriche nach je `barBeats` Schlägen – die Tests prüfen jeden Takt einzeln.
function barred(tokens, barBeats = 4) {
  let beat = 0;
  return tokens.map((token, i) => {
    beat += DURATIONS[token.split(":")[1]];
    return Math.abs(beat % barBeats) < 1e-6 && i < tokens.length - 1 ? `${token} |` : token;
  }).join(" ");
}

// Schwarze Tasten in Be-Tonarten als Be (B, Es …) – nur der Leitton unter dem Grundton bleibt ein Kreuz (d-Moll: Cis).
function scaleNoteName(midi, scale) {
  const leading = (parseNote(scale.tonic) + 11) % 12;
  const flat = scale.key < 0 && isBlack(midi) && midi % 12 !== leading;
  return flat ? `${FLAT_NAME_OF[midi % 12]}${octaveOf(midi)}` : midiName(midi);
}

// Eine Oktave hinauf (Viertel) und hinunter, Grundton am Ende als Halbe.
function scaleTrack(scale, hand, start) {
  const fingers = SCALE_FINGERS[scale.fingers ?? "normal"][hand];
  const notes = scale.steps.map((step) => start + step);
  const token = (i, dur) => `${scaleNoteName(notes[i], scale)}:${dur}:${fingers[i]}`;
  return barred([...notes.map((_, i) => token(i, "q")), ...[6, 5, 4, 3, 2, 1].map((i) => token(i, "q")), token(0, "h")]);
}

function scaleAbout(scale) {
  const minor = scale.steps === HARMONIC_MINOR
    ? "Harmonisch heißt: Der 7. Ton ist um einen Halbton erhöht – das gibt den typischen, leicht orientalischen Moll-Klang. "
    : "";
  const fingering = scale.fingers === "f"
    ? "Achtung Fingersatz: Rechts kommt der Daumen erst nach dem 4. Finger – auf dem B nie den Daumen. "
    : "Rechts schlüpft der Daumen nach dem 3. Finger unter der Hand durch, links greift der 3. Finger über den Daumen. ";
  return `Eine Oktave hinauf und hinunter, beide Hände parallel. ${minor}${fingering}${PRACTICE_HINT}`;
}

const scalePieces = SCALES.map((scale) => {
  const rh = parseNote(scale.tonic);
  const lh = rh > 62 ? rh - 24 : rh - 12; // links tief genug, damit es im Bassschlüssel ohne viele Hilfslinien bleibt
  return {
    id: `t-scale-${scale.id}`, title: scale.title, composer: "Technik-Übung", year: "", genres: ["technik"], level: scale.level,
    meter: "4/4", tempo: 60, clef: "grand", key: scale.key, about: scaleAbout(scale),
    tracks: { rh: scaleTrack(scale, "rh", rh), lh: scaleTrack(scale, "lh", lh) },
  };
});

// Hanon Nr. 1 (1873, gemeinfrei): Muster 1-3-4-5-6-5-4-3 auf jeder Stufe von C-Dur, eine Oktave aufwärts.
const degreeOf = (base, d) => base + Math.floor(d / 7) * 12 + C_MAJOR[d % 7];
function hanonTrack(base, fingers, endFinger) {
  const groups = Array.from({ length: 7 }, (_, g) =>
    [0, 2, 3, 4, 5, 4, 3, 2].map((offset, i) => `${midiName(degreeOf(base, g + offset))}:e:${fingers[i]}`));
  return barred([...groups.flat(), `${midiName(degreeOf(base, 7))}:w:${endFinger}`]);
}

const EXERCISES = [
  {
    id: "t-fuenf-finger", title: "Fünf-Finger-Übung", composer: "Technik-Übung", year: "", genres: ["technik"], level: 1,
    meter: "4/4", tempo: 80, clef: "grand", key: 0,
    about: `Jeder Finger hat seine eigene Taste – beide Hände spiegeln sich. Halte die Hand rund und locker, die Finger bleiben nah an den Tasten. ${PRACTICE_HINT}`,
    tracks: {
      rh: "C4:q:1 D4:q:2 E4:q:3 F4:q:4 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:q:1 E4:q:3 D4:q:2 F4:q:4 | E4:q:3 G4:q:5 C4:h:1",
      lh: "C3:q:5 D3:q:4 E3:q:3 F3:q:2 | G3:q:1 F3:q:2 E3:q:3 D3:q:4 | C3:q:5 E3:q:3 D3:q:4 F3:q:2 | E3:q:3 G3:q:1 C3:h:5",
    },
  },
  {
    id: "t-daumen", title: "Daumenuntersatz", composer: "Technik-Übung", year: "", genres: ["technik"], level: 1,
    meter: "4/4", tempo: 70, clef: "treble", key: 0,
    about: "Die Vorübung für jede Tonleiter: Nach dem E schlüpft der Daumen unter der Hand durch aufs F – ohne dass der Arm mitwackelt. Abwärts greift der 3. Finger über den Daumen.",
    tracks: { rh: "C4:q:1 D4:q:2 E4:q:3 F4:q:1 | E4:q:3 D4:q:2 C4:h:1 | C4:q:1 D4:q:2 E4:q:3 F4:q:1 | G4:q:2 F4:q:1 E4:q:3 D4:q:2 | C4:w:1" },
  },
  {
    id: "t-hanon-1", title: "Hanon Nr. 1", composer: "Charles-Louis Hanon", year: 1873, genres: ["technik"], level: 2,
    meter: "4/4", tempo: 60, clef: "grand", key: 0,
    about: `Aus „Der Klavier-Virtuose“ – seit 150 Jahren die bekannteste Fingerübung. Dasselbe Muster wandert Stufe für Stufe nach oben und stärkt besonders die Finger 3, 4 und 5. Spiel jeden Ton gleich laut. ${PRACTICE_HINT}`,
    tracks: { rh: hanonTrack(60, [1, 2, 3, 4, 5, 4, 3, 2], 1), lh: hanonTrack(48, [5, 4, 3, 2, 1, 2, 3, 4], 5) },
  },
];

const TECHNIK_PIECES = [...EXERCISES, ...scalePieces];

if (typeof module !== "undefined") module.exports = { TECHNIK_PIECES };
