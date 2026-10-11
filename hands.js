// Hände getrennt üben: nur eine Hand spielen – die App spielt die andere auf Wunsch mit.
const HANDS_LABELS = { both: "Beide Hände", rh: "Nur rechts", lh: "Nur links" };
const HANDS_ORDER = ["both", "rh", "lh"];
const ACCOMPANY_LEVEL = 0.18; // Begleitung etwas leiser als die eigene Hand
let practiceHands = "both";

// ---------- rein (auch von music.test.js genutzt) ----------
const playsHand = (note, hand) => hand === "both" || note.hand === hand;
const ownNotes = (step, hand) => step.notes.filter((n) => playsHand(n, hand));

// Nächster Schritt ab `from`, in dem die geübte Hand etwas zu spielen hat (list.length = keiner mehr).
function nextOwnStep(list, from, hand) {
  let i = from;
  while (i < list.length && !ownNotes(list[i], hand).length) i++;
  return i;
}

// Töne der anderen Hand von Schritt `from` bis vor `to`, Schläge relativ zu `from`.
function accompanimentOf(list, from, to, hand) {
  const start = list[from].beat;
  return list.slice(from, to)
    .map((s) => ({ beat: s.beat - start, notes: s.notes.filter((n) => !playsHand(n, hand)) }))
    .filter((s) => s.notes.length);
}

// ---------- Übungsseite ----------
const isMine = (note) => playsHand(note, practiceHands);
const mineOf = (step) => ownNotes(step, practiceHands);
const handsLabel = () => (practiceHands === "both" ? "" : HANDS_LABELS[practiceHands]);
const practiceLabel = () => [rangeLabel(), handsLabel()].filter(Boolean).join(" · ");
// Mit Mikrofon würde sich die App selbst hören – dann keine Begleitung.
const accompanies = () => practiceHands !== "both" && settings.accompany && !mic;

// Schritt für Schritt: nach einem geschafften Schritt weiter zum nächsten eigenen – die andere Hand klingt im Tempo dazwischen.
function advanceStep() {
  const from = run.idx;
  run.idx = nextOwnStep(steps, from + 1, practiceHands);
  const others = accompanies() ? accompanimentOf(steps, from, run.idx, practiceHands) : [];
  if (others.length) scheduleSteps(others, lesson.tempo * settings.taktTempo, ACCOMPANY_LEVEL);
}

function setHands(hands) {
  practiceHands = hands;
  resetLoop();
  restart();
  if (hands !== "both") {
    say(`${HANDS_LABELS[hands]}: Du spielst nur die ${hands === "rh" ? "rechte" : "linke"} Hand${accompanies() ? ", die App spielt die andere leise mit" : ""}. Sterne gibt es erst mit beiden Händen.`, "info");
  }
}

function cycleHands() {
  if ($("#hands").hidden) return say("Dieses Stück hat nur eine Hand.", "info");
  setHands(HANDS_ORDER[(HANDS_ORDER.indexOf(practiceHands) + 1) % HANDS_ORDER.length]);
}

function updateHandsUi(full) {
  $("#hands").hidden = new Set(full.flatMap((s) => s.notes.map((n) => n.hand))).size < 2;
  $("#accompany-group").hidden = $("#hands").hidden;
  document.querySelectorAll('input[name="hands"]').forEach((r) => { r.checked = r.value === practiceHands; });
  $("#accompany").checked = Boolean(settings.accompany);
  $("#staff").dataset.hands = practiceHands;
}

function bindHands() {
  document.querySelectorAll('input[name="hands"]').forEach((r) => r.addEventListener("change", () => setHands(r.value)));
  $("#accompany").addEventListener("change", (e) => saveSettings({ accompany: e.target.checked }));
}

if (typeof module !== "undefined") module.exports = { ownNotes, nextOwnStep, accompanimentOf };
