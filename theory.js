// Theorie-Artikel. Blöcke: "Text" | {h} | {list} | {tip} | {table:{head,rows}} | {staff:{clef,tracks,…}} | {play:[{label,notes,…}]}
// Noten-Token wie in lessons.js; "C4+E4+G4:w" = Akkord, "R:q" = Pause. Texte sind statisch und dürfen <b>/<i> enthalten.
const G = (char) => `<span class="glyph">${char}</span>`;

const THEORY = [
  {
    id: "klaviatur",
    title: "Die Klaviatur & die Tonnamen",
    lede: "Ein Muster aus 12 Tasten – wer es einmal verstanden hat, findet sich auf jedem Klavier zurecht.",
    body: [
      "Ein Konzertflügel hat <b>88 Tasten</b>: 52 weiße und 36 schwarze. Viele Keyboards haben 61 oder 76 Tasten – das Prinzip ist immer gleich, denn die Klaviatur besteht aus einem <b>Muster von 12 Tasten</b>, das sich ständig wiederholt.",
      { h: "Die schwarzen Tasten als Landkarte" },
      "Die schwarzen Tasten liegen abwechselnd in <b>Zweier- und Dreiergruppen</b>. Sie sind deine wichtigste Orientierung: Das <b>C</b> liegt immer links neben der Zweiergruppe, das <b>F</b> immer links neben der Dreiergruppe.",
      { h: "Die Namen der weißen Tasten" },
      "Die weißen Tasten heißen <b>C D E F G A H</b>, danach beginnt es wieder mit C. Im Englischen heißt das H übrigens <b>B</b> – das sorgt in internationalen Noten oft für Verwirrung, denn im Deutschen ist „B“ der Name einer schwarzen Taste.",
      { play: [{ label: "Die weißen Tasten von C4 bis C5", notes: "C4:q D4:q E4:q F4:q G4:q A4:q H4:q C5:h" }] },
      { h: "Oktaven und das mittlere C" },
      "Von einem C bis zum nächsten C sind es acht weiße Tasten – dieser Abstand heißt <b>Oktave</b>. Beide Töne klingen „gleich“, nur höher oder tiefer. Damit man die vielen C's unterscheiden kann, bekommen sie Nummern:",
      {
        table: {
          head: ["Schreibweise", "Deutscher Name", "Wo?"],
          rows: [
            ["C2", "großes C", "tief, linke Hand"],
            ["C3", "kleines c", "linke Hand, Bassschlüssel"],
            ["C4", "eingestrichenes c (c′)", "das <b>mittlere C</b> – Startpunkt fast aller Anfängerstücke"],
            ["C5", "zweigestrichenes c (c″)", "rechte Hand, höher"],
          ],
        },
      },
      "In dieser App verwenden wir die Nummern-Schreibweise, weil sie einfacher ist. Alle Töne einer Oktave tragen dieselbe Zahl: C4, D4, E4 … H4 – dann folgt C5.",
      { h: "Halbtöne und Ganztöne" },
      "Der kleinste Schritt auf der Klaviatur ist der <b>Halbton</b>: von einer Taste zur direkt benachbarten, egal ob weiß oder schwarz. Zwei Halbtöne ergeben einen <b>Ganzton</b>.",
      "Zwischen <b>E und F</b> sowie zwischen <b>H und C</b> liegt keine schwarze Taste. Diese weißen Nachbarn sind also nur einen Halbton voneinander entfernt – alle anderen weißen Nachbarn einen Ganzton.",
      {
        play: [
          { label: "Halbton (E–F)", notes: "E4:h F4:h" },
          { label: "Ganzton (C–D)", notes: "C4:h D4:h" },
          { label: "Alle 12 Halbtöne", notes: "C4:e Cis4:e D4:e Dis4:e E4:e F4:e Fis4:e G4:e Gis4:e A4:e B4:e H4:e C5:h", tempo: 100 },
        ],
      },
      { h: "Die schwarzen Tasten" },
      "Schwarze Tasten werden nach ihren Nachbarn benannt. Erhöht man einen Ton um einen Halbton, hängt man <b>-is</b> an: Die schwarze Taste rechts vom C heißt <b>Cis</b>. Erniedrigt man, hängt man <b>-es</b> an: Dieselbe Taste ist auch das <b>Des</b>, von D aus gesehen.",
      { tip: "Eine Taste, zwei Namen – das nennt man <b>enharmonische Verwechslung</b>. Welcher Name richtig ist, hängt vom Musikstück ab. Mehr dazu im Thema „Vorzeichen“." },
    ],
    see: ["ueben/c-finden", "theorie/vorzeichen"],
  },
  {
    id: "notensystem",
    title: "Das Notensystem & die Schlüssel",
    lede: "Fünf Linien, zwei Schlüssel – und jede Note hat ihren festen Platz.",
    body: [
      "Noten werden auf <b>fünf Linien</b> geschrieben, dem Notensystem. Linien und die vier <b>Zwischenräume</b> zählt man <b>von unten nach oben</b>. Je höher eine Note steht, desto höher klingt sie – auf dem Klavier liegt sie also weiter rechts.",
      "Die Töne wechseln sich ab: Einer sitzt <b>auf</b> einer Linie, der nächste <b>im</b> Zwischenraum darüber, der nächste wieder auf der Linie. Jeder solche Schritt entspricht der nächsten weißen Taste.",
      { staff: { clef: "treble", tracks: { rh: "C4:q D4:q E4:q F4:q | G4:q A4:q H4:q C5:q" }, names: true, caption: "Von C4 bis C5 im Violinschlüssel: Linie, Zwischenraum, Linie …" } },
      { h: "Der Violinschlüssel (G-Schlüssel)" },
      "Der Violinschlüssel gilt meist für die <b>rechte Hand</b> und die höheren Töne. Er ist aus einem verschnörkelten Buchstaben G entstanden: Seine Schnecke kringelt sich um die <b>2. Linie</b> und legt fest, dass dort das <b>G4</b> steht.",
      {
        table: {
          head: ["", "Töne (von unten)", "Merkhilfe"],
          rows: [
            ["Linien", "E – G – H – D – F", "„<b>E</b>in <b>G</b>roßer <b>H</b>und <b>D</b>öst <b>F</b>riedlich“"],
            ["Zwischenräume", "F – A – C – E", "ergibt das Wort <b>FACE</b>"],
          ],
        },
      },
      { h: "Der Bassschlüssel (F-Schlüssel)" },
      "Der Bassschlüssel gilt meist für die <b>linke Hand</b> und die tiefen Töne. Er stammt vom Buchstaben F: Seine zwei Punkte umrahmen die <b>4. Linie</b> – dort steht das <b>F3</b>.",
      { staff: { clef: "bass", tracks: { lh: "C3:q D3:q E3:q F3:q | G3:q A3:q H3:q C4:q" }, names: true, caption: "Von C3 bis C4 im Bassschlüssel" } },
      {
        table: {
          head: ["", "Töne (von unten)", "Merkhilfe"],
          rows: [
            ["Linien", "G – H – D – F – A", "„<b>G</b>roße <b>H</b>unde <b>D</b>ürfen <b>F</b>ast <b>A</b>lles“"],
            ["Zwischenräume", "A – C – E – G", "„<b>A</b>lle <b>C</b>lowns <b>E</b>ssen <b>G</b>ern“"],
          ],
        },
      },
      { h: "Hilfslinien" },
      "Reichen die fünf Linien nicht aus, bekommt eine Note eine eigene kurze Linie: eine <b>Hilfslinie</b>. Das bekannteste Beispiel ist das mittlere <b>C4</b>. Im Violinschlüssel steht es auf einer Hilfslinie <b>unter</b> dem System, im Bassschlüssel auf einer Hilfslinie <b>darüber</b>.",
      { h: "Das Klaviersystem" },
      "Klaviernoten bestehen aus zwei Systemen, die mit einer Klammer verbunden sind – der <b>Akkolade</b>. Oben steht der Violinschlüssel, unten der Bassschlüssel. Was genau übereinandersteht, wird gleichzeitig gespielt.",
      {
        staff: {
          clef: "grand",
          tracks: { rh: "C4:w | E4:h G4:h", lh: "C4:w | C3:w" },
          names: true,
          tempo: 70,
          caption: "Takt 1: zweimal dasselbe mittlere C. Takt 2: rechts E und G, links ein tiefes C dazu.",
        },
      },
      { tip: "Lies Noten <b>in Schritten und Sprüngen</b>, statt jede Note einzeln zu entziffern: Steht die nächste Note eine Stufe höher, ist es einfach die nächste weiße Taste rechts. Das geht viel schneller." },
    ],
    see: ["ueben/notensystem", "ueben/bassschluessel"],
  },
  {
    id: "notenwerte",
    title: "Notenwerte & Pausen",
    lede: "Die Form einer Note verrät, wie lange sie klingt.",
    body: [
      "Die <b>Höhe</b> einer Note zeigt, welche Taste du spielst. Ihre <b>Form</b> zeigt, wie lange du sie hältst. Gemessen wird in <b>Schlägen</b> (auch Zählzeiten genannt) – dem gleichmäßigen Puls, den du beim Mitklatschen spürst.",
      {
        table: {
          head: ["Note", "Name", "Dauer im 4/4-Takt", "Pause"],
          rows: [
            [G("𝅝"), "Ganze Note", "4 Schläge", G("𝄻")],
            [G("𝅗𝅥"), "Halbe Note", "2 Schläge", G("𝄼")],
            [G("𝅘𝅥"), "Viertelnote", "1 Schlag", G("𝄽")],
            [G("𝅘𝅥𝅮"), "Achtelnote", "½ Schlag", G("𝄾")],
            [G("𝅘𝅥𝅯"), "Sechzehntelnote", "¼ Schlag", G("𝄿")],
          ],
        },
      },
      "Jede Note ist genau halb so lang wie die vorherige: Eine Ganze dauert so lange wie zwei Halbe, vier Viertel oder acht Achtel.",
      {
        staff: {
          clef: "treble",
          tracks: { rh: "C4:w | E4:h E4:h | G4:q G4:q G4:q G4:q | C5:e C5:e C5:e C5:e C5:e C5:e C5:e C5:e" },
          tempo: 80,
          caption: "Ganze, Halbe, Viertel, Achtel – jeder Takt dauert gleich lang.",
        },
      },
      { h: "Pausen" },
      "Zu jeder Notenlänge gibt es eine <b>Pause</b> gleicher Dauer. Pausen sind genauso wichtig wie Töne: Du zählst einfach weiter, ohne zu spielen. Merkhilfe: Die <b>ganze Pause hängt</b> unter einer Linie wie ein schwerer Hut, die <b>halbe Pause sitzt</b> auf der Linie.",
      { h: "Der Punkt" },
      "Ein <b>Punkt</b> hinter einer Note verlängert sie um die Hälfte ihres Werts: Eine punktierte Halbe dauert 2 + 1 = <b>3 Schläge</b>, eine punktierte Viertel 1 + ½ = <b>1½ Schläge</b>. Oft folgt einer punktierten Viertel eine Achtel – das ergibt den typischen Lang-kurz-Rhythmus.",
      { staff: { clef: "treble", tracks: { rh: "E4:qd D4:e D4:h | G4:hd G4:q" }, tempo: 90, caption: "Punktierte Viertel + Achtel, dann punktierte Halbe + Viertel" } },
      { h: "Haltebogen und Bindebogen" },
      "Ein <b>Haltebogen</b> verbindet zwei Noten <b>gleicher Höhe</b>: Du spielst nur die erste und hältst sie für beide Längen zusammen – praktisch, wenn ein Ton über den Taktstrich hinaus klingen soll.",
      "Ein <b>Bindebogen</b> (Legatobogen) spannt sich dagegen über Noten <b>verschiedener Höhe</b>. Er bedeutet: gebunden spielen, ohne Lücke zwischen den Tönen.",
    ],
    see: ["ueben/notenwerte", "theorie/takt"],
  },
  {
    id: "takt",
    title: "Takt, Rhythmus & Tempo",
    lede: "Der Puls, der Musik zusammenhält – und wie du ihn mit dem Takt-Modus trainierst.",
    body: [
      "Musik hat einen gleichmäßigen <b>Puls</b>, wie ein Herzschlag. Diese Schläge werden in Gruppen geordnet, den <b>Takten</b>. Senkrechte Taktstriche trennen sie im Notenbild.",
      { h: "Die Taktart" },
      "Am Anfang eines Stücks steht die <b>Taktart</b> als Bruch. Die obere Zahl sagt, <b>wie viele</b> Schläge ein Takt hat, die untere, <b>welcher Notenwert</b> einen Schlag bildet (4 = Viertel).",
      {
        table: {
          head: ["Taktart", "Zählen", "Typisch für"],
          rows: [
            ["4/4", "<b>1</b> – 2 – 3 – 4", "Pop, Rock, Kinderlieder, die meisten Anfängerstücke"],
            ["3/4", "<b>1</b> – 2 – 3", "Walzer, Menuett"],
            ["2/4", "<b>1</b> – 2", "Marsch, Polka"],
            ["6/8", "<b>1</b> – 2 – 3 – 4 – 5 – 6", "schaukelnde Lieder – man fühlt zwei große Schläge (1 und 4)"],
          ],
        },
      },
      "Die <b>1</b> jedes Takts ist am stärksten betont. Darum fühlt sich ein Walzer (3/4) so anders an als ein Marsch (2/4) – auch bei gleichem Tempo.",
      { staff: { clef: "treble", meter: "3/4", tracks: { rh: "C4:h E4:q | G4:hd | G4:h F4:q | E4:hd" }, tempo: 110, caption: "Ein Beispiel im 3/4-Takt: zähle 1 – 2 – 3" } },
      { h: "Achtel zählen" },
      "Für Achtelnoten teilst du jeden Schlag in zwei: „<b>1</b> und <b>2</b> und <b>3</b> und <b>4</b> und“. Die Zahlen fallen auf den Schlag, das „und“ genau dazwischen.",
      { h: "Auftakt" },
      "Manche Stücke beginnen mit einem unvollständigen Takt, dem <b>Auftakt</b>. Die fehlenden Schläge stehen dann im letzten Takt. Ein bekanntes Beispiel ist „Happy Birthday“: Die betonte 1 fällt erst auf „Birth“.",
      { h: "Tempo" },
      "Wie schnell der Puls ist, gibt das <b>Tempo</b> an, meist in <b>BPM</b> (beats per minute, Schläge pro Minute). 60 BPM bedeutet genau einen Schlag pro Sekunde. In klassischen Noten stehen oft italienische Tempobezeichnungen:",
      {
        table: {
          head: ["Bezeichnung", "Bedeutung", "ungefähr"],
          rows: [
            ["Largo", "breit, sehr langsam", "40–60 BPM"],
            ["Adagio", "langsam", "66–76 BPM"],
            ["Andante", "gehend", "76–108 BPM"],
            ["Moderato", "mäßig", "108–120 BPM"],
            ["Allegro", "schnell, munter", "120–156 BPM"],
            ["Presto", "sehr schnell", "168–200 BPM"],
          ],
        },
      },
      "Das <b>Metronom</b> ließ sich Johann Nepomuk Mälzel 1815 patentieren. Darum steht in Noten manchmal „M.M. ♩ = 100“ – Mälzels Metronom, 100 Viertel pro Minute. Beethoven gehörte zu den ersten Komponisten, die solche Zahlen in seine Werke schrieben.",
      {
        play: [
          { label: "60 BPM", notes: "C5:q C5:q C5:q C5:q", tempo: 60 },
          { label: "120 BPM", notes: "C5:q C5:q C5:q C5:q C5:q C5:q C5:q C5:q", tempo: 120 },
        ],
      },
      { h: "So trainierst du Rhythmus mit dem Takt-Modus" },
      {
        list: [
          "Wähle über der Klaviatur den Modus <b>„Im Takt“</b> und drücke <b>Start</b>. Die App zählt einen Takt ein (4 Klicks), danach läuft der Cursor gleichmäßig weiter.",
          "Spiele jede Note genau in dem Moment, in dem die fallende Note die rote Linie erreicht. Die App misst, wie viele Millisekunden du zu früh oder zu spät bist.",
          "Beginne mit <b>60–70 %</b> Tempo. Erst wenn es dreimal hintereinander sauber klappt, erhöhe um 10 %.",
          "Zähle innerlich mit – das Metronom ist eine Hilfe, kein Ersatz für deinen eigenen Puls.",
        ],
      },
    ],
    see: ["theorie/notenwerte", "theorie/ueben"],
  },
  {
    id: "vorzeichen",
    title: "Vorzeichen: Kreuz, Be & Auflöser",
    lede: "Wie die schwarzen Tasten ins Notenbild kommen.",
    body: [
      "Im Notensystem gibt es nur Plätze für die sieben Stammtöne C D E F G A H. Für die schwarzen Tasten werden diese Töne mit <b>Vorzeichen</b> verändert.",
      {
        table: {
          head: ["Zeichen", "Name", "Wirkung", "Beispiel"],
          rows: [
            [G("♯"), "Kreuz", "erhöht um einen Halbton – Endung <b>-is</b>", "F → Fis, C → Cis"],
            [G("♭"), "Be", "erniedrigt um einen Halbton – Endung <b>-es</b>", "D → Des, G → Ges"],
            [G("♮"), "Auflösungszeichen", "hebt Kreuz oder Be wieder auf", "Fis → F"],
          ],
        },
      },
      "Ausnahmen beim Be: Aus E wird <b>Es</b> (nicht „Ees“), aus A wird <b>As</b> – und aus H wird <b>B</b>. Darum heißt die schwarze Taste zwischen A und H im Deutschen einfach „B“.",
      { h: "Wie lange gilt ein Vorzeichen?" },
      {
        list: [
          "<b>Versetzungszeichen</b> stehen direkt vor einer Note. Sie gelten für diese Tonhöhe nur <b>bis zum Ende des Takts</b>.",
          "<b>Generalvorzeichen</b> stehen am Anfang jeder Zeile, direkt nach dem Schlüssel. Sie gelten für das <b>ganze Stück</b> und in jeder Oktave – und verraten die Tonart.",
        ],
      },
      { staff: { clef: "treble", tracks: { rh: "G4:q A4:q H4:q C5:q | D5:q E5:q Fis5:q G5:q" }, names: true, tempo: 90, caption: "G-Dur-Tonleiter: Damit sie richtig klingt, braucht sie ein Fis." } },
      {
        play: [
          { label: "mit F (klingt falsch)", notes: "G4:q A4:q H4:q C5:q D5:q E5:q F5:q G5:h" },
          { label: "mit Fis (richtig)", notes: "G4:q A4:q H4:q C5:q D5:q E5:q Fis5:q G5:h" },
        ],
      },
      { tip: "<b>Enharmonik:</b> Fis und Ges sind dieselbe Taste. Welcher Name richtig ist, entscheidet die Tonart: In G-Dur schreibt man Fis, in Des-Dur Ges." },
    ],
    see: ["theorie/klaviatur", "theorie/tonleitern"],
  },
  {
    id: "intervalle",
    title: "Intervalle: Abstände hören",
    lede: "Der Abstand zwischen zwei Tönen hat einen Namen – und einen eigenen Klang.",
    body: [
      "Ein <b>Intervall</b> ist der Abstand zwischen zwei Tönen. Gezählt werden die Stammtöne, Start und Ziel eingeschlossen: Von C nach E sind es C – D – E, also <b>drei</b> Töne – eine <b>Terz</b>. Die Namen kommen aus dem Lateinischen (prima, secunda, tertia …).",
      {
        table: {
          head: ["Intervall", "Halbtöne", "ab C", "Merk-Lied (Anfang)"],
          rows: [
            ["Prime", "0", "C – C", "–"],
            ["kleine Sekunde", "1", "C – Cis", "„Für Elise“ (E – Dis)"],
            ["große Sekunde", "2", "C – D", "„Alle meine Entchen“"],
            ["kleine Terz", "3", "C – Es", "„Kuckuck, Kuckuck“ (abwärts)"],
            ["große Terz", "4", "C – E", "„When the Saints Go Marching In“"],
            ["Quarte", "5", "C – F", "„O Tannenbaum“"],
            ["Tritonus", "6", "C – Fis", "„Maria“ (West Side Story)"],
            ["Quinte", "7", "C – G", "„Morgen kommt der Weihnachtsmann“"],
            ["kleine Sexte", "8", "C – As", "–"],
            ["große Sexte", "9", "C – A", "„My Bonnie Is Over the Ocean“"],
            ["kleine Septime", "10", "C – B", "„Somewhere“ (West Side Story)"],
            ["große Septime", "11", "C – H", "–"],
            ["Oktave", "12", "C – C", "„Somewhere Over the Rainbow“"],
          ],
        },
      },
      { h: "Hörbeispiele" },
      "Jedes Beispiel spielt erst die beiden Töne nacheinander, dann zusammen.",
      {
        play: [
          { label: "große Sekunde", notes: "C4:h D4:h C4+D4:w" },
          { label: "kleine Terz", notes: "C4:h Es4:h C4+Es4:w" },
          { label: "große Terz", notes: "C4:h E4:h C4+E4:w" },
          { label: "Quarte", notes: "C4:h F4:h C4+F4:w" },
          { label: "Tritonus", notes: "C4:h Fis4:h C4+Fis4:w" },
          { label: "Quinte", notes: "C4:h G4:h C4+G4:w" },
          { label: "große Sexte", notes: "C4:h A4:h C4+A4:w" },
          { label: "Oktave", notes: "C4:h C5:h C4+C5:w" },
        ],
      },
      "Kleine Intervalle wie Sekunde und Terz klingen eng und weich, Quarte und Quinte <b>offen und leer</b>, die Septime <b>spannungsvoll</b> – sie will sich auflösen. Den Tritonus nannte man früher sogar „diabolus in musica“, den Teufel in der Musik.",
      { tip: "Übung: Spiel ein Intervall, sing es nach und such dir das passende Merk-Lied. Mit der Zeit erkennst du Abstände in Melodien ganz von allein – das macht Notenlesen viel schneller." },
    ],
    see: ["theorie/akkorde"],
  },
  {
    id: "tonleitern",
    title: "Tonleitern & Tonarten",
    lede: "Warum C-Dur nur weiße Tasten braucht – und was Dur und Moll unterscheidet.",
    body: [
      "Eine <b>Tonleiter</b> ist eine Treppe aus Tönen von einem Grundton bis zu seiner Oktave. Welche Stufen groß (Ganzton) und welche klein (Halbton) sind, bestimmt ihren Charakter.",
      { h: "Die Dur-Tonleiter" },
      "Jede Dur-Tonleiter folgt demselben Muster: <b>Ganz – Ganz – Halb – Ganz – Ganz – Ganz – Halb</b>. Startest du auf C, passt das Muster genau auf die weißen Tasten, weil die Halbtöne E–F und H–C an der richtigen Stelle liegen.",
      {
        staff: {
          clef: "treble",
          tracks: { rh: "C4:q:1 D4:q:2 E4:q:3 F4:q:1 | G4:q:2 A4:q:3 H4:q:4 C5:q:5" },
          names: true,
          fingers: true,
          caption: "C-Dur mit Fingersatz: Nach dem E schlüpft der Daumen unter der Hand durch und spielt das F.",
        },
      },
      "Startest du auf einem anderen Ton, brauchst du schwarze Tasten, damit das Muster stimmt: <b>G-Dur</b> braucht ein Fis, <b>F-Dur</b> ein B.",
      { h: "Die Moll-Tonleiter" },
      "Die (natürliche) <b>Moll-Tonleiter</b> hat ein anderes Muster: <b>Ganz – Halb – Ganz – Ganz – Halb – Ganz – Ganz</b>. Auf A gestartet, passt es wieder genau auf die weißen Tasten: <b>a-Moll</b>. Dur wird oft als hell und fröhlich empfunden, Moll als dunkler und nachdenklicher – eine Vereinfachung, aber ein guter Anfang.",
      {
        play: [
          { label: "C-Dur", notes: "C4:q D4:q E4:q F4:q G4:q A4:q H4:q C5:h" },
          { label: "a-Moll", notes: "A3:q H3:q C4:q D4:q E4:q F4:q G4:q A4:h" },
          { label: "c-Moll", notes: "C4:q D4:q Es4:q F4:q G4:q As4:q B4:q C5:h" },
        ],
      },
      "C-Dur und a-Moll benutzen dieselben Töne – sie sind <b>Paralleltonarten</b>. Jede Dur-Tonart hat eine Moll-Parallele, die drei Halbtöne tiefer beginnt.",
      { h: "Tonarten und der Quintenzirkel" },
      "Ein Stück „in G-Dur“ verwendet hauptsächlich die Töne der G-Dur-Tonleiter. Die nötigen Vorzeichen stehen deshalb einmal als <b>Generalvorzeichen</b> am Zeilenanfang.",
      "Der <b>Quintenzirkel</b> ordnet alle Tonarten: Gehst du von C aus eine Quinte aufwärts, kommt jeweils ein Kreuz dazu (G-Dur: 1 ♯, D-Dur: 2 ♯, A-Dur: 3 ♯ …). Gehst du eine Quinte abwärts, kommt jeweils ein Be dazu (F-Dur: 1 ♭, B-Dur: 2 ♭, Es-Dur: 3 ♭ …).",
      {
        table: {
          head: ["Tonart", "Vorzeichen", "Moll-Parallele"],
          rows: [
            ["C-Dur", "keine", "a-Moll"],
            ["G-Dur", "1 ♯ (Fis)", "e-Moll"],
            ["D-Dur", "2 ♯ (Fis, Cis)", "h-Moll"],
            ["F-Dur", "1 ♭ (B)", "d-Moll"],
            ["B-Dur", "2 ♭ (B, Es)", "g-Moll"],
          ],
        },
      },
    ],
    see: ["theorie/vorzeichen", "theorie/akkorde"],
  },
  {
    id: "akkorde",
    title: "Akkorde & Begleitung",
    lede: "Drei Töne gleichzeitig – das Fundament fast jeder Begleitung.",
    body: [
      "Erklingen mehrere Töne gleichzeitig, spricht man von einem <b>Akkord</b>. Der wichtigste ist der <b>Dreiklang</b>: Grundton, Terz und Quinte – auf dem Klavier jede zweite weiße Taste, zum Beispiel C – E – G.",
      { staff: { clef: "treble", tracks: { rh: "C4+E4+G4:w | D4+F4+A4:w" }, tempo: 60, caption: "C-Dur und d-Moll: Beide sehen gleich aus – drei Noten übereinander, Linie an Linie oder Zwischenraum an Zwischenraum." } },
      { h: "Dur oder Moll?" },
      "Entscheidend ist die <b>Terz</b>, also der mittlere Ton:",
      {
        list: [
          "<b>Dur-Dreiklang</b>: große Terz (4 Halbtöne) + kleine Terz (3) – z. B. C – E – G. Klingt hell.",
          "<b>Moll-Dreiklang</b>: kleine Terz (3) + große Terz (4) – z. B. C – Es – G oder D – F – A. Klingt dunkler.",
        ],
      },
      {
        play: [
          { label: "C-Dur", notes: "C4+E4+G4:w" },
          { label: "c-Moll", notes: "C4+Es4+G4:w" },
          { label: "gebrochen (Arpeggio)", notes: "C4:e E4:e G4:e C5:e G4:e E4:e C4:h", tempo: 100 },
        ],
      },
      { h: "Die drei Hauptakkorde" },
      "Baust du auf jeder Stufe einer Tonleiter einen Dreiklang, sind drei davon besonders wichtig. In C-Dur:",
      {
        table: {
          head: ["Stufe", "Akkord", "Funktion", "Wirkung"],
          rows: [
            ["I", "C – E – G", "Tonika", "Zuhause, Ruhe"],
            ["IV", "F – A – C", "Subdominante", "Aufbruch, weg vom Zuhause"],
            ["V", "G – H – D", "Dominante", "Spannung – will zurück zur Tonika"],
          ],
        },
      },
      "Mit diesen drei Akkorden lassen sich unzählige Volks-, Kinder- und Popsongs begleiten. Die linke Hand in „Ode an die Freude · beidhändig“ spielt übrigens genau die Grundtöne von Tonika (C) und Dominante (G).",
      { staff: { clef: "treble", tracks: { rh: "C4+E4+G4:w | F4+A4+C5:w | G4+H4+D5:w | C4+E4+G4:w" }, tempo: 70, caption: "Kadenz I – IV – V – I: Hör, wie der G-Akkord zurück zum C „zieht“." } },
      { h: "Akkordsymbole" },
      "In Liederbüchern und Popnoten stehen Akkorde oft als Buchstaben über der Melodie: <b>C</b> = C-Dur, <b>Am</b> = a-Moll (m für Moll), <b>G7</b> = G-Dur mit zusätzlicher kleiner Septime (G – H – D – F). Damit kannst du später Lieder begleiten, ohne dass jede Note ausgeschrieben ist.",
      { tip: "<b>Umkehrungen:</b> Die Töne eines Akkords dürfen auch in anderer Reihenfolge liegen – E – G – C ist immer noch C-Dur. So muss die Hand beim Akkordwechsel weniger springen." },
      { h: "Die Vier-Akkorde-Folge" },
      "Nimm zu den drei Hauptakkorden noch <b>a-Moll</b> (Stufe vi) dazu – schon hast du das Material für unzählige Popsongs. Besonders beliebt sind zwei Reihenfolgen:",
      {
        list: [
          "<b>C – Am – F – G</b> (I – vi – IV – V): der Klang der 50er-Jahre, z. B. „Stand by Me“.",
          "<b>C – G – Am – F</b> (I – V – vi – IV): die „Pop-Folge“, die in sehr vielen Hits der letzten Jahrzehnte steckt.",
        ],
      },
      {
        play: [
          { label: "C – Am – F – G", notes: "C3+E3+G3:h C3+E3+A3:h C3+F3+A3:h H2+D3+G3:h C3+E3+G3:w", tempo: 70 },
          { label: "C – G – Am – F", notes: "C3+E3+G3:h H2+D3+G3:h C3+E3+A3:h C3+F3+A3:h C3+E3+G3:w", tempo: 70 },
        ],
      },
      { h: "Begleitmuster" },
      "Derselbe Akkord klingt ganz anders, je nachdem <b>wie</b> die linke Hand ihn spielt:",
      {
        list: [
          "<b>Blockakkord</b>: alle Töne zusammen – kraftvoll, gut für den Anfang.",
          "<b>Walzer</b> (3/4): Basston auf 1, Akkord auf 2 und 3 – „hm – ta – ta“.",
          "<b>Gebrochen / Arpeggio</b>: die Töne nacheinander – fließend, typisch für Balladen.",
          "<b>Alberti-Bass</b>: tief – hoch – Mitte – hoch in Achteln – der Klang der Wiener Klassik (Mozart).",
        ],
      },
      {
        play: [
          { label: "Walzer", notes: "C3:q E3+G3:q E3+G3:q C3:q E3+G3:q E3+G3:q", tempo: 120 },
          { label: "gebrochen", notes: "C3:q E3:q G3:q E3:q C3:q E3:q A3:q E3:q", tempo: 90 },
          { label: "Alberti-Bass", notes: "C3:e G3:e E3:e G3:e C3:e G3:e E3:e G3:e", tempo: 90 },
        ],
      },
      { tip: "Lieder aus Liederbüchern begleiten: Lies nur die Akkordsymbole über der Melodie und wähle ein Begleitmuster, das zur Stimmung passt – ruhig gebrochen, fröhlich als Walzer oder Blockakkord." },
    ],
    see: ["ueben/vier-akkorde", "ueben/zwei-haende", "theorie/intervalle"],
  },
  {
    id: "ausdruck",
    title: "Dynamik, Artikulation & Pedal",
    lede: "Laut, leise, gebunden, kurz – so wird aus Tönen Musik.",
    body: [
      "Das Klavier heißt eigentlich <b>Pianoforte</b>, „leise-laut“: Es war das erste Tasteninstrument, auf dem man allein durch den Anschlag leise und laut spielen konnte. Dein Digitalpiano misst dafür, wie schnell du eine Taste drückst.",
      { h: "Dynamik: die Lautstärke" },
      {
        table: {
          head: ["Zeichen", "Italienisch", "Bedeutung"],
          rows: [
            ["<i>pp</i>", "pianissimo", "sehr leise"],
            ["<i>p</i>", "piano", "leise"],
            ["<i>mp</i>", "mezzopiano", "halbleise"],
            ["<i>mf</i>", "mezzoforte", "halblaut"],
            ["<i>f</i>", "forte", "laut"],
            ["<i>ff</i>", "fortissimo", "sehr laut"],
          ],
        },
      },
      "Ein sich öffnender Keil (<b>crescendo</b>) bedeutet: allmählich lauter werden. Ein sich schließender Keil (<b>decrescendo</b> oder <b>diminuendo</b>): allmählich leiser.",
      {
        play: [
          { label: "pp", notes: "C4+E4+G4:h", level: 0.04 },
          { label: "mf", notes: "C4+E4+G4:h", level: 0.12 },
          { label: "ff", notes: "C4+E4+G4:h", level: 0.3 },
        ],
      },
      { h: "Artikulation: wie ein Ton beginnt und endet" },
      {
        list: [
          "<b>Legato</b> (Bindebogen): Töne nahtlos verbinden – die nächste Taste drücken, während die vorige gerade losgelassen wird.",
          "<b>Staccato</b> (Punkt über oder unter der Note): kurz und getrennt, als wäre die Taste heiß.",
          "<b>Akzent</b> (Zeichen „>“): diesen Ton besonders betonen.",
          "<b>Fermate</b> (Bogen mit Punkt): den Ton länger halten, als er eigentlich dauert – so lange, wie es sich gut anfühlt.",
        ],
      },
      {
        play: [
          { label: "Legato", notes: "C4:q D4:q E4:q F4:q G4:h", tempo: 100 },
          { label: "Staccato", notes: "C4:e R:e D4:e R:e E4:e R:e F4:e R:e G4:e", tempo: 100 },
        ],
      },
      { h: "Die Pedale" },
      {
        table: {
          head: ["Pedal", "Name", "Wirkung"],
          rows: [
            ["rechts", "Haltepedal (Sustain)", "hebt alle Dämpfer an – die Töne klingen weiter, auch wenn du die Tasten loslässt"],
            ["links", "Leisepedal (una corda)", "macht den Klang leiser und weicher"],
            ["Mitte", "Sostenuto- oder Übepedal", "am Flügel: hält nur die gerade gedrückten Töne; an vielen Klavieren dämpft es den Klang zum leisen Üben"],
          ],
        },
      },
      "Für dein Digitalpiano reicht anfangs ein einfaches Haltepedal. Wichtig: Beim Akkordwechsel das Pedal kurz <b>loslassen</b> und sofort wieder treten – sonst verschwimmen die Harmonien.",
    ],
    see: ["geschichte/cristofori"],
  },
  {
    id: "technik",
    title: "Handhaltung & Technik",
    lede: "Locker, rund, aus dem Arm – die Grundlagen, die dich ein Leben lang begleiten.",
    body: [
      "Gute Technik heißt am Klavier vor allem: <b>so wenig Kraft und Spannung wie möglich</b>. Wer von Anfang an locker spielt, wird später schneller, ausdauernder – und bekommt keine Schmerzen. Fehler in der Haltung schleifen sich dagegen schnell ein und sind später mühsam wieder abzugewöhnen.",
      { h: "Richtig sitzen" },
      {
        list: [
          "<b>Mittig</b> vor der Klaviatur sitzen, etwa vor dem mittleren C.",
          "<b>Höhe:</b> Die Unterarme liegen ungefähr waagerecht, die Handgelenke auf Höhe der Tasten. Bank oder Stuhl so einstellen – notfalls ein Kissen unterlegen.",
          "<b>Abstand:</b> Die Ellbogen sind leicht vor dem Körper, die Arme nicht durchgestreckt. Du solltest die Hände bequem ein Stück nach links und rechts bewegen können.",
          "Nur auf der <b>vorderen Hälfte</b> der Bank sitzen, aufrecht, aber nicht steif. Beide Füße flach auf dem Boden – der rechte kommt später ans Pedal.",
        ],
      },
      { h: "Die natürliche Handform" },
      "Lass einen Arm locker neben dem Körper hängen: Die Finger krümmen sich ganz von allein leicht. <b>Genau diese Form</b> legst du auf die Tasten – als würdest du einen kleinen Ball oder einen Apfel umfassen.",
      {
        list: [
          "Gespielt wird mit den <b>Fingerkuppen</b>, nicht mit dem flachen Finger.",
          "Der <b>Daumen</b> spielt mit seiner Außenkante, also seitlich, und liegt auf den Tasten – nicht darunter.",
          "Die Fingergrundgelenke bilden eine leicht gewölbte <b>Brücke</b>; das vorderste Fingerglied knickt nicht ein.",
          "Das <b>Handgelenk</b> ist weder abgeknickt noch hochgedrückt, sondern bildet mit dem Unterarm eine lockere Linie.",
          "Finger, die gerade nicht spielen, <b>ruhen leicht</b> auf ihren Tasten, statt in die Luft zu stehen.",
        ],
      },
      { h: "Kraft kommt aus dem Arm" },
      "Drück die Tasten nicht mit Fingerkraft herunter. Lass stattdessen das <b>Gewicht des Arms</b> über den Finger in die Taste sinken. Ist die Taste unten, löst du sofort wieder – du hältst sie nur noch, du presst nicht. Laut spielen heißt: mehr Gewicht und Tempo im Anschlag, nicht mehr Verkrampfung.",
      { h: "Häufige Fehler – und was hilft" },
      {
        table: {
          head: ["Fehler", "Was hilft"],
          rows: [
            ["Vorderstes Fingerglied knickt ein", "Langsamer spielen, Fingerkuppe bewusst „stehen“ lassen, kurz die Apfel-Form üben"],
            ["Kleiner Finger oder andere Finger stehen hoch", "Nicht spielende Finger leicht auf den Tasten ablegen"],
            ["Schultern ziehen hoch", "Bewusst ausatmen und die Schultern fallen lassen – am besten an jedem Zeilenanfang"],
            ["Handgelenk hängt unter die Tasten", "Sitzhöhe prüfen, Handgelenk auf Tastenhöhe"],
            ["Hand wird steif oder müde", "Pause, Hände ausschütteln, langsamer und leiser weiterspielen"],
          ],
        },
      },
      { h: "Fingersatz" },
      "Halte dich an den <b>Fingersatz</b> in den Noten – und spiel eine Stelle immer mit denselben Fingern. Nur so kann sich die Bewegung automatisieren. Fehlt ein Fingersatz, schreib dir deinen eigenen mit Bleistift dazu. Für Tonleitern lernst du später den <b>Daumenuntersatz</b> (der Daumen schlüpft unter der Hand durch) und den <b>Übersatz</b> (ein Finger greift über den Daumen).",
      { tip: "Film dich einmal pro Woche mit dem Handy von der Seite. Eingeknickte Finger oder hochgezogene Schultern sieht man von außen viel besser als beim Spielen. <b>Schmerz ist immer ein Stoppsignal:</b> Hör sofort auf, und lass anhaltende Beschwerden ärztlich abklären." },
    ],
    see: ["ueben/c-position", "theorie/ueben"],
  },
  {
    id: "ueben",
    title: "Richtig üben",
    lede: "Wie du in kurzer Zeit mehr erreichst – und wie dir diese App dabei hilft.",
    body: [
      "Klavierspielen ist zu einem großen Teil <b>Bewegungslernen</b>: Dein Gehirn verknüpft Notenbild, Taste und Fingerbewegung. Das klappt am besten mit kurzen, regelmäßigen und konzentrierten Einheiten.",
      { h: "Die wichtigsten Regeln" },
      {
        list: [
          "<b>Lieber täglich 15–20 Minuten</b> als einmal pro Woche zwei Stunden. Im Schlaf festigt das Gehirn, was du geübt hast.",
          "<b>Langsam ist schnell:</b> Spiel so langsam, dass du (fast) keine Fehler machst. Jeder Fehler wird mitgeübt.",
          "<b>Kleine Abschnitte:</b> Übe ein, zwei Takte, bis sie sitzen, dann die nächsten – und verbinde sie danach.",
          "<b>Hände getrennt</b> üben, bevor du sie zusammensetzt.",
          "<b>Fehlerstellen gezielt</b> wiederholen, statt immer wieder von vorn zu beginnen.",
          "<b>Pausen machen:</b> Nach 20–30 Minuten kurz aufstehen und die Hände ausschütteln.",
        ],
      },
      { h: "Haltung" },
      {
        list: [
          "Sitzhöhe so wählen, dass die Unterarme etwa <b>waagerecht</b> zu den Tasten liegen.",
          "Nur auf der vorderen Hälfte der Bank sitzen, Füße flach auf dem Boden.",
          "Schultern locker, Handgelenke weder hängend noch hochgezogen.",
          "Finger leicht rund, mit den Fingerkuppen spielen – den Daumen mit seiner Außenkante.",
        ],
      },
      { h: "Dein Weg durch jede Lektion" },
      {
        list: [
          "<b>Anhören:</b> zuerst „Vorspielen“ – dann weißt du, wie es klingen soll.",
          "<b>Schritt für Schritt</b> mit allen Hilfen, bis die Töne sitzen.",
          "<b>Hilfen abbauen:</b> Notennamen und leuchtende Tasten aus, Ansicht „Noten“ – das bringt den dritten Stern.",
          "<b>Im Takt</b> mit 60–70 % Tempo beginnen, dann in 10-%-Schritten bis zum Originaltempo.",
        ],
      },
      { tip: "Frustriert? Völlig normal. Mach eine Pause oder geh eine Lektion zurück. Fortschritt am Klavier fühlt sich oft erst im Rückblick groß an – vergleich dich mit dir von letzter Woche, nicht mit Profis." },
    ],
    see: ["theorie/takt", "theorie/technik", "theorie/weg-zum-profi"],
  },
  {
    id: "weg-zum-profi",
    title: "Vom Anfänger zum Profi",
    lede: "Ein realistischer Fahrplan – Stufe für Stufe.",
    body: [
      "Klavierlernen ist ein Marathon, kein Sprint. Die Zeitangaben unten sind <b>grobe Richtwerte</b> bei täglichem Üben von etwa 20 bis 30 Minuten – jeder Mensch lernt anders schnell, und das ist völlig in Ordnung. Wichtiger als das Tempo ist, dass du dranbleibst.",
      {
        table: {
          head: ["Stufe", "ungefähr", "Was du lernst", "Typische Stücke"],
          rows: [
            ["<b>1 · Einstieg</b>", "0–3 Monate", "Klaviatur, Noten in Violin- und Bassschlüssel, C-Position, erste Lieder mit beiden Händen", "Die Lektionen dieser App: Ode an die Freude, Hänschen klein, Alle meine Entchen"],
            ["<b>2 · Grundstufe</b>", "3–12 Monate", "Handpositionen wechseln, Achtel und punktierte Rhythmen, erste Tonleitern (C, G, F, D), einfache Akkordbegleitung, Pedal-Grundlagen", "Menuett G-Dur (Notenbüchlein), Schumann „Melodie“ und „Fröhlicher Landmann“, leichte Etüden von Burgmüller"],
            ["<b>3 · Mittelstufe</b>", "1–3 Jahre", "Alle Dur- und Moll-Tonleitern, flüssiges Blattspiel einfacher Stücke, Dynamik und Artikulation bewusst gestalten", "Sonatinen von Clementi, Satie „Gymnopédie Nr. 1“, Chopin „Prélude e-Moll“, „Für Elise“ komplett"],
            ["<b>4 · Fortgeschritten</b>", "3–7 Jahre", "Mehrstimmigkeit, schnelle Läufe, feines Pedal, eigene Interpretation", "Bach „Inventionen“, Mozart KV 545, Debussy „Clair de lune“, leichtere Walzer und Nocturnes von Chopin"],
            ["<b>5 · Profi</b>", "10 Jahre und mehr", "Großes Repertoire, Virtuosität, Vortrag auf der Bühne – meist mit Musikstudium und mehreren Stunden Übung am Tag", "Beethoven-Sonaten, Chopin-Etüden, Liszt, Klavierkonzerte"],
          ],
        },
      },
      "Ehrlich gesagt: Konzertpianistinnen und -pianisten üben meist seit ihrer Kindheit täglich mehrere Stunden. Als Erwachsener ist ein <b>sehr gutes Amateurniveau</b> – Stufe 3 bis 4 – absolut erreichbar. Damit kannst du einen großen Teil der schönsten Klaviermusik spielen.",
      { h: "Die vier Säulen" },
      "Auf jeder Stufe kommst du am schnellsten voran, wenn du vier Bereiche gleichzeitig pflegst:",
      {
        list: [
          "<b>Stücke</b> (Repertoire): Musik, die dich motiviert – das Herz des Übens.",
          "<b>Technik</b>: Tonleitern, Akkorde, Etüden – sie machen schwierige Stellen in Stücken später leicht.",
          "<b>Theorie und Notenlesen</b>: Wer versteht, was er spielt, lernt Stücke viel schneller.",
          "<b>Gehör</b>: Intervalle und Akkorde erkennen, Melodien nachspielen, auch mal frei improvisieren.",
        ],
      },
      { h: "Was dich wirklich weiterbringt" },
      {
        list: [
          "<b>Ein Lehrer oder eine Lehrerin</b> – auch nur alle zwei bis vier Wochen. Haltung, Anschlag und Klang kann keine App so beurteilen wie ein Mensch, der neben dir sitzt.",
          "<b>Täglich fünf Minuten Blattspiel</b> mit Stücken, die deutlich leichter sind als dein Niveau. Das trainiert das Notenlesen enorm.",
          "<b>Aufnehmen und anhören</b>: Beim Spielen hört man sich selbst kaum objektiv.",
          "<b>Vorspielen</b> vor Familie oder Freunden – auch wenn es Überwindung kostet. Es zeigt, was wirklich sitzt.",
          "<b>Stücke fertig machen</b>: Lieber wenige Stücke wirklich gut als viele halb.",
        ],
      },
      { tip: "Zur Orientierung: Die britischen <b>ABRSM-Prüfungen</b> (Grade 1 bis 8) sind weltweit verbreitet. Ihre Pflichtstücke-Listen zeigen gut, was auf welcher Stufe üblich ist. Grade 8 gilt als sehr gutes Amateurniveau und ist oft eine Voraussetzung, um sich an einer Musikhochschule zu bewerben." },
    ],
    see: ["theorie/technik", "theorie/ueben", "geschichte/epochen"],
  },
];

if (typeof module !== "undefined") module.exports = { THEORY };
