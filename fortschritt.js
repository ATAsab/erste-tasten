// Fortschritt: Übungszeit messen, XP & Abzeichen vergeben, Einblendungen, Seitenleisten-Karte und Fortschrittsseite.
const IDLE_MS = 20000; // längere Pausen zwischen zwei Tönen zählen nicht als Übungszeit
const SAVE_EVERY_MS = 5000;
const GOAL_CHOICES = [5, 10, 15, 20, 30];
const HEAT_WEEKS = 18;
const BAR_WEEKS = 12;
const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
let activity = { last: 0, ms: 0, notes: 0, savedAt: 0 };
let reviewMonth = null; // angezeigter Monat im Rückblick ("JJJJ-MM"), null = aktueller
const MONTH_NAMES = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });
const heatLevel = (ms) => (ms <= 0 ? 0 : ms < 5 * 60000 ? 1 : ms < 15 * 60000 ? 2 : ms < 30 * 60000 ? 3 : 4);

const daysData = () => store.get("et-days", {});
const goalMs = () => (settings.dailyGoal ?? 15) * 60000;
const earnedBadges = () => store.get("et-badges", {});
const formatMinutes = (ms) => {
  const min = Math.round(ms / 60000);
  return min < 60 ? `${min} Min` : `${Math.floor(min / 60)} Std ${min % 60} Min`;
};
const formatDay = (key) => new Date(`${key}T12:00:00`).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });

// ---------- Messen & Belohnen ----------

function addToday(patch) {
  const today = dateKey();
  const days = daysData();
  const day = days[today] ?? { ms: 0, notes: 0, xp: 0, runs: 0 };
  const goalBefore = day.ms >= goalMs();
  const next = Object.fromEntries(Object.entries(day).map(([k, v]) => [k, v + (patch[k] ?? 0)]));
  store.set("et-days", { ...days, [today]: { ...day, ...next } });
  if (!goalBefore && next.ms >= goalMs()) {
    toast("🔥", "Tagesziel erreicht!", `Serie: ${streakOf(daysData(), goalMs(), today)} ${streakOf(daysData(), goalMs(), today) === 1 ? "Tag" : "Tage"}`, "goal");
  }
}

// Jeder gespielte Ton zählt; die Zeit zwischen zwei Tönen nur, wenn die Pause kurz ist.
function trackNote(time) {
  const gap = time - activity.last;
  activity = { ...activity, last: time, ms: activity.ms + (gap > 0 && gap < IDLE_MS ? gap : 0), notes: activity.notes + 1 };
  if (time - activity.savedAt > SAVE_EVERY_MS) flushActivity();
}

function flushActivity() {
  if (!activity.ms && !activity.notes) return;
  const { ms, notes } = activity;
  activity = { ...activity, ms: 0, notes: 0, savedAt: performance.now() };
  addToday({ ms: Math.round(ms), notes });
  checkBadges();
  renderMeCard();
}

function awardXp(xp, label) {
  const before = levelInfo(totals(daysData()).xp);
  addToday({ xp });
  const after = levelInfo(totals(daysData()).xp);
  if (label) toast("✦", `+${xp} XP`, label, "xp");
  if (after.level > before.level) toast(String(after.level), `Level ${after.level} erreicht!`, after.title, "level");
  renderMeCard();
}

// Nach jedem kompletten Durchgang: XP, Wiederholungsplan, Abzeichen.
function recordRun({ id, mode, stars, firstTime, fullRun }) {
  if (!fullRun) return awardXp(XP.section + stars, "Abschnitt geübt");
  const today = dateKey();
  const reviews = store.get("et-review", {});
  const before = reviews[id];
  const success = stars >= 2;
  const next = scheduleReview(before, success, today);
  if (next) store.set("et-review", { ...reviews, [id]: next });
  const reviewed = success && before && before.due <= today;
  const xp = (mode === "takt" ? XP.takt : XP.run) + stars * XP.star + (firstTime ? XP.firstTime : 0) + (reviewed ? XP.review : 0);
  addToday({ runs: 1 });
  const learned = store.get("et-learned", {});
  if (firstTime && !learned[id]) store.set("et-learned", { ...learned, [id]: today });
  awardXp(xp, reviewed ? "Wiederholt – gut gefestigt!" : firstTime ? "Neu gelernt" : "Durchgang geschafft");
  if (!before && next) toast("🗂", "Im Wiederholungsplan", `Wiederholen am ${formatDay(next.due)}`, "info");
  checkBadges();
}

