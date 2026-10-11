// Notenbild als SVG – reine Funktion, genutzt von Übungen, Bibliothek und Theorie-Artikeln.
const S = 10; // Abstand zweier Notenlinien in px
const BEAT_W = 44; // Breite eines Schlags (Viertel)
const MIN_GAP = 22; // Mindestabstand zweier Noten – sonst kleben Sechzehntel aneinander
const BAR_PAD = 20; // Luft hinter einem Taktstrich
const LEFT = 92; // Platz für Schlüssel und Taktart
const STEM = 3.4 * S;
const CLEFS = {
  // anchor = Grundlinie des Schlüssel-Zeichens in Linienabständen unter der obersten Linie (an Noto Music angepasst)
  treble: { bottom: 30, glyph: "𝄞", anchor: 5.4 }, // unterste Linie = E4, Schnecke auf der G-Linie
  bass: { bottom: 18, glyph: "𝄢", anchor: 3.6 }, // unterste Linie = G2, Punkte um die F-Linie
};
const REST_GLYPH = { q: "𝄽", qd: "𝄽", e: "𝄾", ed: "𝄾", te: "𝄾", s: "𝄿", t: "𝅀" };
const FLAGS = { e: 1, ed: 1, te: 1, s: 2, t: 3 }; // Anzahl Fähnchen bzw. Balken je Notenwert
// Generalvorzeichen: Reihenfolge der Stammtöne (C=0 … H=6) und ihre Plätze im Violinschlüssel (Bass = 14 Stufen tiefer)
const KEY_ORDER = { sharp: [3, 0, 4, 1, 5, 2, 6], flat: [6, 2, 5, 1, 4, 0, 3] };
const KEY_STEPS = { sharp: [38, 35, 39, 36, 33, 37, 34], flat: [34, 37, 33, 36, 32, 35, 31] };
const KEY_W = 9; // Breite eines Vorzeichens am Zeilenanfang

