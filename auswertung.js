// Aufnahme-Auswertung: deine Aufnahme mit den Noten vergleichen – Treffer, Tempo, Gleichmäßigkeit, Takt für Takt.
const CHORD_MS = 60; // Töne innerhalb von 60 ms gelten als ein Akkord
const LOOKAHEAD = 6; // so weit sucht der Abgleich nach einem verrutschten Ton
const WORST_MIN = 0.12; // ab 12 % Tempoabweichung lohnt sich ein Takt zum Üben
const MIN_MATCHED = 4;
const CHART_RANGE = 0.4; // ±40 % füllen die halbe Diagrammhöhe
const UNEVEN = { good: 40, ok: 90 }; // Schwankung in ms: darunter sehr gleichmäßig bzw. recht gleichmäßig

const avgOf = (list) => list.reduce((a, b) => a + b, 0) / list.length;
const samePitch = (a, b) => a.midi % 12 === b.midi % 12; // Tonname reicht – das Mikrofon verrutscht gern um Oktaven

// Gleichzeitig angeschlagene Töne (Akkord) von unten nach oben sortieren – wie in den Noten.
function groupChords(played) {
  const sorted = [...played].sort((a, b) => a.start - b.start);
  const out = [];
  let cluster = [];
  const flush = () => out.push(...cluster.sort((a, b) => a.midi - b.midi));
  sorted.forEach((n) => {
    if (cluster.length && n.start - cluster[0].start > CHORD_MS) {
      flush();
      cluster = [];
    }
    cluster.push(n);
  });
  flush();
  return out;
}

// ponytail: gieriger Abgleich mit kurzer Vorausschau statt voller Alignment-Tabelle – reicht für Übungsaufnahmen
function alignNotes(expected, played) {
  const pairs = [];
  let i = 0;
  let j = 0;
  let missing = 0;
  let extra = 0;
  let wrong = 0;
  const ahead = (list, from, note) => list.slice(from, from + LOOKAHEAD).findIndex((x) => samePitch(x, note));
  while (i < expected.length && j < played.length) {
    if (samePitch(expected[i], played[j])) {
      pairs.push([expected[i++], played[j++]]);
      continue;
    }
    const inPlayed = ahead(played, j + 1, expected[i]); // gespielt, aber zu viel
    const inExpected = ahead(expected, i + 1, played[j]); // in den Noten, aber ausgelassen
    if (inPlayed >= 0 && (inExpected < 0 || inPlayed <= inExpected)) {
      extra += inPlayed + 1;
      j += inPlayed + 1;
    } else if (inExpected >= 0) {
      missing += inExpected + 1;
      i += inExpected + 1;
    } else {
      wrong++;
      i++;
      j++;
    }
  }
  return { pairs, missing: missing + expected.length - i, extra: extra + played.length - j, wrong };
}

// Ausgleichsgerade y = a + b·x
function fitLine(points) {
  const mx = avgOf(points.map(([x]) => x));
  const my = avgOf(points.map(([, y]) => y));
  const b = points.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / points.reduce((s, [x]) => s + (x - mx) ** 2, 0);
  return { a: my - b * mx, b };
}

/**
 * @param {{midi:number, beat:number}[]} expected Noten (Schläge ab Ausschnittbeginn)
 * @param {{midi:number, start:number}[]} played Aufnahme (ms)
 */