function badgeState() {
  const days = daysData();
  const chapterDone = (index) => CHAPTERS[index].lessons.every((l) => progress[l.id]?.stars);
  return {
    progress, days, totals: totals(days), best: bestStreak(days, goalMs()),
    review: store.get("et-review", {}), quiz: store.get("et-quiz", {}), read: store.get("et-read", {}),
    recordings: Object.keys(store.get("et-rec", {})).length,
    hunt: store.get("et-hunt", {}), meta: store.get("et-meta", {}),
    theoryCount: THEORY.length, historyCount: PEOPLE.length,
    chapterDone, courseDone: () => LESSONS.every((l) => progress[l.id]?.stars),
  };
}

function checkBadges() {
  const earned = earnedBadges();
  const fresh = newBadges(badgeState(), earned);
  if (!fresh.length) return;
  const today = dateKey();
  store.set("et-badges", { ...earned, ...Object.fromEntries(fresh.map((b) => [b.id, today])) });
  fresh.forEach((b) => toast(b.icon, `Abzeichen: ${b.title}`, b.text, "badge"));
  awardXp(fresh.length * XP.badge);
}

// ---------- Einblendungen ----------

function toast(icon, title, text, kind) {
  const box = $("#toasts");
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.innerHTML = `<span class="toast-icon" aria-hidden="true"></span><div><b></b><small></small></div>`;
  el.querySelector(".toast-icon").textContent = icon;
  el.querySelector("b").textContent = title;
  el.querySelector("small").textContent = text ?? "";
  box.append(el);
  setTimeout(() => el.classList.add("out"), kind === "level" ? 5000 : 3200);
  setTimeout(() => el.remove(), kind === "level" ? 5600 : 3800);
}

// ---------- Seitenleisten-Karte ----------

function renderMeCard() {
  const days = daysData();
  const today = dateKey();
  const info = levelInfo(totals(days).xp);
  const todayMs = days[today]?.ms ?? 0;
  const goal = goalMs();
  const due = dueReviews(store.get("et-review", {}), today).length;
  const streak = streakOf(days, goal, today);
  $("#today-link-sub").textContent = due ? `${due} zum Wiederholen` : "Dein Plan";
  $("#me-card").innerHTML = `
    <span class="me-level" aria-hidden="true">${info.level}</span>
    <span class="me-text"><b>Level ${info.level} · ${info.title}</b>
      <span class="bar" role="progressbar" aria-label="Erfahrung bis Level ${info.level + 1}" aria-valuemin="0" aria-valuemax="${info.needed}" aria-valuenow="${info.into}">
        <i style="width:${(info.into / info.needed) * 100}%"></i></span>
      <small>${info.into} / ${info.needed} XP</small></span>
    <span class="me-row">
      <span title="Tage in Folge mit erreichtem Tagesziel">🔥 ${streak}</span>
      <span class="bar small" role="progressbar" aria-label="Tagesziel heute" aria-valuemin="0" aria-valuemax="${goal / 60000}" aria-valuenow="${Math.round(todayMs / 60000)}">
        <i style="width:${Math.min(1, todayMs / goal) * 100}%"></i></span>
      <span>${Math.round(todayMs / 60000)}/${goal / 60000} Min</span>
    </span>
    ${due ? `<span class="me-due">↻ ${due} ${due === 1 ? "Stück" : "Stücke"} zum Wiederholen</span>` : ""}`;
}

// ---------- Fortschrittsseite ----------

