// Wandelt die MIDI-Dateien aus noten/mutopia in Bibliotheksstücke um → library-mutopia.js
// Ausführen mit: node tools/build-mutopia.js
const fs = require("node:fs");
const path = require("node:path");
Object.assign(globalThis, require("../music.js"));
const { parseMidiFile, midiToPiece } = require("../midi.js");

const ROOT = path.join(__dirname, "..");
const PD = "gemeinfrei";
const BY_SA = (version) => `CC BY-SA ${version}`;
const NB = "aus dem Notenbüchlein für Anna Magdalena Bach";

// [Mutopia-ID, Datei, Titel, Komponist, Jahr, Genres, Stufe, Lizenz, Notensatz (bei CC), Beschreibung]
const PIECES = [
  [75, "anna-magdalena-04.mid", "Menuett G-Dur (BWV Anh. 114)", "Christian Petzold", 1725, ["lernen", "klassik"], 2, PD, "", `Das berühmteste Menuett ${NB} – die Vollversion zum Kurs-Menuett, jetzt mit der originalen linken Hand.`],
  [76, "anna-magdalena-05.mid", "Menuett g-Moll (BWV Anh. 115)", "Christian Petzold", 1725, ["lernen", "klassik"], 2, PD, "", `Das Gegenstück in Moll ${NB}: ernster, aber genauso gut spielbar.`],
  [74, "anna-magdalena-03.mid", "Menuett F-Dur (BWV Anh. 113)", "unbekannt", 1725, ["lernen", "klassik"], 2, PD, "", `Ein kurzes, freundliches Menuett ${NB}.`],
  [77, "anna-magdalena-07.mid", "Menuett G-Dur (BWV Anh. 116)", "unbekannt", 1725, ["lernen", "klassik"], 2, PD, "", `Noch ein Menuett ${NB} – mit lebhafterer linker Hand.`],
  [79, "anna-magdalena-22.mid", "Musette D-Dur (BWV Anh. 126)", "unbekannt", 1725, ["lernen", "klassik"], 2, PD, "", `Eine Musette ahmt den Dudelsack nach: Die linke Hand springt munter zwischen den Oktaven. ${NB.replace("aus", "Aus")}.`],
  [647, "schumann-op68-01-melodie.mid", "Melodie (Album für die Jugend Nr. 1)", "Robert Schumann", 1848, ["lernen", "klassik", "ruhig"], 1, BY_SA("2.5"), "Philippe Hézaine", "Das erste Stück aus Schumanns Album für seine Kinder: eine schlichte, singende Melodie über ruhiger Begleitung."],
  [650, "schumann-op68-02-marche-militaire.mid", "Soldatenmarsch (Album für die Jugend Nr. 2)", "Robert Schumann", 1848, ["lernen", "klassik"], 2, BY_SA("2.5"), "Philippe Hézaine", "Ein forscher Marsch mit punktierten Rhythmen – kurz und knackig spielen."],
  [651, "schumann-op68-03-chanson-fredonnee.mid", "Trällerliedchen (Album für die Jugend Nr. 3)", "Robert Schumann", 1848, ["lernen", "klassik"], 1, BY_SA("3.0"), "Philippe Hézaine", "Ein Liedchen zum Mitsummen – die Melodie wechselt zwischen den Händen."],
  [782, "schumann-op68-04-choral.mid", "Ein Choral (Album für die Jugend Nr. 4)", "Robert Schumann", 1848, ["lernen", "klassik", "ruhig"], 1, BY_SA("2.5"), "Philippe Hézaine", "Ein feierlicher vierstimmiger Satz – gute Übung für Akkorde in beiden Händen."],
  [653, "schumann-op68-05-petite-piece.mid", "Stückchen (Album für die Jugend Nr. 5)", "Robert Schumann", 1848, ["lernen", "klassik"], 2, BY_SA("2.5"), "Philippe Hézaine", "Ein fröhliches kleines Stück mit gleichmäßig laufenden Achteln."],
  [687, "schumann-op68-06-pauvre-orpheline.mid", "Armes Waisenkind (Album für die Jugend Nr. 6)", "Robert Schumann", 1848, ["lernen", "klassik", "ruhig"], 2, BY_SA("2.5"), "Philippe Hézaine", "Ein trauriges, langsames Stück in Moll – hier geht es um Ausdruck."],
  [691, "schumann-op68-07-chanson-du-chasseur.mid", "Jägerliedchen (Album für die Jugend Nr. 7)", "Robert Schumann", 1848, ["lernen", "klassik"], 2, BY_SA("3.0"), "Philippe Hézaine", "Hörnerklänge und Galopp im 6/8-Takt."],
  [655, "schumann-op68-08-cavalier-sauvage.mid", "Wilder Reiter (Album für die Jugend Nr. 8)", "Robert Schumann", 1848, ["lernen", "klassik"], 2, BY_SA("2.5"), "Philippe Hézaine", "Einer der Klassiker für Klavierschüler: Die Melodie springt von der rechten in die linke Hand."],
  [659, "schumann-op68-10-gai-laboureur.mid", "Fröhlicher Landmann (Album für die Jugend Nr. 10)", "Robert Schumann", 1848, ["lernen", "klassik"], 2, BY_SA("2.5"), "Philippe Hézaine", "Die Melodie liegt zuerst in der linken Hand – die rechte begleitet. Ein Lieblingsstück vieler Lernender."],
  [676, "schumann-op68-16-premier-chagrin.mid", "Erster Verlust (Album für die Jugend Nr. 16)", "Robert Schumann", 1848, ["lernen", "klassik", "ruhig"], 2, BY_SA("2.5"), "Philippe Hézaine", "Ein kleines Stück über den ersten Kummer eines Kindes – mit viel Gefühl spielen."],
  [202, "25EF-01.mid", "La Candeur (Offenheit)", "Friedrich Burgmüller", 1851, ["lernen"], 2, PD, "", "Die erste der 25 leichten Etüden op. 100: eine singende Melodie über gleichmäßigen Sechzehnteln."],
  [203, "25EF-02.mid", "Arabesque", "Friedrich Burgmüller", 1851, ["lernen"], 2, PD, "", "Flinke Fünftonläufe in a-Moll – eine der beliebtesten Etüden für Lernende."],
  [218, "25EF-03.mid", "La Pastorale", "Friedrich Burgmüller", 1851, ["lernen", "ruhig"], 2, PD, "", "Ein Hirtenlied im wiegenden 6/8-Takt."],
  [224, "25EF-13.mid", "Consolation (Trost)", "Friedrich Burgmüller", 1851, ["lernen", "ruhig"], 2, PD, "", "Ruhig und tröstlich: eine Melodie über sanft gebrochenen Akkorden."],
  [2080, "16OldFrenchSong.mid", "Alte französische Weise", "Peter Tschaikowsky", 1878, ["lernen", "ruhig"], 2, PD, "", "Aus Tschaikowskys Kinderalbum op. 39: eine wehmütige Melodie in g-Moll."],
  [2032, "01MorningPrayer.mid", "Morgengebet", "Peter Tschaikowsky", 1878, ["lernen", "ruhig"], 2, PD, "", "Das erste Stück aus dem Kinderalbum op. 39 – ein stiller, vierstimmiger Satz."],
  [5, "wtk1-prelude1.mid", "Präludium C-Dur (komplett)", "Johann Sebastian Bach", 1722, ["klassik", "ruhig"], 2, PD, "", "Das ganze Präludium aus dem Wohltemperierten Klavier: ein Akkord pro Takt, gleichmäßig gebrochen. Wunderbar zum Abschalten."],
  [37, "gymnopedie_1.mid", "Gymnopédie Nr. 1 (komplett)", "Erik Satie", 1888, ["klassik", "ruhig", "film"], 2, PD, "", "Das berühmte langsame Stück vollständig – schwebend, ruhig, unvergleichlich."],
  [38, "gymnopedie_2.mid", "Gymnopédie Nr. 2", "Erik Satie", 1888, ["klassik", "ruhig"], 2, PD, "", "Die zweite der drei Gymnopédies – genauso ruhig, etwas nachdenklicher."],
  [39, "gymnopedie_3.mid", "Gymnopédie Nr. 3", "Erik Satie", 1888, ["klassik", "ruhig"], 2, PD, "", "Die dritte Gymnopédie in a-Moll – leise und melancholisch."],
  [504, "SchumannOp15No07.mid", "Träumerei (Kinderszenen Nr. 7)", "Robert Schumann", 1838, ["klassik", "ruhig"], 3, PD, "", "Eines der bekanntesten ruhigen Klavierstücke überhaupt. Mehrere Stimmen gleichzeitig – ein schönes Ziel."],
  [468, "Chop-28-4.mid", "Prélude e-Moll op. 28 Nr. 4", "Frédéric Chopin", 1839, ["klassik", "ruhig"], 2, PD, "", "Rechts eine schlichte, traurige Melodie, links langsam wandernde Akkorde – ideal als erstes Chopin-Stück."],
  [469, "Chop-28-6.mid", "Prélude h-Moll op. 28 Nr. 6", "Frédéric Chopin", 1839, ["klassik", "ruhig"], 2, PD, "", "Hier singt die linke Hand die Melodie, die rechte tupft gleichmäßige Akkorde dazu."],
  [470, "Chop-28-7.mid", "Prélude A-Dur op. 28 Nr. 7", "Frédéric Chopin", 1839, ["klassik", "ruhig"], 2, PD, "", "Nur 16 Takte: ein kleiner, zarter Walzer."],
  [472, "Chop-28-20.mid", "Prélude c-Moll op. 28 Nr. 20", "Frédéric Chopin", 1839, ["klassik", "ruhig"], 2, PD, "", "Mächtige, langsame Akkorde, die immer leiser werden – wie ein Trauerzug."],
  [471, "Chop-28-15.mid", "Regentropfen-Prélude op. 28 Nr. 15", "Frédéric Chopin", 1839, ["klassik", "ruhig"], 3, PD, "", "Ein ständig wiederholter Ton wie fallende Regentropfen, darüber eine ruhige Melodie. Ein längeres Ziel."],
  [931, "fur_Elise_WoO59.mid", "Für Elise (komplett)", "Ludwig van Beethoven", 1810, ["klassik"], 3, PD, "", "Das ganze Stück mit beiden Mittelteilen. Das bekannte Thema kennst du schon aus der leichten Fassung."],
  [276, "moonlight1.mid", "Mondscheinsonate, 1. Satz", "Ludwig van Beethoven", 1801, ["klassik", "ruhig"], 3, BY_SA("2.5"), "Stewart Holmes", "Der berühmte langsame Satz: Rechts wiegende Triolen, darüber eine einzelne, ruhige Melodie."],
  [295, "pathetique-2.mid", "Pathétique, 2. Satz (Adagio cantabile)", "Ludwig van Beethoven", 1798, ["klassik", "ruhig"], 3, PD, "", "Eine der schönsten langsamen Melodien Beethovens."],
  [1778, "debussy_Ste_Bergamesq_Clair.mid", "Clair de lune", "Claude Debussy", 1905, ["klassik", "ruhig", "film"], 3, PD, "", "Mondlicht in Tönen – bekannt aus vielen Filmen. Ein großes Ziel für später."],
  [1741, "LiederOhneWorte_-_Op30_No6.mid", "Venezianisches Gondellied op. 30 Nr. 6", "Felix Mendelssohn Bartholdy", 1835, ["klassik", "ruhig"], 3, PD, "", "Ein „Lied ohne Worte“: Die linke Hand schaukelt wie eine Gondel auf dem Wasser."],
  [1888, "Dans_l_antre_du_roi_de_la_montagne.mid", "In der Halle des Bergkönigs", "Edvard Grieg", 1875, ["klassik", "film"], 3, PD, "", "Aus „Peer Gynt“, bekannt aus Film und Werbung: Das Thema wird immer schneller und lauter."],
  [483, "chopin_valse_op64_no1.mid", "Minutenwalzer op. 64 Nr. 1", "Frédéric Chopin", 1847, ["klassik"], 3, PD, "", "Ein flinker Walzer – trotz des Namens dauert er meist länger als eine Minute."],
  [263, "entertainer.mid", "The Entertainer (komplett)", "Scott Joplin", 1902, ["ragtime", "film"], 3, PD, "", "Der ganze Rag mit allen Teilen, bekannt aus „Der Clou“."],
  [23, "maple.mid", "Maple Leaf Rag", "Scott Joplin", 1899, ["ragtime"], 3, PD, "", "Der Rag, der Joplin berühmt machte."],
  [482, "solace.mid", "Solace", "Scott Joplin", 1909, ["ragtime", "ruhig"], 3, PD, "", "Ein langsamer, melancholischer Rag mit lateinamerikanischem Rhythmus."],
  [463, "bethena.mid", "Bethena", "Scott Joplin", 1905, ["ragtime"], 3, PD, "", "Ein Konzertwalzer im Ragtime-Stil."],
  [1295, "stille_nacht.mid", "Stille Nacht (Choralsatz)", "Franz Xaver Gruber", 1818, ["weihnachten", "ruhig"], 2, PD, "", "Vierstimmig wie im Gesangbuch: oben die Melodie, darunter drei Begleitstimmen."],
  [1243, "first_noel.mid", "The First Noel (Choralsatz)", "Volksweise (England)", "", ["weihnachten"], 2, PD, "", "Ein englisches Weihnachtslied im vierstimmigen Satz."],
  [1231, "carol.mid", "It Came Upon the Midnight Clear (Choralsatz)", "Richard Storrs Willis", 1850, ["weihnachten", "ruhig"], 2, PD, "", "Ein ruhiges amerikanisches Weihnachtslied im 6/8-Takt, vierstimmig gesetzt."],
  [1247, "greensleeves.mid", "Greensleeves (Choralsatz)", "Volksweise (England)", "", ["weihnachten", "volkslieder", "ruhig"], 2, PD, "", "Die berühmte englische Melodie, auch als Weihnachtslied „What Child Is This“ bekannt."],
  [905, "GoodKingWenceslas.mid", "Good King Wenceslas (Melodie)", "Volksweise", 1582, ["weihnachten", "volkslieder"], 1, PD, "", "Eine alte Weihnachtsmelodie – nur die rechte Hand."],
  [644, "thehollyandtheivy.mid", "The Holly and the Ivy (Melodie)", "Volksweise (England)", "", ["weihnachten", "volkslieder"], 1, PD, "", "Ein englisches Weihnachtslied – nur die Melodie."],
];

