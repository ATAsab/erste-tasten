// Lehrplan. Noten-Token: "Name+Oktave:Dauer:Finger" – C4 ist das mittlere C.
// Dauer: e=Achtel, q=Viertel, qd=punktierte Viertel, h=Halbe, hd=punktierte Halbe, w=Ganze.
// "|" trennt Takte (nur zur Lesbarkeit, wird vom Test geprüft). clef: null = nur Klaviatur, ohne Noten.
// Die Texte sind eigene, statische Inhalte und dürfen <b> enthalten.

const ODE_RH =
  "E4:q:3 E4:q:3 F4:q:4 G4:q:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:q:1 C4:q:1 D4:q:2 E4:q:3 | E4:qd:3 D4:e:2 D4:h:2 | " +
  "E4:q:3 E4:q:3 F4:q:4 G4:q:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:q:1 C4:q:1 D4:q:2 E4:q:3 | D4:qd:2 C4:e:1 C4:h:1";

const HAENSCHEN_RH =
  "G4:q:5 E4:q:3 E4:h:3 | F4:q:4 D4:q:2 D4:h:2 | C4:q:1 D4:q:2 E4:q:3 F4:q:4 | G4:q:5 G4:q:5 G4:h:5 | " +
  "G4:q:5 E4:q:3 E4:h:3 | F4:q:4 D4:q:2 D4:h:2 | C4:q:1 E4:q:3 G4:q:5 G4:q:5 | C4:w:1";

// Menuett G-Dur (Notenbüchlein für Anna Magdalena Bach, Petzold zugeschrieben); Bass vereinfacht.
const MENUETT_RH_START =
  "D5:q:5 G4:e:1 A4:e:2 H4:e:3 C5:e:4 | D5:q:5 G4:q:1 G4:q:1 | E5:q:5 C5:e:1 D5:e:2 E5:e:3 Fis5:e:4 | G5:q:5 G4:q:1 G4:q:1 | " +
  "C5:q:4 D5:e:5 C5:e:4 H4:e:3 A4:e:2 | H4:q:3 C5:e:4 H4:e:3 A4:e:2 G4:e:1";
const MENUETT_RH_END_1 = "Fis4:q:1 G4:e:2 A4:e:3 H4:e:4 G4:e:2 | A4:hd:3";
const MENUETT_RH_END_2 = "A4:q:3 H4:e:4 A4:e:3 G4:e:2 Fis4:e:1 | G4:hd:2";
const MENUETT_LH_1 = "G2:hd:5 | H2:hd:3 | C3:hd:2 | H2:hd:3 | A2:hd:4 | G2:hd:5 | D3:hd:1 | D3:hd:1";
const MENUETT_LH_2 = "G2:hd:5 | H2:hd:3 | C3:hd:2 | H2:hd:3 | A2:hd:4 | G2:hd:5 | D3:hd:1 | G2:hd:5";

// Setzt Dynamikzeichen vor bestimmte Takte: withDynamics(text, { 0: "p", 4: "f" })
const withDynamics = (text, marks) =>
  text.split(" | ").map((bar, i) => (marks[i] ? `!${marks[i]} ${bar}` : bar)).join(" | ");

const NO_POSITION_HELP = { keys: false, keyNames: false };
const READING_ONLY = { names: false, keys: false, keyNames: false };

