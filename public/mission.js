export const mission = [
  {
    title: 'Dein erster Auftrag',
    instruction: 'Das ist Byte, dein Laborroboter. Bring ihn heute mit einem kurzen Programm in Bewegung.',
    hints: ['Auf der Bühne siehst du Byte. Im Editor baust du sein Programm.'],
    action: 'Loslegen'
  },
  {
    title: 'Erkunde das Labor',
    instruction: 'Finde die Bühne mit Byte. Tippe unter der Bühne auf die Figur. Suche dann links im Reiter Skripte die blaue Kategorie Bewegung.',
    hints: ['Auf kleinen Bildschirmen findest du beide Bereiche unter „Editor & Bühne“.', 'Die Bühne zeigt das Ergebnis. Unter Skripte liegen links die Blöcke und daneben die Fläche für dein Programm.'],
    action: 'Gefunden'
  },
  {
    title: 'Bewege Byte',
    instruction: 'Ziehe „gehe 10 er Schritt“ aus Bewegung auf die freie Codefläche. Tippe einmal auf den Block und beobachte Byte.',
    hints: ['Der Block steht weit oben in der blauen Kategorie Bewegung.', 'Öffne für die Tastaturbedienung „Mit Taste oder Tipp programmieren“. Wähle „Bewegung“ und anschließend „Einzelblock testen“.'],
    check: 'move',
    wait: 'Lege zuerst einen Geh-Block auf die Codefläche einer Figur.',
    success: 'Dein Bewegungsblock ist da.'
  },
  {
    title: 'Gib das Startsignal',
    instruction: 'Hole aus Ereignisse den Block mit der grünen Flagge. Verbinde ihn oberhalb des Bewegungsblocks, bis beide einrasten.',
    hints: ['Die Kategorie Ereignisse ist gelb.', 'Der Block mit der Flagge ist die Kappe des Stapels. Die Taste „Startereignis“ kann einen freien Geh-Block ebenfalls verbinden.'],
    check: 'stack',
    wait: 'Der Geh-Block braucht einen Platz unter einem Startereignis mit grüner Flagge.',
    success: 'Die grüne Flagge startet jetzt deinen Bewegungsblock.'
  },
  {
    title: 'Starte und verändere',
    instruction: 'Klicke zuerst auf die grüne Flagge über der Bühne. Ersetze danach die 10 im Geh-Block durch eine andere Zahl und starte erneut.',
    hints: ['Tippe auf das weiße Zahlenfeld im blauen Block. Probiere 40.', 'Wenn Byte am Rand steht, setze unten bei der Figur x wieder auf −105. Starte danach erneut.'],
    check: 'experiment',
    wait: 'Starte den Stapel mit zwei verschiedenen Schrittzahlen. Byte soll sich bei beiden Starts bewegen.',
    success: 'Dein Programm lief mit zwei verschiedenen Schrittzahlen.'
  },
  {
    title: 'Dein eigenes Manöver',
    instruction: 'Baue in denselben Stapel eine Drehung ein. Wähle die Reihenfolge selbst. Starte mit der Flagge, beobachte das Ergebnis und speichere dein Projekt.',
    hints: ['In Bewegung findest du zwei Blöcke für Drehungen. Wähle eine Richtung.', 'Teste verschiedene Winkel. Mit „Drehung 15°“ lässt sich auch ohne Ziehen ein echter Drehblock anfügen.'],
    check: 'challenge',
    wait: 'Verbinde Gehen und Drehen unter demselben Startereignis. Starte und beobachte Byte auf der Bühne.',
    success: 'Mission geschafft. Byte kann laufen und sich drehen.',
    action: 'Mission abschließen'
  }
];
