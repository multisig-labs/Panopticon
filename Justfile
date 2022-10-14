# Justfiles are better Makefiles (Don't @ me)
# Install the `just` command from here https://github.com/casey/just
# or if you have rust: cargo install just
# https://cheatography.com/linux-china/cheat-sheets/justfile/

# Autoload a .env if one exists
set dotenv-load

VERSION := `grep "const Version " pkg/version/version.go | sed -E 's/.*"(.+)"$$/\1/'`
GIT_COMMIT := `git rev-parse HEAD`
BUILD_DATE := `date '+%Y-%m-%d'`
VERSION_PATH := "github.com/multisig-labs/panopticon/pkg/version"
LDFLAGS := "-X " + VERSION_PATH + ".BuildDate=" + BUILD_DATE + " -X " + VERSION_PATH + ".Version=" + VERSION + " -X " + VERSION_PATH + ".GitCommit=" + GIT_COMMIT

export ETH_RPC_URL := env_var("ETH_RPC_URL")
export ANR_AUTH_TOKEN := env_var("ANR_AUTH_TOKEN")

export RIALTO_URL := env_var("RIALTO_URL")
export RIALTO_AUTH_TOKEN := env_var("RIALTO_AUTH_TOKEN")

# Print out some help
default:
	@just --list --unsorted

compile:
	go build -ldflags "{{LDFLAGS}}" -o bin/panopticon main.go

server: compile
	bin/panopticon server --v --authtoken sekret

# Copy ABIs from ../gogopool-contracts
copy-contracts:
	cp -r ../gogopool-contracts/artifacts/contracts/contract/MinipoolManager.sol ./public/contracts
	cp -r ../gogopool-contracts/artifacts/contracts/contract/Oracle.sol ./public/contracts
	cp -r ../gogopool-contracts/artifacts/contracts/contract/rewards/RewardsPool.sol ./public/contracts
	cp -r ../gogopool-contracts/artifacts/contracts/contract/Staking.sol ./public/contracts
	cp -r ../gogopool-contracts/artifacts/contracts/contract/Storage.sol ./public/contracts
	cp -r ../gogopool-contracts/artifacts/contracts/contract/tokens/TokenggAVAX.sol ./public/contracts
	cp -r ../gogopool-contracts/artifacts/contracts/contract/Vault.sol ./public/contracts

docker-build:
	DOCKER_BUILDKIT=1 docker build --platform linux/arm64 -t multisig-labs/panopticon .

docker-run *cmd:
	mkdir -p $(pwd)/snapshots
	docker run -it -p 8500:8500 \
	  --name panopticon \
		-v $(pwd)/web:/app/web \
		-v $(pwd)/cgi-bin:/app/cgi-bin \
		-e ANR_AUTH_TOKEN={{ANR_AUTH_TOKEN}} \
		--rm multisig-labs/panopticon {{cmd}}

# Run a cmd (i.e. bash) inside a running container
docker-exec *cmd:
	docker exec -it panopticon {{cmd}}

# Run a Rialto REST API command
curl-rialto method path params="":
	#!/usr/bin/env bash
	# Using /bin/echo -n to supress newline
	export RSH_HEADER="Authorization: Basic `/bin/echo -n "admin:${RIALTO_AUTH_TOKEN}" | base64`"
	restish {{method}} {{RIALTO_URL}}{{path}} {{params}} 2>/dev/null

# Run an Avalanche P-Chain API command
curl-ava-p method params="":
	#!/usr/bin/env bash
	set -euo pipefail
	basejson='{"jsonrpc":"2.0","id":"1","method":"platform.{{method}}","params":{}}'
	# Convert params formatted as key:val,key:val into JSON
	paramsjson=$(echo "{{params}}" | jq -cnR '
		def trim: sub("^ +";"") | sub(" +$";"");
		def map_values(f): with_entries(.value = (.value|f));
		inputs 
		| sub("\n$"; "") 
		| split(",") 
		| map(select(index(":"))) 
		| map(capture( "(?<key>[^:]*):(?<value>.*)" )) 
		| map( (.key |= trim) | (.value |= trim) ) 
		| from_entries 
		| map_values( tonumber? // . )
		| {params:.}
	')
	json=$(echo ${basejson} ${paramsjson} | jq -cs add)
	echo "${json}" | restish post {{ETH_RPC_URL}}/ext/bc/P 2>/dev/null

fly-setup:
	fly apps create panopticon

fly-deploy:
  fly deploy --config fly.toml --app panopticon

install:
	brew tap danielgtaylor/restish
	brew install jq restish

# Diagnose any obvious setup issues for new folks
doctor:
	#!/usr/bin/env bash
	set -euo pipefail

	if [ ! -d ../gogopool-contracts ]; then
		echo "gogopool-contracts repo not found"
		exit 1
	fi
	echo "gogopool-contracts repo ok"

	if [ ! -d ../rialto ]; then
		echo "rialto repo not found"
		exit 1
	fi
	echo "rialto repo ok"

	if ! hash jq 2>/dev/null; then
	  echo "jq binary not found in your path"
		exit 1
	fi
	echo "jq ok"

	if ! hash restish 2>/dev/null; then
	  echo "restish binary not found in your path"
		exit 1
	fi
	echo "restish ok"

	echo "ETH_RPC_URL: {{ETH_RPC_URL}}"
	echo "RIALTO_URL: {{RIALTO_URL}}"
	echo "RIALTO ADDR: `cat ~/.config/rialto/custom/alice.json | jq -r '.Wallet.CChainAddr'`"

