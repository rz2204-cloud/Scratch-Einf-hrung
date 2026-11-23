# Scratch-Labor 7

**Mission 1 · Willkommen im Scratch-Labor**

Ein Prototyp für die 7. Jahrgangsstufe einer bayerischen Mittelschule. Die Klasse programmiert den Laborroboter Byte im Originaleditor von Scratch. Der Lernbegleiter führt vom ersten Bewegungsblock über die grüne Flagge bis zu einem eigenen Manöver.

## Start

Voraussetzungen sind Node.js ab 22.2, das Kommando `tar` und ein Browser mit WebGL. Die Einrichtung lädt einmalig rund 150 MB aus der npm-Registry. Anschließend benötigt der Missionsbetrieb auf dem Rechner keine Internetverbindung.

```sh
node scripts/prepare.mjs
node scripts/serve.mjs
```

Öffne [http://127.0.0.1:4173/](http://127.0.0.1:4173/) in Chrome oder Edge und warte auf **Scratch bereit**. Beende den Server mit Strg+C.

Für iPads im selben Schulnetz starte den Server mit `node scripts/serve.mjs --lan` und öffne in Safari `http://<IP-des-Rechners>:4173/`. Der Rechner muss erreichbar bleiben und die Firewall muss den Port für das Schulnetz freigeben. Diese Variante funktioniert ohne Internetzugang im Schulnetz. Soll das iPad auch beim Ausfall des lokalen Servers neu laden können, braucht die Bereitstellung HTTPS und den einmaligen Aufruf über dieselbe HTTPS-Adresse.

## Im Unterricht

1. Mit **Loslegen** starten und die Bühne, die Figur und den Reiter **Skripte** erkunden.
2. Einen Bewegungsblock ziehen und direkt ausführen. Danach das Startereignis mit der grünen Flagge verbinden.
3. Das Programm mit zwei verschiedenen Schrittzahlen ausführen. Zum Schluss eine Drehung ergänzen und die Reihenfolge erproben.
4. Mit **Projekt speichern** eine `.sb3`-Datei herunterladen. Mit **Projekt laden** kann Scratch dieselbe Datei später öffnen.

Über **Hilfe anzeigen** lassen sich Tipps einzeln öffnen. Über **Mit Taste oder Tipp programmieren** können Lernende die für die Mission nötigen Blöcke mit Tastatur oder Touch hinzufügen und ausführen. Auf schmaleren Bildschirmen lassen sich Lernbegleiter und Editor umschalten. Der Wechsel erhält das laufende Projekt.

## Architektur

| Bereich | Umsetzung |
| --- | --- |
| Lernbegleiter | Statisches HTML, CSS und JavaScript. Sechs Aufgaben mit gestuften Hilfen, Sprungnavigation, Rückmeldungen und Fortschrittsanzeige. Der Browser speichert den Aufgabenfortschritt per `localStorage`. |
| Scratch | Standalone-Ausgabe von `@scratch/scratch-gui` **15.3.0**, mit Scratch-Blöcken, Scratch-VM und WebGL-Bühne. Die Vorbereitung prüft die SHA-512-Summe des Originalpakets. Die Scratch-Dateien liegen lokal. |
| Lernprüfung | Die Scratch-VM liefert Blockstruktur und Figurenposition. Nach dem Flaggenstart prüft das Labor, ob Byte sich bewegt und bei der letzten Aufgabe zusätzlich dreht. |
| Dateien | Die VM lädt und exportiert echte Scratch-3-Projekte. Byte und die Teststrecke werden bei der Einrichtung aus Vektordateien zu einer startfertigen `.sb3`-Datei gepackt. |
| Lokaler Betrieb | Ein kleiner Node-HTTP-Server liefert die Dateien aus. Der Service Worker hält Mission und zuvor geladene Scratch-Ressourcen für Offline-Neuladen auf localhost oder HTTPS vor. Das Labor arbeitet ohne Anmeldung, Konten oder Projekt-Backend. |

Die Standalone-API stellt die GUI und die VM im selben Dokument bereit. Das Labor kann den Lernfortschritt dadurch aus dem tatsächlichen Programm ableiten. Die Ergänzung für Tastatur und Touch verwendet Blockoperationen der mitgelieferten VM. Die Versionsbindung und der Browsertest sichern diese Kopplung ab. Die gehostete Scratch-Seite wird nicht eingebettet. Beim Unterrichtsablauf wurden keine externen Browser-Anfragen beobachtet.

## Testen

Mit Chrome und der optionalen Playwright-Abhängigkeit lassen sich die Browserprüfungen wiederholen. Setze die Umgebungsvariable `SCRATCH_LAB_BROWSER` auf `msedge`, um Edge zu verwenden.

```sh
pnpm install
node scripts/prepare.mjs
node scripts/browser-test.mjs
```

Der automatisierte Lauf unter Windows mit Chrome und Playwright ergab:

| Prüfung | Ergebnis |
| --- | --- |
| Desktop bei 1440 × 1000 | Bewegungsblock nativ gezogen. Startereignis, Schrittzahl und Drehung ergänzt. Die Position und Richtung der Figur änderten sich beim Start wie erwartet. Alle sechs Aufgaben abgeschlossen. |
| Tastatur und Hilfe | Hilfe und Weiter-Schaltflächen per Eingabetaste bedient. Die Eingabe eines fehlenden Blocks wurde mit einem konkreten Hinweis beantwortet. |
| Lokale Projektdatei | .sb3 heruntergeladen, Seite neu geladen, Datei geöffnet und das gespeicherte Skript erneut ausgeführt. |
| iPad-Emulation | Touchbedienung bei 820 × 1180, Umschaltung ins Querformat bei 1180 × 820. Einzelblock und Flaggenstapel per Touch ausgeführt. |
| Offline | Netzwerk im Testbrowser deaktiviert und Testserver gestoppt. Seite erneut geöffnet, .sb3 geladen und Programm gestartet. |
| Browserdiagnostik | Keine Konsolen- oder HTTP-Fehler und keine externen Anfragen im getesteten Lernweg. |

Aufnahmen aus dem Testlauf: [Desktop](screenshots/desktop.png) · [Abgeschlossene Mission](screenshots/mission-abgeschlossen.png) · [iPad hoch](screenshots/ipad-portrait.png) · [iPad quer](screenshots/ipad-querformat.png).

## Grenzen und nächste Schritte

- Der Prototyp enthält Mission 1. Neuladen öffnet das Startprojekt. Der Lernfortschritt bleibt im Browser, das Schülerprojekt bleibt über die gespeicherte `.sb3`-Datei erhalten.
- Die Lernprüfung ist auf kurze, gerade Blockstapel dieser Mission ausgelegt. Sie beobachtet die ersten 240 ms nach der grünen Flagge. Freie Programme mit Wartezeiten, Schleifen oder anderen Startereignissen werden in Scratch ausgeführt, können aber durch diese Missionsprüfung unberücksichtigt bleiben.
- Die ergänzenden Tasten decken die Missionsblöcke ab. Der volle Scratch-Editor behält seine ursprüngliche Bedienung. Auf sehr schmalen Geräten kann die Arbeitsfläche innen horizontal scrollen.
- Scratch-Bibliotheken und Erweiterungen können beim Öffnen weitere Ressourcen benötigen. Der Offline-Test umfasst die Mission und die lokale Projektdatei. Browserdaten können nach Speicherdruck oder durch Schulrichtlinien gelöscht werden.
- Vor der nächsten Mission sollte eine Klasse den gesamten Lernweg in Safari auf einem tatsächlich verwalteten Schul-iPad und im Schulnetz erproben. Danach bieten sich ein gemeinsam geprüfter HTTPS-Betrieb und eine Unterrichtserprobung an, bevor weitere Missionen dazukommen.

## Quellcode und Lizenz

Der Labor-Quellcode steht unter [AGPL-3.0-only](LICENSE). Die eingebundene Scratch-Ausgabe ist AGPL-3.0-only. Der Prototyp verwendet das veröffentlichte Paket unverändert und liefert dessen Lizenz und Markenhinweise mit aus. Der Startbildschirm und die Figur Byte haben eigene Grafiken. Das Labor ist ein unabhängiges Unterrichtsprojekt.

- [Korrigiertes GitHub-Repository](https://github.com/rz2204-cloud/Scratch-Einf-hrung)
- [Scratch-Editor und Toolchain am verwendeten Quellstand](https://github.com/scratchfoundation/scratch-editor/tree/b4b934aaf6641a539325a971249234f4a50a2f03)
- [Lizenz und Markenhinweise des Scratch-Editors](https://github.com/scratchfoundation/scratch-editor/tree/b4b934aaf6641a539325a971249234f4a50a2f03#license)
- Die Vorbereitung legt die Originalhinweise in `public/vendor/LICENSE`, `public/vendor/TRADEMARK` und `public/vendor/dist/scratch-gui-standalone.js.LICENSE.txt` ab.
