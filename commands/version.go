package commands

import (
	"fmt"
	"io/fs"

	"github.com/multisig-labs/panopticon/pkg/version"

	"github.com/spf13/cobra"
)

func versionCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "version",
		Short: "Print the version number and list of embedded files",
		Run: func(c *cobra.Command, args []string) {
			fmt.Println("Build Date:", version.BuildDate)
			fmt.Println("Git Commit:", version.GitCommit)
			fmt.Println("Version:", version.Version)
			fmt.Println("Go Version:", version.GoVersion)
			fmt.Println("OS / Arch:", version.OsArch)
			fmt.Println("Embeded Content:")
			fs.WalkDir(content, ".", func(path string, d fs.DirEntry, err error) error {
				if err != nil {
					return err
				}
				println("Path:", path, " Name:", d.Name())
				return nil
			})
		},
	}

	return cmd
}
