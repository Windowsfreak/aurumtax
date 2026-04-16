.DEFAULT_GOAL:=help
.PHONY: all build test run docker-build docker-run help

all: test build ## Run test, then build

build: ## Build the binary
	go build -o build/aurumtax ./cmd/aurumtax

build-all: ## Build binary for Windows, Mac, Linux
	GOOS=windows GOARCH=amd64 go build -o build/aurumtax_windows_amd64.exe ./cmd/aurumtax
	GOOS=darwin GOARCH=amd64 go build -o build/aurumtax_mac_amd64 ./cmd/aurumtax
	GOOS=darwin GOARCH=arm64 go build -o build/aurumtax_mac_arm64 ./cmd/aurumtax
	GOOS=linux GOARCH=amd64 go build -o build/aurumtax_linux_amd64 ./cmd/aurumtax

test: ## Run tests
	go test ./... -p 8

help: ## Display this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