function itemOf(id) {
  const l = LESSONS.find((x) => x.id === id);
  if (l) return { title: l.title, href: `#/ueben/${l.id}`, kind: `Lektion ${l.number}` };
  const p = allPieces().find((x) => x.id === id);
  return p ? { title: p.title, href: `#/stueck/${p.id}`, kind: "Bibliothek" } : null;
}

const stageDots = (stage) =>
  `<span class="fest" aria-label="Festigung ${stage + 1} von ${REVIEW_DAYS.length}">${REVIEW_DAYS.map((_, i) => `<i class="${i <= stage ? "on" : ""}"></i>`).join("")}</span>`;

function heatmapHtml(days, today) {
  const weekday = (new Date(`${today}T12:00:00`).getDay() + 6) % 7;
  const start = addDays(today, -weekday - 7 * (HEAT_WEEKS - 1));
  const cells = [];
  for (let w = 0; w < HEAT_WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const key = addDays(start, w * 7 + d);
      const ms = days[key]?.ms ?? 0;
      const future = key > today;
      const tip = `${formatDay(key)}: ${future ? "–" : formatMinutes(ms)}`;
      cells.push(`<span class="cell l${future ? "x" : heatLevel(ms)}${key === today ? " today" : ""}" style="grid-column:${w + 2};grid-row:${d + 1}" data-tip="${tip}" aria-label="${tip}"></span>`);
    }
  }
  const labels = WEEKDAYS.map((name, d) => (d % 2 === 0 ? `<span class="wd" style="grid-row:${d + 1}">${name}</span>` : "")).join("");
  return `<div class="heatmap" role="img" aria-label="Übungsminuten der letzten ${HEAT_WEEKS} Wochen">${labels}${cells.join("")}</div>
    <p class="heat-legend" aria-hidden="true">weniger <span class="cell l0"></span><span class="cell l1"></span><span class="cell l2"></span><span class="cell l3"></span><span class="cell l4"></span> mehr</p>`;
}

// Säulen: Minuten pro Woche, eine Reihe → keine Legende; Wert an der aktuellen Woche und am Maximum.
function weekChartHtml(weeks) {
  const max = Math.max(30, ...weeks.map((w) => w.minutes));
  const step = max > 300 ? 120 : max > 120 ? 60 : max > 60 ? 30 : 15;
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const W = 560;
  const H = 180;
  const padL = 34;
  const slot = (W - padL) / weeks.length;
  const barW = Math.min(24, slot - 8);
  const y = (v) => H - 22 - ((H - 34) * v) / top;
  const maxIndex = weeks.reduce((best, w, i) => (w.minutes > weeks[best].minutes ? i : best), 0);
  const grid = ticks.map((t) => `<line class="grid" x1="${padL}" x2="${W}" y1="${y(t)}" y2="${y(t)}"/><text class="tick" x="${padL - 6}" y="${y(t) + 4}">${t}</text>`).join("");
  const bars = weeks.map((w, i) => {
    const x = padL + i * slot + (slot - barW) / 2;
    const h = H - 22 - y(w.minutes);
    const r = Math.min(4, h / 2);
    const label = i === weeks.length - 1 || (i === maxIndex && w.minutes > 0)
      ? `<text class="value" x="${x + barW / 2}" y="${y(w.minutes) - 6}">${w.minutes}</text>` : "";
    const d = h > 0 ? `M${x},${H - 22} v${-(h - r)} q0,${-r} ${r},${-r} h${barW - 2 * r} q${r},0 ${r},${r} v${h - r} z` : "";
    const tip = `Woche ab ${formatDay(w.start)}: ${w.minutes} Min`;
    return `<g class="col${i === weeks.length - 1 ? " now" : ""}" data-tip="${tip}"><rect class="hit" x="${padL + i * slot}" y="0" width="${slot}" height="${H - 22}"/>${d ? `<path d="${d}"/>` : ""}${label}
      ${i % 2 === weeks.length % 2 ? "" : `<text class="tick x" x="${x + barW / 2}" y="${H - 6}">${new Date(`${w.start}T12:00:00`).toLocaleDateString("de-DE", { day: "numeric", month: "numeric" })}</text>`}</g>`;
  }).join("");
  return `<svg class="week-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Übungsminuten pro Woche">${grid}${bars}</svg>`;
}

