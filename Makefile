.DEFAULT_GOAL:=help
.PHONY: all build test run docker-build docker-run help

all: test build ## Run test, then build

build: ## Build the binary
	go build -o build/aurumtax ./cmd/aurumtax

build-all: ## Build binary for Windows, Mac, Linux
	mkdir -p build/dist
	GOOS=windows GOARCH=amd64 go build -o build/aurumtax.exe ./cmd/aurumtax
	cd build && zip dist/aurumtax_windows_amd64.zip aurumtax.exe && rm aurumtax.exe
	
	GOOS=darwin GOARCH=amd64 go build -o build/aurumtax ./cmd/aurumtax
	cd build && tar -czf dist/aurumtax_mac_amd64.tar.gz aurumtax && rm aurumtax
	
	GOOS=darwin GOARCH=arm64 go build -o build/aurumtax ./cmd/aurumtax
	cd build && tar -czf dist/aurumtax_mac_arm64.tar.gz aurumtax && rm aurumtax
	
	GOOS=linux GOARCH=amd64 go build -o build/aurumtax ./cmd/aurumtax
	cd build && tar -czf dist/aurumtax_linux_amd64.tar.gz aurumtax && rm aurumtax

test: ## Run tests
	go test ./... -p 8

help: ## Display this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
