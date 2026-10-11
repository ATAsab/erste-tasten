// Bibliothek: gemeinfreie Stücke (Komponist:innen seit über 70 Jahren tot bzw. traditionell).
// Film- und Popmusik wie „Interstellar“ ist geschützt – dafür gibt es den MIDI-Import (midi.js).
// Eintrag mit lesson: verweist auf eine Kurs-Lektion statt eigener Noten.
// level: 1 leicht, 2 mittel, 3 anspruchsvoll. Noten-Token wie in lessons.js.
const GENRES = {
  ruhig: "Ruhig & entspannt",
  lernen: "Anfänger-Literatur",
  klassik: "Klassik",
  balladen: "Pop-Balladen (neu komponiert)",
  volkslieder: "Volks- & Kinderlieder",
  weihnachten: "Weihnachten",
  gospel: "Gospel & Spirituals",
  ragtime: "Ragtime & Jazz",
  film: "Bekannt aus Film & TV",
  technik: "Tonleitern & Technik",
  eigene: "Eigene Stücke",
};

const LIBRARY = [
  // ---------- Klassik ----------
  {
    id: "s-fuer-elise", title: "Für Elise (Thema)", composer: "Ludwig van Beethoven", year: 1810, genres: ["klassik"], level: 3,
    meter: "3/8", tempo: 60, clef: "grand",
    about: "Das berühmte Anfangsthema. Rechts die schwingende Melodie in Sechzehnteln, links gebrochene Akkorde, die sich mit der rechten Hand abwechseln.",
    tracks: {
      rh: "R:q E5:s Dis5:s | E5:s Dis5:s E5:s H4:s D5:s C5:s | A4:e R:s C4:s E4:s A4:s | H4:e R:s E4:s Gis4:s H4:s | " +
        "C5:e R:s E4:s E5:s Dis5:s | E5:s Dis5:s E5:s H4:s D5:s C5:s | A4:e R:s C4:s E4:s A4:s | H4:e R:s E4:s C5:s H4:s | A4:q R:e",
      lh: "R:qd | R:qd | A2:s E3:s A3:s R:e R:s | E2:s E3:s Gis3:s R:e R:s | " +
        "A2:s E3:s A3:s R:e R:s | R:qd | A2:s E3:s A3:s R:e R:s | E2:s E3:s Gis3:s R:e R:s | A2:s E3:s A3:s R:e R:s",
    },
  },
  {
    id: "s-kanon", title: "Kanon in D (Thema)", composer: "Johann Pachelbel", year: "um 1690", genres: ["klassik", "ruhig", "film"], level: 2,
    meter: "4/4", tempo: 60, clef: "grand",
    about: "Die Bassfolge D – A – H – Fis – G – D – G – A wiederholt sich ständig, darüber singt die Melodie. Bekannt von Hochzeiten und aus vielen Filmen.",
    tracks: {
      rh: "Fis5:h E5:h | D5:h Cis5:h | H4:h A4:h | H4:h Cis5:h | D5:h Cis5:h | H4:h A4:h | G4:h Fis4:h | G4:h E4:h | Fis4:w",
      lh: "D3:h A2:h | H2:h Fis2:h | G2:h D2:h | G2:h A2:h | D3:h A2:h | H2:h Fis2:h | G2:h D2:h | G2:h A2:h | D3:w",
    },
  },
  {
    id: "s-nachtmusik", title: "Eine kleine Nachtmusik (Anfang)", composer: "Wolfgang Amadeus Mozart", year: 1787, genres: ["klassik"], level: 2,
    meter: "4/4", tempo: 110, clef: "treble",
    about: "Der Anfang der berühmten Serenade KV 525: ein Signal aus Dreiklangstönen, das jeder kennt. Achte auf die kurzen Pausen.",
    tracks: { rh: "G4:q R:e D4:e G4:q R:e D4:e | G4:e D4:e G4:e H4:e D5:h | C5:q R:e A4:e C5:q R:e A4:e | C5:e A4:e Fis4:e A4:e D4:h" },
  },
  {
    id: "s-neue-welt", title: "Largo aus „Aus der Neuen Welt“", composer: "Antonín Dvořák", year: 1893, genres: ["klassik", "ruhig"], level: 1,
    meter: "4/4", tempo: 56, clef: "treble",
    about: "Die sehnsüchtige Melodie aus Dvořáks 9. Sinfonie, im Original vom Englischhorn gespielt. Ruhig und gesanglich – passt in die C-Position.",
    tracks: { rh: "E4:qd:3 G4:e:5 G4:h:5 | E4:qd:3 D4:e:2 C4:h:1 | D4:q:2 E4:q:3 G4:q:5 E4:q:3 | D4:w:2 | E4:qd:3 G4:e:5 G4:h:5 | E4:qd:3 D4:e:2 C4:h:1 | D4:q:2 E4:q:3 D4:q:2 C4:q:1 | C4:w:1" },
  },
  {
    id: "s-praeludium", title: "Präludium C-Dur (Anfang)", composer: "Johann Sebastian Bach", year: 1722, genres: ["klassik"], level: 2,
    meter: "4/4", tempo: 60, clef: "treble",
    about: "Aus dem Wohltemperierten Klavier: gebrochene Akkorde, jedes Muster zweimal. Im Original spielt die linke Hand die ersten beiden Töne jeder Gruppe – hier übst du alles mit rechts.",
    tracks: {
      rh: "C4:s E4:s G4:s C5:s E5:s G4:s C5:s E5:s C4:s E4:s G4:s C5:s E5:s G4:s C5:s E5:s | " +
        "C4:s D4:s A4:s D5:s F5:s A4:s D5:s F5:s C4:s D4:s A4:s D5:s F5:s A4:s D5:s F5:s | " +
        "H3:s D4:s G4:s D5:s F5:s G4:s D5:s F5:s H3:s D4:s G4:s D5:s F5:s G4:s D5:s F5:s | " +
        "C4:s E4:s G4:s C5:s E5:s G4:s C5:s E5:s C4:s E4:s G4:s C5:s E5:s G4:s C5:s E5:s | " +
        "C4:s E4:s A4:s E5:s A5:s A4:s E5:s A5:s C4:s E4:s A4:s E5:s A5:s A4:s E5:s A5:s",
    },
  },
  {
    id: "s-gymnopedie", title: "Gymnopédie Nr. 1 (Anfang)", composer: "Erik Satie", year: 1888, genres: ["klassik", "ruhig", "film"], level: 2,
    meter: "3/4", tempo: 70, clef: "grand",
    about: "Langsam und schwebend: Links pendeln ein tiefer Basston und ein Akkord, rechts setzt nach vier Takten die Melodie ein. Oft in Filmen und Werbung zu hören.",
    tracks: {
      rh: "R:hd | R:hd | R:hd | R:hd | R:q Fis5:q A5:q | G5:q Fis5:q Cis5:q | H4:q Cis5:q D5:q | A4:hd | Fis4:hd",
      lh: "G2:q H3+D4+Fis4:h | D2:q A3+Cis4+Fis4:h | G2:q H3+D4+Fis4:h | D2:q A3+Cis4+Fis4:h | G2:q H3+D4+Fis4:h | " +
        "D2:q A3+Cis4+Fis4:h | G2:q H3+D4+Fis4:h | D2:q A3+Cis4+Fis4:h | G2:q H3+D4+Fis4:h",
    },
  },
  {
    id: "s-zarathustra", title: "Also sprach Zarathustra (Fanfare)", composer: "Richard Strauss", year: 1896, genres: ["klassik", "film"], level: 1,
    meter: "4/4", tempo: 60, clef: "treble",
    about: "Die Sonnenaufgangs-Fanfare aus „2001: Odyssee im Weltraum“: Grundton, Quinte, Oktave – und dann der Wechsel von Dur (E) nach Moll (Es).",
    tracks: { rh: "C4:w:1 | G4:w:5 | C5:w:5 | E5:e:3 Es5:hd:2 R:e" },
  },
  { id: "s-ode", lesson: "ode-komplett", title: "Ode an die Freude", composer: "Ludwig van Beethoven", year: 1824, genres: ["klassik"], level: 1 },
  { id: "s-sternenweg", lesson: "sternenweg", title: "Sternenweg", composer: "Neu komponiert für Erste Tasten", year: 2026, genres: ["balladen", "ruhig"], level: 1 },
  { id: "s-menuett", lesson: "menuett", title: "Menuett G-Dur", composer: "Christian Petzold", year: 1725, genres: ["klassik"], level: 2 },

  // ---------- Pop-Balladen: eigene Kompositionen für diese App (frei verwendbar) ----------
  {
    id: "s-abendlicht", title: "Abendlicht", composer: "Neu komponiert für Erste Tasten", year: 2026, genres: ["balladen", "ruhig"], level: 2,
    meter: "4/4", tempo: 72, clef: "grand",
    about: "Eine ruhige Ballade im Pop-Stil mit der beliebten Akkordfolge C – a-Moll – F – G. In der ersten Hälfte spielt links ganze Akkorde, in der zweiten gebrochene Akkorde – so wie in vielen Popsongs.",
    chords: "C:w | Am:w | F:w | G:w | C:w | Am:w | F:h G:h | C:w | Am:w | F:w | C:w | G:w | Am:w | F:w | G:w | C:w",
    tracks: {
      rh: "E4:q G4:q C5:h | H4:q A4:q E4:h | F4:q A4:q C5:q A4:q | H4:h G4:h | E4:q G4:q C5:q E5:q | E5:q D5:q C5:h | A4:h H4:h | C5:w | " +
        "C5:q H4:q A4:h | A4:q G4:q F4:h | E4:q F4:q G4:h | D4:q E4:q D4:h | E4:q A4:q C5:h | C5:q A4:q F4:h | G4:q A4:q H4:q D5:q | C5:w",
      lh: "C3+E3+G3:w:531 | C3+E3+A3:w:531 | C3+F3+A3:w:521 | H2+D3+G3:w:531 | C3+E3+G3:w:531 | C3+E3+A3:w:531 | C3+F3+A3:h:521 H2+D3+G3:h:531 | C3+E3+G3:w:531 | " +
        "A2:q E3:q A3:q E3:q | F2:q C3:q F3:q C3:q | C3:q G3:q C4:q G3:q | G2:q D3:q G3:q D3:q | A2:q E3:q A3:q E3:q | F2:q C3:q F3:q C3:q | G2:q D3:q G3:q H3:q | C3+E3+G3:w:531",
    },
  },
  {
    id: "s-regen", title: "Regen am Fenster", composer: "Neu komponiert für Erste Tasten", year: 2026, genres: ["balladen", "ruhig"], level: 2,
    meter: "4/4", tempo: 66, clef: "grand",
    about: "Eine nachdenkliche Ballade in a-Moll mit der Folge a-Moll – F – C – G, die man aus unzähligen Popsongs kennt. Spiel sie langsam und leise, mit viel Haltepedal.",
    chords: "Am:w | F:w | C:w | G:w | Am:w | F:w | G:w | Am:w | Am:w | F:w | C:w | G:w | Am:w | F:w | G:w | Am:w",
    tracks: {
      rh: "A4:q C5:q E5:h | D5:q C5:q A4:h | G4:q C5:q E5:h | D5:q H4:q G4:h | A4:q C5:q E5:q D5:q | C5:h A4:h | H4:q C5:q D5:h | A4:w | " +
        "E5:qd D5:e C5:h | A4:qd H4:e C5:h | G4:q E4:q G4:q C5:q | H4:h D5:h | E5:q C5:q A4:h | F4:q A4:q C5:h | D5:q H4:q G4:q H4:q | A4:w",
      lh: "A2+C3+E3:w:531 | A2+C3+F3:w:531 | G2+C3+E3:w:521 | G2+H2+D3:w:531 | A2+C3+E3:w:531 | A2+C3+F3:w:531 | G2+H2+D3:w:531 | A2+C3+E3:w:531 | " +
        "A2:q E3:q A3:q E3:q | F2:q C3:q F3:q C3:q | C3:q G3:q C4:q G3:q | G2:q D3:q G3:q D3:q | A2:q E3:q A3:q E3:q | F2:q C3:q F3:q C3:q | G2:q D3:q G3:q D3:q | A2+E3+A3:w",
    },
  },

  // ---------- Volks- & Kinderlieder ----------
  { id: "s-haenschen", lesson: "haenschen", title: "Hänschen klein", composer: "Volkslied", year: "", genres: ["volkslieder"], level: 1 },
  { id: "s-entchen", lesson: "entchen", title: "Alle meine Entchen", composer: "Volkslied", year: "", genres: ["volkslieder"], level: 1 },
  { id: "s-bruder-jakob", lesson: "bruder-jakob", title: "Bruder Jakob", composer: "Volkslied (Frankreich)", year: "", genres: ["volkslieder"], level: 1 },
  { id: "s-mary", lesson: "mary-lamb", title: "Mary Had a Little Lamb", composer: "Kinderlied (USA)", year: 1830, genres: ["volkslieder"], level: 1 },
  {
    id: "s-au-clair", title: "Au clair de la lune", composer: "Volkslied (Frankreich)", year: "", genres: ["volkslieder"], level: 1,
    meter: "4/4", tempo: 100, clef: "treble",
    about: "Ein französisches Schlaflied. Im Mittelteil geht die Melodie unter das mittlere C – dort hilft die linke Hand nicht, die rechte rutscht kurz nach unten.",
    tracks: {
      rh: "C4:q C4:q C4:q D4:q | E4:h D4:h | C4:q E4:q D4:q D4:q | C4:w | C4:q C4:q C4:q D4:q | E4:h D4:h | C4:q E4:q D4:q D4:q | C4:w | " +
        "D4:q D4:q D4:q D4:q | A3:h A3:h | D4:q C4:q H3:q A3:q | G3:w | C4:q C4:q C4:q D4:q | E4:h D4:h | C4:q E4:q D4:q D4:q | C4:w",
    },
  },
  {
    id: "s-london-bridge", title: "London Bridge Is Falling Down", composer: "Kinderlied (England)", year: "", genres: ["volkslieder"], level: 1,
    meter: "4/4", tempo: 100, clef: "treble",
    about: "Englisches Kinderlied mit punktiertem Rhythmus am Anfang jeder Zeile.",
    tracks: { rh: "G4:qd:4 A4:e:5 G4:q:4 F4:q:3 | E4:q:2 F4:q:3 G4:h:4 | D4:q:1 E4:q:2 F4:h:3 | E4:q:2 F4:q:3 G4:h:4 | G4:qd:4 A4:e:5 G4:q:4 F4:q:3 | E4:q:2 F4:q:3 G4:h:4 | D4:h:1 G4:h:4 | E4:q:2 C4:hd:1" },
  },
  {
    id: "s-yankee-doodle", title: "Yankee Doodle", composer: "Volkslied (USA)", year: "", genres: ["volkslieder"], level: 1,
    meter: "4/4", tempo: 110, clef: "treble",
    about: "Ein flottes amerikanisches Lied aus dem 18. Jahrhundert – mit kurzen Abstechern unter das mittlere C.",
    tracks: { rh: "C4:q C4:q D4:q E4:q | C4:q E4:q D4:q G3:q | C4:q C4:q D4:q E4:q | C4:h H3:h | C4:q C4:q D4:q E4:q | F4:q E4:q D4:q C4:q | H3:q G3:q A3:q H3:q | C4:h C4:h" },
  },
  {
    id: "s-row-boat", title: "Row, Row, Row Your Boat", composer: "Kinderlied", year: 1852, genres: ["volkslieder"], level: 1,
    meter: "6/8", tempo: 90, clef: "treble",
    about: "Ein schaukelndes Lied im 6/8-Takt: Man fühlt zwei große Schläge pro Takt. Im Mittelteil viele schnelle Tonwiederholungen.",
    tracks: { rh: "C4:qd:1 C4:qd:1 | C4:q:1 D4:e:2 E4:qd:3 | E4:q:3 D4:e:2 E4:q:3 F4:e:4 | G4:hd:5 | C5:e C5:e C5:e G4:e G4:e G4:e | E4:e E4:e E4:e C4:e C4:e C4:e | G4:q:5 F4:e:4 E4:q:3 D4:e:2 | C4:hd:1" },
  },
  {
    id: "s-happy-birthday", title: "Happy Birthday", composer: "Mildred und Patty Hill", year: 1893, genres: ["volkslieder"], level: 1,
    meter: "3/4", tempo: 100, clef: "treble",
    about: "Das meistgesungene Lied der Welt – im 3/4-Takt mit Auftakt. Ideal, um es bald jemandem vorzuspielen!",
    tracks: { rh: "R:h G4:e G4:e | A4:q G4:q C5:q | H4:h G4:e G4:e | A4:q G4:q D5:q | C5:h G4:e G4:e | G5:q E5:q C5:q | H4:q A4:q F5:e F5:e | E5:q C5:q D5:q | C5:hd" },
  },
  {
    id: "s-old-macdonald", title: "Old MacDonald Had a Farm", composer: "Kinderlied (USA)", year: "", genres: ["volkslieder"], level: 1,
    meter: "4/4", tempo: 110, clef: "treble",
    about: "Das Bauernhof-Lied – mit „E-I-E-I-O“ am Ende jeder Zeile.",
    tracks: { rh: "C4:q C4:q C4:q G3:q | A3:q A3:q G3:h | E4:q E4:q D4:q D4:q | C4:hd G3:q | C4:q C4:q C4:q G3:q | A3:q A3:q G3:h | E4:q E4:q D4:q D4:q | C4:w" },
  },

  // ---------- Weihnachten ----------
  {
    id: "s-stille-nacht", title: "Stille Nacht, heilige Nacht", composer: "Franz Xaver Gruber", year: 1818, genres: ["weihnachten"], level: 2,
    meter: "6/8", tempo: 75, clef: "treble",
    about: "Das wohl bekannteste Weihnachtslied der Welt, entstanden in Oberndorf bei Salzburg. Ruhig wiegend im 6/8-Takt.",
    tracks: {
      rh: "G4:qd A4:e G4:q | E4:hd | G4:qd A4:e G4:q | E4:hd | D5:h D5:q | H4:hd | C5:h C5:q | G4:hd | " +
        "A4:h A4:q | C5:qd H4:e A4:q | G4:qd A4:e G4:q | E4:hd | A4:h A4:q | C5:qd H4:e A4:q | G4:qd A4:e G4:q | E4:hd | " +
        "D5:h D5:q | F5:qd D5:e H4:q | C5:hd | E5:hd | C5:qd G4:e E4:q | G4:qd F4:e D4:q | C4:hd",
    },
  },
  {
    id: "s-we-wish-you", title: "We Wish You a Merry Christmas", composer: "Volkslied (England)", year: "", genres: ["weihnachten"], level: 2,
    meter: "3/4", tempo: 120, clef: "treble",
    about: "Fröhlich im 3/4-Takt, mit Achtelketten, die die Melodie hinaufklettern lassen.",
    tracks: { rh: "R:h G4:q | C5:q C5:e D5:e C5:e H4:e | A4:q A4:q A4:q | D5:q D5:e E5:e D5:e C5:e | H4:q G4:q G4:q | E5:q E5:e F5:e E5:e D5:e | C5:q A4:q G4:e G4:e | A4:q D5:q H4:q | C5:h R:q" },
  },
  {
    id: "s-joy-to-the-world", title: "Joy to the World (Anfang)", composer: "Lowell Mason nach Händel", year: 1839, genres: ["weihnachten"], level: 1,
    meter: "4/4", tempo: 90, clef: "treble",
    about: "Die Melodie beginnt mit einer ganzen Tonleiter abwärts – perfekte Übung für den Fingerübersatz.",
    tracks: { rh: "C5:h:5 H4:qd:4 A4:e:3 | G4:hd:2 F4:q:1 | E4:h:3 D4:h:2 | C4:hd:1 G4:q | A4:hd A4:q | H4:hd H4:q | C5:w" },
  },
  { id: "s-jingle-bells", lesson: "jingle-bells", title: "Jingle Bells", composer: "James Lord Pierpont", year: 1857, genres: ["weihnachten"], level: 1 },
  { id: "s-weihnachtsmann", lesson: "weihnachtsmann", title: "Morgen kommt der Weihnachtsmann", composer: "Volkslied", year: "", genres: ["weihnachten", "volkslieder"], level: 1 },

  // ---------- Gospel & Spirituals ----------
  {
    id: "s-amazing-grace", title: "Amazing Grace", composer: "John Newton / Volksweise", year: 1779, genres: ["gospel"], level: 2,
    meter: "3/4", tempo: 80, clef: "treble",
    about: "Einer der bekanntesten Hymnen überhaupt. Ruhig im 3/4-Takt, mit großen Sprüngen nach oben.",
    tracks: {
      rh: "R:h G4:q | C5:h E5:e C5:e | E5:h D5:q | C5:h A4:q | G4:h G4:q | C5:h E5:e C5:e | E5:h D5:q | G5:hd | " +
        "G5:h E5:q | G5:h E5:e C5:e | E5:h D5:q | C5:h A4:q | G4:h G4:q | C5:h E5:e C5:e | E5:h D5:q | C5:hd",
    },
  },
  {
    id: "s-saints", title: "When the Saints Go Marching In", composer: "Spiritual", year: "", genres: ["gospel", "ragtime"], level: 1,
    meter: "4/4", tempo: 120, clef: "treble",
    about: "Ein Spiritual, das als Marsch und Jazz-Standard berühmt wurde. Komplett in der C-Position – mit Pausen auf der ersten Zählzeit.",
    tracks: {
      rh: "R:q C4:q:1 E4:q:3 F4:q:4 | G4:w:5 | R:q C4:q:1 E4:q:3 F4:q:4 | G4:w:5 | R:q C4:q:1 E4:q:3 F4:q:4 | G4:h:5 E4:h:3 | C4:h:1 E4:h:3 | D4:w:2 | " +
        "R:q E4:q:3 E4:q:3 D4:q:2 | C4:hd:1 C4:q:1 | E4:h:3 G4:q:5 G4:q:5 | F4:w:4 | R:q E4:q:3 F4:q:4 G4:q:5 | E4:h:3 C4:h:1 | D4:w:2 | C4:w:1",
    },
  },

  // ---------- Ragtime ----------
  {
    id: "s-entertainer", title: "The Entertainer (Thema)", composer: "Scott Joplin", year: 1902, genres: ["ragtime", "film"], level: 3,
    meter: "4/4", tempo: 80, clef: "treble",
    about: "Das Hauptthema des Rags, bekannt aus dem Film „Der Clou“. Rhythmisch vereinfacht – die Töne stimmen, die typischen Synkopen kommen später.",
    tracks: { rh: "R:h D5:e Dis5:e E5:e C6:e | E5:e C6:e E5:e C6:qd R:q | C6:e D6:e Dis6:e E6:e C6:e D6:e E6:e H5:e | D6:q C6:hd" },
  },
];

if (typeof module !== "undefined") module.exports = { GENRES, LIBRARY };
