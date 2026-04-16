# AURUM Steuerrechner

```
     ▟█▙    ██   ██ █████▙ ██   ██ ██▙    ▟██
    ▟▛ ▜▙   ██   ██ ██▄▄▟▛ ██   ██ ██▜▙  ▟▛██
   ▟▛ ▟██▙  ██   ██ ██▀█▙  ██   ██ ██ ▜▙▟▛ ██
  ▟▛     ▜▙ ▜█████▛ ██  ▜▙ ▜█████▛ ██  ▜▛  ██
```

**Transaktions-Rechner, Steuertool & Exporter für die AURUM-Plattform.**

Ein Kommandozeilen-Tool mit interaktiver Terminal-Oberfläche (TUI), das Transaktionsdaten der [AURUM](https://aurum.foundation)-Plattform einliest, sämtliche Kontobewegungen nachvollzieht, Jahresbilanzen in Euro erstellt und steuerlich relevante Berichte für die deutsche Einkommensteuererklärung generiert.

---

## Inhaltsverzeichnis

- [Funktionsumfang](#funktionsumfang)
- [Schnellstart](#schnellstart)
- [Datenexport aus AURUM](#datenexport-aus-aurum)
- [Verwendung](#verwendung)
- [Generierte Dateien](#generierte-dateien)
- [Steuerliche Hintergründe](#steuerliche-hintergründe)
- [Web-Version (Legacy)](#web-version-legacy)
- [Projektstruktur](#projektstruktur)
- [Bauen & Entwickeln](#bauen--entwickeln)
- [Lizenz & Haftungsausschluss](#lizenz--haftungsausschluss)

---

## Funktionsumfang

### Kernfunktionen

- **Transaktionsverarbeitung** – Liest exportierte JSONL-Zahlungsdaten ein und rekonstruiert die vollständige Kontohistorie (Main-, Invest-, Affiliate- und Kartensaldo).
- **EUR-Umrechnung** – Alle Beträge werden anhand der tagesaktuellen EZB-Wechselkurse (USD/EUR) automatisch in Euro umgerechnet. Kurse werden direkt von der EZB heruntergeladen und lokal gecacht.
- **Jahresbilanzen** – Erträge, Provisionen und Gebühren werden pro Kategorie und Kalenderjahr aufgeschlüsselt und in Euro ausgewiesen.
- **FIFO-Steuerberechnung** – Berechnet Währungsgewinne/-verluste nach dem First-In-First-Out-Verfahren unter Berücksichtigung der 1-jährigen Haltefrist gemäß § 23 EStG.
- **Plausibilitätsprüfung** – Vergleicht berechnete Salden mit den aktuellen API-Salden, um Abweichungen frühzeitig zu erkennen.

### Exportformate

| Format | Datei | Beschreibung |
|--------|-------|--------------|
| **Financial Report** | `*_financial_report.html` | Jahresbilanzen (Erträge, Provisionen, Kosten) in EUR |
| **Steuerreport** | `*_tax_report_YYYY.html` | FIFO-Steuerberechnung pro Jahr (Anlage SO) |
| **Transaktions-CSV** | `*_aurum_report.csv` | Komplette Transaktionsliste mit EUR-Kursen |
| **Excel** | `*_aurum_transactions.xlsx` | Transaktionsliste als Excel-Arbeitsmappe |
| **Blockpit** | `*_blockpit.csv` | Import-Datei für [Blockpit](https://blockpit.io) |
| **Summ** | `*_summ.csv` | Import-Datei für [Summ](https://summ.tax) (ehem. CryptoTaxCalculator) |
| **CoinTracking** | `*_cointracking.csv` | Import-Datei für [CoinTracking](https://cointracking.info) |

### Weitere Features

- **Kontogebühren zusammenfassen** – Kontogebühren können optional als Verwaltungsgebühren zusammengefasst werden.
- **USD-Modus** – Wahlweise Bilanzen in USD statt EUR.
- **Korrekturen** – Synthetische Transaktionen einfügen oder bestehende Transaktionen ausschließen.
- **Plattformübergreifend** – Fertige Binaries für Windows, macOS (Intel & Apple Silicon) und Linux.

---

## Schnellstart

### Vorkompilierte Binaries

Lade das passende Binary für dein Betriebssystem von den [GitHub Releases](../../releases) herunter:

| Betriebssystem | Architektur | Datei |
|----------------|-------------|-------|
| Windows | x86_64 | `aurumtax_windows_amd64.exe` |
| macOS | Intel | `aurumtax_mac_amd64` |
| macOS | Apple Silicon (M1/M2/…) | `aurumtax_mac_arm64` |
| Linux | x86_64 | `aurumtax_linux_amd64` |

### Selbst bauen

Voraussetzung: [Go](https://go.dev/dl/) ≥ 1.22

```bash
# Klonen
git clone https://github.com/Windowsfreak/aurum.git
cd aurum

# Für das aktuelle System bauen
make build

# Oder für alle Plattformen
make build-all
```

Die Binaries landen im Ordner `build/`.

---

## Datenexport aus AURUM

Bevor du den Steuerrechner verwenden kannst, müssen die Transaktionsdaten aus der AURUM-Plattform exportiert werden.

### Methode: Browser-Exportskript

1. Melde dich auf [aurum.foundation](https://aurum.foundation) an.
2. Öffne die Browser-Entwicklertools (F12 → Konsole).
3. Kopiere den Inhalt von [`webVersion/export_script.js`](webVersion/export_script.js) in die Konsole und führe ihn aus.
4. Klicke auf **„Export starten"** und bestätige alle Sicherheitsdialoge.
5. Es werden **vier Dateien** heruntergeladen:

| Datei | Inhalt |
|-------|--------|
| `Nickname_YYYY-MM-DD_aurum_main.json` | Kontodaten & Salden |
| `Nickname_YYYY-MM-DD_aurum_partners.json` | Partnerdaten & Affiliate-Saldo |
| `Nickname_YYYY-MM-DD_aurum_investments.json` | Investment-Daten |
| `Nickname_YYYY-MM-DD_aurum_payments.jsonl` | Alle Zahlungstransaktionen (JSONL) |

> [!IMPORTANT]
> Bei der Payments-Datei (`.jsonl`) wirst du nach einem Speicherort gefragt. Speichere **alle vier Dateien in denselben Ordner**.

> [!TIP]
> Das Exportskript verwendet Streaming, um auch bei sehr vielen Transaktionen (1.000+ Seiten) den Arbeitsspeicher zu schonen und Browser-Abstürze zu vermeiden.

---

## Verwendung

1. Kopiere das `aurumtax`-Binary in den Ordner mit deinen exportierten Dateien (oder navigiere im Terminal dorthin).
2. Starte das Programm:

```bash
./aurumtax              # macOS / Linux
aurumtax.exe            # Windows
```

3. Die interaktive Oberfläche zeigt dir:

```
┌──────────────────────────────────────────────────────┐
│ Datensatz:            [Nickname_2026-04-16 ▼]        │
│ Main Balance:         [1234.56              ]        │
│ Affiliate Balance:    [789.01               ]        │
│ Invest Balance:       [5000.00              ]        │
│ Kontogebühren zusammenfassen: [ ]                    │
│ USD statt EUR verwenden:      [ ]                    │
│                                                      │
│ [Bestätigen & Generieren]  [Beenden]                 │
└──────────────────────────────────────────────────────┘
```

4. Wähle deinen Datensatz aus, prüfe die Salden und klicke **„Bestätigen & Generieren"**.
5. Alle Berichte werden im selben Ordner erstellt.

### Navigation

- **TAB** – zwischen Feldern navigieren
- **Enter** – Dropdown öffnen / Button aktivieren
- **Maus** – ebenfalls vollständig unterstützt

### Korrekturen

Im Textfeld „Korrekturen" rechts können Transaktionen angepasst werden:

```
# Transaktion ausschließen (nur Zeitstempel angeben):
2025-08-22T08:45:57Z

# Synthetische Transaktion einfügen (Zeitstempel + Typ + Betrag):
2025-08-26T17:30:00Z DIVIDEND 420.69
```

---

## Generierte Dateien

Nach der Berechnung findest du folgende Dateien im aktuellen Ordner:

### Financial Report (`*_financial_report.html`)

Übersichtliche Jahresbilanzen mit Aufschlüsselung nach Kategorie:
- **Eigene Erträge** (Dividenden, Reinvestments)
- **Provisionen** (Empfehlungsprogramm, Teameinnahmen)
- **Gebühren** (Abonnements, Transaktionskosten, Kartengebühren)
- **Ausländische Kapitalerträge ohne Steuerabzug** (Summenzeile)

Alle Beträge werden taggenau in Euro umgerechnet.

### Steuerreport (`*_tax_report_YYYY.html`)

FIFO-basierter Krypto-Steuerreport nach deutschem Steuerrecht:
- **Veräußerungspreis** und **Anschaffungskosten**
- Aufschlüsselung nach Haltefrist (≤ 1 Jahr / > 1 Jahr)
- Berücksichtigung der **Freigrenze von 1.000 €**
- Direkt eintragbar in die **Anlage SO** der Einkommensteuererklärung

### CSV-Exporte für Krypto-Steuertools

Die Blockpit-, Summ- und CoinTracking-Exporte enthalten **ausschließlich die Währungsgewinne/-verluste** (Kontostand als Fremdwährungskonto) – **nicht** die Erträge, Provisionen oder Gebühren.

> [!NOTE]
> Für eine **vollständige Steuererklärung** benötigst du beides:
> 1. Den **Financial Report** (Jahresbilanz mit Erträgen & Provisionen)
> 2. Die **Auswertung des Fremdwährungskontos** (Steuerreport oder Krypto-Steuertool)

---

## Steuerliche Hintergründe

### Funktionsweise

Die AURUM-Plattform verwaltet Guthaben in USD (USDT/USDC). Aus steuerlicher Sicht handelt es sich dabei um ein **Fremdwährungskonto**. Jede Saldenänderung wird als Kauf oder Verkauf der Fremdwährung modelliert:

- **Zufluss** (Einzahlung, Dividende, Provision) → „Kauf" von TUSD zum Tageskurs
- **Abfluss** (Auszahlung, Gebühr, Kartenaufladung) → „Verkauf" von TUSD zum Tageskurs

Die Währungsgewinne/-verluste ergeben sich aus der Differenz zwischen Anschaffungs- und Veräußerungskurs nach dem **FIFO-Verfahren** (First-In, First-Out).

### Haltefrist

Nach deutschem Steuerrecht (§ 23 EStG) sind Gewinne aus privaten Veräußerungsgeschäften **steuerfrei**, wenn zwischen Anschaffung und Veräußerung mindestens **ein Jahr** liegt. Gewinne innerhalb der Haltefrist sind bis zu einer Freigrenze von **1.000 € pro Jahr** steuerfrei.

### Wechselkurse

Die EUR/USD-Wechselkurse stammen von der **Europäischen Zentralbank (EZB)** und werden beim Start automatisch heruntergeladen. Für Wochenenden und Feiertage wird der letzte verfügbare Kurs verwendet (Rückblick bis zu 14 Tage).

---

## Web-Version (Legacy)

Im Ordner [`webVersion/`](webVersion/) befindet sich die ursprüngliche Browser-basierte Version des Steuerrechners:

| Datei | Beschreibung |
|-------|--------------|
| `tax_calculator.html` | Eigenständiger FIFO-Steuerrechner (akzeptiert Summ-CSV-Exporte) |
| `script.js` | Ursprüngliche Buchhaltungslogik (vollständig nach Go portiert) |
| `export_script.js` | Datenexport-Skript für die Browser-Konsole |
| `rates.js` | Eingebettete EZB-Wechselkurse (für die JS-Version) |
| `convert_rates.py` | Hilfsskript zur Konvertierung der EZB-XML-Daten |

> [!NOTE]
> Die Web-Version wird nicht mehr aktiv weiterentwickelt. Die Go-Version (`aurumtax`) ist der empfohlene Nachfolger.

---

## Projektstruktur

```
aurum/
├── cmd/aurumtax/
│   └── main.go               # Einstiegspunkt & TUI (Terminal-Oberfläche)
├── internal/
│   ├── domain/
│   │   └── models.go          # Datenmodelle (Payment, Trade, HistoryRow, …)
│   ├── parser/
│   │   └── aurum.go           # JSONL-Parser & Korrekturverarbeitung
│   ├── fx/
│   │   └── ecb.go             # EZB-Wechselkurse (Download, Cache, Lookup)
│   ├── history/
│   │   └── calculator.go      # Kontohistorie & Trade-Generierung
│   ├── tax/
│   │   └── fifo.go            # FIFO-Steuerberechnung (Haltefrist, Jahresstatistik)
│   └── exporter/
│       ├── financial.go       # Financial Report (HTML)
│       ├── html.go            # Steuerreport (HTML)
│       ├── csv.go             # CSV-Exporte (Blockpit, Summ, CoinTracking)
│       └── excel.go           # Excel-Export (XLSX)
├── webVersion/                # Legacy Browser-Version
├── .github/workflows/
│   └── release.yml            # CI/CD: Test, Build & Release
├── Makefile                   # Build-Befehle
└── go.mod                     # Go-Modul-Definition
```

---

## Bauen & Entwickeln

### Voraussetzungen

- [Go](https://go.dev/dl/) ≥ 1.22

### Befehle

```bash
make help        # Alle verfügbaren Befehle anzeigen
make test        # Tests ausführen
make build       # Binary für das aktuelle System bauen
make build-all   # Binaries für Windows, macOS, Linux bauen
```

### CI/CD

Bei jedem Push auf `main` und bei Pull Requests werden automatisch Tests ausgeführt und Binaries gebaut. Beim Erstellen eines Git-Tags (`v*`) wird ein GitHub Release mit allen Binaries erstellt.

---

## Lizenz & Haftungsausschluss

> [!CAUTION]
> **Alle Berechnungen sind ohne Gewähr und ohne Haftung auf Richtigkeit.**
>
> Dieses Tool ersetzt keine professionelle Steuerberatung. Bitte konsultiere für deine individuelle Steuersituation einen Steuerberater oder Steuerfachmann.

### Nutzungsbedingungen

- Jeder aus der **Smart Invest Community** und deren gesamte Downline darf das Tool **kostenfrei** nutzen.
- **Steuerberater**, die mit diesem Tool gewerblich Geld verdienen möchten, benötigen eine **kostenpflichtige Lizenz**. Endnutzer dürfen ihre selbst erstellten Ergebnisse frei an Steuerberater weitergeben.

### Sicherheitshinweis

> [!WARNING]
> Führe niemals fremden Programmcode aus, ohne ihn vorher zu prüfen. Das Exportskript kommuniziert mit der AURUM-API und hat Zugriff auf dein Authentifizierungs-Token. Prüfe den Quellcode sorgfältig oder lass ihn von einem Experten oder einer KI analysieren, bevor du ihn in deiner Browser-Konsole ausführst.

---

<p align="center"><em>by <a href="https://github.com/Windowsfreak">Windowsfreak</a></em></p>
