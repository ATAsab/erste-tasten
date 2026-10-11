// Wiederholen: ein Stück oder einzelne Takte mehrmals hintereinander üben – auf Wunsch mit steigendem Tempo.
const LOOP_PAUSE_MS = 1600; // kurze Atempause zwischen zwei Runden
const LOOP_FASTER_SCORE = 0.9; // ab 90 % im Takt wird die nächste Runde 10 % schneller (bis Originaltempo)
let loopRound = 1;
let loopTimer = null;
let practiceRange = null; // { from, to } in Takten – null = ganzes Stück

const loopTotal = () => (settings.loop === "inf" ? Infinity : Number(settings.loop) || 1);
const looping = () => settings.loop !== "off";
const rangeLabel = () => (practiceRange ? `Takte ${practiceRange.from}–${practiceRange.to}` : "");

function resetLoop() {
  clearTimeout(loopTimer);
  loopTimer = null;
  loopRound = 1;
  updateLoopUi();
}

// Am Ende einer Runde: true = es geht automatisch weiter (kein Ergebnisfenster).
function continueLoop(summary, score) {
  if (!looping() || loopRound >= loopTotal()) return false;
  loopRound++;
  const faster = settings.mode === "takt" && settings.loopFaster && score >= LOOP_FASTER_SCORE && settings.taktTempo < 1;
  if (faster) saveSettings({ taktTempo: Math.min(1, Math.round((settings.taktTempo + 0.1) * 10) / 10) });
  say(`${summary} – Runde ${loopRound}${loopTotal() === Infinity ? "" : ` von ${loopTotal()}`} beginnt${faster ? `, jetzt mit ${Math.round(settings.taktTempo * 100)} % Tempo` : ""} …`, "ok");
  updateLoopUi();
  loopTimer = setTimeout(() => {
    loopTimer = null;
    syncControls();
    if (settings.mode === "takt") startTakt();
    else restart();
  }, LOOP_PAUSE_MS);
  return true;
}

// Ausschnitt aus dem Stück: nur die Schritte und Pausen der gewählten Takte, auf Takt 1 verschoben.
function applyRange(list, rests, meter, range = practiceRange) {
  if (!range) return { steps: list, rests };
  const bar = meterBeats(meter);
  const start = (range.from - 1) * bar;
  const end = range.to * bar;
  const inside = (beat) => beat >= start - 1e-6 && beat < end - 1e-6;
  return {
    steps: list.filter((s) => inside(s.beat)).map((s) => ({
      beat: s.beat - start,
      notes: s.notes.map((n) => ({ ...n, beat: n.beat - start, dur: Math.min(n.dur, end - s.beat) })),
    })),
    rests: rests.filter((r) => inside(r.beat)).map((r) => ({ ...r, beat: r.beat - start })),
  };
}

const barsOf = (list, meter) => Math.max(1, Math.ceil(endBeat(list) / meterBeats(meter) - 1e-6));

function setRange(from, to, bars) {
  const a = Math.max(1, Math.min(bars, Math.round(from) || 1));
  const b = Math.max(a, Math.min(bars, Math.round(to) || bars));
  practiceRange = a === 1 && b === bars ? null : { from: a, to: b };
  resetLoop();
  restart();
}

function updateLoopUi() {
  document.querySelectorAll('input[name="loop"]').forEach((r) => { r.checked = r.value === settings.loop; });
  $("#loop-faster").checked = Boolean(settings.loopFaster);
  const total = loopTotal();
  $("#round").textContent = looping() ? `Runde ${loopRound}${total === Infinity ? "" : `/${total}`}` : "";
  $("#range-label").textContent = rangeLabel();
  updateHotUi();
  updateTuneSummary();
}

function bindLoop() {
  document.querySelectorAll('input[name="loop"]').forEach((r) => r.addEventListener("change", () => {
    saveSettings({ loop: r.value });
    resetLoop();
  }));
  $("#loop-faster").addEventListener("change", (e) => saveSettings({ loopFaster: e.target.checked }));
  const apply = () => setRange(Number($("#range-from").value), Number($("#range-to").value), Number($("#range-to").max));
  $("#range-from").addEventListener("change", apply);
  $("#range-to").addEventListener("change", apply);
  $("#range-reset").addEventListener("click", () => setRange(1, Number($("#range-to").max), Number($("#range-to").max)));
  $("#hot-btn").addEventListener("click", practiceHotspot);
}

if (typeof module !== "undefined") module.exports = { applyRange };
