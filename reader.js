// Theorie & Geschichte: Artikel-Ansicht, Seitenleiste und Hörbeispiele.
// Alle Inhalte stammen aus den eigenen, statischen Dateien theory.js / history.js – daher innerHTML.
const SECTION_LABEL = { ueben: "Lektion", theorie: "Theorie", geschichte: "Geschichte" };
let clips = [];
let clip = null;

const articlesOf = (sec) => (sec === "theorie" ? THEORY : PEOPLE);

function refTitle(ref) {
  const [sec, id] = ref.split("/");
  const item = (sec === "ueben" ? LESSONS : articlesOf(sec)).find((x) => x.id === id);
  if (!item) throw new Error(`Unbekannter Verweis: ${ref}`);
  return item.title;
}

function seeHtml(refs = []) {
  if (!refs.length) return "";
  return `<p class="see">${refs.map((ref) => {
    const sec = ref.split("/")[0];
    return `<a class="see-chip" data-sec="${sec}" href="#/${ref}"><small>${SECTION_LABEL[sec]}</small>${refTitle(ref)}</a>`;
  }).join("")}</p>`;
}

function addClip(list, tempo = 90, level) {
  clips = [...clips, { list, tempo, level }];
  return clips.length - 1;
}

function blockHtml(block) {
  if (typeof block === "string") return `<p>${block}</p>`;
  if (block.h) return `<h2>${block.h}</h2>`;
  if (block.list) return `<ul>${block.list.map((li) => `<li>${li}</li>`).join("")}</ul>`;
  if (block.tip) return `<aside class="callout">${block.tip}</aside>`;
  if (block.table) {
    const { head, rows } = block.table;
    return `<div class="table-wrap"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  if (block.staff) {
    const { clef, tracks, meter = "4/4", tempo = 90, names = false, fingers = false, caption = "" } = block.staff;
    const list = buildSteps(tracks);
    const classes = ["staff", names ? "" : "hide-names", fingers ? "" : "hide-fingers"].join(" ");
    return `<figure class="example"><div class="${classes}">${staffSvg(list, clef, meter, false, restsOf(tracks)).svg}</div>
      <figcaption><span>${caption}</span><button class="play-chip" data-clip="${addClip(list, tempo)}">▶ Anhören</button></figcaption></figure>`;
  }
  if (block.play) {
    return `<div class="clips">${block.play.map((c) =>
      `<button class="play-chip" data-clip="${addClip(buildSteps({ rh: c.notes }), c.tempo, c.level)}">▶ ${c.label}</button>`).join("")}</div>`;
  }
  throw new Error(`Unbekannter Block: ${JSON.stringify(block)}`);
}

// ---------- Quiz ----------

function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function questionHtml(item, index) {
  const options = shuffled(item.options.map((text, i) => ({ text, correct: i === 0 })));
  const hand = item.staff?.clef === "bass" ? "lh" : "rh";
  const staff = item.staff
    ? `<div class="staff hide-names hide-fingers">${staffSvg(buildSteps({ [hand]: item.staff.notes }), item.staff.clef).svg}</div>`
    : "";
  const play = item.play
    ? `<button class="play-chip" data-clip="${addClip(buildSteps({ rh: item.play }), item.tempo)}">▶ Anhören</button>`
    : "";
  return `<div class="question" role="group" aria-labelledby="q${index}">
    <p class="q" id="q${index}"><span>${index + 1}</span>${item.q}</p>
    ${staff}${play}
    <div class="options">${options.map((o) => `<button class="option" data-correct="${o.correct}">${o.text}</button>`).join("")}</div>
    <p class="explain" aria-live="polite" hidden>${item.explain}</p>
  </div>`;
}

function quizHtml(key) {
  const items = QUIZ[key];
  if (!items) return "";
  const best = store.get("et-quiz", {})[key];
  return `<section class="quiz" data-key="${key}" aria-label="Quiz">
    <header><h2>Teste dich</h2><p class="fine">${items.length} Fragen${best ? ` · dein bestes Ergebnis: ${best.right} von ${best.total}` : ""}</p></header>
    ${items.map(questionHtml).join("")}
    <div class="quiz-score" hidden></div>
  </section>`;
}

function answer(button) {
  const question = button.closest(".question");
  if (question.dataset.done) return;
  const correct = button.dataset.correct === "true";
  question.dataset.done = correct ? "right" : "wrong";
  question.querySelectorAll(".option").forEach((o) => {
    o.disabled = true;
    if (o.dataset.correct === "true") o.classList.add("right");
  });
  if (!correct) button.classList.add("wrong");
  const explain = question.querySelector(".explain");
  explain.innerHTML = `<b>${correct ? "Richtig!" : "Nicht ganz."}</b> ${explain.innerHTML}`;
  explain.hidden = false;

  const quiz = button.closest(".quiz");
  const total = quiz.querySelectorAll(".question").length;
  if (quiz.querySelectorAll(".question[data-done]").length < total) return;
  const right = quiz.querySelectorAll('.question[data-done="right"]').length;
  const results = store.get("et-quiz", {});
  const best = Math.max(right, results[quiz.dataset.key]?.right ?? 0);
  store.set("et-quiz", { ...results, [quiz.dataset.key]: { right: best, total } });
  if (right) awardXp(right * XP.quiz, `Quiz: ${right} von ${total} richtig`);
  checkBadges();
  const score = quiz.querySelector(".quiz-score");
  const message = right === total ? "Alles richtig – stark!" : right >= total / 2 ? "Gut! Lies die markierten Stellen noch einmal nach." : "Lies den Text noch einmal in Ruhe und versuch es dann erneut.";
  score.innerHTML = `<b>${right} von ${total} richtig.</b> ${message} <button class="btn ghost" data-quiz-retry>Nochmal (neu gemischt)</button>`;
  score.hidden = false;
  const [sec, id] = quiz.dataset.key.split("/");
  renderReaderList(sec, id);
}

function onReaderClick(e) {
  const option = e.target.closest(".option");
  if (option) return answer(option);
  const retry = e.target.closest("[data-quiz-retry]");
  if (retry) {
    const quiz = retry.closest(".quiz");
    quiz.outerHTML = quizHtml(quiz.dataset.key);
    return;
  }
  const button = e.target.closest("[data-clip]");
  if (!button) return;
  if (clip?.button === button) return stopClip();
  playClip(Number(button.dataset.clip), button);
}

// ---------- Artikel ----------

function articleHead(sec, a, index, total) {
  if (sec === "theorie") return `<p class="eyebrow">Theorie · Thema ${index + 1} von ${total}</p><h1>${a.title}</h1>`;
  const mono = a.monogram ?? a.title[0] + a.title.split(" ").at(-1)[0];
  return `<div class="person" style="--era: var(--era-${a.era})">
    <div class="mono" aria-hidden="true">${mono}</div>
    <div><p class="eyebrow">${ERAS[a.era]} · ${a.years}</p><h1>${a.title}</h1><p class="place">${a.place}</p></div>
  </div>`;
}

function renderArticle(sec, id) {
  const list = articlesOf(sec);
  const index = Math.max(0, list.findIndex((a) => a.id === id));
  const a = list[index];
  const prev = list[index - 1];
  const next = list[index + 1];
  stopClip();
  clips = [];
  const firstRead = !store.get("et-read", {})[`${sec}/${a.id}`];
  store.set("et-read", { ...store.get("et-read", {}), [`${sec}/${a.id}`]: true });
  if (firstRead) awardXp(XP.read, "Neues Thema gelesen");
  const listen = a.listen
    ? `<aside class="listen"><h2>Hörtipps</h2><ul>${a.listen.map((l) => `<li>${l}</li>`).join("")}</ul>
       <p class="fine">Einfach den Titel bei YouTube, Spotify oder Apple Music suchen.</p></aside>`
    : "";
  $("#reader").innerHTML = `<article class="article" data-sec="${sec}">
    <header class="article-head">${articleHead(sec, a, index, list.length)}<p class="lede">${a.lede}</p></header>
    <div class="prose">${a.body.map(blockHtml).join("")}</div>
    ${listen}
    ${quizHtml(`${sec}/${a.id}`)}
    ${seeHtml(a.see)}
    <nav class="pager" aria-label="Blättern">
      ${prev ? `<a href="#/${sec}/${prev.id}"><small>Zurück</small>${prev.title}</a>` : "<span></span>"}
      ${next ? `<a class="next" href="#/${sec}/${next.id}"><small>Weiter</small>${next.title}</a>` : ""}
    </nav>
  </article>`;
  renderReaderList(sec, a.id);
  window.scrollTo({ top: 0 });
}

// Seitenleiste: Quiz-Ergebnis, sonst Häkchen für „gelesen“.
function statusBadge(key, read, quiz) {
  const result = quiz[key];
  if (result) {
    const full = result.right === result.total;
    return `<span class="qz${full ? " full" : ""}" aria-label="Quiz: ${result.right} von ${result.total} richtig">${result.right}/${result.total}</span>`;
  }
  return read[key] ? '<span class="read" aria-label="gelesen">✓</span>' : "";
}

function renderReaderList(sec, current) {
  const read = store.get("et-read", {});
  const quiz = store.get("et-quiz", {});
  const isHistory = sec === "geschichte";
  $("#side-list").innerHTML = `<ol class="${isHistory ? "timeline" : "topics"}">${articlesOf(sec).map((a, i) => `
    <li><a href="#/${sec}/${a.id}" ${a.id === current ? 'aria-current="page"' : ""}${isHistory ? ` style="--era: var(--era-${a.era})"` : ""}>
      <span class="no">${isHistory ? a.born : i + 1}</span>
      <span class="t">${a.title}</span>
      ${statusBadge(`${sec}/${a.id}`, read, quiz)}
    </a></li>`).join("")}</ol>`;
}

function playClip(index, button) {
  const { list, tempo, level } = clips[index];
  playSteps(list, tempo, level, button);
}

// Spielt Noten ab und markiert den Knopf, bis sie verklungen sind (auch für die Hörprobe in der Bibliothek).
function playSteps(list, tempo, level, button) {
  stopClip();
  const { out, spb } = scheduleSteps(list, tempo, level);
  button.classList.add("playing");
  clip = { out, button, timer: setTimeout(stopClip, (endBeat(list) * spb + 0.9) * 1000) };
}

function stopClip() {
  if (!clip) return;
  clearTimeout(clip.timer);
  fadeOut(clip.out);
  clip.button.classList.remove("playing");
  clip = null;
}
