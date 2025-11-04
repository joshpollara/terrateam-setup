package config

// Config holds all configuration for the setup process
type Config struct {
	// User information
	Email     string
	FirstName string
	LastName  string

	// Server configuration
	Port int

	// Tunnel configuration
	SkipTunnel bool

	// GitHub configuration
	GHEHost     string
	GHEProtocol string
	GHOrg       string

	// GitLab configuration
	GitLabURL   string
	GitLabToken string
}

// GetGitHubHost returns the GitHub host (enterprise or github.com)
func (c *Config) GetGitHubHost() string {
	if c.GHEHost != "" {
		return c.GHEHost
	}
	return "github.com"
}

// GetGitHubProtocol returns the GitHub protocol
func (c *Config) GetGitHubProtocol() string {
	if c.GHEProtocol != "" {
		return c.GHEProtocol
	}
	return "https"
}

// GetGitHubBaseURL returns the full GitHub base URL
func (c *Config) GetGitHubBaseURL() string {
	return c.GetGitHubProtocol() + "://" + c.GetGitHubHost()
}

// GetGitHubAPIURL returns the GitHub API URL
func (c *Config) GetGitHubAPIURL() string {
	if c.GHEHost != "" {
		return c.GetGitHubBaseURL() + "/api/v3"
	}
	return "https://api.github.com"
}

// GetGitLabAPIURL returns the GitLab API URL
func (c *Config) GetGitLabAPIURL() string {
	return c.GitLabURL + "/api/v4"
}
