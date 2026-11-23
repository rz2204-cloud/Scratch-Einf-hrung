export const mission = [
  {
    title: 'Dein erster Auftrag',
    instruction: 'Lerne zuerst die Scratch-Oberfläche kennen. Danach bringst du Byte, deinen Laborroboter, mit einem kurzen Programm in Bewegung.',
    hints: ['Auf der Bühne siehst du Byte. Sein Programm entsteht im Skriptbereich.'],
    action: 'Loslegen'
  },
  {
    title: 'Lerne die Scratch-Oberfläche kennen',
    instruction: 'Wähle einen Bereich, um ihn im Scratch-Editor zu markieren. Finde danach heraus, wo dein Programm entsteht.',
    hints: ['Die Skriptblöcke sind einzelne Befehle. In der Blockpalette findest du sie nach Kategorien sortiert.', 'Die freie Fläche rechts neben der Blockpalette ist der Skriptbereich. Dort setzt du die Blöcke zusammen.'],
    action: 'Zum ersten Block'
  },
  {
    title: 'Bewege Byte',
    instruction: 'Öffne den Reiter Skripte und die blaue Kategorie Bewegung. Ziehe „gehe 10 er Schritt“ aus der Blockpalette in den Skriptbereich. Tippe dort auf den Block und beobachte Byte auf der Bühne.',
    hints: ['Der Block steht weit oben in der blauen Kategorie Bewegung.', 'Öffne für die Tastaturbedienung „Mit Taste oder Tipp programmieren“. Wähle „Bewegung“ und anschließend „Einzelblock testen“.'],
    check: 'move',
    wait: 'Ziehe zuerst einen Geh-Block in den Skriptbereich einer Figur.',
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

export const areas = [
  { id: 'stage', name: 'Bühne', description: 'Hier siehst du, was dein Programm macht.' },
  { id: 'sprites', name: 'Figurenliste', description: 'Wähle hier Byte aus. Jede Figur hat ihre eigenen Skripte.' },
  { id: 'blocks', name: 'Blockpalette', description: 'Hier findest du die Skriptblöcke. Jeder Block steht für einen Befehl oder einen Teil des Programms.' },
  { id: 'scripts', name: 'Skriptbereich', description: 'Hier setzt du Blöcke zu einem Skript zusammen. Ein Skript ist eine Folge von Befehlen.' }
];
