// Fortschritt & Spielmechanik – reine Logik ohne DOM (auch von music.test.js genutzt).
// Tage sind lokale Datumsschlüssel "JJJJ-MM-TT"; days = { [Tag]: { ms, notes, xp, runs } }.

const LEVEL_TITLES = [
  [1, "Neuling"], [2, "Tastenentdecker"], [3, "Notenleser"], [4, "Fingerakrobat"], [5, "Melodiemacher"],
  [6, "Taktgefühl"], [7, "Liedspieler"], [8, "Begleiter"], [10, "Hausmusiker"], [12, "Klavierfreund"],
  [15, "Salonpianist"], [20, "Konzertreif"], [25, "Virtuose"],
];
// Nach erfolgreichem Wiederholen wächst der Abstand: 1, 3, 7, 14, 30, 60, 120 Tage (verteiltes Wiederholen)
const REVIEW_DAYS = [1, 3, 7, 14, 30, 60, 120];
const XP = { run: 10, takt: 15, star: 5, firstTime: 20, review: 10, section: 4, quiz: 2, read: 5, badge: 25 };

const pad = (n) => String(n).padStart(2, "0");
const dateKey = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const keyToDate = (key) => new Date(`${key}T12:00:00`); // Mittag: unempfindlich gegen Zeitumstellung
const addDays = (key, n) => {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
};

// Level n beginnt bei 50·n·(n−1) XP: 0, 100, 300, 600, 1000 … – jede Stufe dauert etwas länger.
const levelStart = (level) => 50 * level * (level - 1);
function levelInfo(xp) {
  let level = 1;
  while (xp >= levelStart(level + 1)) level++;
  const title = LEVEL_TITLES.filter(([from]) => from <= level).at(-1)[1];
  const start = levelStart(level);
  const next = levelStart(level + 1);
  return { level, title, xp, into: xp - start, needed: next - start, next };
}

const totals = (days) => Object.values(days).reduce(
  (sum, d) => ({ ms: sum.ms + (d.ms ?? 0), notes: sum.notes + (d.notes ?? 0), xp: sum.xp + (d.xp ?? 0), runs: sum.runs + (d.runs ?? 0) }),
  { ms: 0, notes: 0, xp: 0, runs: 0 },
);

// Serie: Tage am Stück mit erreichtem Tagesziel. Heute zählt mit, sobald das Ziel erreicht ist –
// ist es noch nicht erreicht, bleibt die Serie von gestern bestehen.
function streakOf(days, goalMs, today) {
  const met = (key) => (days[key]?.ms ?? 0) >= goalMs;
  let key = met(today) ? today : addDays(today, -1);
  let count = 0;
  while (met(key)) {
    count++;
    key = addDays(key, -1);
  }
  return count;
}

