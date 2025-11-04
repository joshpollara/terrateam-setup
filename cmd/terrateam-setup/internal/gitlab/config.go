package gitlab

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/terrateam/terrateam-setup/internal/config"
	"github.com/terrateam/terrateam-setup/internal/dotenv"
)

// User represents a GitLab user
type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Name     string `json:"name"`
}

// Setup runs the GitLab setup flow
func Setup(cfg *config.Config) error {
	fmt.Println("🦊 GitLab Setup\n")

	if cfg.GitLabToken == "" {
		return fmt.Errorf("--gitlab-token is required for GitLab setup")
	}

	fmt.Printf("GitLab URL: %s\n", cfg.GitLabURL)
	fmt.Println("\n🔍 Validating Personal Access Token...")

	// Validate token
	user, err := validateToken(cfg)
	if err != nil {
		return fmt.Errorf("token validation failed: %w", err)
	}

	fmt.Printf("✓ Token validated! Authenticated as: %s\n", user.Username)

	// Generate webhook secret
	webhookSecret, err := generateWebhookSecret()
	if err != nil {
		return fmt.Errorf("failed to generate webhook secret: %w", err)
	}

	fmt.Println("\n✓ Generated webhook secret")

	// Write to .env
	env := dotenv.New()
	env.Set("GITLAB_URL", cfg.GitLabURL)
	env.Set("GITLAB_API_URL", cfg.GetGitLabAPIURL())
	env.Set("GITLAB_PERSONAL_ACCESS_TOKEN", cfg.GitLabToken)
	env.Set("GITLAB_WEBHOOK_SECRET", webhookSecret)
	env.Set("GITLAB_BOT_USERNAME", user.Username)

	if err := env.Write(); err != nil {
		return fmt.Errorf("failed to write .env: %w", err)
	}

	if err := env.Display(); err != nil {
		return err
	}

	// Display manual setup instructions
	displayManualInstructions(cfg, webhookSecret)

	return nil
}

func validateToken(cfg *config.Config) (*User, error) {
	url := cfg.GetGitLabAPIURL() + "/user"

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("PRIVATE-TOKEN", cfg.GitLabToken)
	req.Header.Set("User-Agent", "Terrateam-Setup-CLI")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitLab API error (%d): %s", resp.StatusCode, string(body))
	}

	var user User
	if err := json.Unmarshal(body, &user); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &user, nil
}

func generateWebhookSecret() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func displayManualInstructions(cfg *config.Config, webhookSecret string) {
	fmt.Println("\n⚠️  Manual Setup Required\n")
	fmt.Println("GitLab does not support automatic webhook creation via API.")
	fmt.Println("You must manually configure webhooks for each project:\n")

	webhookURL := "https://your-terrateam-url/webhooks/gitlab"

	fmt.Println("Steps:")
	fmt.Println("  1. Go to your GitLab project")
	fmt.Println("  2. Navigate to: Settings > Webhooks")
	fmt.Printf("  3. Add webhook URL: %s\n", webhookURL)
	fmt.Printf("  4. Set Secret Token: %s\n", webhookSecret)
	fmt.Println("  5. Enable these triggers:")
	fmt.Println("     • Issues events")
	fmt.Println("     • Merge request events")
	fmt.Println("     • Push events")
	fmt.Println("     • Pipeline events")
	fmt.Println("     • Note events (comments)")
	fmt.Println()
}
