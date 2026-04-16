package history

import (
	"sort"
	"strconv"
	"time"

	"github.com/windowsfreak/aurumtax/internal/domain"
	"github.com/windowsfreak/aurumtax/internal/fx"
)

type Calculator struct {
	fx *fx.ECBProvider
}

func NewCalculator(fx *fx.ECBProvider) *Calculator {
	return &Calculator{fx: fx}
}

func (c *Calculator) BuildHistory(payments []domain.Payment, targetBalances domain.UserBalances, corrections []domain.Correction, summarizeFees bool) ([]domain.HistoryRow, []domain.Trade) {
	// Sort chronologically (oldest first)
	sort.SliceStable(payments, func(i, j int) bool {
		return payments[i].Date.Before(payments[j].Date)
	})

	var filteredPayments []domain.Payment
	for _, tx := range payments {
		// Apply corrections
		var matched *domain.Correction
		txDateStr := tx.Date.Format(time.RFC3339Nano)
		for _, c := range corrections {
			// Compare dates (assuming corrections string might match beginning of RFC3339)
			if c.Date == txDateStr || c.Date == tx.Date.Format(time.RFC3339) || c.Date == tx.Date.Format("2006-01-02T15:04:05.000Z") {
				cCopy := c
				matched = &cCopy
				break
			}
		}

		if matched != nil && !matched.Synthetic {
			// Skip this transaction
			continue
		}
		filteredPayments = append(filteredPayments, tx)
	}

	// Add synthetic transactions
	for _, correction := range corrections {
		if correction.Synthetic {
			d, _ := time.Parse(time.RFC3339Nano, correction.Date)
			if d.IsZero() {
				d, _ = time.Parse(time.RFC3339, correction.Date)
			}
			syntheticTx := domain.Payment{
				Date:   d,
				Kind:   correction.Kind,
				Amount: strconv.FormatFloat(correction.Amount, 'f', -1, 64),
			}
			// Insert sorted
			idx := sort.Search(len(filteredPayments), func(i int) bool {
				return filteredPayments[i].Date.After(d)
			})
			filteredPayments = append(filteredPayments[:idx], append([]domain.Payment{syntheticTx}, filteredPayments[idx:]...)...)
		}
	}

	// Reverse payments for calculating initial balances
	var paymentsReversed []domain.Payment
	for i := len(filteredPayments) - 1; i >= 0; i-- {
		paymentsReversed = append(paymentsReversed, filteredPayments[i])
	}

	reversedState := domain.UserBalances{
		Main:      targetBalances.Main,
		Invest:    targetBalances.Invest,
		Affiliate: targetBalances.Affiliate,
	}

	for _, tx := range paymentsReversed {
		amt := getTransactionAmount(tx)
		switch tx.Kind {
		case "REPLENISHMENT":
			reversedState.Main -= amt
		case "WITHDRAWAL", "SUBSCRIPTION", "LICENSE", "CARD_PURCHASE", "CARD_PURCHASE_PHYSICAL", "CARD_RECHARGE":
			reversedState.Main += amt
		case "INVESTMENT", "TOP_UP_DEPOSIT":
			reversedState.Main += amt
			reversedState.Invest -= amt
		case "REINVESTMENT", "DIVIDEND":
			reversedState.Invest -= amt
		case "CLAIMED_DIVIDEND":
			reversedState.Main -= amt
			reversedState.Invest += amt
		case "REFERRAL_FUND", "TEAM_EARNINGS", "REFERRAL_LICENSE_FUND", "REFERRAL_CARD_PURCHASE", "REFERRAL_CARD_TOPUP", "TEAM_EARNING_LIVE_TRADING", "SHAREHOLDER_BONUS":
			reversedState.Affiliate -= amt
		case "REFERRAL_RANK_BONUS":
			reversedState.Main -= amt
		case "TRANSFER":
			if (tx.Asset == "PARTNER-USDT" && tx.TargetAsset == "MAIN-USDT") || (tx.Asset == "" && tx.TargetAsset == "") {
				reversedState.Affiliate += amt
				reversedState.Main -= amt
			}
		}
	}

	var history []domain.HistoryRow
	history = append(history, domain.HistoryRow{
		Date:      time.Time{}, // initial
		Kind:      "-",
		Amount:    0,
		Main:      0,
		Invest:    0,
		Affiliate: 0,
		Card:      0,
		Sum:       0,
		Profit:    0,
		Provision: 0,
		Costs:     0,
		TotalCosts: 0,
		IsInitial: true,
	})

	main := float64(0)
	invest := float64(0)
	affiliate := float64(0)
	card := float64(0)
	profit := float64(0)
	provision := float64(0)
	totalCosts := float64(0)

	for _, tx := range filteredPayments {
		amount := getTransactionAmount(tx)
		kind := tx.Kind
		costAddition := float64(0)

		if summarizeFees && (kind == "CARD_RECHARGE" || kind == "CARD_PURCHASE" || kind == "CARD_PURCHASE_PHYSICAL") {
			kind = "MAINTENANCE_FEE"
			main -= amount
			costAddition = amount
		} else {
			switch kind {
			case "REPLENISHMENT":
				main += amount
			case "WITHDRAWAL":
				main -= amount
				costAddition = (amount * 0.01) + 1.01
			case "SUBSCRIPTION", "LICENSE", "CARD_PURCHASE", "CARD_PURCHASE_PHYSICAL":
				main -= amount
				costAddition = amount
			case "INVESTMENT":
				if tx.KindName != "" { // Simulating the AURUM bug check
					// JS had: if (tx.kindName) amount += reversedState.invest
					// This logic meant initial investment = deposit from balance.
					amount += reversedState.Invest
				}
				invest += amount
				main -= amount
			case "TOP_UP_DEPOSIT":
				main -= amount
				invest += amount
			case "DIVIDEND", "REINVESTMENT":
				invest += amount
				profit += amount
			case "CLAIMED_DIVIDEND":
				main += amount
				invest -= amount
			case "REFERRAL_FUND", "TEAM_EARNINGS", "REFERRAL_LICENSE_FUND", "REFERRAL_CARD_PURCHASE", "REFERRAL_CARD_TOPUP", "TEAM_EARNING_LIVE_TRADING", "SHAREHOLDER_BONUS":
				affiliate += amount
				provision += amount
			case "REFERRAL_RANK_BONUS":
				main += amount
				provision += amount
			case "TRANSFER":
				if (tx.Asset == "PARTNER-USDT" && tx.TargetAsset == "MAIN-USDT") || (tx.Asset == "" && tx.TargetAsset == "") {
					affiliate -= amount
					main += amount
				}
			case "CARD_RECHARGE":
				main -= amount
				fee := amount * 0.022
				effective := amount - fee
				card += effective
				costAddition = fee
			}
		}

		totalCosts += costAddition

		history = append(history, domain.HistoryRow{
			Date:       tx.Date,
			Kind:       kind,
			Amount:     amount,
			Main:       main,
			Invest:     invest,
			Affiliate:  affiliate,
			Card:       card,
			Sum:        main + invest + affiliate,
			Profit:     profit,
			Provision:  provision,
			Costs:      costAddition,
			TotalCosts: totalCosts,
			IsInitial:  false,
		})
	}

	trades := c.buildTrades(history)

	return history, trades
}

