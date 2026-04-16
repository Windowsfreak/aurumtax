package exporter

import (
	"strconv"
	"time"

	"github.com/windowsfreak/aurumtax/internal/domain"
	"github.com/windowsfreak/aurumtax/internal/history"
	"github.com/xuri/excelize/v2"
)

func WriteExcel(path string, rows []domain.HistoryRow) error {
	f := excelize.NewFile()
	defer f.Close()

	sheet := "Transactions"
	f.SetSheetName("Sheet1", sheet)

	headers := []string{"Zeitpunkt", "Vorgang", "Betrag", "Main", "Invest", "Affiliate", "Card", "Summe", "Profit", "Provision", "Kosten", "Gesamtkosten"}
	for i, col := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, col)
	}

	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "#FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#0066cc"}, Pattern: 1},
	})
	f.SetRowStyle(sheet, 1, 1, headerStyle)
	f.AutoFilter(sheet, "A1:L1", nil)

	numStyle, _ := f.NewStyle(&excelize.Style{
		NumFmt: 4, // 4 = #,##0.00
	})
	dateStyle, _ := f.NewStyle(&excelize.Style{
		NumFmt: 22, // roughly datetime
	})

	for r, row := range rows {
		rowIdx := r + 2
		dateCell, _ := excelize.CoordinatesToCellName(1, rowIdx)
		if row.IsInitial {
			f.SetCellValue(sheet, dateCell, "(Initial)")
		} else {
			f.SetCellValue(sheet, dateCell, row.Date.Format(time.RFC3339))
			f.SetCellStyle(sheet, dateCell, dateCell, dateStyle)
		}

		for c, val := range []interface{}{
			history.TranslateKind(row.Kind),
			row.Amount,
			row.Main,
			row.Invest,
			row.Affiliate,
			row.Card,
			row.Sum,
			row.Profit,
			row.Provision,
			row.Costs,
			row.TotalCosts,
		} {
			cell, _ := excelize.CoordinatesToCellName(c+2, rowIdx)
			f.SetCellValue(sheet, cell, val)
			if c > 0 { // numeric cells
				f.SetCellStyle(sheet, cell, cell, numStyle)
			}
		}
	}

	// Calculate and Set column widths approx
	for i := 1; i <= len(headers); i++ {
		colName, _ := excelize.ColumnNumberToName(i)
		width := 15.0
		if i == 1 {
			width = 22.0
		} else if i == 2 {
			width = 25.0
		}
		f.SetColWidth(sheet, colName, colName, width)
	}

	return f.SaveAs(path)
}

func FloatStr(f float64) string {
	return strconv.FormatFloat(f, 'f', 2, 64)
}