const CHAPTERS = [
  {
    title: "Die Klaviatur",
    lessons: [
      {
        id: "c-finden",
        title: "Schwarze Gruppen & das C",
        text: [
          "Willkommen! Bevor du Noten liest, lernst du, dich auf den Tasten zurechtzufinden. Schau dir die <b>schwarzen Tasten</b> an: Sie kommen immer abwechselnd in <b>2er- und 3er-Gruppen</b>.",
          "Das <b>C</b> ist die weiße Taste direkt <b>links neben jeder 2er-Gruppe</b>. Weil sich das Muster alle 12 Tasten wiederholt, gibt es viele C's. Die kleine Zahl sagt, welches gemeint ist: <b>C4</b> ist das C in der Mitte deines Keyboards.",
          "Setz dich mittig vor das Keyboard, Schultern locker, Unterarme ungefähr waagerecht.",
        ],
        task: "Spiele alle vier C's von links nach rechts. Die leuchtende Taste zeigt dir, wo.",
        clef: null,
        tempo: 60,
        tracks: { rh: "C3:w | C4:w | C5:w | C6:w" },
      },
      {
        id: "c-d-e",
        title: "D und E",
        text: [
          "Das <b>D</b> liegt <b>zwischen</b> den beiden schwarzen Tasten der 2er-Gruppe, das <b>E</b> rechts daneben.",
          "Merkhilfe: C, D und E umarmen die 2er-Gruppe.",
        ],
        task: "Spiele C – D – E hinauf und wieder hinunter. Ein Finger reicht fürs Erste.",
        clef: null,
        tempo: 70,
        tracks: { rh: "C4:q D4:q E4:h | E4:q D4:q C4:h | C4:q E4:q D4:q E4:q | C4:w" },
      },
      {
        id: "f-bis-h",
        title: "F, G, A und H",
        text: [
          "Das <b>F</b> liegt direkt <b>links neben der 3er-Gruppe</b>. Dann folgen <b>G</b>, <b>A</b> und <b>H</b> – danach beginnt mit dem nächsten C alles von vorn.",
          "Achtung, Besonderheit im Deutschen: Die Taste nach dem A heißt <b>H</b> (im Englischen „B“). Die sieben weißen Töne heißen also: C D E F G A H.",
        ],
        task: "Spiele die Tonleiter von C4 bis C5 hinauf und wieder hinunter.",
        clef: null,
        tempo: 80,
        tracks: { rh: "C4:q D4:q E4:q F4:q | G4:q A4:q H4:q C5:q | C5:q H4:q A4:q G4:q | F4:q E4:q D4:q C4:q" },
      },
      {
        id: "toene-finden",
        title: "Finde die Töne",
        text: [
          "Jetzt leuchten die Tasten nicht mehr: Du siehst nur den Namen und findest die Taste selbst.",
          "Orientiere dich an den schwarzen Gruppen: <b>C</b> liegt links neben der 2er-Gruppe, <b>F</b> links neben der 3er-Gruppe. Von dort zählst du weiter.",
        ],
        task: "Spiele 12 zufällige Töne. Nach zwei Fehlern hintereinander bekommst du einen Tipp.",
        clef: null,
        tempo: 70,
        helps: NO_POSITION_HELP,
        drill: { pool: ["C4", "D4", "E4", "F4", "G4", "A4", "H4"], count: 12 },
      },
    ],
  },
  {
    title: "Hand & Finger",
    lessons: [
      {
        id: "c-position",
        title: "Fingernummern & C-Position",
        text: [
          "Am Klavier haben die Finger Nummern – an <b>beiden Händen gleich</b>: <b>1 = Daumen</b>, 2 = Zeigefinger, 3 = Mittelfinger, 4 = Ringfinger, <b>5 = kleiner Finger</b>.",
          "Leg die rechte Hand so auf die Tasten, dass der <b>Daumen auf C4</b> liegt und jeder Finger eine eigene weiße Taste hat: C D E F G. Das ist die <b>C-Position</b> – dein Zuhause für die ersten Lieder.",
          "Halte die Finger leicht gebogen, als würdest du einen Apfel umfassen, und spiele mit den Fingerkuppen.",
        ],
        task: "Spiele von C bis G und zurück – die kleine Zahl sagt dir, welcher Finger dran ist.",
        clef: null,
        tempo: 80,
        tracks: { rh: "C4:q:1 D4:q:2 E4:q:3 F4:q:4 | G4:w:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:w:1" },
      },
      {
        id: "finger-gymnastik",
        title: "Finger-Gymnastik",
        text: [
          "Jetzt springen die Finger. Die Hand bleibt dabei ruhig in der C-Position liegen – nur die Finger bewegen sich.",
          "Der 4. Finger ist von Natur aus der schwächste. Keine Sorge: Das wird mit jeder Übung besser.",
        ],
        task: "Spiele das Muster langsam und gleichmäßig. Genauigkeit ist wichtiger als Tempo.",
        clef: null,
        tempo: 80,
        tracks: { rh: "C4:q:1 E4:q:3 D4:q:2 F4:q:4 | E4:q:3 G4:q:5 F4:q:4 E4:q:3 | D4:q:2 F4:q:4 E4:q:3 D4:q:2 | C4:w:1" },
      },
    ],
  },
  {
    title: "Noten lesen",
    lessons: [
      {
        id: "notensystem",
        title: "Das Notensystem",
        text: [
          "Noten stehen auf <b>fünf Linien</b>. Je <b>höher</b> eine Note steht, desto <b>weiter rechts</b> liegt ihre Taste.",
          "Das Zeichen am Anfang ist der <b>Violinschlüssel</b>, er gilt für die rechte Hand. Seine Schnecke kringelt sich um die 2. Linie – dort steht das <b>G</b>.",
          "Von C bis G: <b>C</b> hat eine eigene kleine Hilfslinie, <b>D</b> hängt unter der untersten Linie, <b>E</b> sitzt auf der 1. Linie, <b>F</b> im 1. Zwischenraum, <b>G</b> auf der 2. Linie. Es geht also immer abwechselnd: Linie – Zwischenraum – Linie.",
        ],
        task: "Lies die Noten und spiele sie. Die Notennamen unter den Noten helfen dir noch.",
        clef: "treble",
        tempo: 70,
        tracks: { rh: "C4:w:1 | D4:w:2 | E4:w:3 | F4:w:4 | G4:w:5 | E4:h:3 C4:h:1 | G4:h:5 E4:h:3 | C4:w:1" },
      },
      {
        id: "lesen-c-g",
        title: "Notenlese-Trainer: C bis G",
        text: [
          "Jetzt ohne Namen: Du siehst nur die Note und findest die Taste. Erst lesen, <b>dann</b> spielen – Raten bringt dich nicht weiter.",
          "Eselsbrücke: <b>E</b> sitzt auf der untersten Linie, <b>G</b> auf der zweiten. Alles andere ist genau einen Schritt daneben.",
        ],
        task: "16 zufällige Noten. Wenn es zu schwer ist, schalte die Hilfen ruhig wieder ein.",
        clef: "treble",
        tempo: 70,
        helps: READING_ONLY,
        drill: { pool: ["C4:q:1", "D4:q:2", "E4:q:3", "F4:q:4", "G4:q:5"], count: 16 },
      },
      {
        id: "notenwerte",
        title: "Notenwerte: Wie lange klingt ein Ton?",
        text: [
          "Die <b>Form</b> einer Note zeigt, wie <b>lange</b> sie klingt. Wir zählen dazu gleichmäßig: 1 – 2 – 3 – 4.",
          "<b>Viertelnote</b> (schwarz, mit Hals) = 1 Schlag. <b>Halbe Note</b> (hohl, mit Hals) = 2 Schläge. <b>Ganze Note</b> (hohl, ohne Hals) = 4 Schläge.",
          "Ein <b>Takt</b> reicht von einem senkrechten Strich zum nächsten und hat hier immer 4 Schläge – das bedeutet die <b>4/4</b> am Anfang.",
          "Drück auf <b>Vorspielen</b> und zähl laut mit. Beim Üben wartet die App auf dich – den Rhythmus trainierst du, indem du beim Spielen mitzählst.",
        ],
        task: "Spiele die Übung und halte jede Note so lange, wie sie zählt.",
        clef: "treble",
        tempo: 80,
        tracks: {
          rh: "C4:q:1 D4:q:2 E4:h:3 | E4:q:3 D4:q:2 C4:h:1 | C4:q:1 E4:q:3 G4:h:5 | G4:w:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:w:1",
        },
      },
    ],
  },
  {
    title: "Erste Lieder",
    lessons: [
      {
        id: "ode-1",
        title: "Ode an die Freude · Teil 1",
        text: [
          "Dein erstes echtes Stück! Die Melodie stammt aus Beethovens 9. Sinfonie (1824) und ist heute die Europahymne.",
          "Sie bleibt komplett in der C-Position: Daumen auf C, nichts verschieben. Hör sie dir zuerst einmal mit <b>Vorspielen</b> an.",
        ],
        task: "Spiele die ersten vier Takte.",
        clef: "treble",
        tempo: 100,
        tracks: {
          rh: "E4:q:3 E4:q:3 F4:q:4 G4:q:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:q:1 C4:q:1 D4:q:2 E4:q:3 | E4:q:3 D4:q:2 D4:h:2",
        },
      },
      {
        id: "ode-2",
        title: "Ode an die Freude · Teil 2",
        text: [
          "Teil 2 beginnt genau wie Teil 1 – nur das Ende ist anders: Statt auf D landet die Melodie auf C und klingt dadurch „fertig“.",
          "Achte besonders auf den letzten Takt.",
        ],
        task: "Spiele die zweiten vier Takte.",
        clef: "treble",
        tempo: 100,
        tracks: {
          rh: "E4:q:3 E4:q:3 F4:q:4 G4:q:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:q:1 C4:q:1 D4:q:2 E4:q:3 | D4:q:2 C4:q:1 C4:h:1",
        },
      },
      {
        id: "ode-komplett",
        title: "Ode an die Freude · komplett",
        text: [
          "Jetzt das ganze Stück im Original-Rhythmus. Neu ist der <b>Punkt</b> hinter einer Note: Er verlängert sie um die Hälfte. Eine <b>punktierte Viertel</b> dauert 1½ Schläge.",
          "Danach folgt eine <b>Achtelnote</b> (mit Fähnchen), sie dauert nur ½ Schlag. Zusammen ergibt das wieder 2 Schläge: lang – kurz.",
          "Hör dir mit <b>Vorspielen</b> an, wie das Lang-Kurz am Ende jeder Zeile die Melodie lebendig macht.",
        ],
        task: "Spiele das komplette Stück.",
        clef: "treble",
        tempo: 100,
        tracks: { rh: ODE_RH },
      },
      {
        id: "haenschen",
        title: "Hänschen klein",
        text: [
          "Ein Kinderlied, das fast jeder kennt – und es passt genau in die C-Position.",
          "Neu sind <b>Sprünge</b> (G → E, C → E → G). Schau auf die Abstände: Springt die Note von einer Linie zur nächsten Linie, überspringst du eine Taste.",
        ],
        task: "Spiele das ganze Lied.",
        clef: "treble",
        tempo: 100,
        tracks: { rh: HAENSCHEN_RH },
      },
    ],
  },
  {
    title: "Die Hand wandert",
    lessons: [
      {
        id: "neuer-ton-a",
        title: "Neuer Ton: A",
        text: [
          "Das <b>A</b> steht im <b>2. Zwischenraum</b>, direkt über dem G. In der C-Position hat es keinen Finger mehr.",
          "Die Lösung: Die ganze Hand <b>rutscht eine Taste nach rechts</b>. Jetzt liegt der Daumen auf D und der kleine Finger auf A. Die Fingernummern zeigen dir immer, wo deine Hand gerade ist.",
        ],
        task: "Rutsch mit der Hand nach rechts (Daumen auf D) und spiele D bis A hinauf und zurück.",
        clef: "treble",
        tempo: 80,
        tracks: { rh: "D4:q:1 E4:q:2 F4:q:3 G4:q:4 | A4:w:5 | A4:q:5 G4:q:4 F4:q:3 E4:q:2 | D4:w:1" },
      },
      {
        id: "entchen",
        title: "Alle meine Entchen",
        text: [
          "Hier wandert die Hand <b>während</b> des Lieds: Du beginnst in der C-Position. <b>Vor dem ersten A</b> rutscht die Hand eine Taste nach rechts – der kleine Finger geht von G auf A.",
          "Ganz am Ende rutscht nur der <b>Daumen</b> von D zurück aufs C.",
        ],
        task: "Spiele das ganze Lied und achte auf die Fingernummern beim Handwechsel.",
        clef: "treble",
        tempo: 100,
        tracks: {
          rh:
            "C4:q:1 D4:q:2 E4:q:3 F4:q:4 | G4:h:5 G4:h:5 | A4:q:5 A4:q:5 A4:q:5 A4:q:5 | G4:w:4 | " +
            "A4:q:5 A4:q:5 A4:q:5 A4:q:5 | G4:w:4 | F4:q:3 F4:q:3 F4:q:3 F4:q:3 | E4:h:2 E4:h:2 | " +
            "D4:q:1 D4:q:1 D4:q:1 D4:q:1 | C4:w:1",
        },
      },
      {
        id: "weihnachtsmann",
        title: "Morgen kommt der Weihnachtsmann",
        text: [
          "Diese Melodie kennst du vielleicht auch als „Twinkle, Twinkle, Little Star“ – Mozart hat sogar Variationen darüber geschrieben.",
          "Gleicher Trick wie bei den Entchen: Vor <b>A A</b> rutscht die Hand nach rechts, beim C am Ende der Zeile rutscht der Daumen zurück. Der Mittelteil (G G F F …) liegt wieder in der C-Position.",
        ],
        task: "Spiele das ganze Lied.",
        clef: "treble",
        tempo: 100,
        tracks: {
          rh:
            "C4:q:1 C4:q:1 G4:q:5 G4:q:5 | A4:q:5 A4:q:5 G4:h:4 | F4:q:3 F4:q:3 E4:q:2 E4:q:2 | D4:q:1 D4:q:1 C4:h:1 | " +
            "G4:q:5 G4:q:5 F4:q:4 F4:q:4 | E4:q:3 E4:q:3 D4:h:2 | G4:q:5 G4:q:5 F4:q:4 F4:q:4 | E4:q:3 E4:q:3 D4:h:2 | " +
            "C4:q:1 C4:q:1 G4:q:5 G4:q:5 | A4:q:5 A4:q:5 G4:h:4 | F4:q:3 F4:q:3 E4:q:2 E4:q:2 | D4:q:1 D4:q:1 C4:h:1",
        },
      },
      {
        id: "lesen-c-a",
        title: "Notenlese-Trainer: C bis A",
        text: ["Jetzt ist das A mit dabei. Lies jede Note in Ruhe, bevor du spielst."],
        task: "16 zufällige Noten von C bis A.",
        clef: "treble",
        tempo: 70,
        helps: READING_ONLY,
        drill: { pool: ["C4", "D4", "E4", "F4", "G4", "A4"], count: 16 },
      },
    ],
  },
  {
    title: "Die linke Hand",
    lessons: [
      {
        id: "bassschluessel",
        title: "Der Bassschlüssel",
        text: [
          "Die linke Hand spielt meist die <b>tiefen Töne</b>. Dafür gibt es den <b>Bassschlüssel</b>. Seine zwei Punkte umrahmen die 4. Linie – dort steht das <b>F</b>.",
          "Wichtig: Im Bassschlüssel stehen die Noten <b>anders</b> als im Violinschlüssel! <b>C3</b> steht im 2. Zwischenraum, D auf der Mittellinie, E im 3. Zwischenraum, F auf der 4. Linie, G im 4. Zwischenraum.",
          "C-Position links: <b>kleiner Finger (5) auf C3</b> – eine Oktave unter dem mittleren C – und der Daumen (1) auf G3. Die Fingernummern laufen also andersherum.",
        ],
        task: "Spiele mit der linken Hand C bis G hinauf und zurück.",
        clef: "bass",
        tempo: 80,
        tracks: { lh: "C3:q:5 D3:q:4 E3:q:3 F3:q:2 | G3:w:1 | G3:q:1 F3:q:2 E3:q:3 D3:q:4 | C3:w:5" },
      },
      {
        id: "lesen-bass",
        title: "Notenlese-Trainer: Bassschlüssel",
        text: ["Dieselben Tonnamen wie rechts – aber an anderen Stellen im Notensystem. Merke dir: <b>C3 im 2. Zwischenraum</b>, von dort Schritt für Schritt."],
        task: "16 zufällige Noten für die linke Hand.",
        clef: "bass",
        tempo: 70,
        helps: READING_ONLY,
        drill: { pool: ["C3:q:5", "D3:q:4", "E3:q:3", "F3:q:2", "G3:q:1"], count: 16, hand: "lh" },
      },
      {
        id: "ode-links",
        title: "Ode an die Freude · links",
        text: ["Dieselbe Melodie, eine Oktave tiefer, mit der linken Hand. Die Finger sind gespiegelt: Das E spielt der 3. Finger, das G der Daumen."],
        task: "Spiele das komplette Stück mit links.",
        clef: "bass",
        tempo: 90,
        tracks: {
          lh:
            "E3:q:3 E3:q:3 F3:q:2 G3:q:1 | G3:q:1 F3:q:2 E3:q:3 D3:q:4 | C3:q:5 C3:q:5 D3:q:4 E3:q:3 | E3:qd:3 D3:e:4 D3:h:4 | " +
            "E3:q:3 E3:q:3 F3:q:2 G3:q:1 | G3:q:1 F3:q:2 E3:q:3 D3:q:4 | C3:q:5 C3:q:5 D3:q:4 E3:q:3 | D3:qd:4 C3:e:5 C3:h:5",
        },
      },
    ],
  },
  {
    title: "Beide Hände",
    lessons: [
      {
        id: "zwei-haende",
        title: "Zwei Hände, ein Takt",
        text: [
          "Jetzt spielen beide Hände zusammen – auf zwei verbundenen Notensystemen: oben die rechte Hand, unten die linke.",
          "Noten, die <b>genau übereinander</b> stehen, spielst du <b>gleichzeitig</b>. Die linke Hand hält hier lange Basstöne, während die rechte weiterspielt.",
          "Ganz langsam ist völlig in Ordnung – die App wartet, bis <b>beide</b> Töne gedrückt sind.",
        ],
        task: "Spiele die Melodie rechts und drücke zu jedem Taktanfang den Basston links dazu.",
        clef: "grand",
        tempo: 80,
        tracks: {
          rh: "C4:q:1 D4:q:2 E4:q:3 F4:q:4 | G4:w:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:w:1",
          lh: "C3:w:5 | C3:w:5 | G3:w:1 | C3:w:5",
        },
      },
      {
        id: "ode-beide",
        title: "Ode an die Freude · beidhändig",
        text: [
          "Die Melodie kennst du schon. Die linke Hand spielt nur zwei Töne: <b>C</b> (kleiner Finger) und <b>G</b> (Daumen) – immer am Taktanfang.",
          "Tipp: Spiel zuerst einmal nur die linke Hand mit (rechts nur den ersten Ton jedes Takts), dann alles zusammen.",
        ],
        task: "Spiele das ganze Stück mit beiden Händen.",
        clef: "grand",
        tempo: 90,
        tracks: { rh: ODE_RH, lh: "C3:w:5 | G3:w:1 | C3:w:5 | G3:w:1 | C3:w:5 | G3:w:1 | C3:w:5 | G3:h:1 C3:h:5" },
      },
      {
        id: "haenschen-beide",
        title: "Hänschen klein · beidhändig",
        text: ["Dein Abschlussstück für den Grundkurs. Gleiches Prinzip: links C oder G am Taktanfang, rechts die Melodie. Achte darauf, welcher Basston in welchem Takt kommt."],
        task: "Spiele das ganze Lied mit beiden Händen.",
        clef: "grand",
        tempo: 90,
        tracks: { rh: HAENSCHEN_RH, lh: "C3:w:5 | G3:w:1 | C3:w:5 | G3:w:1 | C3:w:5 | G3:w:1 | C3:w:5 | C3:w:5" },
      },
    ],
  },
  {
    title: "Achtel & neue Positionen",
    lessons: [
      {
        id: "achtel",
        title: "Achtelnoten",
        text: [
          "Eine <b>Achtelnote</b> dauert einen halben Schlag. Zähl dazu „<b>1</b> und <b>2</b> und <b>3</b> und <b>4</b> und“: Die erste Achtel fällt auf die Zahl, die zweite auf das „und“.",
          "Zwei oder vier Achtel, die zusammen einen Schlag füllen, werden mit einem <b>Balken</b> verbunden statt mit einzelnen Fähnchen. Das macht das Lesen leichter: Ein Balken-Paar = ein Schlag.",
        ],
        task: "Spiel die Übung und zähl laut mit. Hör sie dir vorher mit „Vorspielen“ an.",
        clef: "treble",
        tempo: 80,
        tracks: {
          rh: "C4:e:1 D4:e:2 E4:e:3 F4:e:4 G4:q:5 G4:q:5 | G4:e:5 F4:e:4 E4:e:3 D4:e:2 C4:h:1 | E4:e:3 E4:e:3 D4:q:2 F4:e:4 F4:e:4 E4:q:3 | D4:e:2 E4:e:3 D4:e:2 C4:e:1 C4:h:1",
        },
      },
      {
        id: "jingle-bells",
        title: "Jingle Bells",
        text: [
          "Ein Weihnachtsklassiker aus den USA (1857), komplett in der C-Position. Neu: Achtel und die punktierte Viertel mitten im Lied.",
          "Achte auf Takt 6: Die zwei Achtel am Ende („ride in a“) gehen schnell – zähl „3 und 4 und“.",
        ],
        task: "Spiele das ganze Lied.",
        clef: "treble",
        tempo: 110,
        tracks: {
          rh:
            "E4:q:3 E4:q:3 E4:h:3 | E4:q:3 E4:q:3 E4:h:3 | E4:q:3 G4:q:5 C4:qd:1 D4:e:2 | E4:w:3 | " +
            "F4:q:4 F4:q:4 F4:qd:4 F4:e:4 | F4:q:4 E4:q:3 E4:q:3 E4:e:3 E4:e:3 | E4:q:3 D4:q:2 D4:q:2 E4:q:3 | D4:h:2 G4:h:5 | " +
            "E4:q:3 E4:q:3 E4:h:3 | E4:q:3 E4:q:3 E4:h:3 | E4:q:3 G4:q:5 C4:qd:1 D4:e:2 | E4:w:3 | " +
            "F4:q:4 F4:q:4 F4:qd:4 F4:e:4 | F4:q:4 E4:q:3 E4:q:3 E4:e:3 E4:e:3 | G4:q:5 G4:q:5 F4:q:4 D4:q:2 | C4:w:1",
        },
      },
      {
        id: "g-position",
        title: "Die G-Position",
        text: [
          "Bisher lag dein Daumen auf C. Jetzt wandert die rechte Hand nach oben: <b>Daumen auf G4</b>, dann A, H, C und D – das ist die <b>G-Position</b>.",
          "Im Notensystem: G auf der 2. Linie, A im 2. Zwischenraum, H auf der Mittellinie, C im 3. Zwischenraum, D auf der 4. Linie.",
        ],
        task: "Leg den Daumen auf G und spiele die Übung.",
        clef: "treble",
        tempo: 80,
        tracks: {
          rh: "G4:q:1 A4:q:2 H4:q:3 C5:q:4 | D5:w:5 | D5:q:5 C5:q:4 H4:q:3 A4:q:2 | G4:w:1 | G4:q:1 H4:q:3 D5:h:5 | C5:q:4 A4:q:2 G4:h:1",
        },
      },
      {
        id: "mary-lamb",
        title: "Mary Had a Little Lamb",
        text: ["Ein englisches Kinderlied, das perfekt in die G-Position passt. Der Daumen bleibt auf G, du brauchst nur G, A, H und D."],
        task: "Spiele das Lied in der G-Position.",
        clef: "treble",
        tempo: 100,
        tracks: {
          rh:
            "H4:q:3 A4:q:2 G4:q:1 A4:q:2 | H4:q:3 H4:q:3 H4:h:3 | A4:q:2 A4:q:2 A4:h:2 | H4:q:3 D5:q:5 D5:h:5 | " +
            "H4:q:3 A4:q:2 G4:q:1 A4:q:2 | H4:q:3 H4:q:3 H4:q:3 H4:q:3 | A4:q:2 A4:q:2 H4:q:3 A4:q:2 | G4:w:1",
        },
      },
      {
        id: "bruder-jakob",
        title: "Bruder Jakob",
        text: [
          "Der berühmte Kanon – mit einem Trick: Das tiefe G am Ende („Ding, dang, dong“) spielt die <b>linke Hand</b> mit dem Daumen, während die rechte kurz Pause macht.",
          "Neu sind auch <b>Pausenzeichen</b>: Dort spielt die Hand nichts, du zählst einfach weiter. In Takt 5 und 6 streckt sich die rechte Hand ein wenig, damit der kleine Finger das A erreicht.",
        ],
        task: "Spiele das Lied – rechts die Melodie, links nur das tiefe G.",
        clef: "grand",
        tempo: 100,
        tracks: {
          rh:
            "C4:q:1 D4:q:2 E4:q:3 C4:q:1 | C4:q:1 D4:q:2 E4:q:3 C4:q:1 | E4:q:3 F4:q:4 G4:h:5 | E4:q:3 F4:q:4 G4:h:5 | " +
            "G4:e:4 A4:e:5 G4:e:4 F4:e:3 E4:q:2 C4:q:1 | G4:e:4 A4:e:5 G4:e:4 F4:e:3 E4:q:2 C4:q:1 | C4:q:1 R:q C4:h:1 | C4:q:1 R:q C4:h:1",
          lh: "R:w | R:w | R:w | R:w | R:w | R:w | R:q G3:q:1 R:h | R:q G3:q:1 R:h",
        },
      },
    ],
  },
  {
    title: "Laut & leise",
    lessons: [
      {
        id: "dynamik",
        title: "Piano und Forte",
        text: [
          "Jetzt kommt Ausdruck ins Spiel: <b><i>f</i></b> (forte) heißt laut, <b><i>p</i></b> (piano) heißt leise. Das Zeichen steht unter den Noten und gilt, bis ein neues kommt.",
          "Laut spielst du nicht durch Drücken, sondern indem du die Taste <b>schneller</b> anschlägst – mit etwas mehr Armgewicht. Leise: langsam und weich in die Taste sinken.",
          "Bewertet wird die Lautstärke nur mit <b>USB-Keyboard</b>: Es misst, wie schnell du anschlägst. Ist dir die Grenze zwischen leise und laut zu streng, stell sie oben unter „Feinjustierung“ ein.",
        ],
        task: "Spiele die erste Hälfte laut, die zweite leise. Die Anzeige „Anschlag“ zeigt dir, wie fest du gespielt hast.",
        clef: "treble",
        tempo: 80,
        tracks: { rh: "!f C4:q:1 D4:q:2 E4:q:3 F4:q:4 | G4:w:5 | !p G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:w:1" },
      },
      {
        id: "echo",
        title: "Das Echo-Spiel",
        text: ["Jede kleine Melodie kommt zweimal: erst laut, dann als leises Echo – wie in den Bergen. Der Unterschied soll deutlich hörbar sein."],
        task: "Spiel laut und leise im Wechsel.",
        clef: "treble",
        tempo: 90,
        tracks: {
          rh:
            "!f C4:q:1 E4:q:3 G4:h:5 | !p C4:q:1 E4:q:3 G4:h:5 | !f G4:q:5 F4:q:4 E4:q:3 D4:q:2 | !p G4:q:5 F4:q:4 E4:q:3 D4:q:2 | " +
            "!f E4:q:3 D4:q:2 C4:h:1 | !p E4:q:3 D4:q:2 C4:h:1",
        },
      },
      {
        id: "ode-dynamik",
        title: "Ode an die Freude · mit Ausdruck",
        text: ["Die Melodie kennst du – jetzt mit Gestaltung: Die erste Hälfte leise und ruhig, die zweite laut und strahlend. So klingt dasselbe Stück plötzlich viel lebendiger."],
        task: "Spiele das Stück mit leiser erster und lauter zweiter Hälfte.",
        clef: "treble",
        tempo: 100,
        tracks: { rh: withDynamics(ODE_RH, { 0: "p", 4: "f" }) },
      },
    ],
  },
  {
    title: "Tonleitern & Begleitung",
    lessons: [
      {
        id: "tonleiter-c",
        title: "C-Dur-Tonleiter mit Daumenuntersatz",
        text: [
          "Eine Tonleiter hat acht Töne – aber du hast nur fünf Finger. Der Trick heißt <b>Daumenuntersatz</b>: Nach C – D – E (Finger 1, 2, 3) schlüpft der Daumen <b>unter</b> der Hand durch und spielt das F. Dann geht es mit 2, 3, 4, 5 weiter.",
          "Abwärts umgekehrt: Nach F (Daumen) greift der <b>3. Finger über</b> den Daumen aufs E. Die Hand bleibt dabei ruhig, nur der Daumen bewegt sich.",
        ],
        task: "Spiel die Tonleiter langsam hinauf und hinunter – achte genau auf die Fingernummern.",
        clef: "treble",
        tempo: 70,
        tracks: { rh: "C4:q:1 D4:q:2 E4:q:3 F4:q:1 | G4:q:2 A4:q:3 H4:q:4 C5:q:5 | C5:q:5 H4:q:4 A4:q:3 G4:q:2 | F4:q:1 E4:q:3 D4:q:2 C4:q:1" },
      },
      {
        id: "akkorde-links",
        title: "Akkorde mit links",
        text: [
          "Die linke Hand spielt jetzt <b>drei Töne gleichzeitig</b> – Akkorde. Drei Griffe reichen für viele Lieder: <b>C-Dur</b> (C – E – G), <b>F-Dur</b> (C – F – A) und <b>G7</b> (H – F – G).",
          "Der kleine Finger bleibt dabei fast immer liegen, die Hand wechselt nur wenig. Die Fingernummern stehen von unten nach oben. Drück alle drei Tasten genau gleichzeitig – die App wartet, bis alle drei unten sind.",
        ],
        task: "Spiele die Akkordfolge C – F – G7 – C mit der linken Hand.",
        clef: "bass",
        tempo: 70,
        chords: "C:w | F:w | G7:w | C:w | F:h C:h | G7:h C:h",
        tracks: {
          lh: "C3+E3+G3:w:531 | C3+F3+A3:w:521 | H2+F3+G3:w:521 | C3+E3+G3:w:531 | C3+F3+A3:h:521 C3+E3+G3:h:531 | H2+F3+G3:h:521 C3+E3+G3:h:531",
        },
      },
      {
        id: "ode-akkorde",
        title: "Ode an die Freude · mit Akkorden",
        text: ["Jetzt klingt es wie ein richtiges Klavierstück: Rechts die Melodie, links zu jedem Takt ein Akkord – C-Dur oder G7. Tipp: Übe zuerst nur die Akkordwechsel, dann beides zusammen."],
        task: "Spiele die Melodie rechts und die Akkorde links.",
        clef: "grand",
        tempo: 90,
        chords: "C:w | G7:w | C:w | G7:w | C:w | G7:w | C:w | G7:h C:h",
        tracks: {
          rh: ODE_RH,
          lh: "C3+E3+G3:w:531 | H2+F3+G3:w:521 | C3+E3+G3:w:531 | H2+F3+G3:w:521 | C3+E3+G3:w:531 | H2+F3+G3:w:521 | C3+E3+G3:w:531 | H2+F3+G3:h:521 C3+E3+G3:h:531",
        },
      },
      {
        id: "menuett-1",
        title: "Menuett G-Dur · Teil 1",
        text: [
          "Dein erstes Stück aus der Barockzeit, aus dem „Notenbüchlein für Anna Magdalena Bach“ (1725) – heute Christian Petzold zugeschrieben. Ein <b>Menuett</b> ist ein Tanz im <b>3/4-Takt</b>: zähl 1 – 2 – 3.",
          "Rechts brauchst du Achtel und Positionswechsel, links spielt eine vereinfachte Begleitung lange Basstöne. Das <b>Fis</b> (♯) erkennst du am Kreuz vor der Note. Der Fingersatz ist ein Vorschlag.",
        ],
        task: "Spiele die ersten acht Takte.",
        clef: "grand",
        tempo: 90,
        meter: "3/4",
        tracks: { rh: `${MENUETT_RH_START} | ${MENUETT_RH_END_1}`, lh: MENUETT_LH_1 },
      },
      {
        id: "menuett",
        title: "Menuett G-Dur · komplett",
        text: [
          "Der zweite Teil beginnt genau wie der erste – nur die letzten zwei Takte führen zurück nach Hause, aufs G. Wenn du das schaffst, hast du ein echtes Stück aus der Klavierliteratur gelernt.",
        ],
        task: "Spiele das ganze Menuett. Danach: im Takt mit 60 % Tempo!",
        clef: "grand",
        tempo: 90,
        meter: "3/4",
        tracks: {
          rh: `${MENUETT_RH_START} | ${MENUETT_RH_END_1} | ${MENUETT_RH_START} | ${MENUETT_RH_END_2}`,
          lh: `${MENUETT_LH_1} | ${MENUETT_LH_2}`,
        },
      },
    ],
  },
  {
    title: "Akkorde & Begleitung",
    lessons: [
      {
        id: "vier-akkorde",
        title: "a-Moll & die Vier-Akkorde-Folge",
        text: [
          "Zu C, F und G kommt jetzt <b>a-Moll</b> (Symbol <b>Am</b>) dazu – der „traurige Bruder“ von C-Dur. Er hat zwei Töne mit C-Dur gemeinsam: Nur das G wird zum A.",
          "Die Folge <b>C – Am – F – G</b> (Stufen I – vi – IV – V) gehört zu den beliebtesten der Popgeschichte. Sie trägt unzählige Songs der 50er-Jahre, zum Beispiel „Stand by Me“ (dort in A-Dur). Die Buchstaben über den Noten sind <b>Akkordsymbole</b>: So stehen Akkorde in Liederbüchern.",
          "Alle vier Griffe liegen dicht beieinander – der kleine Finger bleibt auf C (bei G auf H). So wechselt die Hand fast ohne Springen.",
        ],
        task: "Spiele die Folge C – Am – F – G zweimal. Achte darauf, dass alle drei Töne genau gleichzeitig kommen.",
        clef: "bass",
        tempo: 70,
        chords: "C:w | Am:w | F:w | G:w | C:w | Am:w | F:w | G:h C:h",
        tracks: {
          lh: "C3+E3+G3:w:531 | C3+E3+A3:w:531 | C3+F3+A3:w:521 | H2+D3+G3:w:531 | C3+E3+G3:w:531 | C3+E3+A3:w:531 | C3+F3+A3:w:521 | H2+D3+G3:h:531 C3+E3+G3:h:531",
        },
      },
      {
        id: "haenschen-akkorde",
        title: "Hänschen klein · nach Akkordsymbolen",
        text: [
          "Jetzt liest du <b>zwei Dinge gleichzeitig</b>: oben die Melodie, darüber die Akkordsymbole. Die linke Hand spielt einfach den Akkord, der über dem Takt steht – C oder G7.",
          "Profi-Trick: Schau beim Spielen nur noch auf die Buchstaben, nicht auf die Bassnoten. So begleiten Pianisten Lieder aus jedem Liederbuch.",
        ],
        task: "Spiele die Melodie rechts und die Akkorde links – lies die linke Hand nur über die Symbole.",
        clef: "grand",
        tempo: 90,
        chords: "C:w | G7:w | C:w | C:w | C:w | G7:w | C:w | C:w",
        tracks: {
          rh: HAENSCHEN_RH,
          lh: "C3+E3+G3:w:531 | H2+F3+G3:w:521 | C3+E3+G3:w:531 | C3+E3+G3:w:531 | C3+E3+G3:w:531 | H2+F3+G3:w:521 | C3+E3+G3:w:531 | C3+E3+G3:w:531",
        },
      },
      {
        id: "walzer",
        title: "Walzer-Begleitung: Bass – Akkord – Akkord",
        text: [
          "Ein Walzer geht im <b>3/4-Takt</b>: Auf die <b>1</b> spielt links ein tiefer Basston, auf <b>2</b> und <b>3</b> der Rest des Akkords. Das klingt sofort nach Tanz – „hm – ta – ta“.",
          "Die Melodie ist neu komponiert und bleibt in der C-Position. Übe zuerst nur die linke Hand (Hände: Links), bis das „hm – ta – ta“ gleichmäßig läuft.",
        ],
        task: "Spiele den Walzer mit beiden Händen. Die Eins darf etwas betonter klingen.",
        clef: "grand",
        tempo: 100,
        meter: "3/4",
        chords: "C:hd | C:hd | G7:hd | G7:hd | G7:hd | G7:hd | C:hd | C:hd",
        tracks: {
          rh: "E4:q:3 E4:q:3 G4:q:5 | E4:h:3 C4:q:1 | D4:q:2 F4:q:4 D4:q:2 | D4:hd:2 | F4:q:4 F4:q:4 G4:q:5 | F4:h:4 D4:q:2 | E4:q:3 D4:q:2 E4:q:3 | C4:hd:1",
          lh: "C3:q:5 E3+G3:q:31 E3+G3:q:31 | C3:q:5 E3+G3:q:31 E3+G3:q:31 | H2:q:5 F3+G3:q:21 F3+G3:q:21 | H2:q:5 F3+G3:q:21 F3+G3:q:21 | " +
            "H2:q:5 F3+G3:q:21 F3+G3:q:21 | H2:q:5 F3+G3:q:21 F3+G3:q:21 | C3:q:5 E3+G3:q:31 E3+G3:q:31 | C3:q:5 E3+G3:q:31 E3+G3:q:31",
        },
      },
      {
        id: "gebrochen",
        title: "Gebrochene Akkorde",
        text: [
          "Statt alle Töne gleichzeitig zu drücken, kannst du einen Akkord auch <b>nacheinander</b> spielen – „gebrochen“ oder als Arpeggio. Das klingt fließend und ruhig, typisch für Balladen.",
          "Die Griffe sind dieselben wie in „a-Moll & die Vier-Akkorde-Folge“ – nur einzeln: unten – Mitte – oben – Mitte.",
        ],
        task: "Spiele die gebrochenen Akkorde gleichmäßig, ohne Lücke beim Wechsel.",
        clef: "bass",
        tempo: 80,
        chords: "C:w | Am:w | F:w | G:w | C:w | Am:w | F:w | G:h C:h",
        tracks: {
          lh: "C3:q:5 E3:q:3 G3:q:1 E3:q:3 | C3:q:5 E3:q:3 A3:q:1 E3:q:3 | C3:q:5 F3:q:2 A3:q:1 F3:q:2 | H2:q:5 D3:q:3 G3:q:1 D3:q:3 | " +
            "C3:q:5 E3:q:3 G3:q:1 E3:q:3 | C3:q:5 E3:q:3 A3:q:1 E3:q:3 | C3:q:5 F3:q:2 A3:q:1 F3:q:2 | H2+D3+G3:h:531 C3+E3+G3:h:531",
        },
      },
      {
        id: "alberti",
        title: "Alberti-Bass",
        text: [
          "Der <b>Alberti-Bass</b> ist das Markenzeichen der Klassik: tief – hoch – Mitte – hoch, in schnellen Achteln. Mozart hat ihn geliebt – zum Beispiel am Anfang seiner berühmten C-Dur-Sonate KV 545.",
          "Der Daumen spielt dabei immer wieder denselben oberen Ton, die Hand bleibt locker liegen und „wiegt“ nur leicht hin und her.",
        ],
        task: "Spiele den Alberti-Bass ganz gleichmäßig – erst langsam, dann im Takt.",
        clef: "bass",
        tempo: 72,
        chords: "C:w | G7:w | C:w | G7:w | C:w | F:w | G7:w | C:w",
        tracks: {
          lh: "C3:e:5 G3:e:1 E3:e:3 G3:e:1 C3:e:5 G3:e:1 E3:e:3 G3:e:1 | H2:e:5 G3:e:1 F3:e:2 G3:e:1 H2:e:5 G3:e:1 F3:e:2 G3:e:1 | " +
            "C3:e:5 G3:e:1 E3:e:3 G3:e:1 C3:e:5 G3:e:1 E3:e:3 G3:e:1 | H2:e:5 G3:e:1 F3:e:2 G3:e:1 H2:e:5 G3:e:1 F3:e:2 G3:e:1 | " +
            "C3:e:5 G3:e:1 E3:e:3 G3:e:1 C3:e:5 G3:e:1 E3:e:3 G3:e:1 | C3:e:5 A3:e:1 F3:e:2 A3:e:1 C3:e:5 A3:e:1 F3:e:2 A3:e:1 | " +
            "H2:e:5 G3:e:1 F3:e:2 G3:e:1 H2:e:5 G3:e:1 F3:e:2 G3:e:1 | C3+E3+G3:w:531",
        },
      },
      {
        id: "sternenweg",
        title: "Sternenweg · Ballade mit Begleitung",
        text: [
          "Zum Abschluss eine ruhige, neu komponierte Ballade: Rechts eine einfache Melodie in der C-Position, links die Vier-Akkorde-Folge als <b>Basston + Akkord</b> – jeweils eine halbe Note.",
          "Spiel sie langsam und leise. Wenn sie sitzt: Probier die Begleitung auch mal gebrochen, so wie in der Lektion davor – dann klingt sie wie ein Popsong.",
        ],
        task: "Spiele die Ballade mit beiden Händen – ruhig und gleichmäßig.",
        clef: "grand",
        tempo: 72,
        chords: "C:w | Am:w | F:w | G:w | C:w | Am:w | F:w | G:h C:h",
        tracks: {
          rh: "E4:q:3 D4:q:2 C4:q:1 D4:q:2 | E4:hd:3 C4:q:1 | F4:q:4 E4:q:3 D4:q:2 C4:q:1 | D4:w:2 | " +
            "E4:q:3 G4:q:5 G4:q:5 E4:q:3 | E4:h:3 C4:h:1 | D4:q:2 F4:q:4 E4:q:3 D4:q:2 | D4:h:2 C4:h:1",
          lh: "C3:h:5 E3+G3:h:31 | A2:h:5 C3+E3:h:31 | F2:h:5 A2+C3:h:31 | G2:h:5 H2+D3:h:31 | " +
            "C3:h:5 E3+G3:h:31 | A2:h:5 C3+E3:h:31 | F2:h:5 A2+C3:h:31 | H2+D3+G3:h:531 C3+E3+G3:h:531",
        },
      },
    ],
  },
];

