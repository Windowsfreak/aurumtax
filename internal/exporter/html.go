package exporter

import (
	"bytes"
	"fmt"
	"html/template"
	"os"
	"sort"
	"time"

	"github.com/windowsfreak/aurumtax/internal/tax"
)

var taxReportTpl = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Krypto Steuerreport (FIFO)</title>
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
        .report-year { background: var(--card-bg); padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 40px; }
        .report-year h2 { border-bottom: 2px solid var(--border-color); padding-bottom: 10px; margin-top: 0; font-size: 1.5rem; color: #0f172a; }
        .meta { font-size: 0.875rem; color: #64748b; margin-bottom: 30px; }
        h3 { color: #0f172a; font-size: 1.125rem; margin-top: 30px; margin-bottom: 15px; }
        .tax-table { width: 100%; border-collapse: collapse; }
        .tax-table td { padding: 12px 0; border-bottom: 1px solid var(--border-color); }
        .tax-table tr:last-child td { border-bottom: none; }
        .tax-table td:last-child { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .amount-positive { color: var(--success-color); font-weight: 500; }
        .amount-negative { color: var(--danger-color); font-weight: 500; }
        .fw-bold { font-weight: 700; color: #0f172a; }
    </style>
</head>
<body>
    <div class="container">
        <h1>AURUM Steuerreport Generator (DE)</h1>
        <div id="reportsContainer">
			{{range .Years}}
            <div class="report-year">
              <h2>{{.ReportTitle}}</h2>
              <div class="meta">Generiert am: {{$.GeneratedAt}}</div>
              <h3>Berichtsdetails</h3>
              <p>Währung: EUR<br>
              Gesamttransaktionen (gesamt): {{$.TotalTx}}<br>
              Transaktionen in ( {{.PeriodLabel}} ): {{.TxCount}}</p>
              <h3>Steuereinstellungen</h3>
              <p>Inventarisierungsmethode: Wer zuerst kommt, mahlt zuerst (FIFO)<br>
              Kostenbasisverfolgung: Universal</p>
              <h3>Sonstige Einkünfte aus privaten Veräußerungsgeschäften nach § 23 EStG</h3>
              <table class="tax-table">
                <tr><td>Veräußerungspreis</td><td>{{.SalePrice}}</td></tr>
                <tr><td>Anschaffungskosten</td><td>{{.AcqCost}}</td></tr>
                <tr><td>Veräußerungsgewinn /-verlust außerhalb der 1-jährigen Haltefrist</td><td class="{{.LongTermClass}}">{{.ProfitLong}}</td></tr>
                <tr><td>Veräußerungsgewinn /-verlust innerhalb der 1-jährigen Haltefrist</td><td class="{{.ShortTermClass}}">{{.ProfitShort}}</td></tr>
                <tr><td>Freigrenze</td><td>1.000,00 €</td></tr>
                <tr><td class="fw-bold">Sonstige Einkünfte aus privaten Veräußerungsgeschäften nach § 23 EStG (einzutragen in Anlage SO)</td><td class="fw-bold">{{.Taxable}}</td></tr>
              </table>
            </div>
			{{end}}
        </div>
    </div>
</body>
</html>`

type templateYearData struct {
	ReportTitle    template.HTML
	PeriodLabel    string
	TxCount        int
	SalePrice      string
	AcqCost        string
	ProfitLong     string
	ProfitShort    string
	LongTermClass  string
	ShortTermClass string
	Taxable        string
}

func WriteTaxReportHTML(pathPrefix string, stats map[int]*tax.YearStats, totalTx int) error {
	var years []int
	for y := range stats {
		years = append(years, y)
	}
	sort.Ints(years)

	now := time.Now()

	for _, yr := range years {
		st := stats[yr]

		taxable := 0.0
		if st.ProfitShort >= 1000 || st.ProfitShort < 0 {
			taxable = st.ProfitShort
		}

		isFuture := yr > now.Year()
		title := fmt.Sprintf("ANLAGE SO - Prognose zukünftiger Verkäufe (Fiktiver Stand)")
		period := "Offener Kontosaldo"
		if !isFuture {
			title = fmt.Sprintf("ANLAGE SO (SONSTIGE EINKÜNFTE)<br>01.01.%d - 31.12.%d", yr, yr)
			period = fmt.Sprintf("01.01.%d - 31.12.%d", yr, yr)
		}

		lc := ""
		if st.ProfitLong > 0 {
			lc = "amount-positive"
		} else if st.ProfitLong < 0 {
			lc = "amount-negative"
		}
		sc := ""
		if st.ProfitShort > 0 {
			sc = "amount-positive"
		} else if st.ProfitShort < 0 {
			sc = "amount-negative"
		}

		yData := templateYearData{
			ReportTitle:    template.HTML(title),
			PeriodLabel:    period,
			TxCount:        st.TxCount,
			SalePrice:      fmt.Sprintf("%.2f €", st.SalePrice),
			AcqCost:        fmt.Sprintf("%.2f €", st.AcqCost),
			ProfitLong:     fmt.Sprintf("%.2f €", st.ProfitLong),
			ProfitShort:    fmt.Sprintf("%.2f €", st.ProfitShort),
			LongTermClass:  lc,
			ShortTermClass: sc,
			Taxable:        fmt.Sprintf("%.2f €", taxable),
		}

		data := struct {
			GeneratedAt string
			TotalTx     int
			Years       []templateYearData
		}{
			GeneratedAt: now.Format("02.01.2006 15:04:05"),
			TotalTx:     totalTx,
			Years:       []templateYearData{yData}, // Only ONE year inserted
		}

		tmpl, err := template.New("tax").Parse(taxReportTpl)
		if err != nil {
			return err
		}

		var buf bytes.Buffer
		if err := tmpl.Execute(&buf, data); err != nil {
			return err
		}
		
		// Determine specialized file path
		subPath := fmt.Sprintf("%s_%d.html", pathPrefix, yr)
		
		if err := os.WriteFile(subPath, buf.Bytes(), 0644); err != nil {
			return err
		}
	}

	return nil
}
