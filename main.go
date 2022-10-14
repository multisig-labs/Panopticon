package main

import (
	"embed"
	"fmt"
	"os"
	"runtime/debug"

	"github.com/multisig-labs/panopticon/commands"
	"github.com/multisig-labs/panopticon/pkg/version"
)

//go:embed public/*
var content embed.FS

func panicHandler() {
	if panicPayload := recover(); panicPayload != nil {
		stack := string(debug.Stack())
		fmt.Fprintln(os.Stderr, "================================================================================")
		fmt.Fprintln(os.Stderr, "            Panopticon encountered a fatal error. This is a bug!")
		fmt.Fprintln(os.Stderr, "================================================================================")
		fmt.Fprintf(os.Stderr, "Version:           %s\n", version.Version)
		fmt.Fprintf(os.Stderr, "Build Date:        %s\n", version.BuildDate)
		fmt.Fprintf(os.Stderr, "Git Commit:        %s\n", version.GitCommit)
		fmt.Fprintf(os.Stderr, "Go Version:        %s\n", version.GoVersion)
		fmt.Fprintf(os.Stderr, "OS / Arch:         %s\n", version.OsArch)
		fmt.Fprintf(os.Stderr, "Panic:             %s\n\n", panicPayload)
		fmt.Fprintln(os.Stderr, stack)
		os.Exit(1)
	}
}

func main() {
	defer panicHandler()
	commands.Execute(content)
}