func (c *Calculator) buildTrades(rows []domain.HistoryRow) []domain.Trade {
	var trades []domain.Trade
	prevSum := float64(0)
	
	// Assume most recent rate logic
	now := time.Now()
	mostRecentRate := c.fx.GetRate(now)

	for _, row := range rows {
		if row.IsInitial {
			prevSum = row.Sum
			continue
		}
		diff := row.Sum - prevSum
		if diff > -0.001 && diff < 0.001 {
			prevSum = row.Sum
			continue
		}
		rate := c.fx.GetRate(row.Date)

		var outAsset, inAsset, typ string
		var outAmt, inAmt float64

		if diff > 0 {
			outAsset = "EUR"
			outAmt = diff / rate
			inAsset = "TUSD"
			inAmt = diff
			typ = "buy"
		} else {
			outAsset = "TUSD"
			outAmt = -diff
			inAsset = "EUR"
			inAmt = -diff / rate
			typ = "sell"
		}
		trades = append(trades, domain.Trade{
			Date:     row.Date,
			OutAsset: outAsset,
			OutAmt:   outAmt,
			InAsset:  inAsset,
			InAmt:    inAmt,
			Type:     typ,
		})
		prevSum = row.Sum
	}

	if len(rows) > 0 {
		finalSum := rows[len(rows)-1].Sum
		if finalSum > 0 {
			// Add 2099 final fallback transaction
			t2099, _ := time.Parse("2006-01-02 15:04", "2099-12-31 23:59")
			trades = append(trades, domain.Trade{
				Date:     t2099,
				OutAsset: "TUSD",
				OutAmt:   finalSum,
				InAsset:  "EUR",
				InAmt:    finalSum / mostRecentRate,
				Type:     "sell",
			})
		}
	}

	return trades
}

