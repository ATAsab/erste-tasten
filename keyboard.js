// Bildschirm-Klaviatur und fallende Noten (Canvas).
const FALL_PX = 46; // Schritt für Schritt: Höhe eines Schlags
const FALL_PX_PER_SEC = 120; // Im Takt: feste Fallgeschwindigkeit – die Trefferzone ist bei jedem Tempo gleich groß
const TAKT_HIT_LIFT = 44; // Im Takt liegt die Trefferlinie höher, damit die Zone darunter sichtbar bleibt
const MARK_MS = 1400; // so lange bleibt die Markierung eines Anschlags sichtbar
let KEYS = [];
let whiteCount = 0;
let fallBeat = 0;

// Mindestens C3–C6; reicht ein Stück tiefer oder höher, wächst die Klaviatur bis zum nächsten C mit.
function setKeyboardRange(list) {
  const midis = list.flatMap((s) => s.notes.map((n) => n.midi));
  const low = Math.min(48, Math.floor(Math.min(...midis) / 12) * 12);
  const high = Math.max(84, Math.ceil(Math.max(...midis) / 12) * 12);
  if (KEYS[0] === low && KEYS.at(-1) === high) return;
  KEYS = Array.from({ length: high - low + 1 }, (_, i) => low + i);
  whiteCount = KEYS.filter((k) => !isBlack(k)).length;
  buildKeyboard();
}

const inRange = (midi) => midi >= KEYS[0] && midi <= KEYS.at(-1);

function keyGeom(midi) {
  const whitesBefore = KEYS.filter((k) => k < midi && !isBlack(k)).length;
  const w = 1 / whiteCount;
  return isBlack(midi) ? { center: whitesBefore * w, width: w * 0.62 } : { center: (whitesBefore + 0.5) * w, width: w };
}

function buildKeyboard() {
  $("#keyboard").innerHTML = KEYS.map((m) => {
    const { center, width } = keyGeom(m);
    const label = isBlack(m) ? "" : pitchName(m) + (m % 12 === 0 ? `<sub>${octaveOf(m)}</sub>` : "");
    return `<button class="key ${isBlack(m) ? "black" : "white"}" data-midi="${m}" tabindex="-1" aria-label="${midiName(m)}"
      style="left:${(center - width / 2) * 100}%;width:${width * 100}%"><span class="kfinger"></span><span class="kname">${label}</span></button>`;
  }).join("");
  $("#keyboard").classList.toggle("dense", whiteCount > 30);
}

const keyEl = (midi) => $(`#keyboard [data-midi="${midi}"]`);

function flash(midi, tone) {
  const key = keyEl(midi);
  if (!key) return;
  key.classList.remove("ok", "bad", "tap");
  void key.offsetWidth; // Animation neu starten
  key.classList.add(tone);
}

// ---------- Fallende Noten ----------

function drawFall() {
  const canvas = $("#fall");
  if (!steps || canvas.offsetParent === null) return;
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (canvas.width !== Math.round(W * dpr)) canvas.width = Math.round(W * dpr);
  if (canvas.height !== Math.round(H * dpr)) canvas.height = Math.round(H * dpr);
  const now = performance.now();
  const at = currentIndex();
  const beatPx = takt ? takt.spb * FALL_PX_PER_SEC : FALL_PX;
  const hitY = H - (takt ? TAKT_HIT_LIFT : 4);
  const live = takt ? taktFallBeat(now) : playback ? playback.beat() : null;
  fallBeat = live ?? fallBeat + ((steps[run.idx]?.beat ?? endBeat(steps)) - fallBeat) * 0.16;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = colors.lane;
  KEYS.filter((k) => k % 12 === 0 || k % 12 === 5).forEach((k) => {
    const g = keyGeom(k);
    ctx.fillRect(Math.round((g.center - g.width / 2) * W), 0, 1, H);
  });
  if (takt) drawTimingZone(ctx, W, hitY);

  ctx.textAlign = "center";
  let flat = -1;
  steps.forEach((s, i) => s.notes.forEach((n) => {
    flat++;
    if (!inRange(n.midi)) return;
    const bottom = hitY - (s.beat - fallBeat) * beatPx;
    const height = n.dur * beatPx - 4;
    if (bottom < 0 || bottom - height > H) return;
    const g = keyGeom(n.midi);
    const x = (g.center - g.width / 2) * W + 2;
    const w = g.width * W - 4;
    const result = takt?.results[flat];
    ctx.globalAlpha = !takt && i < at ? 0.25 : isMine(n) ? 1 : 0.3; // Hände getrennt: andere Hand blass
    ctx.fillStyle = result && result !== "auto" ? colors[result] : n.hand === "lh" ? colors.lh : colors.rh;
    ctx.beginPath();
    ctx.roundRect(x, bottom - height, w, height, 5);
    ctx.fill();
    const due = takt && !result && Math.abs(takt.notes[flat].time - now) <= takt.window;
    if (due || (!takt && i === at && isMine(n))) {
      ctx.strokeStyle = due ? colors.ok : colors.gold; // im Takt: grüner Rand = jetzt drücken
      ctx.lineWidth = due ? 3 : 2.5;
      ctx.stroke();
    }
    ctx.fillStyle = "#fff";
    if (helps.names && w > 12) {
      ctx.font = "600 12px 'Instrument Sans', sans-serif";
      ctx.fillText(pitchName(n.midi), x + w / 2, bottom - 7);
    }
    if (n.dyn && height > 34 && w > 12) {
      ctx.font = "italic 600 13px Fraunces, serif";
      ctx.fillText(n.dyn, x + w / 2, bottom - height + 15);
    }
  }));
  ctx.globalAlpha = 1;
  if (takt) drawHitMarks(ctx, W, hitY, now);
}

// Trefferzone: gelb = knapp, grün = pünktlich, dunkelgrün = perfekt. Die Linie pulsiert auf jedem Schlag.
function drawTimingZone(ctx, W, hitY) {
  const pxPerMs = FALL_PX_PER_SEC / 1000;
  const band = (ms, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, hitY - ms * pxPerMs, W, 2 * ms * pxPerMs);
  };
  band(takt.window, colors.zoneKnapp);
  band(TIMING.good, colors.zoneGood);
  band(TIMING.perfect, colors.zonePerfect);
  const phase = ((taktBeat() % 1) + 1) % 1;
  ctx.globalAlpha = 0.5 + 0.5 * Math.max(0, 1 - phase * 3);
  ctx.fillStyle = colors.felt;
  ctx.fillRect(0, hitY - 1.5, W, 3);
  ctx.globalAlpha = 1;
}

// Wo lag dein Anschlag? Über der Linie = zu früh, darunter = zu spät, mit Millisekunden.
function drawHitMarks(ctx, W, hitY, now) {
  const pxPerMs = FALL_PX_PER_SEC / 1000;
  ctx.font = "600 11px 'Instrument Sans', sans-serif";
  takt.marks.forEach((m) => {
    const age = now - m.at;
    if (age > MARK_MS || !inRange(m.midi)) return;
    const g = keyGeom(m.midi);
    const w = Math.max(16, g.width * W);
    const x = g.center * W;
    const y = hitY + m.offset * pxPerMs;
    ctx.globalAlpha = 1 - age / MARK_MS;
    ctx.fillStyle = colors[m.rating];
    ctx.fillRect(x - w / 2, y - 2, w, 4);
    ctx.fillText(`${m.offset < 0 ? "−" : "+"}${Math.round(Math.abs(m.offset))}`, x, y - 7);
  });
  ctx.globalAlpha = 1;
}
