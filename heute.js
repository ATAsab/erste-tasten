// Startseite „Heute üben“: ein kurzer Plan – aufwärmen, wiederholen, weiterlernen.
const PLAN_DUE_SHOWN = 3;

function greeting(hour = new Date().getHours()) {
  if (hour < 11) return "Guten Morgen!";
  if (hour < 18) return "Schön, dass du da bist.";
  return "Guten Abend!";
}

// ponytail: Stufe grob aus dem Kursfortschritt geschätzt
function comfortLevel() {
  const done = LESSONS.filter((l) => progress[l.id]?.stars).length;
  return done < 12 ? 1 : done < 28 ? 2 : 3;
}
const daySeed = (today) => [...today].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

// Jeden Tag ein anderes, noch nicht gespieltes Stück passender Stufe.
function pieceOfTheDay(today) {
  const options = allPieces().filter((p) => !p.lesson && !p.genres.includes("technik") && p.level <= comfortLevel() && !progress[p.id]);
  return options.length ? options[daySeed(today) % options.length] : null;
}

// Jeden Tag eine andere Tonleiter, passend zur Stufe.
function scaleOfTheDay(today) {
  const options = TECHNIK_PIECES.filter((p) => p.id.startsWith("t-scale-") && p.level <= Math.max(1, comfortLevel() - 1));
  return options[daySeed(today) % options.length];
}

function topTrickySpot() {
  return Object.entries(store.get("et-errors", {}))
    .map(([id, map]) => ({ item: itemOf(id), spot: findHotspots(map)[0] }))
    .filter((t) => t.item && t.spot)
    .sort((a, b) => b.spot.score - a.spot.score)[0];
}

function planStep({ no, done, kind, title, body, cta, hero = false }) {
  return `<li class="plan-step ${hero ? "hero" : ""} ${done ? "done" : ""}">
    <span class="plan-no" aria-label="${done ? "erledigt" : `Schritt ${no}`}">${done ? "✓" : no}</span>
    <p class="plan-kind">${kind}</p>
    <h3>${title}</h3>
    ${body}
    ${cta}
  </li>`;
}

function warmUpStep(today) {
  const hunts = store.get("et-hunt", {});
  const level = HUNT_LEVELS[settings.huntLevel] ? settings.huntLevel : "leicht";
  const best = hunts[level]?.best;
  const scale = scaleOfTheDay(today);
  return planStep({
    no: 1,
    done: Object.values(hunts).some((h) => h.date === today),
    kind: "Aufwärmen · 3 Minuten",
    title: "Notenjagd & Tonleiter",
    body: `<p>Lies dich warm: Stufe ${HUNT_LEVELS[level].label}${best ? ` · dein Rekord: ${best}` : ""}. Danach die Finger: <b>${scale.title}</b>.</p>`,
    cta: `<div class="plan-ctas"><a class="btn ghost" href="#/jagd">🎯 Notenjagd</a><a class="btn ghost" href="#/stueck/${scale.id}">🎹 Tonleiter</a></div>`,
  });
}

function reviewStep(today) {
  const review = store.get("et-review", {});
  const due = dueReviews(review, today).map((r) => ({ ...r, item: itemOf(r.id) })).filter((r) => r.item);
  const reviewedToday = Object.values(review).some((r) => r.last === today);
  const list = due.slice(0, PLAN_DUE_SHOWN).map((r) =>
    `<li><a href="${r.item.href}"><span aria-hidden="true">↻</span><b>${escapeHtml(r.item.title)}</b><small>${r.item.kind}</small></a></li>`).join("");
  return planStep({
    no: 2,
    done: !due.length && reviewedToday,
    kind: "Wiederholen",
    title: due.length ? `${due.length} ${due.length === 1 ? "Stück ist" : "Stücke sind"} fällig` : "Nichts fällig",
    body: due.length
      ? `<ul class="todo">${list}</ul>${due.length > PLAN_DUE_SHOWN ? `<p class="fine">… und ${due.length - PLAN_DUE_SHOWN} weitere auf der Fortschrittsseite.</p>` : ""}`
      : `<p>${reviewedToday ? "Alles wiederholt – stark!" : "Dein Repertoire sitzt. Stücke kommen hierher, sobald du sie mit zwei Sternen schaffst."}</p>`,
    cta: "",
  });
}

