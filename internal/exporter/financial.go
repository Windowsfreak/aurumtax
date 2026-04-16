package exporter

import (
	"bytes"
	"fmt"
	"html/template"
	"math"
	"os"
	"sort"
	"strconv"

	"github.com/windowsfreak/aurumtax/internal/domain"
	"github.com/windowsfreak/aurumtax/internal/fx"
	"github.com/windowsfreak/aurumtax/internal/history"
)

var financialReportTpl = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aurum - Financial Report</title>
    <style>
        :root {
            --bg-color: #f8fafc;
            --text-color: #334155;
            --card-bg: #ffffff;
            --primary-color: #0ea5e9;
            --border-color: #e2e8f0;
            --success-color: #10b981;
            --danger-color: #ef4444;
        }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: var(--bg-color); color: var(--text-color); margin: 0; padding: 40px 20px; line-height: 1.5; }
        .container { max-width: 900px; margin: 0 auto; }
        h1 { text-align: center; color: var(--primary-color); margin-bottom: 40px; font-weight: 800; }
        .report-section { background: var(--card-bg); padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 40px; }
        .report-section h3 { border-bottom: 2px solid var(--border-color); padding-bottom: 10px; margin-top: 0; font-size: 1.2rem; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { text-align: left; padding: 12px 10px; border-bottom: 1px solid var(--border-color); color: #64748b; font-weight: normal; font-size: 0.9rem; }
        th.right, td.right { text-align: right; }
        td { padding: 12px 10px; border-bottom: 1px solid var(--border-color); color: #334155; font-size: 0.95rem; }
        .fw-bold { font-weight: 700; color: #0f172a; }
    </style>
</head>
<body>
    <div class="container">
        <h1>AURUM Financial Report</h1>
        
        {{range .Years}}
        <div class="report-section">
            <h3>Transaktionsaufstellung für den Zeitraum 01.01.-31.12.{{.Year}}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Kategorie</th>
                        <th class="right">Profit EUR</th>
                        <th class="right">Prov. EUR</th>
                        <th class="right">Kosten EUR</th>
                    </tr>
                </thead>
                <tbody>
                    {{range .Categories}}
                    <tr>
                        <td>{{.Name}}</td>
                        <td class="right">{{.ProfitEUR}}</td>
                        <td class="right">{{.ProvisionEUR}}</td>
                        <td class="right">{{.CostsEUR}}</td>
                    </tr>
                    {{end}}
                </tbody>
            </table>

            <h3>Ertragsaufstellung für den Zeitraum 01.01.-31.12.{{.Year}}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Höhe der ausländischen Kapitalerträge</th>
                        <th class="right">Betrag EUR</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Eigene Erträge</td>
                        <td class="right">{{.TotalProfitEUR}}</td>
                    </tr>
                    <tr>
                        <td>Erträge durch Partner (Provisionen)</td>
                        <td class="right">{{.TotalProvisionEUR}}</td>
                    </tr>
                    <tr>
                        <td>Gebühren (Transaktionen, Netzwerk, System)</td>
                        <td class="right">{{.TotalCostsEUR}}</td>
                    </tr>
                    <tr>
                        <td class="fw-bold">Ausländische Kapitalerträge ohne Steuerabzug</td>
                        <td class="right fw-bold">{{.NetEUR}}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        {{end}}

        <div class="report-section">
            <h3>Plausibilitäts-Prüfung</h3>
            {{if .CheckPassed}}
            <p style="color:var(--success-color); font-weight:bold;">Abrechnung stimmt auf den Cent genau.</p>
            {{else}}
            <p style="color:var(--danger-color); font-weight:bold;">Es gibt Abweichungen mit dem Endergebnis.</p>
            <table>
                <thead>
                    <tr>
                        <th>Konto</th>
                        <th class="right">Soll (Berechnet)</th>
                        <th class="right">Ist (API/Target)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Main</td><td class="right">{{.SollMain}}</td><td class="right">{{.IstMain}}</td></tr>
                    <tr><td>Invest</td><td class="right">{{.SollInvest}}</td><td class="right">{{.IstInvest}}</td></tr>
                    <tr><td>Affiliate</td><td class="right">{{.SollAffiliate}}</td><td class="right">{{.IstAffiliate}}</td></tr>
                </tbody>
            </table>
            {{end}}
        </div>

    </div>
</body>
</html>`

type catBreakdown struct {
	ProfitEUR    float64
	ProvisionEUR float64
	CostsEUR     float64
}

type tplCategory struct {
	Name         string
	ProfitEUR    string
	ProvisionEUR string
	CostsEUR     string
}

type tplYear struct {
	Year              string
	Categories        []tplCategory
	TotalProfitEUR    string
	TotalProvisionEUR string
	TotalCostsEUR     string
	NetEUR            string
}

func WriteFinancialReportHTML(path string, rows []domain.HistoryRow, fxP *fx.ECBProvider, targetFinal domain.UserBalances) error {
	yearMap := make(map[string][]domain.HistoryRow)
	for _, row := range rows {
		if row.IsInitial {
			continue
		}
		y := strconv.Itoa(row.Date.Year())
		yearMap[y] = append(yearMap[y], row)
	}

	var sortedYears []string
	for y := range yearMap {
		sortedYears = append(sortedYears, y)
	}
	sort.Strings(sortedYears)

	var tplYears []tplYear

	for _, y := range sortedYears {
		yRows := yearMap[y]
		if len(yRows) == 0 {
			continue
		}

		prevRow := rows[0] // initial fallback
		// find actual previous row if exists
		// the simplest is to find the first row of this year in the overall 'rows' array and take the one before it.
		for i, r := range rows {
			if !r.IsInitial && strconv.Itoa(r.Date.Year()) == y {
				if i > 0 {
					prevRow = rows[i-1]
				}
				break
			}
		}

		cats := make(map[string]*catBreakdown)

		for i, cr := range yRows {
			pr := prevRow
			if i > 0 {
				pr = yRows[i-1]
			}
			rate := fxP.GetRate(cr.Date)
			kind := cr.Kind
			if kind == "MAINTENANCE_FEE" || kind == "REINVESTMENT" {
				kind = "DIVIDEND"
			}

			if _, ok := cats[kind]; !ok {
				cats[kind] = &catBreakdown{}
			}

			diffProfit := cr.Profit - pr.Profit
			diffProvision := cr.Provision - pr.Provision
			diffCosts := cr.Costs // Costs are not cumulative in historyRow, it is per-transaction

			cats[kind].ProfitEUR += diffProfit / rate
			cats[kind].ProvisionEUR += diffProvision / rate
			cats[kind].CostsEUR += diffCosts / rate
		}

		var diffProfitEUR, diffProvisionEUR, diffCostsEUR float64
		var categoriesData []tplCategory

		// sort categories alphabetically for deterministic rendering
		var kinds []string
		for k := range cats {
			kinds = append(kinds, k)
		}
		sort.Strings(kinds)

		for _, kind := range kinds {
			c := cats[kind]
			if c.ProfitEUR != 0 || c.ProvisionEUR != 0 || c.CostsEUR != 0 {
				diffProfitEUR += c.ProfitEUR
				diffProvisionEUR += c.ProvisionEUR
				diffCostsEUR += c.CostsEUR

				categoriesData = append(categoriesData, tplCategory{
					Name:         history.TranslateKind(kind),
					ProfitEUR:    fmt.Sprintf("%.2f", c.ProfitEUR),
					ProvisionEUR: fmt.Sprintf("%.2f", c.ProvisionEUR),
					CostsEUR:     fmt.Sprintf("%.2f", c.CostsEUR),
				})
			}
		}

		netEUR := diffProfitEUR + diffProvisionEUR - diffCostsEUR

		tplYears = append(tplYears, tplYear{
			Year:              y,
			Categories:        categoriesData,
			TotalProfitEUR:    fmt.Sprintf("%.2f €", diffProfitEUR),
			TotalProvisionEUR: fmt.Sprintf("%.2f €", diffProvisionEUR),
			TotalCostsEUR:     fmt.Sprintf("%.2f €", diffCostsEUR),
			NetEUR:            fmt.Sprintf("%.2f €", netEUR),
		})
	}

	var lastRow domain.HistoryRow
	if len(rows) > 0 {
		lastRow = rows[len(rows)-1]
	}

	approxEqual := func(a, b float64) bool {
		return math.Abs(a-b) < 0.001
	}

	checkPassed := approxEqual(lastRow.Main, targetFinal.Main) &&
		approxEqual(lastRow.Invest, targetFinal.Invest) &&
		approxEqual(lastRow.Affiliate, targetFinal.Affiliate)

	data := struct {
		Years         []tplYear
		CheckPassed   bool
		SollMain      string
		SollInvest    string
		SollAffiliate string
		IstMain       string
		IstInvest     string
		IstAffiliate  string
	}{
		Years:         tplYears,
		CheckPassed:   checkPassed,
		SollMain:      fmt.Sprintf("%.2f", lastRow.Main),
		SollInvest:    fmt.Sprintf("%.2f", lastRow.Invest),
		SollAffiliate: fmt.Sprintf("%.2f", lastRow.Affiliate),
		IstMain:       fmt.Sprintf("%.2f", targetFinal.Main),
		IstInvest:     fmt.Sprintf("%.2f", targetFinal.Invest),
		IstAffiliate:  fmt.Sprintf("%.2f", targetFinal.Affiliate),
	}

	tmpl, err := template.New("financial").Parse(financialReportTpl)
	if err != nil {
		return err
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return err
	}

	return os.WriteFile(path, buf.Bytes(), 0644)
}
