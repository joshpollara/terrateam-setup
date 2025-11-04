package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/terrateam/terrateam-setup/internal/config"
	"github.com/terrateam/terrateam-setup/internal/github"
	"github.com/terrateam/terrateam-setup/internal/gitlab"
)

var (
	version = "1.0.0"

	// VCS flags
	useGitHub bool
	useGitLab bool

	// Tunnel flags
	skipTunnel bool

	// User info flags
	email      string
	firstName  string
	lastName   string

	// GitHub flags
	gheHost     string
	gheProtocol string
	ghOrg       string

	// GitLab flags
	gitlabURL   string
	gitlabToken string

	// Other flags
	port int
)

var rootCmd = &cobra.Command{
	Use:   "terrateam-setup",
	Short: "Setup Terrateam with GitHub or GitLab",
	Long: `Terrateam Setup CLI - Fast, streamlined setup for Terrateam.

This CLI tool helps you quickly set up Terrateam with GitHub or GitLab
by creating the necessary app configurations and generating your .env file.

Examples:
  # GitHub setup (fastest)
  terrateam-setup --github

  # GitHub Enterprise
  terrateam-setup --github --ghe-host github.company.com

  # GitLab with token
  terrateam-setup --gitlab --gitlab-token glpat-xxxxx

  # Self-hosted GitLab
  terrateam-setup --gitlab --gitlab-url https://gitlab.company.com --gitlab-token glpat-xxxxx`,
	Version: version,
	RunE:    run,
}

func init() {
	// VCS provider flags
	rootCmd.Flags().BoolVar(&useGitHub, "github", false, "Use GitHub as VCS provider")
	rootCmd.Flags().BoolVar(&useGitLab, "gitlab", false, "Use GitLab as VCS provider")

	// Tunnel flags
	rootCmd.Flags().BoolVar(&skipTunnel, "no-tunnel", true, "Skip tunnel configuration (default)")

	// User info flags
	rootCmd.Flags().StringVar(&email, "email", "", "Your email address")
	rootCmd.Flags().StringVar(&firstName, "first-name", "", "Your first name")
	rootCmd.Flags().StringVar(&lastName, "last-name", "", "Your last name")

	// GitHub flags
	rootCmd.Flags().StringVar(&gheHost, "ghe-host", "", "GitHub Enterprise host")
	rootCmd.Flags().StringVar(&gheProtocol, "ghe-protocol", "https", "GitHub Enterprise protocol")
	rootCmd.Flags().StringVar(&ghOrg, "gh-org", "", "GitHub organization")

	// GitLab flags
	rootCmd.Flags().StringVar(&gitlabURL, "gitlab-url", "https://gitlab.com", "GitLab instance URL")
	rootCmd.Flags().StringVar(&gitlabToken, "gitlab-token", "", "GitLab Personal Access Token")

	// Other flags
	rootCmd.Flags().IntVar(&port, "port", 3000, "Port for local callback server")
}

func run(cmd *cobra.Command, args []string) error {
	// Validate VCS selection
	if !useGitHub && !useGitLab {
		return fmt.Errorf("you must specify either --github or --gitlab")
	}
	if useGitHub && useGitLab {
		return fmt.Errorf("you cannot use both --github and --gitlab")
	}

	fmt.Println("\n🚀 Terrateam Setup CLI")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

	cfg := &config.Config{
		Email:       email,
		FirstName:   firstName,
		LastName:    lastName,
		Port:        port,
		SkipTunnel:  skipTunnel,
		GHEHost:     gheHost,
		GHEProtocol: gheProtocol,
		GHOrg:       ghOrg,
		GitLabURL:   gitlabURL,
		GitLabToken: gitlabToken,
	}

	var err error
	if useGitHub {
		err = github.Setup(cfg)
	} else {
		err = gitlab.Setup(cfg)
	}

	if err != nil {
		return fmt.Errorf("setup failed: %w", err)
	}

	fmt.Println("\n✅ Setup Complete!")
	fmt.Println("\nNext Steps:")
	fmt.Println("  1. Review your .env file")
	fmt.Println("  2. Start Terrateam: npm start")
	if useGitHub {
		fmt.Println("  3. Install the GitHub App in your repositories")
	} else {
		fmt.Println("  3. Configure your GitLab webhooks")
	}
	fmt.Println()

	return nil
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