function analyzeRecording(expected, played, { barBeats = 4, firstBar = 1 } = {}) {
  const exp = [...expected].sort((a, b) => a.beat - b.beat || a.midi - b.midi);
  const { pairs, missing, extra, wrong } = alignNotes(exp, groupChords(played));
  const base = { expected: exp.length, matched: pairs.length, missing, extra, wrong, accuracy: exp.length ? pairs.length / exp.length : 0 };
  const points = pairs.map(([e, p]) => [e.beat, p.start]);
  if (pairs.length < MIN_MATCHED || new Set(points.map(([beat]) => beat)).size < 2) return { ...base, tooShort: true, bars: [], worst: null };
  const { a, b } = fitLine(points);
  const bpm = 60000 / b;
  const unevenMs = Math.round(Math.sqrt(avgOf(points.map(([beat, time]) => (time - (a + b * beat)) ** 2))));
  // Tempo je Takt: vom ersten Anschlag eines Takts bis zum ersten im nächsten
  const anchors = new Map();
  points.forEach(([beat, time]) => {
    const bar = Math.floor(beat / barBeats + 1e-6);
    if (!anchors.has(bar)) anchors.set(bar, [beat, time]);
  });
  const order = [...anchors.keys()].sort((x, y) => x - y);
  const bars = order.slice(0, -1).flatMap((bar, i) => {
    const [b1, t1] = anchors.get(bar);
    const [b2, t2] = anchors.get(order[i + 1]);
    if (t2 <= t1) return [];
    const local = (60000 * (b2 - b1)) / (t2 - t1);
    return [{ bar: firstBar + bar, bpm: Math.round(local), deviation: Math.round((local / bpm - 1) * 100) / 100 }];
  });
  // Übungsstelle = wo das Tempo gegenüber den Nachbartakten kippt (Stocken, Hetzen) – allmähliches Abdriften zählt extra.
  const jumps = bars.map((x, i) => {
    const near = [bars[i - 1], bars[i + 1]].filter(Boolean).map((n) => n.bpm);
    return { bar: x.bar, deviation: near.length ? Math.round((x.bpm / avgOf(near) - 1) * 100) / 100 : 0 };
  });
  const worst = jumps.filter((x) => Math.abs(x.deviation) >= WORST_MIN)
    .sort((x, y) => Math.abs(y.deviation) - Math.abs(x.deviation))[0] ?? null;
  const drift = bars.length >= 2 ? Math.round((bars.at(-1).bpm / bars[0].bpm - 1) * 100) / 100 : 0;
  return { ...base, bpm, unevenMs, bars, worst, drift };
}

// ---------- Oberfläche ----------
let lastReport = null;

const signedPct = (x) => `${x > 0 ? "+" : x < 0 ? "−" : "±"}${Math.abs(Math.round(x * 100))} %`;

// Erwartete Töne zur Aufnahme: derselbe Ausschnitt und dieselbe Hand wie beim Aufnehmen.
function expectedFor(item, recording) {
  const full = item.notes ? stepsFromNotes(item.notes, item.flats) : buildSteps(item.tracks);
  const { steps: part } = applyRange(full, [], item.meter, recording.range ?? null);
  return part.flatMap((s) => s.notes.filter((n) => playsHand(n, recording.hands ?? "both")).map((n) => ({ midi: n.midi, beat: s.beat })));
}

function tempoChartHtml(bars) {
  if (bars.length < 2) return "";
  const w = 30;
  const mid = 60;
  const height = (dev) => Math.max(2, (Math.min(1, Math.abs(dev) / CHART_RANGE) * (mid - 12)));
  const columns = bars.map((x, i) => {
    const h = height(x.deviation);
    const faster = x.deviation > 0;
    const label = `Takt ${x.bar}: ${x.bpm} BPM (${signedPct(x.deviation)}) – ${faster ? "schneller" : x.deviation < 0 ? "langsamer" : "genau im Schnitt"}`;
    return `<g><title>${label}</title>
      <rect class="${faster ? "eilt" : "schleppt"}" x="${i * w + 8}" y="${faster ? mid - h : mid}" width="14" height="${h}" rx="3"/>
      <text class="tick" x="${i * w + 15}" y="${2 * mid - 2}">${x.bar}</text></g>`;
  }).join("");
  return `<figure class="tempo-chart">
    <figcaption>Tempo je Takt im Vergleich zu deinem Durchschnitt</figcaption>
    <svg viewBox="0 0 ${bars.length * w + 8} ${2 * mid}" role="img" aria-label="Tempo je Takt">
      <line class="axis" x1="0" x2="${bars.length * w + 8}" y1="${mid}" y2="${mid}"/>${columns}
    </svg>
    <p class="chart-key"><span class="swatch eilt"></span>eilt (schneller) <span class="swatch schleppt"></span>schleppt (langsamer)</p>
    <details class="table-view"><summary>Als Tabelle</summary>
      <table><thead><tr><th>Takt</th><th>BPM</th><th>Abweichung</th></tr></thead>
      <tbody>${bars.map((x) => `<tr><td>${x.bar}</td><td>${x.bpm}</td><td>${signedPct(x.deviation)}</td></tr>`).join("")}</tbody></table>
    </details>
  </figure>`;
}

