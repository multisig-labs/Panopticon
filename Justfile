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
LDFLAGS := "-s -w " + "-X " + VERSION_PATH + ".BuildDate=" + BUILD_DATE + " -X " + VERSION_PATH + ".Version=" + VERSION + " -X " + VERSION_PATH + ".GitCommit=" + GIT_COMMIT

# Print out some help
default:
	@just --list --unsorted

compile:
	go build -ldflags "{{LDFLAGS}}" -o bin/panopticon main.go

# Run server using embedded files
server: compile
	bin/panopticon server

# Run server and serve files from disk, not embedded files
dev: compile
	OPEN_BROWSER=false VERBOSE=true bin/panopticon server

# Copy ABIs from ../gogopool-contracts (excluding Base*)
copy-contracts:
	#!/usr/bin/env bash
	set -euo pipefail
	cat \
	   ../gogopool/artifacts/contracts/contract/*.sol/*.json \
	   ../gogopool/artifacts/contracts/contract/tokens/*.sol/*.json \
	| jq  'select(.contractName != null and (.contractName|startswith("Base")|not)) | {(.contractName): {abi: .abi}}' \
	| jq -s add > public/deployments/contracts.json

fly-deploy:
  fly deploy --local-only --config fly.toml --app panopticon

# Diagnose any obvious setup issues for new folks
doctor:
	#!/usr/bin/env bash
	set -euo pipefail

	if [ ! -d ../gogopool-contracts ]; then
		echo "gogopool-contracts repo not found"
		exit 1
	fi
	echo "gogopool-contracts repo ok"

