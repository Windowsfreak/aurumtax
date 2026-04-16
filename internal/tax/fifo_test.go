package tax

import (
	"testing"
	"time"

	"github.com/windowsfreak/aurumtax/internal/domain"
)

func TestCalculateFIFO(t *testing.T) {
	// Setup test dates
	now := time.Now()
	moreThanOneYearLater := now.AddDate(1, 0, 1)
	lessThanOneYearLater := now.AddDate(0, 6, 0)

	tests := []struct {
		name     string
		trades   []domain.Trade
		expected map[int]YearStats
	}{
		{
			name: "Simple buy and sell within same year (short term)",
			trades: []domain.Trade{
				{
					Date:    now,
					Type:    "buy",
					InAmt:   100, // 100 TUSD
					OutAmt:  90,  // for 90 EUR
					InAsset: "TUSD",
				},
				{
					Date:    lessThanOneYearLater,
					Type:    "sell",
					InAmt:   110, // Received 110 EUR
					OutAmt:  100, // Sold 100 TUSD
					OutAsset: "TUSD",
				},
			},
			expected: map[int]YearStats{
				now.Year(): {
					Year:        now.Year(),
					TxCount:     2,
					SalePrice:   110,
					AcqCost:     90,
					ProfitShort: 20,
					ProfitLong:  0,
				},
			},
		},
		{
			name: "Buy and sell after a year (long term)",
			trades: []domain.Trade{
				{
					Date:    now,
					Type:    "buy",
					InAmt:   100,
					OutAmt:  90,
				},
				{
					Date:    moreThanOneYearLater,
					Type:    "sell",
					InAmt:   150,
					OutAmt:  100,
				},
			},
			expected: map[int]YearStats{
				now.Year(): {
					Year:    now.Year(),
					TxCount: 1,
				},
				moreThanOneYearLater.Year(): {
					Year:        moreThanOneYearLater.Year(),
					TxCount:     1,
					SalePrice:   150,
					AcqCost:     90,
					ProfitShort: 0,
					ProfitLong:  60,
				},
			},
		},
		{
			name: "Partial sales",
			trades: []domain.Trade{
				{
					Date:   now,
					Type:   "buy",
					InAmt:  100,
					OutAmt: 100, // 1 EUR per TUSD
				},
				{
					Date:   now.Add(time.Hour),
					Type:   "sell",
					OutAmt: 50,
					InAmt:  75, // 1.5 EUR per TUSD -> Profit 25
				},
				{
					Date:   now.Add(2 * time.Hour),
					Type:   "sell",
					OutAmt: 50,
					InAmt:  60, // 1.2 EUR per TUSD -> Profit 10
				},
			},
			expected: map[int]YearStats{
				now.Year(): {
					Year:        now.Year(),
					TxCount:     3,
					SalePrice:   135,
					AcqCost:     100,
					ProfitShort: 35,
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results := CalculateFIFO(tt.trades)
			if len(results) != len(tt.expected) {
				t.Errorf("expected %d years, got %d", len(tt.expected), len(results))
			}

			for yr, expectedStats := range tt.expected {
				got, ok := results[yr]
				if !ok {
					t.Errorf("year %d not found in results", yr)
					continue
				}

				if got.TxCount != expectedStats.TxCount {
					t.Errorf("year %d: expected TxCount %d, got %d", yr, expectedStats.TxCount, got.TxCount)
				}
				
				const epsilon = 1e-8
				if (got.SalePrice - expectedStats.SalePrice) > epsilon || (expectedStats.SalePrice - got.SalePrice) > epsilon {
					t.Errorf("year %d: expected SalePrice %f, got %f", yr, expectedStats.SalePrice, got.SalePrice)
				}
				if (got.AcqCost - expectedStats.AcqCost) > epsilon || (expectedStats.AcqCost - got.AcqCost) > epsilon {
					t.Errorf("year %d: expected AcqCost %f, got %f", yr, expectedStats.AcqCost, got.AcqCost)
				}
				if (got.ProfitShort - expectedStats.ProfitShort) > epsilon || (expectedStats.ProfitShort - got.ProfitShort) > epsilon {
					t.Errorf("year %d: expected ProfitShort %f, got %f", yr, expectedStats.ProfitShort, got.ProfitShort)
				}
				if (got.ProfitLong - expectedStats.ProfitLong) > epsilon || (expectedStats.ProfitLong - got.ProfitLong) > epsilon {
					t.Errorf("year %d: expected ProfitLong %f, got %f", yr, expectedStats.ProfitLong, got.ProfitLong)
				}
			}
		})
	}
}
