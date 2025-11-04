package github

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"time"

	"github.com/terrateam/terrateam-setup/internal/config"
	"github.com/terrateam/terrateam-setup/internal/dotenv"
)

// AppManifest represents the GitHub App manifest
type AppManifest struct {
	Name        string                 `json:"name"`
	URL         string                 `json:"url"`
	Description string                 `json:"description"`
	Public      bool                   `json:"public"`
	RedirectURL string                 `json:"redirect_url"`
	HookAttributes map[string]string   `json:"hook_attributes"`
	DefaultPermissions map[string]string `json:"default_permissions"`
	DefaultEvents []string             `json:"default_events"`
}

// AppResponse represents the GitHub App creation response
type AppResponse struct {
	ID            int    `json:"id"`
	ClientID      string `json:"client_id"`
	ClientSecret  string `json:"client_secret"`
	WebhookSecret string `json:"webhook_secret"`
	PEM           string `json:"pem"`
	HTMLURL       string `json:"html_url"`
	Owner         struct {
		Login string `json:"login"`
	} `json:"owner"`
}

// Setup runs the GitHub setup flow
func Setup(cfg *config.Config) error {
	fmt.Println("🐙 GitHub App Setup\n")

	baseURL := fmt.Sprintf("http://127.0.0.1:%d", cfg.Port)

	// Create manifest
	manifest := createManifest(baseURL)
	manifestJSON, err := json.Marshal(manifest)
	if err != nil {
		return fmt.Errorf("failed to create manifest: %w", err)
	}

	// Determine GitHub URLs
	createAppURL := getCreateAppURL(cfg)

	fmt.Println("📝 Creating GitHub App...")
	fmt.Printf("\nSteps:\n")
	fmt.Printf("  1. Opening browser to create GitHub App\n")
	fmt.Printf("  2. Review permissions and click 'Create GitHub App'\n")
	fmt.Printf("  3. You'll be redirected back to complete setup\n\n")

	// Start local server
	appCode := make(chan string, 1)
	errChan := make(chan error, 1)

	server := startServer(cfg.Port, string(manifestJSON), createAppURL, appCode, errChan)
	defer server.Shutdown(context.Background())

	// Open browser
	localURL := fmt.Sprintf("http://127.0.0.1:%d/create-app", cfg.Port)
	fmt.Printf("Opening browser to: %s\n\n", localURL)

	if err := openBrowser(localURL); err != nil {
		fmt.Printf("Could not open browser automatically. Please visit:\n  %s\n\n", localURL)
	}

	// Wait for callback or timeout
	select {
	case code := <-appCode:
		fmt.Println("✓ GitHub App creation initiated\n")
		return completeSetup(cfg, code)
	case err := <-errChan:
		return fmt.Errorf("server error: %w", err)
	case <-time.After(10 * time.Minute):
		return fmt.Errorf("timeout waiting for GitHub App creation")
	}
}

func createManifest(baseURL string) *AppManifest {
	return &AppManifest{
		Name:        "terrateam",
		URL:         "https://terrateam.io/",
		Description: "Terrateam is the flexible GitOps orchestration engine for Terraform, OpenTofu, CDKTF, Terragrunt, and Pulumi.",
		Public:      false,
		RedirectURL: baseURL + "/callback",
		HookAttributes: map[string]string{
			"url": "https://terrateam.io",
		},
		DefaultPermissions: map[string]string{
			"actions":       "write",
			"checks":        "read",
			"contents":      "write",
			"issues":        "write",
			"metadata":      "read",
			"pull_requests": "write",
			"statuses":      "write",
			"members":       "read",
			"secrets":       "write",
			"emails":        "read",
			"workflows":     "write",
		},
		DefaultEvents: []string{
			"issue_comment",
			"issues",
			"pull_request",
			"pull_request_review",
			"pull_request_review_comment",
			"push",
			"workflow_job",
			"workflow_run",
		},
	}
}

