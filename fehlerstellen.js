// Fehlerstellen: Fehler je Takt sammeln, schwierige Takte im Notenbild markieren und gezielt in Schleife üben.
let barErrors = {}; // Fehler des laufenden Durchgangs { Takt im ganzen Stück: Gewicht }

const errorMaps = () => store.get("et-errors", {});
const hotspots = () => (lesson && !lesson.drill ? findHotspots(errorMaps()[lesson.id]) : []);
const spotLabel = (spot) => (spot.from === spot.to ? `Takt ${spot.from}` : `Takte ${spot.from}–${spot.to}`);
const isCurrentRange = (spot) => practiceRange?.from === spot.from && practiceRange?.to === spot.to;
const nextHotspot = () => hotspots().find((spot) => !isCurrentRange(spot));

// beat = Schlag im (ggf. ausgeschnittenen) Notenbild → Taktnummer im ganzen Stück
function noteError(beat, weight = 1) {
  if (lesson.drill) return; // Zufallsübungen haben keine festen Takte
  const clamped = Math.min(Math.max(beat, 0), endBeat(steps) - 1e-3);
  const bar = Math.floor(clamped / meterBeats(lesson.meter) + 1e-6) + (practiceRange?.from ?? 1);
  barErrors = { ...barErrors, [bar]: (barErrors[bar] ?? 0) + weight };
}

// Nach einem kompletten Durchgang: neue Fehler dazu, alte Fehler in den gespielten Takten verblassen.
function saveErrors() {
  if (lesson.drill) return;
  const others = Object.fromEntries(Object.entries(errorMaps()).filter(([id]) => id !== lesson.id));
  const next = commitErrors(errorMaps()[lesson.id], barErrors, practiceRange);
  store.set("et-errors", Object.keys(next).length ? { ...others, [lesson.id]: next } : others);
  barErrors = {};
  markHotBars();
  updateHotUi();
}

// Rote Flächen hinter den Fehlerstellen im Notenbild
function markHotBars() {
  const svg = $("#staff svg");
  if (!svg) return;
  svg.querySelectorAll(".hot-bar").forEach((r) => r.remove());
  const barBeats = meterBeats(lesson.meter);
  const first = practiceRange?.from ?? 1;
  const last = first + barsOf(steps, lesson.meter) - 1;
  const height = Number(svg.getAttribute("height"));
  const rects = hotspots().flatMap((spot) => {
    const from = Math.max(spot.from, first);
    const to = Math.min(spot.to, last);
    if (from > to) return [];
    const x1 = from === first ? staffXAt(0) - 20 : staffXAt((from - first) * barBeats) - 22;
    const x2 = staffXAt((to - first + 1) * barBeats) - 22;
    return [`<rect class="hot-bar" x="${x1}" y="6" width="${x2 - x1}" height="${height - 12}" rx="8"><title>Fehlerstelle: ${spotLabel(spot)}</title></rect>`];
  });
  svg.insertAdjacentHTML("afterbegin", rects.join(""));
}

function updateHotUi() {
  const spot = nextHotspot();
  $("#hot-btn").hidden = !spot;
  $("#hot-result").hidden = !spot;
  if (!spot) return;
  $("#hot-btn").textContent = `⚑ Fehlerstelle üben: ${spotLabel(spot)}`;
  $("#hot-result").textContent = `⚑ ${spotLabel(spot)} üben`;
}

// Fehlerstelle als Ausschnitt in Schleife – ohne gewählte Wiederholung 3 Runden.
function practiceHotspot() {
  const spot = nextHotspot();
  if (!spot) return;
  if (!looping()) saveSettings({ loop: "3" });
  setRange(spot.from, spot.to, Number($("#range-to").max));
  const rounds = loopTotal() === Infinity ? "immer wieder" : `${loopTotal()}-mal`;
  say(`${spotLabel(spot)} in Schleife: Spiel die Stelle ${rounds} – langsam und sauber${settings.mode === "takt" ? " (mit „Start“)" : ""}. Saubere Runden lassen die Markierung verblassen.`, "info");
}
