// Aufnehmen und Anhören: speichert gespielte Töne (USB-Keyboard, Maus, Mikrofon) je Übung.
// Wiedergabe über den eingebauten Klang oder – wenn möglich – über das Keyboard selbst.
const MAX_REC_EVENTS = 6000;
const TAP_MS = 350; // Maus und Mikrofon melden kein Loslassen – angenommene Tondauer
const DEFAULT_VELOCITY = 80;
let rec = null; // laufende Aufnahme
let recPlay = null; // laufende Wiedergabe
let midiOutput = null; // von initMidi gesetzt, wenn das Keyboard Töne empfangen kann

const recordings = () => store.get("et-rec", {});

function recordNote(midi, velocity, time, duration = null) {
  if (!rec) return;
  if (rec.events.length >= MAX_REC_EVENTS) {
    stopRecord();
    return say("Die Aufnahme ist voll und wurde gespeichert.", "info");
  }
  const t = time - rec.start;
  rec.events.push([1, midi, velocity ?? DEFAULT_VELOCITY, Math.round(t)]);
  if (duration !== null) rec.events.push([0, midi, 0, Math.round(t + duration)]);
}

function recordRelease(midi, time) {
  if (rec) rec.events.push([0, midi, 0, Math.round(time - rec.start)]);
}

function toggleRecord() {
  if (rec) return stopRecord();
  stopRecPlay();
  rec = { key: lesson.id, start: performance.now(), events: [], range: practiceRange, hands: practiceHands };
  rec.timer = setInterval(updateRecUi, 250);
  updateRecUi();
  say("Aufnahme läuft – spiel einfach los. Nochmal klicken (oder Taste A) beendet sie.", "info");
}

function stopRecord() {
  if (!rec) return;
  clearInterval(rec.timer);
  const { key, events, range, hands } = rec;
  rec = null;
  const count = events.filter((e) => e[0]).length;
  if (!count) say("Es wurden keine Töne aufgenommen.", "info");
  else if (store.set("et-rec", { ...recordings(), [key]: { date: Date.now(), events, range, hands } })) {
    say(`Aufnahme gespeichert (${count} Töne). Hör sie dir mit „▶ Meine Aufnahme“ an.`, "ok");
    checkBadges();
    // gleich auswerten – aber nicht, wenn die Aufnahme durch einen Seitenwechsel endet
    const sameLesson = () => key === lesson.id && PRACTICE_SECTIONS.includes(section) && !lesson.drill;
    if (count >= 4) setTimeout(() => sameLesson() && showRecReport(), 0);
  } else {
    say("Die Aufnahme konnte nicht gespeichert werden (Speicher voll?).", "bad");
  }
  updateRecUi();
}

// An/Aus-Ereignisse zu Tönen mit Start und Ende zusammensetzen
function recordingNotes(events) {
  const open = new Map();
  const notes = [];
  [...events].sort((a, b) => a[3] - b[3]).forEach(([on, midi, velocity, t]) => {
    if (on) return open.set(midi, { midi, velocity, start: t });
    const note = open.get(midi);
    if (note) notes.push({ ...note, end: Math.max(t, note.start + 60) });
    open.delete(midi);
  });
  open.forEach((note) => notes.push({ ...note, end: note.start + TAP_MS }));
  return notes.sort((a, b) => a.start - b.start);
}

function toggleRecPlay() {
  if (recPlay) return stopRecPlay();
  const saved = recordings()[lesson.id];
  if (!saved) return say("Für diese Übung gibt es noch keine Aufnahme.", "info");
  stopRecord();
  stopPlay();
  stopTakt();
  const notes = recordingNotes(saved.events);
  const first = notes[0].start; // Stille am Anfang überspringen
  const viaKeyboard = Boolean(settings.recViaKeyboard && midiOutput);
  const ctx = audio();
  const out = ctx.createGain();
  out.connect(ctx.destination);
  const lead = 0.15;
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, lead * 1000 + ms));
  notes.forEach((n) => {
    const start = n.start - first;
    const end = n.end - first;
    if (viaKeyboard) {
      at(start, () => midiOutput.send([0x90, n.midi, n.velocity]));
      at(end, () => midiOutput.send([0x80, n.midi, 0]));
    } else {
      tone(n.midi, ctx.currentTime + lead + start / 1000, (end - start) / 1000, out, 0.04 + (n.velocity / 127) * 0.4);
    }
    at(start, () => keyEl(n.midi)?.classList.add("down"));
    at(end, () => keyEl(n.midi)?.classList.remove("down"));
  });
  at(Math.max(...notes.map((n) => n.end)) - first + 800, stopRecPlay);
  recPlay = { out, timers, viaKeyboard };
  updateRecUi();
}

function stopRecPlay() {
  if (!recPlay) return;
  recPlay.timers.forEach(clearTimeout);
  fadeOut(recPlay.out);
  if (recPlay.viaKeyboard) midiOutput.send([0xb0, 123, 0]); // „All Notes Off“
  document.querySelectorAll("#keyboard .key.down").forEach((k) => k.classList.remove("down"));
  recPlay = null;
  quietUntil = performance.now() + 700;
  updateRecUi();
}

function updateRecUi() {
  const button = $("#rec-btn");
  if (rec) {
    const secs = Math.floor((performance.now() - rec.start) / 1000);
    button.textContent = `■ Stopp ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  } else {
    button.textContent = "● Aufnehmen";
  }
  button.classList.toggle("recording", Boolean(rec));
  const hasRecording = Boolean(lesson && recordings()[lesson.id]);
  $("#rec-play").disabled = !hasRecording && !recPlay;
  $("#rec-play").textContent = recPlay ? "■ Stopp" : "▶ Meine Aufnahme";
  $("#rec-report-btn").disabled = !hasRecording || Boolean(lesson?.drill);
  $("#rec-via-label").hidden = !midiOutput;
  $("#rec-via").checked = Boolean(settings.recViaKeyboard);
}
