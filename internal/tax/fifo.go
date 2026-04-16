package tax

import (
	"sort"
	"time"

	"github.com/windowsfreak/aurumtax/internal/domain"
)

type YearStats struct {
	Year        int
	TxCount     int
	SalePrice   float64
	AcqCost     float64
	ProfitLong  float64
	ProfitShort float64
}

type buyEvent struct {
	Date    time.Time
	Amount  float64
	CostEur float64
}

func CalculateFIFO(trades []domain.Trade) map[int]*YearStats {
	// Sort trades
	sort.SliceStable(trades, func(i, j int) bool {
		return trades[i].Date.Before(trades[j].Date)
	})

	yearStats := make(map[int]*YearStats)
	for _, t := range trades {
		yr := t.Date.Year()
		if _, ok := yearStats[yr]; !ok {
			yearStats[yr] = &YearStats{Year: yr}
		}
		yearStats[yr].TxCount++
	}

	var queue []buyEvent

	for _, t := range trades {
		if t.Type == "buy" {
			queue = append(queue, buyEvent{
				Date:    t.Date,
				Amount:  t.InAmt,     // BaseAmount (TUSD)
				CostEur: t.OutAmt,    // QuoteAmount (EUR cost)
			})
		} else if t.Type == "sell" {
			yr := t.Date.Year()
			amountToSell := t.OutAmt // we are selling TUSD
			revenueRate := t.InAmt / t.OutAmt // EUR received / TUSD sold

			for amountToSell > 1e-8 && len(queue) > 0 {
				buy := &queue[0]
				minAmt := buy.Amount
				if amountToSell < minAmt {
					minAmt = amountToSell
				}

				chunkCost := buy.CostEur * (minAmt / buy.Amount)
				chunkRev := revenueRate * minAmt
				profit := chunkRev - chunkCost

				limitDate := buy.Date.AddDate(1, 0, 0) // 1 year holding
				isLongTerm := t.Date.After(limitDate)

				st := yearStats[yr]
				st.SalePrice += chunkRev
				st.AcqCost += chunkCost

				if isLongTerm {
					st.ProfitLong += profit
				} else {
					st.ProfitShort += profit
				}

				amountToSell -= minAmt
				buy.Amount -= minAmt
				buy.CostEur -= chunkCost

				if buy.Amount < 1e-8 {
					queue = queue[1:] // shift
				}
			}
		} // else ignore transfers/etc if any
	}

	return yearStats
}