const svgLine = (x1, y1, x2, y2, cls) => `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const staffOf = (clef, hand) => (clef === "grand" ? (hand === "lh" ? "bass" : "treble") : clef);
const isBarStart = (t, barBeats) => t > 0 && Math.abs(t / barBeats - Math.round(t / barBeats)) < 1e-6;

// lift = zusätzlicher Platz oben für Akkordsymbole
function staffLayout(clef, lift = 0) {
  const top = 50 + lift;
  if (clef === "grand") return { tops: { treble: top, bass: top + 4 * S + 100 }, height: top + 8 * S + 100 + 90 };
  return { tops: { [clef]: top }, height: top + 4 * S + 90 };
}

function geometry(staff, top) {
  const bottomY = top + 4 * S;
  const base = CLEFS[staff].bottom;
  return { top, bottomY, base, middle: base + 4, yOf: (st) => bottomY - ((st - base) * S) / 2 };
}

// Zeit → x: proportional zur Dauer, aber mit Mindestabstand und Luft hinter Taktstrichen.
function buildTimeline(times, barBeats, left) {
  const sorted = [...new Set(times)].sort((a, b) => a - b);
  const xs = new Map();
  let x = left + 20;
  sorted.forEach((t, i) => {
    if (i > 0) x += Math.max(MIN_GAP, (t - sorted[i - 1]) * BEAT_W) + (isBarStart(t, barBeats) ? BAR_PAD : 0);
    xs.set(t, x);
  });
  const xAt = (beat) => {
    if (beat <= sorted[0]) return xs.get(sorted[0]) + (beat - sorted[0]) * BEAT_W;
    const i = sorted.findIndex((t) => t >= beat);
    if (i < 0) return xs.get(sorted.at(-1));
    const [a, b] = [sorted[i - 1], sorted[i]];
    return xs.get(a) + ((xs.get(b) - xs.get(a)) * (beat - a)) / (b - a);
  };
  return { xs, xAt };
}

// Je Schritt und System ein Akkord (meist nur ein Ton), Töne von unten nach oben sortiert.
function chordsOf(steps, clef, flatIndex) {
  return steps.flatMap((s, i) => {
    const byStaff = new Map();
    s.notes.forEach((n) => {
      const staff = staffOf(clef, n.hand);
      byStaff.set(staff, [...(byStaff.get(staff) ?? []), n]);
    });
    return [...byStaff].map(([staff, notes]) => ({
      staff, step: i, beat: s.beat, hand: notes[0].hand, dur: notes[0].dur, durCode: notes[0].durCode,
      notes: notes
        .map((n) => ({ n, pos: staffStep(n.midi, n.spell), flat: flatIndex.get(n) }))
        .sort((a, b) => a.pos.step - b.pos.step),
    }));
  });
}

// Achtel/Sechzehntel innerhalb einer Zählzeit bekommen einen gemeinsamen Balken.
// ponytail: nur Einzeltöne – Akkorde behalten ihre Fähnchen
function beamGroups(chords, unit) {
  const groups = [];
  for (const staff of new Set(chords.map((c) => c.staff))) {
    let current = [];
    const flush = () => {
      if (current.length > 1) groups.push(current);
      current = [];
    };
    chords.filter((c) => c.staff === staff).forEach((c) => {
      if (!FLAGS[c.durCode] || c.notes.length > 1) return flush();
      const prev = current.at(-1);
      const sameUnit = prev && Math.floor(prev.beat / unit + 1e-6) === Math.floor(c.beat / unit + 1e-6);
      const touching = prev && Math.abs(prev.beat + prev.dur - c.beat) < 1e-6;
      if (prev && !(sameUnit && touching)) flush();
      current.push(c);
    });
    flush();
  }
  return groups;
}

function stemUp(positions, middle) {
  const low = Math.min(...positions);
  const high = Math.max(...positions);
  return middle - low > high - middle;
}

function beamLayout(group, x, geo) {
  const up = stemUp(group.map((c) => c.notes[0].pos.step), geo.middle);
  const dir = up ? -1 : 1;
  const stemXs = group.map((c) => x(c) + (up ? 5.6 : -5.6));
  const ys = group.map((c) => geo.yOf(c.notes[0].pos.step));
  const first = ys[0] + dir * STEM;
  const slope = Math.max(-0.2, Math.min(0.2, (ys.at(-1) - ys[0]) / (stemXs.at(-1) - stemXs[0])));
  const lineAt = (sx) => first + slope * (sx - stemXs[0]);
  // Balken verschieben, bis jeder Hals mindestens 2,6 Linienabstände lang ist
  const push = Math.max(0, ...ys.map((y, i) => (up ? lineAt(stemXs[i]) - (y - 2.6 * S) : y + 2.6 * S - lineAt(stemXs[i]))));
  const beamY = (sx) => lineAt(sx) + dir * push;
  const toward = -dir; // Richtung zu den Notenköpfen
  const bar = (x1, x2, offset) => {
    const [y1, y2] = [beamY(x1) + offset, beamY(x2) + offset];
    return `<polygon class="beam" points="${x1},${y1} ${x2},${y2} ${x2},${y2 + toward * 4.5} ${x1},${y1 + toward * 4.5}"/>`;
  };
  const beams = [bar(stemXs[0], stemXs.at(-1), 0)];
  const flagsOf = (c) => FLAGS[c?.durCode] ?? 0;
  for (let level = 2; level <= 3; level++) { // zweiter Balken = Sechzehntel, dritter = Zweiunddreißigstel
    group.forEach((c, i) => {
      if (flagsOf(c) < level) return;
      const offset = toward * 7.5 * (level - 1);
      if (flagsOf(group[i + 1]) >= level) beams.push(bar(stemXs[i], stemXs[i + 1], offset));
      else if (flagsOf(group[i - 1]) < level) {
        const stub = i < group.length - 1 ? 9 : -9; // allein stehend: kurzer Stummel
        beams.push(bar(Math.min(stemXs[i], stemXs[i] + stub), Math.max(stemXs[i], stemXs[i] + stub), offset));
      }
    });
  }
  if (group.every((c) => c.durCode === "te")) { // Triole: „3“ über bzw. unter dem Balken
    const mid = (stemXs[0] + stemXs.at(-1)) / 2;
    beams.push(`<text class="tuplet" x="${mid}" y="${beamY(mid) + (up ? -6 : 16)}">3</text>`);
  }
  return { up, tips: stemXs.map(beamY), svg: beams.join("") };
}

// Vorzeichen an der Note: nur wenn es von der Tonart abweicht (♮ hebt ein Generalvorzeichen auf)
function accidentalOf(pos, keyAlter) {
  const alter = pos.accidental === "sharp" ? 1 : pos.accidental === "flat" ? -1 : 0;
  const expected = keyAlter[((pos.step % 7) + 7) % 7];
  if (alter === expected) return "";
  return alter === 0 ? "♮" : alter > 0 ? "♯" : "♭";
}

function chordSvg(c, x, geo, up, tipY, flags, keyAlter) {
  const { top, bottomY, base, yOf } = geo;
  const count = c.notes.length;
  const shift = c.notes.map(() => 0);
  for (let k = 1; k < count; k++) {
    const second = c.notes[k].pos.step - c.notes[k - 1].pos.step === 1;
    if (second && !shift[k - 1] && !shift[k]) shift[up ? k : k - 1] = up ? 12 : -12; // Sekunde: ein Kopf weicht aus
  }
  const heads = c.notes.map((m, k) => {
    const nx = x + shift[k];
    const y = yOf(m.pos.step);
    const out = [];
    for (let l = base - 2; l >= m.pos.step; l -= 2) out.push(svgLine(nx - 10, yOf(l), nx + 10, yOf(l), "ledger"));
    for (let l = base + 10; l <= m.pos.step; l += 2) out.push(svgLine(nx - 10, yOf(l), nx + 10, yOf(l), "ledger"));
    out.push(`<ellipse class="head${c.dur >= 2 ? " hollow" : ""}" cx="${nx}" cy="${y}" rx="6.2" ry="4.5" transform="rotate(-20 ${nx} ${y})"/>`);
    if (c.durCode.endsWith("d")) out.push(`<circle class="dot" cx="${nx + 11}" cy="${(m.pos.step - base) % 2 === 0 ? y - S / 2 : y}" r="1.9"/>`);
    const sign = accidentalOf(m.pos, keyAlter);
    if (sign) out.push(`<text class="acc" x="${x - 15}" y="${y + 4}">${sign}</text>`);
    const fromTop = count - 1 - k; // Beschriftung von oben nach unten wie die Köpfe
    out.push(`<text class="name" x="${x}" y="${bottomY + 3.3 * S + fromTop * 12}">${pitchName(m.n.midi)}</text>`);
    if (m.n.finger) {
      const fy = m.n.hand === "lh" ? bottomY + 3.3 * S + count * 12 + 8 + fromTop * 12 : top - 1.6 * S - k * 12;
      out.push(`<text class="finger" x="${x}" y="${fy}">${m.n.finger}</text>`);
    }
    return `<g class="note ${c.hand}" data-step="${c.step}" data-n="${m.flat}">${out.join("")}</g>`;
  });
  if (c.dur >= 4) return heads.join("");
  const ys = c.notes.map((m) => yOf(m.pos.step));
  const sx = up ? x + 5.6 : x - 5.6;
  const from = up ? Math.max(...ys) : Math.min(...ys);
  const stem = [svgLine(sx, from, sx, tipY, "stem")];
  const dir = up ? 1 : -1;
  if (flags) {
    for (let k = 0; k < (FLAGS[c.durCode] ?? 0); k++) {
      stem.push(`<path class="flag" d="M${sx} ${tipY + 7 * dir * k} c1 ${7 * dir} 9 ${9 * dir} 7 ${18 * dir}"/>`);
    }
  }
  return heads.join("") + `<g class="note ${c.hand}" data-step="${c.step}">${stem.join("")}</g>`;
}

function restSvg(r, x, geo) {
  const { top } = geo;
  const dot = r.durCode.endsWith("d") ? `<circle class="dot rest-dot" cx="${x + 12}" cy="${top + 1.5 * S}" r="1.9"/>` : "";
  if (r.durCode === "w") return `<rect class="rest" x="${x - 7}" y="${top + S}" width="14" height="5"/>`;
  if (r.durCode.startsWith("h")) return `<rect class="rest" x="${x - 7}" y="${top + 2 * S - 5}" width="14" height="5"/>${dot}`;
  return `<text class="rest-glyph" x="${x}" y="${top + 2 * S + 12}">${REST_GLYPH[r.durCode]}</text>${dot}`;
}

// Dynamikzeichen (p, f …) dort, wo sie sich in einer Hand ändern
function dynamicsSvg(steps, clef, xs, geos) {
  const last = {};
  return steps.flatMap((s) => s.notes.flatMap((n) => {
    if (!n.dyn || last[n.hand] === n.dyn) return [];
    last[n.hand] = n.dyn;
    const geo = geos[staffOf(clef, n.hand)];
    const y = geo.bottomY + (n.hand === "lh" ? 7.2 : 5.6) * S;
    return [`<text class="dyn" x="${xs.get(s.beat) - 4}" y="${y}">${n.dyn}</text>`];
  })).join("");
}

/**
 * @param {{beat:number, notes:object[]}[]} steps
 * @param {"treble"|"bass"|"grand"} clef
 * @param {string} meter z. B. "4/4", "3/4", "6/8"
 * @param {{beat:number, name:string}[]} chordSyms Akkordsymbole über dem System
 * @returns {{ svg: string, stepX: number[], xAt: (beat:number) => number }}
 */
function staffSvg(steps, clef, meter = "4/4", withCursor = false, rests = [], key = 0, firstBar = 1, chordSyms = []) {
  const kind = key > 0 ? "sharp" : "flat";
  const keyAlter = [0, 0, 0, 0, 0, 0, 0].map((_, letter) => (KEY_ORDER[kind].slice(0, Math.abs(key)).includes(letter) ? Math.sign(key) : 0));
  const left = LEFT + Math.abs(key) * KEY_W;
  const { tops, height } = staffLayout(clef, chordSyms.length ? 16 : 0);
  const barBeats = meterBeats(meter);
  const content = Math.max(endBeat(steps), ...rests.map((r) => r.beat + r.dur));
  const total = Math.ceil(content / barBeats - 1e-6) * barBeats;
  const bars = Array.from({ length: Math.round(total / barBeats) }, (_, i) => (i + 1) * barBeats);
  const { xs, xAt } = buildTimeline([0, ...steps.map((s) => s.beat), ...rests.map((r) => r.beat), ...bars], barBeats, left);
  const width = xs.get(total) + 16;
  const geos = Object.fromEntries(Object.entries(tops).map(([staff, top]) => [staff, geometry(staff, top)]));
  const topValues = Object.values(tops);
  const sysTop = Math.min(...topValues);
  const sysBottom = Math.max(...topValues) + 4 * S;
  const [count, unit] = meter.split("/");

  const parts = withCursor
    ? [`<rect class="cursor" x="0" y="${sysTop - 3 * S}" width="30" height="${sysBottom - sysTop + 6.5 * S}" rx="9"/>`]
    : [];
  for (const [staff, top] of Object.entries(tops)) {
    for (let i = 0; i < 5; i++) parts.push(svgLine(14, top + i * S, width - 8, top + i * S, "staff-line"));
    parts.push(`<text class="clef ${staff}" x="20" y="${top + CLEFS[staff].anchor * S}">${CLEFS[staff].glyph}</text>`);
    const shift = staff === "bass" ? -14 : 0;
    KEY_STEPS[kind].slice(0, Math.abs(key)).forEach((st, i) => {
      const y = top + 4 * S - ((st + shift - CLEFS[staff].bottom) * S) / 2;
      parts.push(`<text class="acc key" x="${58 + i * KEY_W}" y="${y + 4}">${key > 0 ? "♯" : "♭"}</text>`);
    });
    const tx = 70 + Math.abs(key) * KEY_W;
    parts.push(`<text class="time" x="${tx}" y="${top + 2 * S}">${count}</text><text class="time" x="${tx}" y="${top + 4 * S}">${unit}</text>`);
  }
  parts.push(svgLine(14, sysTop, 14, sysBottom, "bar"));
  bars.forEach((b) => {
    const x = xs.get(b) - 22;
    parts.push(b === total
      ? svgLine(x - 5, sysTop, x - 5, sysBottom, "bar") + svgLine(x, sysTop, x, sysBottom, "bar end")
      : svgLine(x, sysTop, x, sysBottom, "bar"));
  });
  // Taktnummern über jedem Takt – damit man Abschnitte zum Üben wählen kann
  [0, ...bars.slice(0, -1)].forEach((b, i) => {
    const x = b === 0 ? xs.get(0) - 18 : xs.get(b) - 19;
    parts.push(`<text class="bar-no" x="${x}" y="${sysTop - 2.4 * S}">${firstBar + i}</text>`);
  });
  rests.forEach((r) => parts.push(restSvg(r, xs.get(r.beat), geos[staffOf(clef, r.hand)])));
  chordSyms.forEach((c) => parts.push(`<text class="chord-sym" x="${xAt(c.beat) - 6}" y="${sysTop - 3.9 * S}">${c.name}</text>`));

  const flatIndex = new Map();
  let flat = 0;
  steps.forEach((s) => s.notes.forEach((n) => flatIndex.set(n, flat++)));
  const chords = chordsOf(steps, clef, flatIndex);
  const xOf = (c) => xs.get(c.beat);
  const beamed = new Map();
  beamGroups(chords, unit === "8" ? 1.5 : 1).forEach((group) => {
    const layout = beamLayout(group, xOf, geos[group[0].staff]);
    group.forEach((c, i) => beamed.set(c, { up: layout.up, tip: layout.tips[i] }));
    parts.push(`<g class="beams ${group[0].hand}">${layout.svg}</g>`);
  });
  chords.forEach((c) => {
    const geo = geos[c.staff];
    const ys = c.notes.map((m) => geo.yOf(m.pos.step));
    const beam = beamed.get(c);
    const up = beam ? beam.up : stemUp(c.notes.map((m) => m.pos.step), geo.middle);
    const tip = beam ? beam.tip : up ? Math.min(...ys) - STEM : Math.max(...ys) + STEM;
    parts.push(chordSvg(c, xOf(c), geo, up, tip, !beam, keyAlter));
  });
  parts.push(dynamicsSvg(steps, clef, xs, geos));

  const stepX = steps.map((s) => xs.get(s.beat));
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Notenbild">${parts.join("")}</svg>`;
  return { svg, stepX, xAt };
}

if (typeof module !== "undefined") module.exports = { staffSvg };