function learnStep() {
  const next = LESSONS.find((l) => !progress[l.id]?.stars);
  if (!next) {
    return planStep({
      no: 3, hero: true, kind: "Weiterlernen", title: "Kurs geschafft! 🎓",
      body: "<p>Such dir ein neues Stück aus der Bibliothek – dort wartet viel freie Musik.</p>",
      cta: `<a class="btn accent" href="#/stuecke">Zur Bibliothek →</a>`,
    });
  }
  const chapter = CHAPTERS[next.chapterNo - 1];
  const done = chapter.lessons.filter((l) => progress[l.id]?.stars).length;
  return planStep({
    no: 3,
    hero: true,
    kind: `Weiterlernen · Kapitel ${next.chapterNo}: ${chapter.title}`,
    title: `<span class="plan-lesson-no">${next.number}</span> ${next.title}`,
    body: `<p>${next.task}</p>
      <span class="bar" role="progressbar" aria-label="Lektionen in Kapitel ${next.chapterNo}" aria-valuemin="0" aria-valuemax="${chapter.lessons.length}" aria-valuenow="${done}"><i style="width:${(done / chapter.lessons.length) * 100}%"></i></span>
      <p class="fine">${done} von ${chapter.lessons.length} Lektionen in diesem Kapitel</p>`,
    cta: `<a class="btn accent" href="#/ueben/${next.id}">Weiter üben →</a>`,
  });
}

function extrasHtml(today) {
  const tricky = topTrickySpot();
  const piece = pieceOfTheDay(today);
  const prevMonth = addMonths(today.slice(0, 7), -1);
  const review = Number(today.slice(8)) <= 3 && monthSummary(daysData(), prevMonth, goalMs()).activeDays > 0;
  const cards = [
    review && `<a class="extra" href="#/fortschritt?monat=${prevMonth}"><small>📅 Monatsrückblick</small><b>Dein ${MONTH_NAMES.format(new Date(`${prevMonth}-01T12:00:00`))}</b>
      <span>So lief dein Monat: Zeit, Übungstage, neue Stücke</span></a>`,
    tricky && `<a class="extra" href="${tricky.item.href}"><small>⚑ Knifflige Stelle</small><b>${escapeHtml(tricky.item.title)}</b>
      <span>${spotLabel(tricky.spot)} – im Stück auf „Fehlerstelle üben“ tippen</span></a>`,
    piece && `<a class="extra" href="#/stueck/${piece.id}"><small>♪ Stück-Tipp des Tages</small><b>${escapeHtml(piece.title)}</b>
      <span>${escapeHtml(piece.composer)} · ${GENRES[piece.genres[0]]} · ${LEVEL_LABELS[piece.level]}</span></a>`,
  ].filter(Boolean);
  return cards.length ? `<div class="extras">${cards.join("")}</div>` : "";
}

function renderToday() {
  flushActivity();
  const today = dateKey();
  const days = daysData();
  const goal = goalMs();
  const todayMs = days[today]?.ms ?? 0;
  const streak = streakOf(days, goal, today);
  const date = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  $("#today").innerHTML = `
    <header class="today-head">
      <p class="eyebrow">${date}</p>
      <h1>${greeting()}</h1>
      <div class="today-goal">
        <span class="bar big goal" role="progressbar" aria-label="Tagesziel heute" aria-valuemin="0" aria-valuemax="${goal / 60000}" aria-valuenow="${Math.round(todayMs / 60000)}"><i style="width:${Math.min(1, todayMs / goal) * 100}%"></i></span>
        <p><b>${Math.round(todayMs / 60000)} von ${goal / 60000} Minuten</b> Tagesziel${streak ? ` · 🔥 ${streak} ${streak === 1 ? "Tag" : "Tage"} in Folge` : ""}</p>
      </div>
    </header>
    <section aria-labelledby="plan-title">
      <h2 id="plan-title" class="plan-title">Dein Plan für heute</h2>
      <ol class="plan">${warmUpStep(today)}${reviewStep(today)}${learnStep()}</ol>
    </section>
    ${extrasHtml(today)}`;
}