// ---------- Monatsrückblick ----------

function monthCalendarHtml(days, month, today) {
  const first = `${month}-01`;
  const offset = (new Date(`${first}T12:00:00`).getDay() + 6) % 7; // Montag = 0
  const cells = Array.from({ length: daysInMonth(month) }, (_, i) => {
    const key = addDays(first, i);
    const ms = days[key]?.ms ?? 0;
    const tip = `${formatDay(key)}: ${key > today ? "–" : formatMinutes(ms)}`;
    return `<span class="cell l${key > today ? "x" : heatLevel(ms)}${key === today ? " today" : ""}" ${i === 0 ? `style="grid-column:${offset + 1}"` : ""} data-tip="${tip}" aria-label="${tip}"><i>${i + 1}</i></span>`;
  });
  return `<div class="month-cal" role="img" aria-label="Übungsminuten pro Tag im ${MONTH_NAMES.format(new Date(`${first}T12:00:00`))}">
    ${WEEKDAYS.map((w) => `<span class="wd">${w}</span>`).join("")}${cells.join("")}</div>`;
}

function compareHtml(now, before) {
  if (!before) return now ? "<small>neu dabei</small>" : "<small>–</small>";
  const change = Math.round((now / before - 1) * 100);
  return `<small class="${change >= 0 ? "up" : "down"}">${change >= 0 ? "▲" : "▼"} ${Math.abs(change)} % zum Vormonat</small>`;
}

function monthReviewHtml(days, today) {
  const current = today.slice(0, 7);
  const month = reviewMonth ?? current;
  const sum = monthSummary(days, month, goalMs());
  const prev = monthSummary(days, addMonths(month, -1), goalMs());
  const inMonth = (dict) => Object.entries(dict).filter(([, date]) => date.startsWith(`${month}-`)).map(([id]) => id);
  const learned = inMonth(store.get("et-learned", {})).map(itemOf).filter(Boolean);
  const badges = inMonth(earnedBadges()).map((id) => BADGES.find((b) => b.id === id)).filter(Boolean);
  const title = MONTH_NAMES.format(new Date(`${month}-01T12:00:00`));
  const headline = sum.activeDays
    ? `Du hast an <b>${sum.activeDays} ${sum.activeDays === 1 ? "Tag" : "Tagen"}</b> geübt – zusammen <b>${formatMinutes(sum.ms)}</b>. Dein bester Tag: ${formatDay(sum.bestDay.key)} mit ${sum.bestDay.minutes} Minuten.`
    : month === current ? "Dieser Monat ist noch frisch – jeder gespielte Ton zählt." : "In diesem Monat hast du nicht geübt.";
  return `<section class="card month-review" id="month-review" aria-labelledby="month-title">
    <div class="month-head">
      <button class="month-nav" type="button" data-month="-1" aria-label="Vormonat">‹</button>
      <h2 id="month-title">Monatsrückblick <span>${title}</span></h2>
      <button class="month-nav" type="button" data-month="1" aria-label="Nächster Monat" ${month >= current ? "disabled" : ""}>›</button>
    </div>
    <p class="month-line">${headline}</p>
    <div class="month-body">
      <div class="month-tiles">
        <div class="tile"><span>Übungszeit</span><b>${formatMinutes(sum.ms)}</b>${compareHtml(sum.ms, prev.ms)}</div>
        <div class="tile"><span>Übungstage</span><b>${sum.activeDays} / ${daysInMonth(month)}</b><small>Tagesziel an ${sum.goalDays} ${sum.goalDays === 1 ? "Tag" : "Tagen"}</small></div>
        <div class="tile"><span>Längste Serie</span><b>${sum.longestRun} ${sum.longestRun === 1 ? "Tag" : "Tage"}</b><small>am Stück geübt</small></div>
        <div class="tile"><span>Gespielte Töne</span><b>${sum.notes.toLocaleString("de-DE")}</b>${compareHtml(sum.notes, prev.notes)}</div>
      </div>
      ${monthCalendarHtml(days, month, today)}
    </div>
    <div class="month-lists">
      <div><h3>Neu gelernt</h3>${learned.length
        ? `<ul>${learned.map((it) => `<li><a href="${it.href}">${escapeHtml(it.title)}</a><small>${it.kind}</small></li>`).join("")}</ul>`
        : "<p class=\"fine\">Noch nichts Neues geschafft – das erste Stück mit einem Stern landet hier.</p>"}</div>
      <div><h3>Abzeichen</h3>${badges.length
        ? `<ul>${badges.map((b) => `<li><span aria-hidden="true">${b.icon}</span> ${b.title}</li>`).join("")}</ul>`
        : "<p class=\"fine\">Keine neuen Abzeichen in diesem Monat.</p>"}</div>
    </div>
  </section>`;
}

