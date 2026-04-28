package main

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/windowsfreak/aurumtax/internal/domain"
	"github.com/windowsfreak/aurumtax/internal/exporter"
	"github.com/windowsfreak/aurumtax/internal/fx"
	"github.com/windowsfreak/aurumtax/internal/history"
	"github.com/windowsfreak/aurumtax/internal/parser"
	"github.com/windowsfreak/aurumtax/internal/tax"
	"github.com/gdamore/tcell/v2"
	"github.com/rivo/tview"
	"path/filepath"
)

func main() {
	app := tview.NewApplication()
	app.EnableMouse(true)

	// 1. Try current directory
	prefixes := findPrefixes(".")

	// 2. If nothing found, try the directory of the executable (common for macOS double-click)
	if len(prefixes) == 0 {
		if exe, err := os.Executable(); err == nil {
			exeDir := filepath.Dir(exe)
			if exeDir != "." {
				os.Chdir(exeDir)
				prefixes = findPrefixes(".")
			}
		}
	}

	// 3. Define a function to show a directory browser
	var showDirBrowser func(path string)
	showDirBrowser = func(path string) {
		files, err := os.ReadDir(path)
		if err != nil {
			showErr(app, err)
			return
		}

		list := tview.NewList()
		list.SetTitle(fmt.Sprintf(" Ordner auswählen: %s ", path)).SetBorder(true)
		list.AddItem(".. (Zurück)", "In den übergeordneten Ordner wechseln", 'u', func() {
			showDirBrowser(filepath.Dir(path))
		})

		for _, f := range files {
			if f.IsDir() {
				name := f.Name()
				if strings.HasPrefix(name, ".") {
					continue
				}
				list.AddItem(name+"/", "Ordner öffnen", 0, func() {
					showDirBrowser(filepath.Join(path, name))
				})
			}
		}

		list.AddItem("Diesen Ordner wählen", "Nach .jsonl Dateien in diesem Ordner suchen", 's', func() {
			absPath, _ := filepath.Abs(path)
			os.Chdir(absPath)
			newPrefixes := findPrefixes(".")
			if len(newPrefixes) == 0 {
				modal := tview.NewModal().
					SetText(fmt.Sprintf("Keine Datensätze in %s gefunden.", path)).
					AddButtons([]string{"Ok"}).
					SetDoneFunc(func(buttonIndex int, buttonLabel string) {
						showDirBrowser(path)
					})
				app.SetRoot(modal, true)
			} else {
				// Restart with new prefixes (simple way to refresh UI)
				main() 
			}
		})

		list.SetSelectedFunc(func(index int, mainText string, secondaryText string, shortcut rune) {
			// Handled by individual items
		})
		
		list.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
			if event.Key() == tcell.KeyEscape {
				app.Stop()
			}
			return event
		})

		app.SetRoot(list, true)
	}

	if len(prefixes) == 0 {
		home, _ := os.UserHomeDir()
		modal := tview.NewModal().
			SetText("Keine Datensätze (*_aurum_payments*.jsonl) gefunden.\nBitte navigiere in den Ordner mit deinen Export-Dateien.").
			AddButtons([]string{"Ordner suchen", "Beenden"}).
			SetDoneFunc(func(buttonIndex int, buttonLabel string) {
				if buttonIndex == 0 {
					showDirBrowser(home)
				} else {
					app.Stop()
				}
			})
		if err := app.SetRoot(modal, true).Run(); err != nil {
			panic(err)
		}
		return
	}

	form := tview.NewForm()

	var currentPrefix string

	mainInput := tview.NewInputField().SetLabel("Main Balance:").SetFieldWidth(20)
	affiliateInput := tview.NewInputField().SetLabel("Affiliate Balance:").SetFieldWidth(20)
	investInput := tview.NewInputField().SetLabel("Invest Balance:").SetFieldWidth(20)

	updateBalances := func(prefix string) {
		currentPrefix = prefix
		_, bals, _ := parser.ParsePrefix(prefix) // read balances silently
		mainInput.SetText(fmt.Sprintf("%.2f", bals.Main))
		affiliateInput.SetText(fmt.Sprintf("%.2f", bals.Affiliate))
		investInput.SetText(fmt.Sprintf("%.2f", bals.Invest))
	}

	form.AddDropDown("Datensatz:", prefixes, 0, func(option string, optionIndex int) {
		updateBalances(option)
	})

	form.AddFormItem(mainInput)
	form.AddFormItem(affiliateInput)
	form.AddFormItem(investInput)

	summarizeFeesCheck := tview.NewCheckbox().SetLabel("Kontogebühren zusammenfassen:")
	form.AddFormItem(summarizeFeesCheck)

	useUSDCheck := tview.NewCheckbox().SetLabel("USD statt EUR verwenden:")
	form.AddFormItem(useUSDCheck)

	correctionsArea := tview.NewTextArea().
		SetPlaceholder("Beispiel:\n2025-08-22T08:45:57Z\n2025-08-26T17:30:00Z DIVIDEND 420.69")
	correctionsArea.SetTitle(" Korrekturen (Optional) ")
	correctionsArea.SetBorder(true)
	
	// Layout wrapper for corrections since standard form doesn't support TextArea well
	leftFlex := tview.NewFlex().SetDirection(tview.FlexRow).
		AddItem(form, 0, 1, true).
		AddItem(tview.NewTextView().SetText(" TAB zum Navigieren.\n Mit Enter in Dropdowns auswählen.\n Buttons in Form können per Enter aktiviert werden."), 5, 0, false)

	contentFlex := tview.NewFlex().
		AddItem(leftFlex, 0, 1, true).
		AddItem(correctionsArea, 0, 1, false)

	logoView := tview.NewTextView().
		SetTextColor(tcell.ColorBlue).
		SetText(`
         ▟█▙    ██   ██ █████▙ ██   ██ ██▙    ▟██    Transaktions-Rechner,
        ▟▛ ▜▙   ██   ██ ██▄▄▟▛ ██   ██ ██▜▙  ▟▛██    Steuertool & Exporter
       ▟▛ ▟██▙  ██   ██ ██▀█▙  ██   ██ ██ ▜▙▟▛ ██
      ▟▛     ▜▙ ▜█████▛ ██  ▜▙ ▜█████▛ ██  ▜▛  ██    by Windowsfreak`)
	logoView.SetBackgroundColor(tcell.ColorWhite)

	frame := tview.NewFrame(contentFlex).
		SetBorders(1, 1, 1, 1, 4, 4)

	mainFlex := tview.NewFlex().SetDirection(tview.FlexRow).
		AddItem(logoView, 6, 1, false).
		AddItem(frame, 0, 1, true)

	updateBalances(prefixes[0])

	form.AddButton("Bestätigen & Generieren", func() {
		app.SetRoot(tview.NewTextView().SetText("Generiere... Bitte warten.\n(Lade Wechselkurse)"), true)
		
		go func() {
			// ... Parsing ...
			mainVal, _ := strconv.ParseFloat(mainInput.GetText(), 64)
			affVal, _ := strconv.ParseFloat(affiliateInput.GetText(), 64)
			invVal, _ := strconv.ParseFloat(investInput.GetText(), 64)

			targetBals := domain.UserBalances{
				Main:      mainVal,
				Affiliate: affVal,
				Invest:    invVal,
			}

			summarizeFees := summarizeFeesCheck.IsChecked()
			// useUSD := useUSDCheck.IsChecked() // TODO if useUSD is checked, fx provider just returns 1.0

			corrText := correctionsArea.GetText()
			corrections, _ := parser.ParseCorrections(corrText)

			payments, _, err := parser.ParsePrefix(currentPrefix)
			if err != nil {
				app.QueueUpdateDraw(func() { showErr(app, err) })
				return
			}

			fxP := fx.NewECBProvider()
			if !useUSDCheck.IsChecked() {
				if err := fxP.Init("usd.xml"); err != nil {
					// we just warn and proceed with what we have
				}
			}

			calc := history.NewCalculator(fxP)
			hist, trades := calc.BuildHistory(payments, targetBals, corrections, summarizeFees)

			// Generate Reports
			stats := tax.CalculateFIFO(trades)
			_ = exporter.WriteTaxReportHTML(fmt.Sprintf("%s_tax_report", currentPrefix), stats, len(trades))
			_ = exporter.WriteFinancialReportHTML(fmt.Sprintf("%s_financial_report.html", currentPrefix), hist, fxP, targetBals)

			// Write CSVs & Excel
			_ = exporter.WriteBaseCSV(fmt.Sprintf("%s_aurum_report.csv", currentPrefix), hist, fxP)
			_ = exporter.WriteBlockpitCSV(fmt.Sprintf("%s_blockpit.csv", currentPrefix), trades)
			_ = exporter.WriteSummCSV(fmt.Sprintf("%s_summ.csv", currentPrefix), trades)
			_ = exporter.WriteCointrackingCSV(fmt.Sprintf("%s_cointracking.csv", currentPrefix), trades)
			_ = exporter.WriteExcel(fmt.Sprintf("%s_aurum_transactions.xlsx", currentPrefix), hist)

			app.QueueUpdateDraw(func() {
				msg := fmt.Sprintf("Erfolgreich generiert für %s!\nChecke den aktuellen Ordner für CSV, XLSX und HTML Dateien.", currentPrefix)
				modal := tview.NewModal().
					SetText(msg).
					AddButtons([]string{"Ok", "Beenden"}).
					SetDoneFunc(func(buttonIndex int, buttonLabel string) {
						if buttonIndex == 1 {
							app.Stop()
						} else {
							app.SetRoot(mainFlex, true)
						}
					})
				app.SetRoot(modal, true)
			})
		}()
	}).AddButton("Beenden", func() {
		app.Stop()
	})

	if err := app.SetRoot(mainFlex, true).Run(); err != nil {
		panic(err)
	}
}

func showErr(app *tview.Application, err error) {
	modal := tview.NewModal().
		SetText(fmt.Sprintf("Fehler:\n%v", err)).
		AddButtons([]string{"Schließen"}).
		SetDoneFunc(func(buttonIndex int, buttonLabel string) {
			app.Stop() // Or return to main flex
		})
	app.SetRoot(modal, true)
}

func findPrefixes(dir string) []string {
	var results []string
	prefixMap := make(map[string]bool)
	files, err := os.ReadDir(dir)
	if err != nil {
		return results
	}
	for _, f := range files {
		name := f.Name()
		if strings.Contains(name, "_aurum_payments") && strings.HasSuffix(name, ".jsonl") {
			idx := strings.Index(name, "_aurum_payments")
			prefix := name[:idx]
			prefixMap[prefix] = true
		}
	}
	for p := range prefixMap {
		results = append(results, p)
	}
	return results
}