function bestStreak(days, goalMs) {
  const keys = Object.keys(days).filter((k) => days[k].ms >= goalMs).sort();
  let best = 0;
  let run = 0;
  keys.forEach((k, i) => {
    run = i > 0 && addDays(keys[i - 1], 1) === k ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

// Wiederholungsplan: Erfolg zum Fälligkeitstag (oder später) → nächste Stufe, Misserfolg → morgen nochmal.
// Vorzeitiges Üben schadet nicht, schiebt aber nicht vor.
function scheduleReview(entry, success, today) {
  if (!success) return entry ? { ...entry, stage: 0, due: addDays(today, 1), last: today } : null;
  const wasDue = !entry || entry.due <= today;
  const stage = entry ? (wasDue ? Math.min(entry.stage + 1, REVIEW_DAYS.length - 1) : entry.stage) : 0;
  return { stage, due: addDays(today, REVIEW_DAYS[stage]), last: today, reviews: (entry?.reviews ?? 0) + (entry && wasDue ? 1 : 0) };
}

const dueReviews = (review, today) =>
  Object.entries(review).filter(([, e]) => e.due <= today).map(([id, e]) => ({ id, ...e })).sort((a, b) => a.due.localeCompare(b.due));

// Minuten je Woche (Montag–Sonntag) für die letzten `weeks` Wochen, älteste zuerst.
function weeklyMinutes(days, today, weeks) {
  const weekday = (keyToDate(today).getDay() + 6) % 7; // Montag = 0
  const monday = addDays(today, -weekday);
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(monday, -7 * (weeks - 1 - i));
    const minutes = Array.from({ length: 7 }, (_, d) => days[addDays(start, d)]?.ms ?? 0).reduce((a, b) => a + b, 0) / 60000;
    return { start, minutes: Math.round(minutes) };
  });
}

// ---------- Monatsrückblick ----------
// Monate als "JJJJ-MM".
function addMonths(month, n) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
const daysInMonth = (month) => new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();

function monthSummary(days, month, goalMs) {
  const keys = Object.keys(days).filter((k) => k.startsWith(`${month}-`)).sort();
  const sum = totals(Object.fromEntries(keys.map((k) => [k, days[k]])));
  const active = keys.filter((k) => (days[k].ms ?? 0) > 0);
  let longestRun = 0;
  let run = 0;
  active.forEach((k, i) => {
    run = i > 0 && addDays(active[i - 1], 1) === k ? run + 1 : 1;
    longestRun = Math.max(longestRun, run);
  });
  const best = active.reduce((top, k) => (!top || days[k].ms > days[top].ms ? k : top), null);
  return {
    month, ...sum, minutes: Math.round(sum.ms / 60000), activeDays: active.length,
    goalDays: keys.filter((k) => days[k].ms >= goalMs).length, longestRun,
    bestDay: best && { key: best, minutes: Math.round(days[best].ms / 60000) },
  };
}

// Abzeichen: test(state) mit state = { progress, lessonsByChapter, days, totals, streak, best, quiz, read, theoryCount, historyCount, review, recordings }
const BADGES = [
  { id: "erster-ton", icon: "♪", title: "Erster Ton", text: "Den ersten Ton gespielt.", test: (s) => s.totals.notes >= 1 },
  { id: "erste-lektion", icon: "★", title: "Erste Lektion", text: "Eine Lektion abgeschlossen.", test: (s) => Object.values(s.progress).some((p) => p.stars) },
  { id: "ohne-netz", icon: "✦", title: "Ohne Netz", text: "Drei Sterne – ganz ohne Hilfen.", test: (s) => Object.values(s.progress).some((p) => p.stars === 3) },
  { id: "im-takt", icon: "♩", title: "Im Takt", text: "Eine Übung im Takt-Modus geschafft.", test: (s) => Object.values(s.progress).some((p) => p.takt) },
  { id: "metronom-meister", icon: "⏱", title: "Metronom-Meister", text: "Drei Sterne im Takt – im Originaltempo.", test: (s) => Object.values(s.progress).some((p) => p.takt === 3) },
  { id: "kapitel-1", icon: "🎹", title: "Klaviatur-Kenner", text: "Kapitel 1 komplett.", test: (s) => s.chapterDone(0) },
  { id: "kapitel-3", icon: "𝄞", title: "Notenleser", text: "Kapitel 3 komplett.", test: (s) => s.chapterDone(2) },
  { id: "kapitel-7", icon: "🙌", title: "Beidhändig", text: "Kapitel 7 komplett.", test: (s) => s.chapterDone(6) },
  { id: "kurs", icon: "🎓", title: "Kursabschluss", text: "Alle Lektionen mit mindestens einem Stern.", test: (s) => s.courseDone() },
  { id: "bibliothek", icon: "📚", title: "Bücherwurm", text: "Ein Stück aus der Bibliothek geschafft.", test: (s) => Object.entries(s.progress).some(([id, p]) => /^[smu]-/.test(id) && p.stars) },
  { id: "serie-3", icon: "🔥", title: "Dranbleiber", text: "3 Tage in Folge das Tagesziel erreicht.", test: (s) => s.best >= 3 },
  { id: "serie-7", icon: "🔥", title: "Eine Woche am Stück", text: "7 Tage in Folge das Tagesziel erreicht.", test: (s) => s.best >= 7 },
  { id: "serie-30", icon: "🏆", title: "Ein Monat am Stück", text: "30 Tage in Folge das Tagesziel erreicht.", test: (s) => s.best >= 30 },
  { id: "stunde-1", icon: "⌛", title: "Erste Stunde", text: "Insgesamt 1 Stunde geübt.", test: (s) => s.totals.ms >= 3.6e6 },
  { id: "stunden-10", icon: "⌛", title: "Zehn Stunden", text: "Insgesamt 10 Stunden geübt.", test: (s) => s.totals.ms >= 3.6e7 },
  { id: "stunden-50", icon: "💎", title: "Fünfzig Stunden", text: "Insgesamt 50 Stunden geübt.", test: (s) => s.totals.ms >= 1.8e8 },
  { id: "noten-1000", icon: "🎶", title: "Tausend Töne", text: "1.000 Töne gespielt.", test: (s) => s.totals.notes >= 1000 },
  { id: "noten-10000", icon: "🎼", title: "Zehntausend Töne", text: "10.000 Töne gespielt.", test: (s) => s.totals.notes >= 10000 },
  { id: "repertoire-5", icon: "🗂", title: "Repertoire", text: "5 Stücke im Wiederholungsplan.", test: (s) => Object.keys(s.review).length >= 5 },
  { id: "gefestigt", icon: "🧱", title: "Gefestigt", text: "Ein Stück fünfmal pünktlich wiederholt.", test: (s) => Object.values(s.review).some((r) => r.stage >= 5) },
  { id: "quiz-ass", icon: "✓", title: "Quiz-Ass", text: "Ein Quiz ohne Fehler.", test: (s) => Object.values(s.quiz).some((q) => q.right === q.total) },
  { id: "theorie", icon: "📖", title: "Theorie-Profi", text: "Alle Theorie-Themen gelesen.", test: (s) => Object.keys(s.read).filter((k) => k.startsWith("theorie/")).length >= s.theoryCount },
  { id: "geschichte", icon: "🏛", title: "Musikhistoriker", text: "Alle Geschichtskapitel gelesen.", test: (s) => Object.keys(s.read).filter((k) => k.startsWith("geschichte/")).length >= s.historyCount },
  { id: "aufnahme", icon: "🎙", title: "Aufgenommen", text: "Die erste eigene Aufnahme gemacht.", test: (s) => s.recordings > 0 },
];

BADGES.push(
  { id: "notenjaeger", icon: "🎯", title: "Notenjäger", text: "20 Noten in einer Notenjagd.", test: (s) => Object.values(s.hunt).some((h) => h.best >= 20) },
  { id: "blitzleser", icon: "⚡", title: "Blitzleser", text: "30 Noten in einer Notenjagd (Mittel oder Schwer).", test: (s) => (s.hunt.mittel?.best ?? 0) >= 30 || (s.hunt.schwer?.best ?? 0) >= 30 },
  { id: "gesichert", icon: "💾", title: "Gut gesichert", text: "Den Fortschritt als Datei gesichert.", test: (s) => Boolean(s.meta.lastBackup) },
);

const newBadges = (state, earned) => BADGES.filter((b) => !earned[b.id] && b.test(state));

// ---------- Fehlerstellen ----------
// Fehler je Takt; bei jedem neuen Durchgang verblassen alte Fehler – saubere Durchgänge lassen eine Stelle verschwinden.
const ERROR_DECAY = 0.6;
const ERROR_MIN = 0.5;
const round2 = (n) => Math.round(n * 100) / 100;

// range = gespielte Takte { from, to } – nur dort verblassen alte Fehler (null = ganzes Stück).
function commitErrors(map = {}, runErrors = {}, range = null) {
  const played = (bar) => !range || (bar >= range.from && bar <= range.to);
  const next = {};
  Object.entries(map).forEach(([bar, value]) => {
    const faded = played(Number(bar)) ? value * ERROR_DECAY : value;
    if (faded >= ERROR_MIN) next[bar] = round2(faded);
  });
  Object.entries(runErrors).forEach(([bar, count]) => { next[bar] = round2((next[bar] ?? 0) + count); });
  return next;
}

// Die schwierigsten Stellen: stärkster Takt plus Nachbarn mit mindestens halb so vielen Fehlern (höchstens 4 Takte).
// Eine Stelle zählt erst ab minScore – ein einzelner Ausrutscher ist noch keine Fehlerstelle.
function findHotspots(map = {}, limit = 3, maxSpan = 4, minScore = 2) {
  const value = (bar) => map[bar] ?? 0;
  const ranked = Object.keys(map).map(Number).filter((bar) => value(bar) >= 1).sort((a, b) => value(b) - value(a));
  const used = new Set();
  const spots = [];
  for (const bar of ranked) {
    if (used.has(bar) || spots.length >= limit) continue;
    const strong = (b) => !used.has(b) && value(b) >= value(bar) * 0.5;
    let from = bar;
    let to = bar;
    while (to - from + 1 < maxSpan && strong(to + 1)) to++;
    while (to - from + 1 < maxSpan && strong(from - 1)) from--;
    for (let b = from; b <= to; b++) used.add(b);
    let score = 0;
    for (let b = from; b <= to; b++) score += value(b);
    if (score >= minScore) spots.push({ from, to, score: Math.round(score) });
  }
  return spots;
}

if (typeof module !== "undefined") {
  module.exports = {
    REVIEW_DAYS, XP, BADGES, dateKey, addDays, levelStart, levelInfo, totals, streakOf, bestStreak,
    scheduleReview, dueReviews, weeklyMinutes, newBadges, commitErrors, findHotspots, monthSummary, addMonths, daysInMonth,
  };
}
