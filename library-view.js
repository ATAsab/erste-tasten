// Bibliothek: Stücke suchen, nach Genre und Stufe filtern, anhören, üben – und eigene MIDI-Dateien importieren.
const LEVEL_LABELS = { 1: "leicht", 2: "mittel", 3: "anspruchsvoll" };
const MAX_MIDI_BYTES = 2_000_000;
let libFilter = { q: "", g: "", l: "" };

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const normalize = (text) => String(text).toLowerCase().normalize("NFD").replace(/\p{M}/gu, ""); // Akzente entfernen (é → e)
const ownPieces = () => store.get("et-own", []);

// Einträge, die auf eine Kurs-Lektion zeigen, übernehmen deren Noten.
function resolvePiece(entry) {
  if (!entry.lesson) return entry;
  const l = LESSONS.find((x) => x.id === entry.lesson);
  return { ...entry, tracks: l.tracks, chords: l.chords, meter: l.meter ?? "4/4", tempo: l.tempo, clef: l.clef };
}

const allPieces = () => [...LIBRARY.map(resolvePiece), ...MUTOPIA_PIECES, ...TECHNIK_PIECES, ...ownPieces()];
const pieceSteps = (p) => (p.notes ? stepsFromNotes(p.notes, p.flats) : buildSteps(p.tracks));
const pieceBars = (p) => Math.ceil(endBeat(pieceSteps(p)) / meterBeats(p.meter) - 1e-6);

// Quellenangabe für Stücke aus dem Internet (Pflicht bei Creative Commons, fair bei gemeinfreien)
function sourceHtml(source) {
  if (!source) return "";
  const typeset = source.typesetter ? ` · Notensatz: ${escapeHtml(source.typesetter)}` : "";
  return `<span class="source">Noten: <a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.name} #${source.id}</a> · ` +
    `Lizenz: ${source.license}${typeset} · automatisch aus MIDI übertragen – Rhythmus und Notenbild können leicht vom Original abweichen.</span>`;
}

function pieceAsLesson(p) {
  const level = p.level === 3 ? "Ein anspruchsvolles Original – nimm dir einzelne Takte vor und übe langsam. " : "";
  return {
    ...p,
    isPiece: true,
    chapter: GENRES[p.genres[0]],
    meter: p.meter ?? "4/4",
    text: [p.about, ...(p.source ? [sourceHtml(p.source)] : [])],
    helps: p.source ? { names: false } : undefined, // Originale: dichtes Notenbild – Namen bei Bedarf mit Taste 1
    task: `${level}Hör es dir zuerst an. Übe dann „Schritt für Schritt“ – und erst wenn die Töne sitzen, „Im Takt“ mit niedrigem Tempo.`,
    see: [],
  };
}

function matches(p, { q, g, l }) {
  if (g && !p.genres.includes(g)) return false;
  if (l && String(p.level) !== l) return false;
  const haystack = normalize([p.title, p.composer, p.year, p.about ?? "", ...p.genres.map((x) => GENRES[x])].join(" "));
  return normalize(q).split(/\s+/).filter(Boolean).every((word) => haystack.includes(word));
}

function chipHtml(kind, value, label, count) {
  const pressed = libFilter[kind] === value;
  return `<button class="filter-chip" data-filter="${kind}" data-value="${value}" aria-pressed="${pressed}">${label}${count === undefined ? "" : ` <span>${count}</span>`}</button>`;
}

function cardHtml(p) {
  const stars = progress[p.lesson ?? p.id]?.stars ?? 0;
  const target = p.lesson ? `#/ueben/${p.lesson}` : `#/stueck/${p.id}`;
  const hands = p.clef === "grand" ? "beide Hände" : p.clef === "bass" ? "linke Hand" : "rechte Hand";
  const own = p.genres.includes("eigene");
  return `<article class="piece" style="--genre: var(--genre-${p.genres[0]})">
    <p class="piece-top"><span class="genre">${GENRES[p.genres[0]]}</span>
      <span class="level" title="${LEVEL_LABELS[p.level]}" aria-label="Stufe: ${LEVEL_LABELS[p.level]}">${"●".repeat(p.level)}<i>${"●".repeat(3 - p.level)}</i></span></p>
    <h3>${escapeHtml(p.title)}</h3>
    <p class="by">${escapeHtml(p.composer)}${p.year ? ` · ${p.year}` : ""}</p>
    <p class="meta">${hands} · ${p.meter ?? "4/4"} · ${pieceBars(p)} Takte${p.lesson ? " · auch im Kurs" : ""}${p.source ? " · Original" : ""}${stars ? ` · <span class="stars-inline">${"★".repeat(stars)}</span>` : ""}</p>
    <div class="piece-actions">
      <button class="play-chip" data-preview="${p.id}">▶ Anhören</button>
      <a class="btn" href="${target}">Üben</a>
      ${own ? `<button class="link-btn" data-delete="${p.id}">Entfernen</button>` : ""}
    </div>
  </article>`;
}