// Querverweise aus den Lektionen in Theorie und Geschichte ("bereich/id").
const LESSON_SEE = {
  "c-finden": ["theorie/klaviatur"],
  "c-d-e": ["theorie/klaviatur"],
  "f-bis-h": ["theorie/klaviatur"],
  "toene-finden": ["theorie/klaviatur"],
  "c-position": ["theorie/technik", "theorie/ueben"],
  "finger-gymnastik": ["theorie/technik"],
  notensystem: ["theorie/notensystem"],
  "lesen-c-g": ["theorie/notensystem"],
  notenwerte: ["theorie/notenwerte", "theorie/takt"],
  "ode-1": ["geschichte/beethoven"],
  "ode-2": ["geschichte/beethoven"],
  "ode-komplett": ["theorie/notenwerte", "geschichte/beethoven"],
  haenschen: ["theorie/intervalle"],
  "neuer-ton-a": ["theorie/notensystem"],
  entchen: ["theorie/intervalle"],
  weihnachtsmann: ["geschichte/mozart", "theorie/intervalle"],
  "lesen-c-a": ["theorie/notensystem"],
  bassschluessel: ["theorie/notensystem"],
  "lesen-bass": ["theorie/notensystem"],
  "ode-links": ["geschichte/beethoven"],
  "zwei-haende": ["theorie/akkorde"],
  "ode-beide": ["theorie/akkorde", "geschichte/beethoven"],
  "haenschen-beide": ["theorie/akkorde", "theorie/ueben"],
  achtel: ["theorie/notenwerte", "theorie/takt"],
  "jingle-bells": ["theorie/notenwerte"],
  "g-position": ["theorie/notensystem"],
  "mary-lamb": ["theorie/notensystem"],
  "bruder-jakob": ["theorie/notenwerte"],
  dynamik: ["theorie/ausdruck", "geschichte/cristofori"],
  echo: ["theorie/ausdruck"],
  "ode-dynamik": ["theorie/ausdruck", "geschichte/beethoven"],
  "tonleiter-c": ["theorie/tonleitern", "theorie/technik"],
  "akkorde-links": ["theorie/akkorde"],
  "ode-akkorde": ["theorie/akkorde"],
  "menuett-1": ["geschichte/bach", "theorie/takt"],
  menuett: ["geschichte/bach", "theorie/weg-zum-profi"],
  "vier-akkorde": ["theorie/akkorde"],
  "haenschen-akkorde": ["theorie/akkorde"],
  walzer: ["theorie/akkorde", "theorie/takt"],
  gebrochen: ["theorie/akkorde"],
  alberti: ["theorie/akkorde", "geschichte/mozart"],
  sternenweg: ["theorie/akkorde", "theorie/ausdruck"],
};

if (typeof module !== "undefined") module.exports = { CHAPTERS, LESSON_SEE };
