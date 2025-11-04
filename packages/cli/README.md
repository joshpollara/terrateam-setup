# Terrateam Setup CLI

A standalone command-line interface for setting up Terrateam with GitHub or GitLab. This CLI provides an interactive wizard that guides you through the entire setup process without requiring a web browser interface.

## Features

- 🚀 **Interactive Setup Wizard** - Step-by-step prompts for easy configuration
- 🐙 **GitHub Support** - Automatic GitHub App creation via manifest
- 🦊 **GitLab Support** - Personal Access Token (PAT) configuration
- 🌐 **Tunnel Integration** - Optional Terratunnel configuration for webhook delivery
- 🔐 **Secure** - Credentials saved to local `.env` file
- 🎨 **Beautiful UI** - Colorful terminal output with progress indicators
- 🔄 **Development Mode** - Mock data for testing without real app creation

## Installation

### From the terrateam-setup repository:

```bash
cd packages/cli
npm install
```

### Global installation (optional):

```bash
cd packages/cli
npm link
```

After linking globally, you can run `terrateam-setup` from anywhere.

## Usage

### Basic Usage

```bash
# From the CLI directory
npm start

# Or if installed globally
terrateam-setup
```

### With Environment Variables

```bash
# Development mode (uses mock data)
TERRATEAM_DEV_MODE=true npm start

# GitHub Enterprise
GHE_HOST=github.company.com GHE_PROTOCOL=https npm start
```

## Setup Flow

The CLI guides you through these steps:

### 1. User Information (Optional)
- First Name
- Last Name
- Email
- Onboarding call preference
- Telemetry opt-in/out

### 2. VCS Provider Selection
Choose between:
- **GitHub** - Creates a GitHub App automatically
- **GitLab** - Configures with Personal Access Token

### 3. Tunnel Configuration (Optional)
- OAuth authentication with GitHub/GitLab
- Automatic tunnel provisioning via Terratunnel
- Webhook URL generation

### 4. Platform-Specific Setup

#### GitHub Flow:
- GitHub Enterprise Server support (optional)
- Browser-based GitHub App creation
- Automatic credential retrieval
- `.env` file generation with:
  - `GITHUB_APP_ID`
  - `GITHUB_APP_PEM`
  - `GITHUB_WEBHOOK_SECRET`
  - `GITHUB_APP_CLIENT_ID`
  - `GITHUB_APP_CLIENT_SECRET`
  - `GITHUB_APP_URL`
  - `TERRATUNNEL_API_KEY` (if tunnel configured)
  - `TERRAT_UI_BASE` (if tunnel configured)
  - `TERRAT_WEB_BASE_URL` (if tunnel configured)

#### GitLab Flow:
- GitLab.com or self-hosted support
- Personal Access Token validation
- Webhook secret generation
- `.env` file generation with:
  - `GITLAB_URL`
  - `GITLAB_API_URL`
  - `GITLAB_PERSONAL_ACCESS_TOKEN`
  - `GITLAB_WEBHOOK_SECRET`
  - `GITLAB_BOT_USERNAME`
  - `TERRATUNNEL_API_KEY` (if tunnel configured)
  - `TERRAT_UI_BASE` (if tunnel configured)
  - `TERRAT_WEB_BASE_URL` (if tunnel configured)

### 5. Success Screen
- Displays configuration summary
- Shows next steps
- Provides webhook URLs (if applicable)

## Environment Variables

### General

| Variable | Description | Default |
|----------|-------------|---------|
| `TERRATEAM_DEV_MODE` | Enable development mode with mock data | `false` |
| `PORT` | Port for local callback server | `3000` |

### GitHub Enterprise

| Variable | Description | Example |
|----------|-------------|---------|
| `GHE_HOST` | GitHub Enterprise hostname | `github.company.com` |
| `GHE_PROTOCOL` | Protocol for GHE | `https` |
| `GH_ORG` | Organization name (optional) | `my-org` |
| `GITHUB_API_BASE_URL` | Custom GitHub API URL | `https://github.company.com/api/v3` |
| `GITHUB_WEB_BASE_URL` | Custom GitHub web URL | `https://github.company.com` |

## Development Mode

For testing without creating real GitHub Apps or GitLab configurations:

```bash
TERRATEAM_DEV_MODE=true npm start
```

In development mode:
- Mock GitHub App credentials are generated
- Mock tunnel configuration is created
- No actual API calls to GitHub/GitLab
- `.env` file is still updated with mock values

## Requirements

### System Requirements
- Node.js >= 10.21
- Terminal with ANSI color support
- Internet connection

### GitHub Setup Requirements
- GitHub account with permission to create apps
- Organization admin rights (if creating org-level app)

### GitLab Setup Requirements
- GitLab account (GitLab.com or self-hosted)
- Permission to create Personal Access Tokens
- Required PAT scopes:
  - `api` - Full API access
  - `read_repository` - Read repository data
  - `write_repository` - Write to repository

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, set a different port:
```bash
PORT=3001 npm start
```

### OAuth Timeout
The OAuth flow times out after 10 minutes for GitHub App creation and 5 minutes for tunnel configuration. If you hit the timeout, simply restart the CLI and try again.

### Browser Not Opening
If the browser doesn't open automatically, you can manually copy the URL from the terminal and paste it into your browser.

### GitHub App Creation Failed
- Verify you have permission to create apps in your GitHub account/organization
- Check that your GHE environment variables are correct (if using GHE)
- Ensure you're not behind a firewall blocking GitHub API access

### GitLab Token Validation Failed
- Verify the token has the required scopes (`api`, `read_repository`, `write_repository`)
- Check that the GitLab URL is correct (for self-hosted instances)
- Ensure the token hasn't expired

### Tunnel Configuration Failed
- Check your internet connection
- Verify you can access `tunnel.terrateam.dev`
- Try skipping tunnel configuration and setting it up later

## Output

The CLI creates/updates a `.env` file in your current working directory with all the necessary credentials. This file should be:
- Added to `.gitignore` to prevent committing secrets
- Backed up securely
- Kept in the root of your Terrateam deployment

## Next Steps After Setup

### For GitHub:
1. Review your `.env` file
2. Start Terrateam: `npm start`
3. Install the GitHub App in your repositories
4. Configure repository settings as needed

### For GitLab:
1. Review your `.env` file
2. Start Terrateam: `npm start`
3. Manually configure webhooks in each GitLab project:
   - Go to Project Settings > Webhooks
   - Add webhook URL (displayed in CLI output)
   - Set secret token (displayed in CLI output)
   - Enable required event triggers

## Architecture

```
packages/cli/
├── bin/
│   └── terrateam-setup.js       # CLI entry point
├── lib/
│   ├── cli.js                   # Main CLI logic and flow
│   ├── github-setup.js          # GitHub App creation
│   ├── github-manifest.js       # GitHub manifest and API
│   ├── gitlab-setup.js          # GitLab PAT configuration
│   ├── tunnel-config.js         # Terratunnel OAuth flow
│   └── telemetry.js             # Telemetry reporting
├── package.json
└── README.md
```

## Dependencies

- **inquirer** - Interactive command-line prompts
- **chalk** - Terminal string styling
- **ora** - Elegant terminal spinners
- **open** - Opens URLs in the browser
- **express** - Local callback server for OAuth
- **update-dotenv** - Safely update .env files
- **js-yaml** - YAML parsing for app.yml

## License

ISC

## Support

For issues and questions:
- GitHub Issues: https://github.com/terrateamio/terrateam-setup/issues
- Documentation: https://terrateam.io/docs
