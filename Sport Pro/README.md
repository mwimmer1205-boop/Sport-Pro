# FitLog Pro

FitLog Pro ist eine **vollständig offline** lauffähige App für Training, Ernährung und Gewohnheiten – ohne Konto, Cloud oder externe Ressourcen. Alle Daten bleiben lokal im Browser-Speicher deines Geräts.

## Start

1. Ordner `Fitness-Studio` komplett behalten (alle Dateien gehören zusammen).
2. **Windows:** `Start-Fitness-Studio.bat` doppelklicken **oder** `index.html` im Browser öffnen.
3. Optional: Über das Browser-Menü als App installieren. Die mitgelieferte `manifest.webmanifest` und `sw.js` ermöglichen Offline-Nutzung innerhalb des Ordners.

Es werden keine Schriften, Skripte oder Daten von externen Servern geladen.

## Funktionen

### Rezepte & Makro-Tracking
- Rezepte mit Kategorie, Portionen, Zutaten und Zubereitung speichern
- Makros **pro Portion**: Kalorien, Protein, Kohlenhydrate, Fett
- Suche über Name, Kategorie und Zutaten
- Rezept mit einem Klick (inkl. Portionsfaktor) ins Tagebuch übernehmen

### Ernährungstagebuch
- Tagesansicht mit Datumsnavigation (auch nachträglich eintragen)
- Mahlzeiten: Frühstück, Mittagessen, Abendessen, Snack
- Eigene Lebensmittel oder gespeicherte Rezepte erfassen
- Tagesbilanz mit Kalorien-Ring, Makro-Balken und Zielvergleich
- Tägliche Ziele für Kalorien und Makros in den Einstellungen anpassbar

### Trainingsplan
- Pläne mit beliebig vielen Trainingstagen anlegen
- Übungen mit Sätzen, Wiederholungen und Gewicht planen
- Fertige **Push/Pull/Legs-Vorlage** auf Wunsch laden
- Trainingstag direkt als Einheit starten (Übungen werden vorausgefüllt)

### Trainingslog
- Einheiten mit Datum, Dauer, Notizen und Übungen erfassen
- Automatische Berechnung des Volumens (Sätze × Wiederholungen × Gewicht)
- Statistik: Trainings gesamt, Wochenziel, Gesamtvolumen, Ø Dauer
- Wochenvolumen-Diagramm der letzten 8 Wochen
- Einträge bearbeiten und löschen

### Zähler
- Drei Zähler: **Nicht geraucht**, **Sport gemacht** und ein **privater Zähler**
- Tage-Modus mit Serie (Streak), Bestwert, Gesamttagen und 10-Wochen-Kalender (Tage nachträglich korrigierbar)
- Freier Wert-Modus mit +/− und Zielwert
- Bezeichnung, Emoji, Ziel und Modus frei anpassbar

### Daten & Sicherheit
- **Makroberechnung aus Körperdaten:** Größe, Gewicht, Alter, Geschlecht, Aktivität und Ziel (Abnehmen/Halten/Zunehmen) → Grundumsatz, Gesamtumsatz und passende Makros.
- Automatische Speicherung im lokalen Browser-Speicher (`localStorage`)
- Backup als JSON exportieren und wieder importieren
- Kompletter Reset über die Einstellungen
- Installierbar als App (Manifest, Icons, Offline-Cache)

## Tipps

- **Backups:** Browserdaten können beim Löschen des Browser-Verlaufs bzw. beim Profilwechsel verloren gehen. Exportiere regelmäßig über *Einstellungen → Backup exportieren*.
- **Mehrere Geräte:** Backup exportieren und auf dem anderen Gerät importieren.
- **Nachträgliche Korrekturen:** Im Zähler-Kalender lassen sich einzelne Tage anklicken; im Ernährungstagebuch kann jedes Datum gewählt werden.

## Technik

Reines HTML/CSS/JavaScript ohne Bibliotheken oder Build-Schritt. Klassische Skripte, damit die App auch per Doppelklick über `file://` funktioniert.

```
index.html            App-Shell & Navigation
styles.css            Design (Dark, responsiv)
js/util.js            Datums-, Format- und Datei-Helfer
js/store.js           Datenmodell, Statistik, localStorage, Import/Export
js/ui.js              Icons, Dialoge, Toasts
js/dashboard.js       Übersicht
js/recipes.js         Rezepte
js/nutrition.js       Tagebuch & Makros
js/plans.js           Trainingspläne
js/log.js             Trainingslog & Diagramm
js/counters.js        Tageszähler
js/settings.js        Profil, Ziele, Backup
js/app.js             Routing & App-Start
sw.js                 Offline-Cache
manifest.webmanifest  Installierbare App
```

## Auf GitHub hochladen und hosten

Das Projekt ist eine reine Static-Site (HTML/CSS/JS) – perfekt für **GitHub Pages**.

1. Neues Repository auf GitHub anlegen (z. B. `fitlog-pro`).
2. Alle Dateien aus dem Ordner `Fitness-Studio` in das Repository kopieren/committen (inkl. `.nojekyll`).
3. Auf GitHub: **Settings → Pages → Source: Deploy from a branch**, Branch `main` / Ordner `/ (root)` wählen.
4. Nach dem Deployment ist die App unter `https://<user>.github.io/<repo>/` erreichbar – inklusive Offline-Cache und Installation als App.

> Hinweis: Die App speichert alle Daten lokal im Browser (`localStorage`). Auf GitHub Pages funktioniert das wie lokal; Backups über *Einstellungen → Backup exportieren* bleiben empfohlen.

## Datenschutz

Es findet keine Übertragung an externe Server statt. Alle Eingaben verbleiben im lokalen Speicher des verwendeten Browsers.
