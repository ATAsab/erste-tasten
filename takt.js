// Takt-Modus: einzählen, Metronom, laufender Cursor und Bewertung nach Timing (und laut/leise).
const MIC_DELAY_MS = 70; // ponytail: geschätzte Verzögerung der Mikrofon-Erkennung – Feinjustierung über den Timing-Regler
let takt = null;

const taktBpm = () => Math.round(lesson.tempo * settings.taktTempo);
const taktBeat = () => (performance.now() - takt.perfStart) / 1000 / takt.spb;
// Für die fallenden Noten: dieselbe Uhr wie die Bewertung (inklusive Latenz-Ausgleich)
const taktFallBeat = (now) => (now - takt.perfStart - takt.latency) / 1000 / takt.spb;

function click(out, time, accent) {
  const ctx = out.context;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = accent ? 1760 : 1180;
  gain.gain.setValueAtTime(accent ? 0.45 : 0.25, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  osc.connect(gain).connect(out);
  osc.start(time);
  osc.stop(time + 0.06);
}

function startTakt() {
  if (takt) {
    resetLoop(); // Stopp von Hand beendet auch die Wiederholung
    return stopTakt();
  }
  clearTimeout(loopTimer); // eine geplante nächste Runde startet jetzt sofort
  loopTimer = null;
  restart();
  closeTune();
  const ctx = audio();
  const spb = 60 / taktBpm();
  const barBeats = meterBeats(lesson.meter);
  const countIn = Math.max(2, Math.round(barBeats)); // ein Takt Einzählen (3/4 → 3, 4/4 → 4)
  const out = ctx.createGain();
  out.connect(ctx.destination);
  const audioStart = ctx.currentTime + 0.3 + countIn * spb; // Schlag 0 auf der Audio-Uhr
  const perfStart = performance.now() + (audioStart - ctx.currentTime) * 1000; // … und auf der Event-Uhr
  const total = endBeat(steps);
  const lastClick = settings.metronome ? Math.ceil(total) : 0;
  const barStart = (b) => Math.abs(b / barBeats - Math.round(b / barBeats)) < 1e-6;
  for (let b = -countIn; b < lastClick; b++) click(out, audioStart + b * spb, barStart(b));
  // Was du hörst, kommt um die Ausgabe-Latenz verzögert an – darauf spielst du.
  const latency = (ctx.outputLatency || ctx.baseLatency || 0) * 1000 + settings.latencyMs;
  const notes = steps.flatMap((s) => s.notes.map((n) => ({ midi: n.midi, dyn: n.dyn, beat: s.beat, dur: n.dur, mine: isMine(n), time: perfStart + s.beat * spb * 1000 + latency })));
  // Hände getrennt: die andere Hand spielt die App (oder sie wird nur übersprungen) – bewertet wird sie nie.
  if (accompanies()) notes.forEach((n) => !n.mine && tone(n.midi, audioStart + n.beat * spb, n.dur * spb, out, ACCOMPANY_LEVEL));
  takt = {
    out, spb, perfStart, latency, notes, countIn,
    bpm: taktBpm(),
    results: notes.map((n) => (n.mine ? null : "auto")),
    offsets: [],
    marks: [],
    wrong: 0,
    dynHits: 0,
    dynTotal: 0,
    idx: -1,
    window: Math.min(TIMING.windowMax, spb * 450),
    end: perfStart + total * spb * 1000 + latency,
  };
  takt.timer = setInterval(taktWatch, 30);
  $("#takt-start").textContent = "■ Stopp";
  $(".stage").classList.add("running");
  $("#staff .cursor")?.classList.add("live");
  say(`Einzählen … ${takt.bpm} BPM – drück, wenn die Note in der grünen Zone ist.`, "info");
}

function stopTakt() {
  if (!takt) return;
  clearInterval(takt.timer);
  fadeOut(takt.out);
  takt = null;
  $("#countin").hidden = true;
  $("#takt-start").textContent = "● Start";
  $(".stage").classList.remove("running");
  $("#staff .cursor")?.classList.remove("live");
  paint();
}

function setResult(index, result, offset = null) {
  takt = {
    ...takt,
    results: takt.results.with(index, result),
    offsets: offset === null ? takt.offsets : [...takt.offsets, offset],
  };
  $(`#staff [data-n="${index}"]`)?.setAttribute("data-result", result);
  if (result === "verpasst" || result === "knapp") noteError(takt.notes[index].beat, result === "knapp" ? 0.5 : 1);
}

function taktWatch() {
  const now = performance.now();
  takt.notes.forEach((n, i) => {
    if (!takt.results[i] && now > n.time + takt.window) setResult(i, "verpasst");
  });
  const beat = taktBeat();
  const countIn = $("#countin");
  countIn.hidden = beat >= 0;
  if (beat < 0) countIn.textContent = String(takt.countIn + Math.floor(beat) + 1);
  const idx = steps.findIndex((s) => s.beat > beat - 0.25);
  if (idx !== takt.idx) {
    takt = { ...takt, idx };
    paint();
  }
  if (now > takt.end + takt.window + 400) finishTakt();
}

function taktNote(midi, src, time, velocity) {
  if (taktBeat() < -0.5) return flash(midi, "tap"); // noch beim Einzählen
  const hit = judgeHit(takt.notes, takt.results, midi, time - (src === "mic" ? MIC_DELAY_MS : 0), takt.window, src === "mic");
  if (!hit) {
    takt = { ...takt, wrong: takt.wrong + 1 };
    noteError(taktBeat());
    flash(midi, "bad");
    return say(`${pitchName(midi)} passt hier nicht – falscher Ton oder falscher Moment.`, "bad");
  }
  const rating = rateOffset(hit.offset);
  const fits = dynamicFits(takt.notes[hit.index].dyn, velocity, settings.dynSplit);
  setResult(hit.index, rating, hit.offset);
  takt = {
    ...takt,
    marks: [...takt.marks.filter((m) => performance.now() - m.at < MARK_MS), { midi, offset: hit.offset, rating, at: performance.now() }],
    dynHits: takt.dynHits + (fits ? 1 : 0),
    dynTotal: takt.dynTotal + (fits === null ? 0 : 1),
  };
  flash(midi, rating === "knapp" ? "tap" : "ok");
  const ms = Math.round(Math.abs(hit.offset));
  const direction = hit.offset < 0 ? "zu früh" : "zu spät";
  const dynNote = fits === false ? " · Lautstärke passt nicht" : "";
  if (rating === "perfekt") say(`Perfekt im Takt! (${ms} ms)${dynNote}`, "ok");
  else say(`${rating === "gut" ? "Gut" : "Knapp"} – ${ms} ms ${direction}${dynNote}`, rating === "gut" ? "ok" : "info");
}

// Läuft in jedem Bild: Cursor gleitet gleichmäßig mit dem Takt durchs Notenbild.
function moveTaktCursor() {
  const cursor = $("#staff .cursor");
  if (!cursor) return;
  const x = staffXAt(Math.max(taktBeat(), -0.5));
  cursor.style.transform = `translateX(${x - 15}px)`;
  const staff = $("#staff");
  staff.scrollLeft = x * staffZoom - staff.clientWidth / 3;
}

function finishTakt() {
  const { results, offsets, wrong, bpm, dynHits, dynTotal } = takt;
  stopTakt();
  const { score, stars: earned, counts } = rhythmScore(results, wrong);
  const slow = settings.taktTempo < 1;
  const stars = slow ? Math.min(2, earned) : earned;
  const fullRun = !practiceRange && practiceHands === "both";
  const entry = progress[lesson.id] ?? {};
  if (stars && fullRun) {
    progress = { ...progress, [lesson.id]: { ...entry, takt: Math.max(stars, entry.takt ?? 0) } };
    store.set("et-progress", progress);
    if (lesson.isPiece) renderLibrarySide(lesson.id);
    else renderList();
  }
  if (stars) recordRun({ id: lesson.id, mode: "takt", stars, firstTime: !entry.takt && !entry.stars, fullRun });
  saveErrors();
  if (continueLoop(`Runde ${loopRound}: ${Math.round(score * 100)} % im Takt`, score)) return;
  const mean = offsets.length ? offsets.reduce((a, b) => a + b, 0) / offsets.length : 0;
  const tendency = Math.abs(mean) < 25
    ? "Dein Timing ist ausgeglichen."
    : `Du spielst im Schnitt ${Math.round(Math.abs(mean))} ms ${mean < 0 ? "zu früh – lass dir etwas mehr Zeit" : "zu spät – hör genau auf den Klick"}.`;
  const advice = stars === 0 ? "Noch viele Töne verpasst. Versuch es langsamer – das ist kein Rückschritt, sondern der schnellste Weg."
    : slow && earned === 3 ? "Perfekt in diesem Tempo! Den dritten Stern gibt es im Originaltempo (100 %)."
      : stars === 3 ? "Sauber im Originaltempo – großartig!"
        : "";
  const canFaster = score >= 0.8 && settings.taktTempo < 1.2;
  const canSlower = score < 0.8 && settings.taktTempo > 0.5;
  const stats = [
    [`${Math.round(score * 100)} %`, "im Takt"],
    [counts.perfekt + counts.gut, "pünktlich"],
    [counts.knapp, "knapp"],
    [counts.verpasst + wrong, "verpasst / falsch"],
  ];
  if (dynTotal) stats.push([`${dynHits}/${dynTotal}`, "laut/leise"]);
  if (looping()) stats.push([loopRound, loopRound === 1 ? "Runde" : "Runden"]);
  showResult({
    eyebrow: `Im Takt · ${bpm} BPM${practiceLabel() ? ` · ${practiceLabel()}` : ""}`,
    title: stars >= 2 ? "Sauber im Takt!" : stars === 1 ? "Geschafft!" : "Weiter üben!",
    stars,
    stats,
    tip: `${tendency} ${advice}`,
    middle: canFaster ? { value: "faster", label: "Schneller (+10 %)" } : canSlower ? { value: "slower", label: "Langsamer (−10 %)" } : null,
  });
}
