package commands

import (
	"embed"
	"fmt"
	"io/fs"

	"github.com/multisig-labs/panopticon/pkg/version"
	"github.com/spf13/cobra"
)

const rootCmdName = "panopticon"

const asciiArt = `
▁ ▂ ▄ ▅ ▆ ▇ █ Panopticon █ ▇ ▆ ▅ ▄ ▂ ▁

`

var content fs.FS

func NewRootCommand() *cobra.Command {

	cmd := &cobra.Command{
		Use:   rootCmdName,
		Short: "Panopticon UI",
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			cmd.SilenceUsage = true // So cobra doesn't print usage when a command fails.
			fmt.Print(asciiArt)
			fmt.Printf("Panopticon Version: %s\n\n", version.Version)
		},
	}

	cmd.AddCommand(serverCommand())
	cmd.AddCommand(versionCommand())

	return cmd
}

// Embedded web content passed in from main.go
func Execute(content_ embed.FS) {
	content = content_
	cobra.CheckErr(NewRootCommand().Execute())
}