function renderDashboard(month = null) {
  const jump = /^\d{4}-\d{2}$/.test(month ?? "");
  if (jump) {
    reviewMonth = month;
    setTimeout(() => $("#month-review")?.scrollIntoView({ block: "start" }), 0); // nach dem Hochscrollen der Navigation
  }
  flushActivity();
  const days = daysData();
  const today = dateKey();
  const sum = totals(days);
  const info = levelInfo(sum.xp);
  const goal = goalMs();
  const todayMs = days[today]?.ms ?? 0;
  const review = store.get("et-review", {});
  const due = dueReviews(review, today);
  const weeks = weeklyMinutes(days, today, BAR_WEEKS);
  const earned = earnedBadges();
  const done = LESSONS.filter((l) => progress[l.id]?.stars).length;
  const starSum = (list) => list.reduce((n, l) => n + (progress[l.id]?.stars ?? 0), 0);
  const nextLesson = LESSONS.find((l) => !progress[l.id]?.stars);
  const hunts = store.get("et-hunt", {});
  const tricky = Object.entries(store.get("et-errors", {}))
    .map(([id, map]) => ({ item: itemOf(id), spot: findHotspots(map)[0] }))
    .filter((t) => t.item && t.spot)
    .sort((a, b) => b.spot.score - a.spot.score);
  const repertoire = Object.entries(review).map(([id, e]) => ({ id, ...e, item: itemOf(id) })).filter((r) => r.item).sort((a, b) => a.due.localeCompare(b.due));

  $("#dashboard").innerHTML = `
    <header class="dash-head">
      <div class="dash-level" aria-hidden="true">${info.level}</div>
      <div class="dash-title">
        <p class="eyebrow">Dein Fortschritt</p>
        <h1>Level ${info.level} · ${info.title}</h1>
        <div class="bar big" role="progressbar" aria-label="Erfahrung bis Level ${info.level + 1}" aria-valuemin="0" aria-valuemax="${info.needed}" aria-valuenow="${info.into}"><i style="width:${(info.into / info.needed) * 100}%"></i></div>
        <p class="fine">${info.into} von ${info.needed} XP bis Level ${info.level + 1} · insgesamt ${sum.xp} XP</p>
      </div>
    </header>

    <section class="tiles" aria-label="Kennzahlen">
      <div class="tile"><span>Serie</span><b>${streakOf(days, goal, today)} ${streakOf(days, goal, today) === 1 ? "Tag" : "Tage"}</b><small>Rekord: ${bestStreak(days, goal)}</small></div>
      <div class="tile"><span>Übungszeit gesamt</span><b>${formatMinutes(sum.ms)}</b><small>an ${Object.values(days).filter((d) => d.ms > 0).length} Tagen</small></div>
      <div class="tile"><span>Diese Woche</span><b>${weeks.at(-1).minutes} Min</b><small>Vorwoche: ${weeks.at(-2).minutes} Min</small></div>
      <div class="tile"><span>Gespielte Töne</span><b>${sum.notes.toLocaleString("de-DE")}</b><small>${sum.runs} Durchgänge</small></div>
    </section>

    <div class="dash-grid">
      <section class="card">
        <h2>Tagesziel</h2>
        <div class="bar big goal" role="progressbar" aria-label="Tagesziel heute" aria-valuemin="0" aria-valuemax="${goal / 60000}" aria-valuenow="${Math.round(todayMs / 60000)}"><i style="width:${Math.min(1, todayMs / goal) * 100}%"></i></div>
        <p><b>${Math.round(todayMs / 60000)} von ${goal / 60000} Minuten</b> ${todayMs >= goal ? "– geschafft! 🔥" : "– jeder gespielte Ton zählt."}</p>
        <div class="chips" role="group" aria-label="Tagesziel wählen">${GOAL_CHOICES.map((m) => `<button class="filter-chip" data-goal="${m}" aria-pressed="${m === goal / 60000}">${m} Min</button>`).join("")}</div>
      </section>

      <section class="card">
        <h2>Heute dran</h2>
        ${due.length ? `<ul class="todo">${due.slice(0, 6).map((r) => {
          const item = itemOf(r.id);
          return item ? `<li><a href="${item.href}"><span>↻</span><b>${escapeHtml(item.title)}</b><small>${item.kind} · wiederholen</small></a></li>` : "";
        }).join("")}</ul>` : `<p class="fine">Nichts zu wiederholen – stark! Neue Stücke kommen in den Plan, sobald du sie mit mindestens zwei Sternen schaffst.</p>`}
        ${nextLesson ? `<a class="next-up" href="#/ueben/${nextLesson.id}"><small>Als Nächstes im Kurs</small><b>${nextLesson.number} · ${nextLesson.title}</b></a>` : ""}
      </section>
    </div>

    ${monthReviewHtml(days, today)}

    <section class="card">
      <h2>Kurs</h2>
      <div class="bar big" role="progressbar" aria-label="Lektionen geschafft" aria-valuemin="0" aria-valuemax="${LESSONS.length}" aria-valuenow="${done}"><i style="width:${(done / LESSONS.length) * 100}%"></i></div>
      <p class="fine">${done} von ${LESSONS.length} Lektionen · ${starSum(LESSONS)} von ${LESSONS.length * 3} Sternen</p>
      <ol class="chapters">${CHAPTERS.map((c, i) => {
        const stars = starSum(c.lessons);
        const max = c.lessons.length * 3;
        return `<li><span class="no">${i + 1}</span><span class="name">${c.title}</span>
          <span class="bar" role="progressbar" aria-label="Sterne in Kapitel ${i + 1}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${stars}"><i style="width:${(stars / max) * 100}%"></i></span>
          <span class="count">${stars}/${max} ★</span></li>`;
      }).join("")}</ol>
    </section>

    <div class="dash-grid">
      <section class="card">
        <h2>Übungskalender</h2>
        <p class="fine">Minuten pro Tag, die letzten ${HEAT_WEEKS} Wochen</p>
        ${heatmapHtml(days, today)}
      </section>
      <section class="card">
        <h2>Minuten pro Woche</h2>
        <p class="fine">Die letzten ${BAR_WEEKS} Wochen</p>
        ${weekChartHtml(weeks)}
        <details class="table-view"><summary>Als Tabelle</summary>
          <table><thead><tr><th>Woche ab</th><th>Minuten</th></tr></thead>
          <tbody>${weeks.map((w) => `<tr><td>${formatDay(w.start)}</td><td>${w.minutes}</td></tr>`).join("")}</tbody></table>
        </details>
      </section>
    </div>

    <div class="dash-grid">
      <section class="card">
        <h2>Knifflige Stellen</h2>
        ${tricky.length ? `<ul class="todo">${tricky.slice(0, 5).map((t) => `<li><a href="${t.item.href}"><span>⚑</span><b>${escapeHtml(t.item.title)}</b>
          <small>${spotLabel(t.spot)} · ${t.item.kind}</small></a></li>`).join("")}</ul>
          <p class="fine">Öffne das Stück und tippe auf „Fehlerstelle üben“ – die Takte laufen dann in Schleife. Saubere Runden lassen die Markierung verblassen.</p>`
          : `<p class="fine">Noch keine Fehlerstellen. Die App merkt sich, in welchen Takten du danebengreifst, und schlägt dir diese Stellen zum gezielten Üben vor.</p>`}
      </section>
      <section class="card">
        <h2>Notenjagd</h2>
        <ul class="hunt-records">${Object.entries(HUNT_LEVELS).map(([id, l]) => {
          const h = hunts[id];
          return `<li><span>${l.label}</span><b>${h?.best ?? "–"}</b><small>${h ? `${h.runs} ${h.runs === 1 ? "Runde" : "Runden"} · Ø ${Math.round(h.total / h.runs)}` : "noch nicht gespielt"}</small></li>`;
        }).join("")}</ul>
        <a class="next-up" href="#/jagd"><small>60 Sekunden Noten lesen</small><b>🎯 Zur Notenjagd</b></a>
      </section>
    </div>

    <section class="card">
      <h2>Abzeichen <small>${Object.keys(earned).length} von ${BADGES.length}</small></h2>
      <ul class="badges">${BADGES.map((b) => `<li class="${earned[b.id] ? "earned" : ""}">
        <span class="badge-icon" aria-hidden="true">${b.icon}</span><b>${b.title}</b><small>${earned[b.id] ? `seit ${formatDay(earned[b.id])}` : b.text}</small></li>`).join("")}</ul>
    </section>

    <section class="card">
      <h2>Repertoire &amp; Wiederholungsplan</h2>
      <p class="fine">Wer ein Stück immer wieder spielt, behält es. Nach jeder gelungenen Wiederholung (mindestens zwei Sterne) wächst der Abstand: ${REVIEW_DAYS.join(", ")} Tage.</p>
      ${repertoire.length ? `<div class="table-wrap"><table class="repertoire"><thead><tr><th>Stück</th><th>Festigung</th><th>Nächste Wiederholung</th></tr></thead><tbody>
        ${repertoire.map((r) => `<tr><td><a href="${r.item.href}">${escapeHtml(r.item.title)}</a><small>${r.item.kind}</small></td><td>${stageDots(r.stage)}</td>
          <td>${r.due <= today ? "<b>heute</b>" : formatDay(r.due)}</td></tr>`).join("")}
      </tbody></table></div>` : `<p class="empty">Noch leer. Schaff eine Lektion oder ein Stück mit zwei Sternen – dann landet es hier.</p>`}
    </section>
    ${backupCardHtml()}
    <div id="chart-tip" class="chart-tip" role="tooltip" hidden></div>`;
}

