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

# Print out some help
default:
	@just --list --unsorted

compile:
	go build -ldflags "{{LDFLAGS}}" -o bin/panopticon main.go

# Run server using embedded files
server: compile
	bin/panopticon server

# Run server and server files from disk, not embedded files
dev: compile
	OPEN_BROWSER=false VERBOSE=true bin/panopticon server

# Copy ABIs from ../gogopool-contracts
copy-contracts:
	cp -r ../gogopool-contracts/artifacts/contracts/contract/utils/Multicall3.sol ./public/contracts
	cp -r ../gogopool-contracts/artifacts/contracts/contract/MinipoolManager.sol ./public/contracts
	cp -r ../gogopool-contracts/artifacts/contracts/contract/Oracle.sol ./public/contracts
	cp -r ../gogopool-contracts/artifacts/contracts/contract/ProtocolDAO.sol ./public/contracts
	cp -r ../gogopool-contracts/artifacts/contracts/contract/RewardsPool.sol ./public/contracts
	cp -r ../gogopool-contracts/artifacts/contracts/contract/Staking.sol ./public/contracts
	cp -r ../gogopool-contracts/artifacts/contracts/contract/Storage.sol ./public/contracts
	cp -r ../gogopool-contracts/artifacts/contracts/contract/tokens/TokenggAVAX.sol ./public/contracts
	cp -r ../gogopool-contracts/artifacts/contracts/contract/Vault.sol ./public/contracts

fly-deploy:
  fly deploy --config fly.toml --app panopticon

# Diagnose any obvious setup issues for new folks
doctor:
	#!/usr/bin/env bash
	set -euo pipefail

	if [ ! -d ../gogopool-contracts ]; then
		echo "gogopool-contracts repo not found"
		exit 1
	fi
	echo "gogopool-contracts repo ok"

