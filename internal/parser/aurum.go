package parser

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/windowsfreak/aurumtax/internal/domain"
)

type mainResponse struct {
	Balance struct {
		Total string `json:"total"`
	} `json:"balance"`
}

type partnerResponse struct {
	PartnerBalance string `json:"partnerBalance"`
}

type investmentsResponse struct {
	Balance struct {
		TotalDeposit string `json:"totalDeposit"`
		TokenBalance string `json:"tokenBalance"`
	} `json:"balance"`
}

// ParsePrefix lädt alle zugehörigen Daten basierend auf dem Dateipräfix.
func ParsePrefix(prefix string) ([]domain.Payment, domain.UserBalances, error) {
	var balances domain.UserBalances
	
	// Main
	mainData, err := os.ReadFile(fmt.Sprintf("%s_aurum_main.json", prefix))
	if err == nil {
		var mr mainResponse
		if err := json.Unmarshal(mainData, &mr); err == nil {
			balances.Main = parseFloatSafe(mr.Balance.Total)
		}
	}
	
	// Partners
	partData, err := os.ReadFile(fmt.Sprintf("%s_aurum_partners.json", prefix))
	if err == nil {
		var pr partnerResponse
		if err := json.Unmarshal(partData, &pr); err == nil {
			balances.Affiliate = parseFloatSafe(pr.PartnerBalance)
		}
	}
	
	// Investments
	invData, err := os.ReadFile(fmt.Sprintf("%s_aurum_investments.json", prefix))
	if err == nil {
		var ir investmentsResponse
		if err := json.Unmarshal(invData, &ir); err == nil {
			balances.Invest = parseFloatSafe(ir.Balance.TotalDeposit) + parseFloatSafe(ir.Balance.TokenBalance)
		}
	}
	
	// Payments (JSONL)
	payPath := fmt.Sprintf("%s_aurum_payments.jsonl", prefix)
	f, err := os.Open(payPath)
	if err != nil {
		return nil, balances, domain.WrapError(err, "konnte Payments Datei %s nicht öffnen", payPath)
	}
	defer f.Close()
	
	var payments []domain.Payment
	scanner := bufio.NewScanner(f)
	
	// Um große Zeilen zu unterstützen
	buf := make([]byte, 0, 64*1024)
	scanner.Buffer(buf, 1024*1024)
	
	lineNum := 0
	for scanner.Scan() {
		lineNum++
		line := scanner.Text()
		if strings.TrimSpace(line) == "" {
			continue
		}
		var p domain.Payment
		if err := json.Unmarshal([]byte(line), &p); err != nil {
			return nil, balances, domain.WrapError(err, "fehler in Zeile %d bei Payments", lineNum)
		}
		
		// Filter out unsupported currencies wie in `script.js`
		tickerOk := p.Ticker == "" || p.Ticker == "USDT" || p.Ticker == "USDC"
		cryptoOk := p.CryptoTicker == "" || p.CryptoTicker == "USDT" || p.CryptoTicker == "USDC"
		
		rejectedCard := p.Kind == "CARD_RECHARGE" && p.StatusName == "transactions:REJECTED"

		if tickerOk && cryptoOk && !rejectedCard {
			payments = append(payments, p)
		}
	}
	
	if err := scanner.Err(); err != nil {
		return nil, balances, domain.WrapError(err, "fehler beim Lesen der Payments JSONL")
	}
	
	return payments, balances, nil
}

func parseFloatSafe(s string) float64 {
	s = strings.ReplaceAll(s, " ", "")
	v, _ := strconv.ParseFloat(s, 64)
	return v
}

// ParseCorrections liest eine Korrekturdatei im Format: Datum [Synthetisch/Typ] [Betrag]
func ParseCorrections(content string) ([]domain.Correction, error) {
	var corrections []domain.Correction
	lines := strings.Split(content, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		parts := strings.Split(line, " ")
		if len(parts) >= 1 {
			date := parts[0]
			if len(parts) > 1 {
				kind := parts[1]
				amt := 0.0
				if len(parts) > 2 {
					amt = parseFloatSafe(parts[2])
				}
				corrections = append(corrections, domain.Correction{
					Date:      date,
					Synthetic: true,
					Kind:      kind,
					Amount:    amt,
				})
			} else {
				corrections = append(corrections, domain.Correction{
					Date:      date,
					Synthetic: false,
				})
			}
		}
	}
	return corrections, nil
}