func getCreateAppURL(cfg *config.Config) string {
	baseURL := cfg.GetGitHubBaseURL()
	if cfg.GHOrg != "" {
		return fmt.Sprintf("%s/organizations/%s/settings/apps/new", baseURL, cfg.GHOrg)
	}
	return fmt.Sprintf("%s/settings/apps/new", baseURL)
}

func startServer(port int, manifest, createAppURL string, appCode chan string, errChan chan error) *http.Server {
	mux := http.NewServeMux()

	// Serve manifest submission page
	mux.HandleFunc("/create-app", func(w http.ResponseWriter, r *http.Request) {
		html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
    <title>Create Terrateam GitHub App</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
        }
        .container {
            background: white;
            padding: 3rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 600px;
        }
        h1 { color: #2d3748; margin-bottom: 1rem; }
        p { color: #718096; line-height: 1.6; margin-bottom: 2rem; }
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 1rem 2rem;
            font-size: 1rem;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .btn:hover { background: #5568d3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Create Terrateam GitHub App</h1>
        <p>Click the button below to create your GitHub App. You'll be taken to GitHub to review and approve the app permissions.</p>
        <form action="%s" method="POST">
            <input type="hidden" name="manifest" value='%s'>
            <button type="submit" class="btn">Create GitHub App</button>
        </form>
    </div>
</body>
</html>`, createAppURL, manifest)
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(html))
	})

	// Handle callback
	mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		code := r.URL.Query().Get("code")
		if code == "" {
			http.Error(w, "Missing code parameter", http.StatusBadRequest)
			errChan <- fmt.Errorf("missing code parameter")
			return
		}

		html := `<!DOCTYPE html>
<html>
<head>
    <title>Success</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 3rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
        }
        h1 { color: #2d3748; }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">✅</div>
        <h1>GitHub App Created Successfully!</h1>
        <p>You can now close this window and return to the terminal.</p>
    </div>
</body>
</html>`
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(html))

		appCode <- code
	})

	server := &http.Server{
		Addr:    fmt.Sprintf("127.0.0.1:%d", port),
		Handler: mux,
	}

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errChan <- err
		}
	}()

	time.Sleep(500 * time.Millisecond) // Give server time to start
	return server
}

func completeSetup(cfg *config.Config, code string) error {
	fmt.Println("🔄 Exchanging code for app credentials...")

	// Convert code to app credentials
	appResp, err := exchangeCode(cfg, code)
	if err != nil {
		return fmt.Errorf("failed to exchange code: %w", err)
	}

	fmt.Printf("\n✓ GitHub App created successfully!\n")
	fmt.Printf("  App ID: %d\n", appResp.ID)
	fmt.Printf("  App URL: %s\n", appResp.HTMLURL)
	fmt.Printf("  Owner: %s\n", appResp.Owner.Login)

	// Write to .env
	env := dotenv.New()
	env.Set("GITHUB_APP_ID", fmt.Sprintf("%d", appResp.ID))
	env.Set("GITHUB_APP_CLIENT_ID", appResp.ClientID)
	env.Set("GITHUB_APP_CLIENT_SECRET", appResp.ClientSecret)
	env.Set("GITHUB_WEBHOOK_SECRET", appResp.WebhookSecret)
	env.Set("GITHUB_APP_PEM", appResp.PEM)
	env.Set("GITHUB_APP_URL", appResp.HTMLURL)

	if err := env.Write(); err != nil {
		return fmt.Errorf("failed to write .env: %w", err)
	}

	return env.Display()
}

func exchangeCode(cfg *config.Config, code string) (*AppResponse, error) {
	apiURL := cfg.GetGitHubAPIURL()
	url := fmt.Sprintf("%s/app-manifests/%s/conversions", apiURL, code)

	req, err := http.NewRequest("POST", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/vnd.github.v3+json")
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

	if resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("GitHub API error (%d): %s", resp.StatusCode, string(body))
	}

	var appResp AppResponse
	if err := json.Unmarshal(body, &appResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &appResp, nil
}

func openBrowser(url string) error {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "linux":
		cmd = exec.Command("xdg-open", url)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	default:
		return fmt.Errorf("unsupported platform")
	}

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Start()
}
