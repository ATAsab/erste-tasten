// MIDI-Import: liest Standard-MIDI-Dateien (Typ 0 und 1) und macht daraus ein übbares Stück.
// Nutzt meterBeats/DURATIONS aus music.js (im Browser global, im Test über globalThis).
const MAX_IMPORT_NOTES = 4000;
const DRUM_CHANNEL = 9;

function readVarLen(bytes, pos) {
  let value = 0;
  let byte;
  do {
    byte = bytes[pos++];
    value = (value << 7) | (byte & 0x7f);
  } while (byte & 0x80);
  return [value, pos];
}

/** @returns {{ division:number, tempo:number, meter:string, notes:{midi,start,end,velocity,track}[] }} */
function parseMidiFile(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const tag = (p) => String.fromCharCode(...bytes.slice(p, p + 4));
  if (bytes.length < 14 || tag(0) !== "MThd") throw new Error("Das ist keine MIDI-Datei.");
  const trackCount = view.getUint16(10);
  const division = view.getUint16(12);
  if (division & 0x8000) throw new Error("Diese MIDI-Zeitbasis (SMPTE) wird nicht unterstützt.");
  let pos = 8 + view.getUint32(4);
  let tempo = null;
  let meter = null;
  let key = null; // Tonart: Anzahl Vorzeichen, + = Kreuze, − = Be
  const notes = [];
  for (let track = 0; track < trackCount && pos + 8 <= bytes.length; track++) {
    if (tag(pos) !== "MTrk") throw new Error("Die MIDI-Datei ist beschädigt.");
    const end = Math.min(bytes.length, pos + 8 + view.getUint32(pos + 4));
    let p = pos + 8;
    let tick = 0;
    let status = 0;
    const open = new Map();
    while (p < end) {
      let delta;
      [delta, p] = readVarLen(bytes, p);
      tick += delta;
      const byte = bytes[p];
      if (byte === 0xff) { // Meta-Ereignis: Tempo, Taktart, …
        const type = bytes[p + 1];
        let length;
        [length, p] = readVarLen(bytes, p + 2);
        if (type === 0x51 && tempo === null) tempo = 60e6 / ((bytes[p] << 16) | (bytes[p + 1] << 8) | bytes[p + 2]);
        if (type === 0x58 && meter === null) meter = `${bytes[p]}/${2 ** bytes[p + 1]}`;
        if (type === 0x59 && key === null) key = (bytes[p] << 24) >> 24; // Vorzeichen als signiertes Byte
        p += length;
        continue;
      }
      if (byte === 0xf0 || byte === 0xf7) { // SysEx überspringen
        let length;
        [length, p] = readVarLen(bytes, p + 1);
        p += length;
        continue;
      }
      if (byte & 0x80) { status = byte; p++; } // sonst „running status“: letzter Status gilt weiter
      const type = status & 0xf0;
      const channel = status & 0x0f;
      const [d1, d2] = [bytes[p], bytes[p + 1]];
      p += type === 0xc0 || type === 0xd0 ? 1 : 2;
      if (channel === DRUM_CHANNEL) continue;
      const slot = `${channel}:${d1}`;
      if (type === 0x90 && d2 > 0) open.set(slot, { midi: d1, start: tick, velocity: d2, track });
      else if (type === 0x80 || type === 0x90) {
        const note = open.get(slot);
        if (note) notes.push({ ...note, end: tick });
        open.delete(slot);
      }
    }
    pos = end;
  }
  return { division, tempo: tempo ?? 120, meter: meter ?? "4/4", key: key ?? 0, notes };
}

const DURATION_LIST = () => Object.entries(DURATIONS).sort((a, b) => a[1] - b[1]);
const nearestDuration = (beats) =>
  DURATION_LIST().reduce((best, entry) => (Math.abs(entry[1] - beats) < Math.abs(best[1] - beats) ? entry : best))[0];

// Hände: mehrere Notenspuren (eine je System oder Stimme) → obere Hälfte rechts, untere links.
// Eine einstimmige Spur ist eine Melodie; eine mehrstimmige wird am mittleren C geteilt.
function handAssigner(notes) {
  const tracks = [...new Set(notes.map((n) => n.track))];
  const avg = (t) => notes.filter((n) => n.track === t).reduce((s, n, _, a) => s + n.midi / a.length, 0);
  if (tracks.length > 1) {
    const upper = new Set([...tracks].sort((a, b) => avg(b) - avg(a)).slice(0, Math.ceil(tracks.length / 2)));
    return (n) => (upper.has(n.track) ? "rh" : "lh");
  }
  const melody = notes.every((n, i) => i === 0 || n.start >= notes[i - 1].end - 1);
  if (melody) return () => (avg(tracks[0]) >= 55 ? "rh" : "lh");
  return (n) => (n.midi >= 60 ? "rh" : "lh");
}

// Raster: 1/24 Schlag – trifft Sechzehntel, Zweiunddreißigstel und Triolen genau.
function midiToPiece({ division, tempo, meter, key = 0, notes }, title) {
  if (!notes.length) throw new Error("In der Datei sind keine Noten.");
  if (notes.length > MAX_IMPORT_NOTES) throw new Error(`Das Stück ist zu lang (höchstens ${MAX_IMPORT_NOTES} Noten).`);
  const grid = division / 24;
  const handOf = handAssigner([...notes].sort((a, b) => a.start - b.start));
  const quantized = notes.map((n) => ({
    midi: n.midi,
    beat: Math.round(n.start / grid) / 24,
    dur: Math.min(4, Math.max(0.125, Math.round((n.end - n.start) / grid) / 24)),
    hand: handOf(n),
  }));
  const barBeats = meterBeats(meter);
  const shift = Math.floor(Math.min(...quantized.map((n) => n.beat)) / barBeats) * barBeats; // leere Anfangstakte weg
  const seen = new Set();
  const compact = quantized
    .map((n) => ({ ...n, beat: n.beat - shift }))
    .filter((n) => {
      const id = `${n.hand}:${n.midi}:${n.beat}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .sort((a, b) => a.beat - b.beat || a.midi - b.midi)
    .map((n) => [n.midi, n.beat, nearestDuration(n.dur), n.hand]);
  const hands = new Set(compact.map((n) => n[3]));
  const length = Math.max(...compact.map((n) => n[1])) + 1;
  const density = compact.length / length;
  return {
    id: `u-${Date.now()}`,
    title,
    composer: "Eigener Import",
    year: "",
    genres: ["eigene"],
    level: density > 2.5 ? 3 : density > 1.2 ? 2 : 1,
    meter,
    key,
    flats: key < 0, // schwarze Tasten als Be schreiben
    tempo: Math.round(tempo),
    clef: hands.size === 2 ? "grand" : hands.has("lh") ? "bass" : "treble",
    about: `Aus deiner MIDI-Datei importiert – ${compact.length} Noten. Rhythmus und Notenbild sind automatisch angenähert.`,
    notes: compact,
  };
}

if (typeof module !== "undefined") module.exports = { parseMidiFile, midiToPiece };