function reportTip(r) {
  if (r.tooShort) return "Für eine Tempo-Auswertung passen zu wenige Töne zu den Noten. Nimm ein paar Takte am Stück auf – am besten frei oder „Im Takt“.";
  const tempo = `Dein Tempo: ${Math.round(r.bpm)} BPM – das Original hat ${lesson.tempo} BPM (${Math.round((r.bpm / lesson.tempo) * 100)} %). `;
  if (r.accuracy < 0.8) return `${tempo}Noch fehlen oder klingen viele Töne falsch. Übe die Töne erst „Schritt für Schritt“ – das Tempo kommt danach.`;
  const drift = Math.abs(r.drift) >= WORST_MIN ? ` Insgesamt wirst du zum Ende hin ${r.drift < 0 ? "langsamer" : "schneller"} (${signedPct(r.drift)}).` : "";
  if (r.worst?.deviation < 0) return `${tempo}In Takt ${r.worst.bar} wirst du plötzlich langsamer (${signedPct(r.worst.deviation)} gegenüber den Nachbartakten). Meist sitzt die Stelle noch nicht – übe sie einzeln.${drift}`;
  if (r.worst) return `${tempo}In Takt ${r.worst.bar} eilst du (${signedPct(r.worst.deviation)} gegenüber den Nachbartakten). Zähl dort bewusst mit oder nimm das Metronom dazu.${drift}`;
  if (drift) return `${tempo}${drift.trim()} Spiel „Im Takt“ mit Metronom – dann bleibt der Puls bis zum Schluss gleich.`;
  if (r.unevenMs > UNEVEN.ok) return `${tempo}Kein Takt fällt heraus, aber das Tempo schwankt insgesamt. Spiel „Im Takt“ mit Metronom, um den Puls zu festigen.`;
  return `${tempo}Sehr gleichmäßig – so klingt es musikalisch. Probier es jetzt etwas schneller!`;
}

function showRecReport() {
  const recording = recordings()[lesson.id];
  if (!recording || lesson.drill) return;
  const r = analyzeRecording(expectedFor(lesson, recording), recordingNotes(recording.events), {
    barBeats: meterBeats(lesson.meter), firstBar: recording.range?.from ?? 1,
  });
  lastReport = r;
  const part = [recording.range ? `Takte ${recording.range.from}–${recording.range.to}` : "ganzes Stück", HANDS_LABELS[recording.hands ?? "both"]].join(" · ");
  $("#rec-report-title").textContent = lesson.title;
  $("#rec-report-part").textContent = `${part} · aufgenommen am ${new Date(recording.date).toLocaleDateString("de-DE", { day: "numeric", month: "long" })}`;
  const evenness = r.tooShort ? "–" : r.unevenMs < UNEVEN.good ? "sehr ruhig" : r.unevenMs < UNEVEN.ok ? "recht ruhig" : "schwankt";
  $("#rec-report-body").innerHTML = `
    <ul class="stats">
      <li><b>${Math.round(r.accuracy * 100)} %</b>Töne richtig</li>
      <li><b>${r.missing}</b>fehlen</li>
      <li><b>${r.extra + r.wrong}</b>falsch / zu viel</li>
      <li><b>${r.tooShort ? "–" : Math.round(r.bpm)}</b>BPM</li>
      <li><b>${r.tooShort ? "–" : `±${r.unevenMs} ms`}</b>${evenness}</li>
    </ul>
    ${tempoChartHtml(r.bars)}
    <p class="tip">${reportTip(r)}</p>`;
  $("#rec-report-spot").hidden = !r.worst;
  if (r.worst) $("#rec-report-spot").textContent = `⚑ Takt ${r.worst.bar} üben`;
  $("#rec-report").returnValue = "";
  $("#rec-report").showModal();
}

function onRecReportClose() {
  const choice = $("#rec-report").returnValue;
  if (choice === "listen") toggleRecPlay();
  if (choice === "spot" && lastReport?.worst) {
    const bars = Number($("#range-to").max);
    if (!looping()) saveSettings({ loop: "3" });
    setRange(lastReport.worst.bar, Math.min(bars, lastReport.worst.bar + 1), bars);
    say(`Takt ${lastReport.worst.bar} und der Übergang in den nächsten – ${loopTotal() === Infinity ? "immer wieder" : `${loopTotal()}-mal`} hintereinander.`, "info");
  }
}

function bindRecReport() {
  $("#rec-report-btn").addEventListener("click", showRecReport);
  $("#rec-report").addEventListener("close", onRecReportClose);
}

if (typeof module !== "undefined") module.exports = { analyzeRecording };
