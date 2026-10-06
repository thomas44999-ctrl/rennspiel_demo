# Flitzi-Rennen

Ein kleiner Rennspiel-Prototyp für Kinder ab ca. 5 Jahren. Läuft komplett im Browser, ohne Installation, ohne Internet, ohne Text.

## Starten

`index.html` per Doppelklick im Browser öffnen (Chrome, Firefox, Edge oder Safari). Fertig.

## Spielidee

- Das Fahrzeug fährt von allein. Das Kind wechselt nur die Spur (3 Spuren).
- **Sterne sammeln:** 10 Sterne füllen die Leiste oben links.
- **Pokal:** Bei 10 Sternen gibt es Pokal, Konfetti und Fanfare, danach geht es in eine neue Welt: Wiese, Strand, Schnee (dann wieder von vorn).
- **Kein Verlieren:** Bei einem Zusammenstoß wackelt das Fahrzeug, das Hindernis fliegt weg und es geht kurz langsamer weiter. Es gibt kein Game Over.
- Jede Hindernisreihe lässt immer mindestens eine Spur frei.
- Das Tempo steigt pro Pokal nur leicht an und ist nach oben begrenzt.

## Steuerung

| Taste | Im Menü | Im Spiel |
|---|---|---|
| Pfeil links / rechts (oder A / D) | Fahrzeug wählen | Spur wechseln |
| Leertaste / Enter | Losfahren | Hupen |
| P / Esc | | Pause |
| M | Ton an/aus | Ton an/aus |

Maus und Touch funktionieren ebenfalls: Fahrzeug oder grünen Knopf antippen, im Spiel links oder rechts vom Fahrzeug tippen.

Beim Start erscheinen neben dem Fahrzeug blinkende Pfeiltasten als Hinweis. Das Haus-Symbol (zurück zum Menü) gibt es bewusst nur im Pausenbildschirm, damit es nicht versehentlich gedrückt wird.

## Fahrzeuge

Rennauto, Feuerwehr (mit Blaulicht und Sirene), Traktor (tuckert und qualmt) und Schulbus. Jedes Fahrzeug hat eine eigene Hupe. Die Auswahl wird im Browser gespeichert.

## Technik

- Reines HTML5 Canvas und JavaScript, keine Abhängigkeiten, kein Build-Schritt.
- Alle Grafiken werden im Code gezeichnet (`js/art.js`), alle Klänge und die Musik mit der Web Audio API erzeugt (`js/audio.js`).
- Spiellogik in `js/game.js`. Die Spielfläche passt sich an jede Fenstergröße an (mindestens 960x720 logische Pixel).
- Spielt automatisch Pause, wenn das Fenster den Fokus verliert.

## Mögliche nächste Schritte

- Kurze gesprochene Lob-Sätze (Browser-Sprachausgabe)
- Weitere Welten (Nacht, Wüste, Unterwasser-Tunnel)
- Elternbereich mit Tempo-Regler und Spielzeit-Begrenzung
- Gamepad-Unterstützung
