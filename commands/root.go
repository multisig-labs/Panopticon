package commands

import (
	"embed"
	"fmt"
	"io/fs"
	"log"

	"github.com/AbsaOSS/env-binder/env"
	"github.com/spf13/cobra"
)

type Config struct {
	OpenBrowser bool   `env:"OPEN_BROWSER,default=true"`
	Verbose     bool   `env:"VERBOSE,default=false"`
	AuthToken   string `env:"AUTH_TOKEN"`
}

var AppConfig *Config

func init() {
	AppConfig = &Config{}
	if err := env.Bind(AppConfig); err != nil {
		log.Fatalf("error binding config to env: %v", err)
	}
}

const rootCmdName = "panopticon"

const asciiArt = `
👁 Panopticon 👁

`

var content fs.FS

func NewRootCommand() *cobra.Command {

	cmd := &cobra.Command{
		Use:   rootCmdName,
		Short: "Panopticon UI",
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			cmd.SilenceUsage = true // So cobra doesn't print usage when a command fails.
			fmt.Print(asciiArt)
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
