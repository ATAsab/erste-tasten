# Erste Tasten – Klavier von null

Eine Web-App, um Klavier ganz von vorn zu lernen: Noten lesen, Stücke in kleinen Schritten üben und Rückmeldung über USB-Keyboard oder Mikrofon bekommen.

**Online öffnen:** https://atasab.github.io/erste-tasten/

## Was die App kann

- **Kurs** mit 42 Lektionen in 11 Kapiteln – von der Klaviatur bis zu Akkorden und Begleitung
- **Bibliothek** mit freien Stücken (gemeinfrei, Creative Commons oder neu komponiert), Tonleitern und Technik-Übungen – plus Import eigener MIDI-Dateien
- **Üben** Schritt für Schritt oder im Takt, mit fallenden Noten, Hände getrennt, Takt-Ausschnitten in Schleife und automatisch erkannten Fehlerstellen
- **Aufnehmen** mit Auswertung: Treffer, Tempo, wo du langsamer oder schneller wirst
- **Notenjagd** – 60 Sekunden Noten lesen, inklusive Training deiner häufigsten Verwechsler
- **Theorie, Geschichte & Quiz**, Fortschritt mit Level, Serien, Abzeichen und Monatsrückblick

## Benutzen

- **Computer:** Chrome oder Edge – nur dort funktioniert das USB-Keyboard (Web MIDI).
- **Android:** Chrome, USB-Keyboard über einen USB-C-Adapter.
- **iPhone / iPad:** Antippen und Mikrofon funktionieren, ein USB-Keyboard nicht (Apple unterstützt Web MIDI in keinem Browser).

Dein Fortschritt bleibt **nur in deinem Browser** auf deinem Gerät – nichts wird hochgeladen. Um ihn auf ein anderes Gerät mitzunehmen: auf der Fortschrittsseite „Sicherung herunterladen“ und auf dem neuen Gerät „Sicherung einspielen“.

**Ohne Internet am Mac:** Doppelklick auf `Erste Tasten starten.command` startet die App lokal unter `http://localhost:8123`.

## Entwickeln

Reines HTML, CSS und JavaScript – ohne Build-Schritt und ohne Abhängigkeiten.

```bash
node music.test.js
```

prüft die Musik-Logik, alle Lektionen, Stücke, Quizfragen und die Datensicherung.

`tools/build-mutopia.js` erzeugt `library-mutopia.js` aus den Original-MIDI-Dateien im Ordner `noten/` (nicht im Repository enthalten).

## Quellen & Lizenzen der Noten

- **Mutopia Project** (https://www.mutopiaproject.org/): Jedes Stück nennt in der App seine Quelle, Lizenz (gemeinfrei oder Creative Commons) und den Notensetzer. Die Noten wurden automatisch aus MIDI übertragen.
- **Hanon Nr. 1** (1873) und alle Volks- und Weihnachtslieder sind gemeinfrei.
- Die Balladen „Abendlicht“, „Regen am Fenster“ und „Sternenweg“ sowie die Walzer-Melodie in Kapitel 11 sind eigene Kompositionen für diese App.
