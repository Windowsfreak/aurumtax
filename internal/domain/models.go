package domain

import (
	"fmt"
	"time"
)

// Payment repräsentiert eine Zahlungstransaktion aus der API (.jsonl Datei).
type Payment struct {
	ID           string    `json:"id"`
	Date         time.Time `json:"date"`
	Kind         string    `json:"kind"`
	Amount       string    `json:"amount"`
	Fee          string    `json:"fee"`
	CryptoAmount string    `json:"cryptoAmount"`
	Asset        string    `json:"asset"`
	TargetAsset  string    `json:"targetAsset"`
	CryptoTicker  string    `json:"cryptoTicker"`
	Ticker        string    `json:"ticker"`
	KindName      string    `json:"kindName"`
	StatusName    string    `json:"statusName"`
}

// UserBalances repräsentiert die Salden eines Accounts.
type UserBalances struct {
	Main      float64
	Affiliate float64
	Invest    float64
}

// Trade repräsentiert den konvertierten Trade-Eintrag für Blockpit/Summ.
type Trade struct {
	Date     time.Time
	OutAsset string
	OutAmt   float64
	InAsset  string
	InAmt    float64
	Type     string // "buy" oder "sell"
}

// HistoryRow repräsentiert eine verarbeitete Zeile in der berechneten Historie.
type HistoryRow struct {
	Date       time.Time
	Kind       string
	Amount     float64
	Main       float64
	Invest     float64
	Affiliate  float64
	Card       float64
	Sum        float64
	Profit     float64
	Provision  float64
	Costs      float64
	TotalCosts float64
	IsInitial  bool
}

// Correction repräsentiert eine Benutzer-Korrektur (synthetisch oder exkludierend).
type Correction struct {
	Date      string
	Synthetic bool
	Kind      string
	Amount    float64
}

// AppError ist ein benutzerdefinierter Error Typ für die Anwendung.
type AppError struct {
	Msg string
	Err error
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Msg, e.Err)
	}
	return e.Msg
}

// WrapError kapselt einen bestehenden internen Fehler in einen neuen mit deutscher Nachricht.
func WrapError(err error, msg string, args ...any) error {
	return &AppError{
		Msg: fmt.Sprintf(msg, args...),
		Err: err,
	}
}

// NewError erstellt einen simplen App Fehler in Deutsch.
func NewError(msg string, args ...any) error {
	return &AppError{
		Msg: fmt.Sprintf(msg, args...),
	}
}