func getTransactionAmount(tx domain.Payment) float64 {
	if tx.CryptoAmount != "" && tx.Amount != "" {
		val, _ := strconv.ParseFloat(tx.CryptoAmount, 64)
		return val
	}
	val, _ := strconv.ParseFloat(tx.Amount, 64)
	return val
}

func TranslateKind(kind string) string {
	mapKind := map[string]string{
		"REPLENISHMENT":               "Eingezahlt",
		"WITHDRAWAL":                  "Ausgezahlt",
		"WITHDRAWAL_DEPOSIT":          "Ausgezahlt (Deposit)",
		"INVESTMENT":                  "Invest",
		"TOP_UP_DEPOSIT":              "Invest",
		"CARD_RECHARGE":               "Karte aufladen",
		"SUBSCRIPTION":                "Abonnement",
		"REINVESTMENT":                "Reinvest",
		"DIVIDEND":                    "Dividende",
		"CLAIMED_DIVIDEND":            "Umbuchung",
		"REFERRAL_FUND":               "Empfehlungsprovision",
		"TEAM_EARNINGS":               "Teameinnahmen",
		"REFERRAL_RANK_BONUS":         "Rangbonus",
		"TRANSFER":                    "Übertragung",
		"CARD_PURCHASE":               "Kartenbestellung",
		"CARD_PURCHASE_PHYSICAL":      "Physische Karte",
		"MAINTENANCE_FEE":             "Verwaltungsgebühren",
		"LICENSE":                     "Lizenz",
		"FLASH_LOAN_PROFIT":           "Flash Loan Profit (nicht unterstützt)",
		"LIVE_TRADING":                "Live Trading (nicht unterstützt)",
		"LIVE_TRADING_BOTS":           "Live Trading Bots (nicht unterstützt)",
		"LIVE_TRADING_BOT_STOP":       "Live Trading Bot Stop (nicht unterstützt)",
		"TEAM_EARNING_LIVE_TRADING":   "Team Live Trading",
		"AURUM_TOKEN":                 "Aurum Token (nicht unterstützt)",
		"REFERRAL_LICENSE_FUND":       "Empfehlungs-Lizenz-Fonds",
		"REFERRAL_CARD_PURCHASE":      "Empfehlungs-Kartenkauf",
		"REFERRAL_CARD_TOPUP":         "Empfehlungs-Kartenaufladung",
		"CARD_PURCHASE_CASHBACK":      "Karten-Cashback (nicht unterstützt)",
		"SHAREHOLDER_BONUS":           "Aktionärsbonus",
	}
	if val, ok := mapKind[kind]; ok {
		return val
	}
	return kind
}