function renderLibrary(params) {
  libFilter = { q: params.get("q") ?? "", g: params.get("g") ?? "", l: params.get("l") ?? "" };
  $("#library").innerHTML = `
    <header class="lib-head">
      <p class="eyebrow">Bibliothek</p>
      <h1>Stücke zum Üben</h1>
      <p class="lede">Klassik, Volkslieder, Weihnachten, Gospel und Ragtime – alle frei spielbar. Dazu deine eigenen Stücke per MIDI-Import.</p>
    </header>
    <div class="lib-tools">
      <input id="lib-search" class="search" type="search" aria-label="Stücke durchsuchen"
        placeholder="Suchen: Titel, Komponist, Genre – z. B. „Bach“ oder „Weihnachten“" value="${escapeHtml(libFilter.q)}">
      <div class="chips" id="lib-genres"></div>
      <div class="chips" id="lib-levels"></div>
    </div>
    <p id="lib-count" class="fine" aria-live="polite"></p>
    <div id="lib-results" class="lib-grid"></div>
    <section class="links" aria-labelledby="links-title">
      <h2 id="links-title">Mehr freie Noten im Internet</h2>
      <ul>
        <li><a href="https://www.mutopiaproject.org/cgibin/make-table.cgi?Instrument=Piano" target="_blank" rel="noopener noreferrer">Mutopia Project</a>
          – über 500 Klavierstücke, gemeinfrei oder Creative Commons. Zu jedem Stück gibt es eine <b>.mid-Datei</b>: herunterladen und unten importieren. Die Stücke mit „Original“ in dieser Bibliothek stammen von dort.</li>
        <li><a href="https://openscore.cc" target="_blank" rel="noopener noreferrer">OpenScore</a>
          – gemeinfreie Klassik von MuseScore und IMSLP, frei nutzbar (CC0). In MuseScore öffnen und als MIDI exportieren.</li>
        <li><a href="https://imslp.org" target="_blank" rel="noopener noreferrer">IMSLP</a>
          – die größte Sammlung gemeinfreier Noten, meist als PDF. Gut zum Ausdrucken und Lesen, aber nicht zum Importieren.</li>
      </ul>
    </section>
    <section class="import" aria-labelledby="import-title">
      <h2 id="import-title">Eigene Stücke importieren</h2>
      <p>Film- und Popmusik – etwa „Interstellar“ von Hans Zimmer – ist urheberrechtlich geschützt und deshalb nicht in der Bibliothek.
        Du kannst aber jede <b>MIDI-Datei</b> importieren, die du besitzt: gekaufte Noten mit MIDI-Datei oder eine eigene Bearbeitung,
        z. B. in der kostenlosen Notensoftware MuseScore erstellt und über <i>Exportieren → MIDI</i> gespeichert.
        Das Stück bleibt nur in deinem Browser.</p>
      <label class="btn file-btn">MIDI-Datei wählen …<input id="midi-file" type="file" accept=".mid,.midi,audio/midi" hidden></label>
      <p id="import-status" class="fine" role="status"></p>
    </section>`;
  renderFilters();
  renderResults();
  renderLibrarySide();
}

function renderFilters() {
  const pieces = allPieces();
  const count = (g) => pieces.filter((p) => p.genres.includes(g)).length;
  $("#lib-genres").innerHTML = chipHtml("g", "", "Alle", pieces.length) +
    Object.entries(GENRES).filter(([key]) => count(key)).map(([key, label]) => chipHtml("g", key, label, count(key))).join("");
  $("#lib-levels").innerHTML = chipHtml("l", "", "Jede Stufe") +
    Object.entries(LEVEL_LABELS).map(([key, label]) => chipHtml("l", key, label)).join("");
}

