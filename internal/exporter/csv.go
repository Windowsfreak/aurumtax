package exporter

import (
	"encoding/csv"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/windowsfreak/aurumtax/internal/domain"
	"github.com/windowsfreak/aurumtax/internal/fx"
	"github.com/windowsfreak/aurumtax/internal/history"
)

func formatExportDate(d time.Time) string {
	if d.IsZero() {
		return "(Initial)"
	}
	return d.Format("2006-01-02 15:04:00") // UTC
}

func WriteBaseCSV(path string, rows []domain.HistoryRow, fxP *fx.ECBProvider) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()

	w := csv.NewWriter(f)
	w.Comma = ','
	_ = w.Write([]string{"Zeitpunkt", "Vorgang", "Betrag USD", "Betrag EUR", "Kurs", "Main USD", "Invest USD", "Affiliate USD", "Sum USD"})

	for _, row := range rows {
		dateStr := formatExportDate(row.Date)

		rate := fxP.GetRate(row.Date)
		if row.IsInitial {
			rate = fxP.GetRate(time.Now())
		}
		amtEur := row.Amount / rate

		_ = w.Write([]string{
			fmt.Sprintf(`"%s"`, dateStr),
			fmt.Sprintf(`"%s"`, history.TranslateKind(row.Kind)),
			strconv.FormatFloat(row.Amount, 'f', -1, 64),
			strconv.FormatFloat(amtEur, 'f', 5, 64),
			strconv.FormatFloat(rate, 'f', 4, 64),
			strconv.FormatFloat(row.Main, 'f', 2, 64),
			strconv.FormatFloat(row.Invest, 'f', 2, 64),
			strconv.FormatFloat(row.Affiliate, 'f', 2, 64),
			strconv.FormatFloat(row.Sum, 'f', 2, 64),
		})
	}
	w.Flush()
	return w.Error()
}

func WriteBlockpitCSV(path string, trades []domain.Trade) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	w := csv.NewWriter(f)
	_ = w.Write([]string{"Date (UTC)", "Integration Name", "Label", "Outgoing Asset", "Outgoing Amount", "Incoming Asset", "Incoming Amount", "Fee Asset (optional)", "Fee Amount (optional)", "Comment (optional)", "Trx. ID (optional)"})

	for _, t := range trades {
		_ = w.Write([]string{
			fmt.Sprintf(`"%s"`, formatExportDate(t.Date)),
			"AURUM",
			"Trade",
			t.OutAsset,
			strconv.FormatFloat(t.OutAmt, 'f', -1, 64),
			t.InAsset,
			strconv.FormatFloat(t.InAmt, 'f', -1, 64),
			"", "", "", "",
		})
	}
	w.Flush()
	return w.Error()
}

func WriteSummCSV(path string, trades []domain.Trade) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	w := csv.NewWriter(f)
	_ = w.Write([]string{"Timestamp (UTC)", "Type", "Base Currency", "Base Amount", "Quote Currency (Optional)", "Quote Amount (Optional)", "Fee Currency (Optional)", "Fee Amount (Optional)", "From (Optional)", "To (Optional)", "Blockchain (Optional)", "ID (Optional)", "Description (Optional)"})

	for _, t := range trades {
		var baseAmt, quoteAmt string
		if t.Type == "buy" {
			baseAmt = strconv.FormatFloat(t.InAmt, 'f', -1, 64)
			quoteAmt = strconv.FormatFloat(t.OutAmt, 'f', -1, 64)
		} else {
			baseAmt = strconv.FormatFloat(t.OutAmt, 'f', -1, 64)
			quoteAmt = strconv.FormatFloat(t.InAmt, 'f', -1, 64)
		}

		_ = w.Write([]string{
			fmt.Sprintf(`"%s"`, formatExportDate(t.Date)),
			t.Type,
			strings.ReplaceAll("TUSD", "TUSD", "TUSD"), // just text
			baseAmt,
			"EUR",
			quoteAmt,
			"", "", "AURUM", "AURUM", "", "", "",
		})
	}
	w.Flush()
	return w.Error()
}

func WriteCointrackingCSV(path string, trades []domain.Trade) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	w := csv.NewWriter(f)
	_ = w.Write([]string{"Type", "Buy Amount", "Buy Currency", "Sell Amount", "Sell Currency", "Fee", "Fee Currency", "Exchange", "Trade-Group", "Comment", "Date"})

	for _, t := range trades {
		_ = w.Write([]string{
			"Trade",
			strconv.FormatFloat(t.InAmt, 'f', -1, 64),
			t.InAsset,
			strconv.FormatFloat(t.OutAmt, 'f', -1, 64),
			t.OutAsset,
			"", "", "AURUM", "", "",
			fmt.Sprintf(`"%s"`, formatExportDate(t.Date)),
		})
	}
	w.Flush()
	return w.Error()
}