function bindDashboard() {
  const box = $("#dashboard");
  box.addEventListener("click", (e) => {
    const step = e.target.closest("[data-month]");
    if (step) {
      reviewMonth = addMonths(reviewMonth ?? dateKey().slice(0, 7), Number(step.dataset.month));
      renderDashboard();
      return $(`[data-month="${step.dataset.month}"]`)?.focus();
    }
    const goal = e.target.closest("[data-goal]");
    if (!goal) return;
    saveSettings({ dailyGoal: Number(goal.dataset.goal) });
    renderDashboard();
    renderMeCard();
  });
  // Ein Tooltip für Kalender und Wochensäulen
  box.addEventListener("pointerover", (e) => {
    const target = e.target.closest("[data-tip]");
    const tip = $("#chart-tip");
    if (!tip) return;
    if (!target) return (tip.hidden = true);
    tip.textContent = target.dataset.tip;
    tip.hidden = false;
    const rect = target.getBoundingClientRect();
    tip.style.left = `${rect.left + rect.width / 2 + scrollX}px`;
    tip.style.top = `${rect.top + scrollY - 8}px`;
  });
  box.addEventListener("pointerleave", () => { if ($("#chart-tip")) $("#chart-tip").hidden = true; });
  document.addEventListener("visibilitychange", () => { if (document.hidden) flushActivity(); });
  window.addEventListener("pagehide", flushActivity);
}