function findFile(name) {
  for (const dir of ["noten/mutopia", "noten/mutopia-moonlight"]) {
    const direct = path.join(ROOT, dir, name);
    if (fs.existsSync(direct)) return direct;
    const prefixed = fs.readdirSync(path.join(ROOT, dir)).find((f) => f.endsWith(`-${name}`));
    if (prefixed) return path.join(ROOT, dir, prefixed);
  }
  throw new Error(`Datei fehlt: ${name}`);
}

const pieces = PIECES.map(([id, file, title, composer, year, genres, level, license, typesetter, about]) => {
  const buffer = fs.readFileSync(findFile(file));
  const parsed = parseMidiFile(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  const piece = midiToPiece(parsed, title);
  return {
    ...piece,
    id: `m-${id}`,
    composer,
    year,
    genres,
    level,
    about,
    source: { name: "Mutopia Project", id, url: `https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=${id}`, license, typesetter },
  };
});

// Kompakt speichern: je Note vier ganze Zahlen [midi, Position in 1/24 Schlag, Notenwert-Index, Hand 0/1]
const DUR_CODES = Object.keys(DURATIONS);
const packed = pieces.map(({ notes, ...rest }) => ({
  ...rest,
  packed: notes.flatMap(([midi, beat, durCode, hand]) => [midi, Math.round(beat * 24), DUR_CODES.indexOf(durCode), hand === "lh" ? 1 : 0]),
}));

const header = "// Automatisch erzeugt von tools/build-mutopia.js – nicht von Hand bearbeiten.\n" +
  "// Quelle: Mutopia Project (mutopiaproject.org), gemeinfrei bzw. CC BY-SA; aus MIDI automatisch konvertiert.\n";
const body = `const MUTOPIA_PIECES = (() => {
  const durs = ${JSON.stringify(DUR_CODES)};
  const unpack = (p) => {
    const notes = [];
    for (let i = 0; i < p.length; i += 4) notes.push([p[i], p[i + 1] / 24, durs[p[i + 2]], p[i + 3] ? "lh" : "rh"]);
    return notes;
  };
  return ${JSON.stringify(packed)}.map(({ packed, ...piece }) => ({ ...piece, notes: unpack(packed) }));
})();

if (typeof module !== "undefined") module.exports = { MUTOPIA_PIECES };
`;
fs.writeFileSync(path.join(ROOT, "library-mutopia.js"), header + body);
const notes = pieces.reduce((n, p) => n + p.notes.length, 0);
console.log(`${pieces.length} Stücke, ${notes} Noten → library-mutopia.js (${Math.round((header + body).length / 1024)} KB)`);
pieces.forEach((p) => console.log(`  ${p.id.padEnd(7)} ${p.title.slice(0, 44).padEnd(44)} ${p.meter.padEnd(5)} ${String(p.tempo).padStart(3)} BPM  ${p.clef.padEnd(6)} ${String(p.notes.length).padStart(5)} Noten${p.flats ? "  ♭" : ""}`));