function renderResults() {
  const found = allPieces().filter((p) => matches(p, libFilter));
  $("#lib-count").textContent = `${found.length} ${found.length === 1 ? "Stück" : "Stücke"}`;
  $("#lib-results").innerHTML = found.length
    ? found.map(cardHtml).join("")
    : `<p class="empty">Nichts gefunden. Film- und Popmusik ist urheberrechtlich geschützt – dafür kannst du unten eine eigene MIDI-Datei importieren.</p>`;
}

function updateLibraryUrl() {
  const query = new URLSearchParams(Object.entries(libFilter).filter(([, v]) => v)).toString();
  history.replaceState(null, "", `#/stuecke${query ? `?${query}` : ""}`);
}

function renderLibrarySide(currentId) {
  const pieces = allPieces();
  const current = pieces.find((p) => p.id === currentId);
  $("#side-list").innerHTML = `<ol class="topics">
    <li><a href="#/stuecke" ${!current && !libFilter.g && section === "stuecke" ? 'aria-current="page"' : ""}><span class="no">♪</span><span class="t">Alle Stücke</span></a></li>
    ${Object.entries(GENRES).map(([key, label]) => {
      const n = pieces.filter((p) => p.genres.includes(key)).length;
      if (!n) return "";
      const active = current ? current.genres[0] === key : libFilter.g === key && section === "stuecke";
      return `<li><a href="#/stuecke?g=${key}" ${active ? 'aria-current="page"' : ""}><span class="no" style="color: var(--genre-${key})">●</span><span class="t">${label}</span><span class="qz">${n}</span></a></li>`;
    }).join("")}
  </ol>`;
}

async function importMidi(file) {
  const status = $("#import-status");
  try {
    if (file.size > MAX_MIDI_BYTES) throw new Error("Die Datei ist zu groß (höchstens 2 MB).");
    const piece = midiToPiece(parseMidiFile(await file.arrayBuffer()), file.name.replace(/\.(mid|midi)$/i, "").slice(0, 80));
    if (!store.set("et-own", [...ownPieces(), piece])) throw new Error("Der Speicher im Browser ist voll.");
    libFilter = { q: "", g: "eigene", l: "" };
    updateLibraryUrl();
    $("#lib-search").value = "";
    renderFilters();
    renderResults();
    renderLibrarySide();
    status.textContent = `„${piece.title}“ importiert – ${piece.notes.length} Noten. Viel Spaß beim Üben!`;
  } catch (err) {
    console.warn("MIDI-Import fehlgeschlagen", err);
    status.textContent = `Import fehlgeschlagen: ${err.message}`;
  }
}

function onLibraryClick(e) {
  const chip = e.target.closest("[data-filter]");
  if (chip) {
    libFilter = { ...libFilter, [chip.dataset.filter]: chip.dataset.value };
    updateLibraryUrl();
    renderFilters();
    renderResults();
    return renderLibrarySide();
  }
  const preview = e.target.closest("[data-preview]");
  if (preview) {
    if (clip?.button === preview) return stopClip();
    const piece = allPieces().find((p) => p.id === preview.dataset.preview);
    return playSteps(pieceSteps(piece), piece.tempo, undefined, preview);
  }
  const remove = e.target.closest("[data-delete]");
  if (remove && confirm("Dieses importierte Stück entfernen?")) {
    store.set("et-own", ownPieces().filter((p) => p.id !== remove.dataset.delete));
    renderFilters();
    renderResults();
    renderLibrarySide();
  }
}

function bindLibrary() {
  const box = $("#library");
  box.addEventListener("click", onLibraryClick);
  box.addEventListener("input", (e) => {
    if (e.target.id !== "lib-search") return;
    libFilter = { ...libFilter, q: e.target.value };
    updateLibraryUrl();
    renderResults();
  });
  box.addEventListener("change", (e) => {
    if (e.target.id === "midi-file" && e.target.files[0]) importMidi(e.target.files[0]);
  });
}
