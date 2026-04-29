package fx

import (
	"encoding/xml"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/windowsfreak/aurumtax/internal/domain"
)

type CompactData struct {
	XMLName xml.Name `xml:"CompactData"`
	Series  []Series `xml:"DataSet>Series"`
}

type Series struct {
	Obs []Obs `xml:"Obs"`
}

type Obs struct {
	TimePeriod string  `xml:"TIME_PERIOD,attr"`
	ObsValue   float64 `xml:"OBS_VALUE,attr"`
}

type ECBProvider struct {
	rates map[string]float64
}

func NewECBProvider() *ECBProvider {
	return &ECBProvider{
		rates: make(map[string]float64),
	}
}

// Init lädt die Daten von lokaler Datei oder lädt sie herunter.
func (p *ECBProvider) Init(localCachePath string) error {
	url := "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/usd.xml"
	
	// Versuch, XML herunterzuladen
	resp, err := http.Get(url)
	var data []byte
	
	if err == nil && resp.StatusCode == http.StatusOK {
		defer resp.Body.Close()
		data, err = io.ReadAll(resp.Body)
		if err == nil {
			// Speichern im Cache, Ignorieren von Fehlern
			_ = os.WriteFile(localCachePath, data, 0644)
		}
	}
	
	// Falls Download fehlgeschlagen, versuche lokalen Cache
	if len(data) == 0 {
		data, err = os.ReadFile(localCachePath)
		if err != nil {
			return domain.WrapError(err, "kann ECB Raten weder herunterladen noch aus Cache lesen")
		}
	}
	
	var compactData CompactData
	if err := xml.Unmarshal(data, &compactData); err != nil {
		return domain.WrapError(err, "fehler beim Parsen der ECB XML-Daten")
	}
	
	for _, series := range compactData.Series {
		for _, obs := range series.Obs {
			if obs.TimePeriod != "" {
				p.rates[obs.TimePeriod] = obs.ObsValue
			}
		}
	}
	return nil
}

func (p *ECBProvider) GetRate(date time.Time) float64 {
	// Letzte 14 Tage probieren (wie im ursprünglichen Script)
	for i := 0; i < 14; i++ {
		iso := date.Format("2006-01-02")
		if rate, ok := p.rates[iso]; ok {
			return rate
		}
		date = date.AddDate(0, 0, -1)
	}
	return 1.0 // Fallback
}
