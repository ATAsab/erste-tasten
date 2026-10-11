// Quizfragen zu Theorie und Geschichte, Schlüssel = "bereich/id" des Artikels.
// Die ERSTE Antwort ist immer die richtige – die Reihenfolge wird beim Anzeigen gemischt.
// Optional: play = Hörbeispiel (Noten-Token wie in lessons.js), staff = Note zum Ablesen.
const QUIZ = {
  "theorie/klaviatur": [
    { q: "Woran erkennst du auf der Klaviatur sofort ein C?", options: ["Es liegt direkt links neben der Zweiergruppe schwarzer Tasten", "Es liegt direkt rechts neben der Dreiergruppe", "Es ist immer die erste Taste ganz links"], explain: "Das C liegt in jeder Oktave direkt links neben den zwei schwarzen Tasten." },
    { q: "Wie heißt im Deutschen die weiße Taste nach dem A?", options: ["H", "B", "C"], explain: "Auf A folgt im Deutschen das H. „B“ ist bei uns die schwarze Taste zwischen A und H – im Englischen heißt das H dagegen B." },
    { q: "Zwischen welchen weißen Tasten liegt keine schwarze Taste?", options: ["E–F und H–C", "C–D und F–G", "D–E und A–H"], explain: "E–F und H–C sind nur einen Halbton voneinander entfernt – dazwischen ist kein Platz für eine schwarze Taste." },
    { q: "Die schwarze Taste direkt rechts vom F heißt …", options: ["Fis", "Fes", "Es"], explain: "Erhöht man einen Ton, hängt man -is an: Aus F wird Fis. Von G aus gesehen heißt dieselbe Taste Ges." },
  ],
  "theorie/notensystem": [
    { q: "Welche Note ist das?", staff: { clef: "treble", notes: "G4:w" }, options: ["G", "E", "A"], explain: "Die Note sitzt auf der 2. Linie – genau dort, wo sich die Schnecke des Violinschlüssels kringelt: G." },
    { q: "Und diese hier?", staff: { clef: "treble", notes: "F4:w" }, options: ["F", "E", "G"], explain: "Erster Zwischenraum im Violinschlüssel: F. Die Zwischenräume ergeben von unten das Wort FACE." },
    { q: "Achtung, Bassschlüssel! Welche Note ist das?", staff: { clef: "bass", notes: "C3:w" }, options: ["C", "A", "E"], explain: "Im Bassschlüssel ist der 2. Zwischenraum das C (C3). Im Violinschlüssel stünde dort ein A – deshalb immer zuerst auf den Schlüssel schauen." },
    { q: "Wo steht das mittlere C4 im Violinschlüssel?", options: ["Auf einer Hilfslinie unter dem System", "Auf der untersten Linie", "Im untersten Zwischenraum"], explain: "Die unterste Linie ist das E. Das C4 liegt zwei Stufen tiefer auf einer eigenen kleinen Hilfslinie." },
  ],
  "theorie/notenwerte": [
    { q: "Wie viele Viertelnoten dauern so lange wie eine Ganze Note?", options: ["4", "2", "8"], explain: "Eine Ganze = 2 Halbe = 4 Viertel = 8 Achtel." },
    { q: "Wie lange dauert eine punktierte Halbe?", options: ["3 Schläge", "2½ Schläge", "4 Schläge"], explain: "Der Punkt verlängert um die Hälfte: 2 + 1 = 3 Schläge." },
    { q: "Woran erkennst du eine Achtelnote?", options: ["Gefüllter Kopf mit Hals und Fähnchen", "Hohler Kopf mit Hals", "Hohler Kopf ohne Hals"], explain: "Hohl mit Hals ist die Halbe, hohl ohne Hals die Ganze. Das Fähnchen macht aus der Viertel eine Achtel." },
    { q: "Ein Haltebogen verbindet zwei gleich hohe Noten. Was machst du?", options: ["Nur die erste spielen und für beide Längen halten", "Beide Noten einzeln anschlagen", "Die zweite Note durch eine Pause ersetzen"], explain: "Der Haltebogen verlängert den Ton – angeschlagen wird nur einmal." },
  ],
  "theorie/takt": [
    { q: "Was bedeutet die obere Zahl der Taktart 3/4?", options: ["3 Schläge pro Takt", "3 Takte pro Zeile", "Tempo: 3 Schläge pro Sekunde"], explain: "Oben: wie viele Schläge ein Takt hat. Unten: welcher Notenwert einen Schlag bildet (4 = Viertel)." },
    { q: "In welcher Taktart steht typischerweise ein Walzer?", options: ["3/4", "4/4", "2/4"], explain: "Walzer zählt man 1 – 2 – 3, mit Betonung auf der 1." },
    { q: "Was bedeutet 60 BPM?", options: ["Ein Schlag pro Sekunde", "60 Takte pro Minute", "60 Töne pro Takt"], explain: "BPM = beats per minute, Schläge pro Minute. 60 pro Minute ist genau einer pro Sekunde." },
    { q: "Was bedeutet die Tempoangabe „Allegro“?", options: ["Schnell, munter", "Langsam", "Gehend"], explain: "Allegro ist schnell (etwa 120–156 BPM). Langsam wäre Adagio, gehend Andante." },
  ],
  "theorie/vorzeichen": [
    { q: "Was bewirkt ein Kreuz (♯) vor einer Note?", options: ["Es erhöht sie um einen Halbton", "Es erniedrigt sie um einen Halbton", "Es verlängert die Note"], explain: "Kreuz = einen Halbton höher, Endung -is. Das Be (♭) erniedrigt." },
    { q: "Wie heißt ein E mit Be (♭)?", options: ["Es", "Ees", "Eis"], explain: "Ausnahme beim Be: aus E wird Es, aus A wird As und aus H wird B." },
    { q: "Wie lange gilt ein Versetzungszeichen direkt vor einer Note?", options: ["Bis zum Ende des Takts", "Für das ganze Stück", "Nur für genau diese eine Note"], explain: "Es gilt für diese Tonhöhe bis zum nächsten Taktstrich. Für das ganze Stück gelten nur die Generalvorzeichen am Zeilenanfang." },
    { q: "Welcher Ton wird in der G-Dur-Tonleiter erhöht?", options: ["F wird zu Fis", "C wird zu Cis", "H wird zu His"], explain: "G-Dur hat ein Kreuz: Fis. Sonst stimmt das Dur-Muster nicht." },
  ],
  "theorie/intervalle": [
    { q: "Welches Intervall hörst du?", play: "C4:h G4:h C4+G4:w", options: ["Quinte", "Terz", "Oktave"], explain: "C – G ist eine Quinte: offen und leer, wie der Anfang von „Morgen kommt der Weihnachtsmann“." },
    { q: "Welches Intervall hörst du jetzt?", play: "C4:h E4:h C4+E4:w", options: ["Große Terz", "Quarte", "Große Sekunde"], explain: "C – E ist eine große Terz – der Klang eines hellen Dur-Akkords." },
    { q: "Und dieses?", play: "C4:h C5:h C4+C5:w", options: ["Oktave", "Quinte", "Große Sexte"], explain: "Gleicher Tonname, acht Stufen höher: Die Oktave klingt fast wie ein einziger Ton." },
    { q: "Wie viele Halbtöne umfasst eine Quarte?", options: ["5", "4", "7"], explain: "C – F: Cis, D, Dis, E, F = 5 Halbtöne. Die Quinte hat 7, die große Terz 4." },
  ],
  "theorie/tonleitern": [
    { q: "Welches Muster hat jede Dur-Tonleiter?", options: ["Ganz – Ganz – Halb – Ganz – Ganz – Ganz – Halb", "Ganz – Halb – Ganz – Ganz – Halb – Ganz – Ganz", "Halb – Ganz – Ganz – Halb – Ganz – Ganz – Ganz"], explain: "Das zweite Muster ist natürliches Moll. Bei Dur liegen die Halbtöne zwischen der 3./4. und der 7./8. Stufe." },
    { q: "Klingt diese Tonleiter nach Dur oder nach Moll?", play: "A3:q H3:q C4:q D4:q E4:q F4:q G4:q A4:h", tempo: 100, options: ["Moll", "Dur"], explain: "Das war a-Moll – nur weiße Tasten, aber von A aus gespielt." },
    { q: "Welche Moll-Tonart ist die Parallele zu C-Dur?", options: ["a-Moll", "c-Moll", "e-Moll"], explain: "Paralleltonarten haben dieselben Töne. Die Moll-Parallele beginnt drei Halbtöne tiefer: C → A." },
    { q: "Wie viele Kreuze hat D-Dur?", options: ["2 (Fis, Cis)", "1 (Fis)", "3 (Fis, Cis, Gis)"], explain: "Im Quintenzirkel: C (0) → G (1 ♯) → D (2 ♯) → A (3 ♯)." },
  ],
  "theorie/akkorde": [
    { q: "Was bedeutet das Akkordsymbol „Am“?", options: ["a-Moll (A – C – E)", "A-Dur (A – Cis – E)", "A mit Septime"], explain: "Das kleine m steht für Moll. a-Moll hat zwei Töne mit C-Dur gemeinsam – nur das G wird zum A." },
    { q: "Welches Begleitmuster spielt „tief – hoch – Mitte – hoch“ in Achteln?", options: ["Alberti-Bass", "Walzer", "Blockakkord"], explain: "Benannt nach Domenico Alberti – Mozart hat ihn oft verwendet, z. B. in der C-Dur-Sonate KV 545." },
    { q: "Wie geht die Walzer-Begleitung im 3/4-Takt?", options: ["Bass auf 1, Akkord auf 2 und 3", "Akkord auf allen drei Schlägen", "Bass auf 2 und 3"], explain: "Hm – ta – ta: Der tiefe Basston auf der Eins gibt den Tanzschritt vor." },
    { q: "Aus welchen Tönen besteht der C-Dur-Dreiklang?", options: ["C – E – G", "C – D – E", "C – F – A"], explain: "Grundton, Terz und Quinte: jede zweite weiße Taste ab C." },
    { q: "Klingt dieser Akkord nach Dur oder nach Moll?", play: "C4+Es4+G4:w", options: ["Moll", "Dur"], explain: "Das war c-Moll: Die kleine Terz (Es) unten macht den Klang dunkler." },
    { q: "Welcher Akkord ist in C-Dur die Dominante?", options: ["G-Dur (G – H – D)", "F-Dur (F – A – C)", "a-Moll (A – C – E)"], explain: "Die Dominante steht auf der 5. Stufe und will zurück zur Tonika C. F-Dur ist die Subdominante." },
    { q: "Was bedeutet das Akkordsymbol „Am“?", options: ["a-Moll", "A-Dur", "A mit Septime"], explain: "Das kleine m steht für Moll. A-Dur schreibt man einfach „A“, A mit Septime „A7“." },
  ],
  "theorie/ausdruck": [
    { q: "Was bedeutet das Zeichen „p“ in den Noten?", options: ["piano – leise", "presto – sehr schnell", "Pedal treten"], explain: "p = piano = leise, f = forte = laut. Davon hat das Pianoforte seinen Namen." },
    { q: "Wie spielst du staccato?", options: ["Kurz und getrennt", "Gebunden, ohne Lücken", "Besonders laut"], explain: "Staccato (Punkt an der Note) heißt kurz und abgesetzt. Gebunden wäre legato." },
    { q: "Was macht das rechte Pedal?", options: ["Es hebt die Dämpfer – die Töne klingen weiter", "Es macht alles leiser", "Es verschiebt alle Töne eine Oktave"], explain: "Das Haltepedal hebt alle Dämpfer an. Leiser macht das linke Pedal." },
  ],
  "theorie/technik": [
    { q: "Wie findest du die natürliche Handform?", options: ["Arm locker hängen lassen – die Finger krümmen sich von selbst", "Finger ganz gerade ausstrecken", "Finger fest gegen die Handfläche ziehen"], explain: "Diese entspannte, leicht gerundete Form legst du auf die Tasten." },
    { q: "Womit spielt der Daumen?", options: ["Mit seiner Außenkante, also seitlich", "Mit der ganzen Unterseite, flach", "Mit der Spitze, steil von oben"], explain: "Der Daumen liegt seitlich auf der Taste – nicht unter der Klaviatur." },
    { q: "Woher kommt die Kraft für den Anschlag?", options: ["Aus dem Gewicht des Arms", "Nur aus den Fingern", "Aus den hochgezogenen Schultern"], explain: "Arm-Gewicht sinkt über den Finger in die Taste – danach sofort lösen, nicht pressen." },
    { q: "Beim Üben tut die Hand weh. Was tust du?", options: ["Sofort aufhören und eine Pause machen", "Weiterspielen – das gehört dazu", "Fester drücken, um die Muskeln zu stärken"], explain: "Schmerz ist immer ein Stoppsignal. Bei anhaltenden Beschwerden ärztlich abklären lassen." },
  ],
  "theorie/weg-zum-profi": [
    { q: "Was kann keine App so gut wie ein Mensch?", options: ["Haltung, Anschlag und Klang beurteilen", "Noten anzeigen", "Ein Metronom spielen"], explain: "Ein Lehrer oder eine Lehrerin – auch nur alle paar Wochen – korrigiert, was du selbst nicht siehst." },
    { q: "Welche vier Säulen gehören zum Klavierlernen?", options: ["Stücke, Technik, Theorie und Gehör", "Nur Stücke, Stücke, Stücke", "Tempo, Lautstärke, Pedal und Ausdauer"], explain: "Wer alle vier pflegt, kommt auf jeder Stufe schneller voran." },
    { q: "Wie übst du Blattspiel am besten?", options: ["Täglich kurz, mit deutlich leichteren Stücken", "Selten, mit möglichst schweren Stücken", "Gar nicht – auswendig lernen reicht"], explain: "Fünf Minuten am Tag mit leichten Stücken trainieren das Notenlesen am wirkungsvollsten." },
  ],
  "theorie/ueben": [
    { q: "Was bringt mehr?", options: ["Täglich 15–20 Minuten", "Einmal pro Woche zwei Stunden", "Nur üben, wenn man Lust hat"], explain: "Kurz und regelmäßig – im Schlaf festigt das Gehirn, was du geübt hast." },
    { q: "Ein Takt klappt einfach nicht. Was tust du?", options: ["Ihn gezielt und langsam wiederholen", "Immer wieder von vorn anfangen", "Schneller spielen, dann ist er schneller vorbei"], explain: "Fehlerstellen isolieren und langsam üben – sonst übst du die anderen Takte zehnmal und die schwierige Stelle nie richtig." },
    { q: "Wann erhöhst du im Takt-Modus das Tempo?", options: ["Wenn es mehrmals hintereinander sauber klappt", "Nach jedem Durchgang", "Sobald du die Noten auswendig kennst"], explain: "Erst sauber, dann schneller – in kleinen Schritten von 10 %." },
  ],

  "geschichte/epochen": [
    { q: "In welcher Epoche lebte Johann Sebastian Bach?", options: ["Barock", "Klassik", "Romantik"], explain: "Bach (1685–1750) ist der wichtigste Komponist des Barock – die Epoche endet ungefähr mit seinem Tod." },
    { q: "Welche Reihenfolge stimmt?", options: ["Barock → Klassik → Romantik", "Klassik → Barock → Romantik", "Romantik → Klassik → Barock"], explain: "Barock (bis ca. 1750), Klassik (bis ca. 1820), Romantik (bis ca. 1900)." },
    { q: "Seit wann sind 88 Tasten beim Klavier Standard?", options: ["Seit dem späten 19. Jahrhundert", "Seit Bachs Zeit", "Seit etwa 1950"], explain: "Cristoforis Instrumente hatten nur gut vier Oktaven. Erst im späten 19. Jahrhundert setzten sich 88 Tasten durch." },
  ],
  "geschichte/cristofori": [
    { q: "Was ist der entscheidende Unterschied zwischen Pianoforte und Cembalo?", options: ["Hämmer schlagen die Saiten an – leise und laut ist möglich", "Das Pianoforte hat mehr Tasten", "Beim Pianoforte werden die Saiten gezupft"], explain: "Beim Cembalo werden die Saiten angezupft, jeder Ton ist gleich laut. Cristoforis Hämmer machen die Lautstärke vom Anschlag abhängig." },
    { q: "Wo arbeitete Cristofori, als er das Klavier erfand?", options: ["Am Hof der Medici in Florenz", "Am Kaiserhof in Wien", "In Leipzig bei Bach"], explain: "Er war Instrumentenbauer bei Prinz Ferdinando de' Medici in Florenz." },
    { q: "Was bewirkt die „Auslösung“?", options: ["Der Hammer springt sofort zurück, die Saite schwingt frei", "Die Taste kommt schneller wieder hoch", "Alle Dämpfer werden angehoben"], explain: "Ohne Auslösung würde der Hammer auf der Saite liegen bleiben und sie sofort wieder abdämpfen." },
  ],
  "geschichte/bach": [
    { q: "Was enthält „Das Wohltemperierte Klavier“?", options: ["Präludien und Fugen in allen 24 Dur- und Moll-Tonarten", "24 Klavierkonzerte", "Fingerübungen nur in C-Dur"], explain: "Teil 1 (1722) geht einmal durch alle Tonarten – möglich durch eine Stimmung, in der alle gut klingen." },
    { q: "In welcher Stadt war Bach ab 1723 Thomaskantor?", options: ["Leipzig", "Eisenach", "Wien"], explain: "In Eisenach wurde er geboren, in Leipzig arbeitete er bis zu seinem Tod 1750." },
    { q: "Wer holte Bachs Musik 1829 mit der Matthäus-Passion zurück ins Bewusstsein?", options: ["Felix Mendelssohn Bartholdy", "Wolfgang Amadeus Mozart", "Franz Liszt"], explain: "Nach Bachs Tod galt seine Musik als altmodisch – Mendelssohns Aufführung löste eine Bach-Begeisterung aus." },
  ],
  "geschichte/mozart": [
    { q: "Welche Melodie variiert Mozart in KV 265?", options: ["„Ah, vous dirai-je, Maman“ – bei uns „Morgen kommt der Weihnachtsmann“", "„Ode an die Freude“", "„Alle meine Entchen“"], explain: "Genau das Lied, das du in Kapitel 5 spielst – Mozart schrieb zwölf Variationen darüber." },
    { q: "Wie nannte Mozart seine Sonate KV 545 selbst?", options: ["Kleine Klavier Sonate für Anfänger", "Mondscheinsonate", "Rondo alla turca"], explain: "So trug er sie in sein Werkverzeichnis ein. Die Mondscheinsonate ist von Beethoven, das Rondo alla turca aus KV 331." },
    { q: "Wie alt wurde Mozart?", options: ["35 Jahre", "56 Jahre", "27 Jahre"], explain: "1756 bis 1791 – und trotzdem hinterließ er über 600 Werke." },
  ],
  "geschichte/beethoven": [
    { q: "Welches Stück ist das?", play: "E5:s Dis5:s E5:s Dis5:s E5:s H4:s D5:s C5:s A4:e R:s C4:s E4:s A4:s H4:e", tempo: 66, options: ["Für Elise", "Mondscheinsonate", "Ode an die Freude"], explain: "Für Elise – entstanden 1810, veröffentlicht erst 40 Jahre nach Beethovens Tod." },
    { q: "Woher stammt die Melodie der „Ode an die Freude“?", options: ["Aus Beethovens 9. Sinfonie", "Aus der Mondscheinsonate", "Aus Für Elise"], explain: "Der Schlusschor der 9. Sinfonie (1824) – heute die Europahymne." },
    { q: "Wie viele Klaviersonaten schrieb Beethoven?", options: ["32", "9", "100"], explain: "32 Sonaten – 9 ist die Zahl seiner Sinfonien." },
  ],
  "geschichte/chopin": [
    { q: "Für welches Instrument schrieb Chopin fast ausschließlich?", options: ["Klavier", "Geige", "Orgel"], explain: "Er gilt als „Poet des Klaviers“." },
    { q: "Was bedeutet Rubato?", options: ["Ein freies, atmendes Tempo", "Ein polnischer Tanz", "Eine Pedaltechnik"], explain: "Beim Rubato nimmt man sich etwas Zeit und holt sie später wieder auf. Polnische Tänze sind Mazurka und Polonaise." },
    { q: "In welcher Stadt lebte Chopin ab 1831?", options: ["Paris", "Warschau", "Wien"], explain: "Er kehrte nie nach Polen zurück – nur sein Herz wurde später nach Warschau gebracht." },
  ],
  "geschichte/liszt": [
    { q: "Was gilt als Liszts Erfindung?", options: ["Der Klavierabend als Solokonzert", "Das Haltepedal", "Der Konzertflügel"], explain: "Er bestritt als einer der Ersten ganze Konzerte allein – „Recitals“." },
    { q: "Bei wem lernte Liszt in Wien?", options: ["Bei Carl Czerny, einem Schüler Beethovens", "Bei Mozart", "Bei Bach"], explain: "Mozart und Bach waren längst tot. Czerny verband Liszt direkt mit Beethoven." },
    { q: "Warum waren Liszts Transkriptionen so wichtig?", options: ["Ohne Tonaufnahmen machten sie Sinfonien und Lieder überall hörbar", "Sie waren leichter zu spielen als die Originale", "Sie ersetzten die Orchester"], explain: "Ein Pianist konnte so eine ganze Beethoven-Sinfonie in jeden Salon bringen." },
  ],
  "geschichte/clara-schumann": [
    { q: "Auf welchem Geldschein war Clara Schumann abgebildet?", options: ["100 D-Mark", "10 Euro", "50 D-Mark"], explain: "Von 1989 bis 2001 auf dem 100-D-Mark-Schein." },
    { q: "Was tat Clara Schumann als eine der Ersten im Konzert?", options: ["Auswendig spielen", "Mit Pedal spielen", "Im Stehen spielen"], explain: "Auswendig spielen war damals ungewöhnlich – heute ist es Standard." },
    { q: "Mit welchem Komponisten war sie ein Leben lang eng befreundet?", options: ["Johannes Brahms", "Claude Debussy", "Scott Joplin"], explain: "Brahms war ein enger Freund der Familie Schumann. Debussy und Joplin wirkten erst später." },
  ],
  "geschichte/debussy": [
    { q: "Welche Tonleiter hörst du?", play: "C4:e D4:e E4:e Fis4:e Gis4:e B4:e C5:h", tempo: 80, options: ["Ganztonleiter", "Dur-Tonleiter", "Moll-Tonleiter"], explain: "Nur Ganztonschritte – schwebend und ohne Ziel. Debussy liebte diesen Klang." },
    { q: "Woher hat der „Impressionismus“ seinen Namen?", options: ["Von Malern wie Claude Monet", "Von einem Klavierhersteller", "Von einer Oper Debussys"], explain: "Wie die Maler Lichtstimmungen malten, malt Debussys Musik Klangstimmungen." },
    { q: "Wo schrieb Debussy bei seinen Préludes den Titel hin?", options: ["Ans Ende des Stücks", "An den Anfang", "Gar nicht"], explain: "Erst hören, dann lesen, was gemeint war." },
  ],
  "geschichte/satie": [
    { q: "Wie heißen Saties berühmteste Klavierstücke?", options: ["Gymnopédies", "Nocturnes", "Ungarische Rhapsodien"], explain: "Nocturnes sind typisch für Chopin, Rhapsodien für Liszt." },
    { q: "Was ist „Möbelmusik“?", options: ["Musik, die bewusst im Hintergrund laufen soll", "Musik für große Konzertsäle", "Marschmusik"], explain: "Satie wollte Musik, auf die man nicht hören muss – ein Vorläufer von Ambient." },
    { q: "Wie oft soll „Vexations“ hintereinander gespielt werden?", options: ["840-mal", "8-mal", "Einmal, aber sehr langsam"], explain: "Die erste vollständige Aufführung 1963 dauerte über 18 Stunden." },
  ],
  "geschichte/joplin": [
    { q: "Was ist typisch für Ragtime?", options: ["Links gleichmäßig wie ein Marsch, rechts synkopiert", "Beide Hände spielen im Kanon", "Nur schwarze Tasten"], explain: "Die Akzente der rechten Hand fallen neben die Schläge – das ist die Synkope." },
    { q: "Welcher Film machte „The Entertainer“ 1973 wieder weltberühmt?", options: ["Der Clou (The Sting)", "Casablanca", "Der weiße Hai"], explain: "Danach bekam Joplin 1976 sogar nachträglich einen Pulitzer-Preis." },
    { q: "Wie sollte man Ragtime nach Joplins Ansicht spielen?", options: ["Niemals schnell", "So schnell wie möglich", "Immer mit Pedal"], explain: "Das ließ er sogar auf seine Notenblätter drucken." },
  ],
  "geschichte/jarrett": [
    { q: "Was war beim Köln Concert 1975 das Problem?", options: ["Statt des Konzertflügels stand nur ein kleiner, schlechter Flügel bereit", "Der Strom fiel aus", "Kaum jemand kam"], explain: "Klemmende Tasten, schwache Höhen – und trotzdem entstand eines der meistverkauften Soloalben des Jazz." },
    { q: "Wie viel vom Köln Concert war vorher aufgeschrieben?", options: ["Nichts – alles improvisiert", "Alles", "Nur die linke Hand"], explain: "Jarrett erfand die Musik im Moment." },
    { q: "Was bedeutet Improvisation?", options: ["Musik im Moment erfinden", "Noten vom Blatt spielen", "Ein Stück auswendig vortragen"], explain: "Auch Bach, Mozart, Beethoven und Liszt waren berühmte Improvisatoren." },
  ],
};

if (typeof module !== "undefined") module.exports = { QUIZ };
