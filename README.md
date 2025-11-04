# terrateam-setup

Setup wizard for Terrateam - the flexible GitOps orchestration engine for Terraform, OpenTofu, CDKTF, Terragrunt, and Pulumi.

This repository provides **two ways** to set up Terrateam with your GitHub or GitLab instance:

1. **Web UI** - Browser-based setup wizard (original)
2. **CLI** - Terminal-based interactive setup (new!)

## Quick Start

### Option 1: Web UI Setup (Browser-based)

```bash
npm install
npm start
```

Then open your browser to `http://localhost:3000/probot` and follow the interactive wizard.

### Option 2: CLI Setup (Terminal-based)

```bash
cd packages/cli
npm install
npm start
```

Follow the interactive prompts in your terminal.

## Features

Both setup methods provide the same functionality:

- ✅ **GitHub App Creation** - Automatic GitHub App setup via manifest
- ✅ **GitLab Configuration** - Personal Access Token (PAT) setup
- ✅ **Tunnel Integration** - Optional Terratunnel for webhook delivery
- ✅ **Enterprise Support** - GitHub Enterprise Server and self-hosted GitLab
- ✅ **Development Mode** - Test without creating real apps
- ✅ **Telemetry Options** - Optional usage reporting

## When to Use Which?

### Use the Web UI if:
- You prefer a visual interface
- You're setting up multiple instances
- You want to share the setup process with team members
- You're deploying to a server with a web interface

### Use the CLI if:
- You prefer terminal-based workflows
- You're automating setup as part of a script
- You're working in a headless environment
- You want a faster, keyboard-driven experience

## Web UI Setup

### Installation

```bash
npm install
```

### Running

```bash
# Production mode
npm start

# Development mode (bypasses GitHub App creation)
TERRATEAM_DEV_MODE=true npm start

# With GitHub OAuth credentials
GITHUB_CLIENT_ID=your_client_id GITHUB_CLIENT_SECRET=your_secret npm start
```

### UI Flow

1. **Welcome Screen** (`/probot`) - User info and telemetry preferences
2. **VCS Selection** (`/probot/vcs-selection`) - Choose GitHub or GitLab
3. **Tunnel Configuration** (`/probot/tunnel-config`) - Optional tunnel setup with OAuth
4. **App Setup** - GitHub App creation or GitLab PAT configuration
5. **Success Screen** - Credentials display and next steps

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TERRATEAM_DEV_MODE` | Enable development mode | `false` |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | - |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | - |
| `GHE_HOST` | GitHub Enterprise hostname | - |
| `GHE_PROTOCOL` | GHE protocol | `https` |
| `GH_ORG` | GitHub organization | - |

## CLI Setup

### Installation

```bash
cd packages/cli
npm install
```

### Running

```bash
# Standard mode
npm start

# Development mode (mock data)
TERRATEAM_DEV_MODE=true npm start

# With custom port
PORT=3001 npm start
```

### CLI Flow

The CLI provides an interactive wizard with:
- Colored output and progress indicators
- Input validation
- Browser integration for OAuth flows
- Automatic `.env` file generation

See [`packages/cli/README.md`](packages/cli/README.md) for detailed CLI documentation.

## Project Structure

```
terrateam-setup/
├── packages/
│   ├── cli/                    # 🆕 Standalone CLI tool
│   │   ├── bin/                # CLI entry point
│   │   ├── lib/                # CLI implementation
│   │   │   ├── cli.js          # Main CLI logic
│   │   │   ├── github-setup.js # GitHub App creation
│   │   │   ├── gitlab-setup.js # GitLab configuration
│   │   │   ├── tunnel-config.js# Tunnel OAuth flow
│   │   │   └── telemetry.js    # Telemetry reporting
│   │   └── package.json
│   └── probot/                 # Modified Probot framework (Web UI)
│       ├── lib/
│       │   ├── apps/
│       │   │   └── setup.js    # Web UI routes and logic
│       │   └── manifest-creation.js
│       ├── views/              # Handlebars templates
│       └── static/             # CSS and assets
├── app.yml                     # GitHub App manifest template
├── index.js                    # Web UI entry point
└── package.json
```

## Development

### Working with the Web UI

```bash
# Start with hot reload
npm start

# Access development helper
TERRATEAM_DEV_MODE=true npm start
# Then visit http://localhost:3000/probot/dev
```

### Working with the CLI

```bash
cd packages/cli

# Build (no TypeScript compilation needed - pure JavaScript)
npm run build

# Test in development mode
TERRATEAM_DEV_MODE=true npm start
```

### Working in the Probot Package

```bash
cd packages/probot

npm run build      # Compile TypeScript
npm run test       # Run tests
npm run lint       # Check formatting
npm run lint:fix   # Auto-fix formatting
```

## Output

Both setup methods create a `.env` file in your working directory with credentials:

### GitHub Output
```env
GITHUB_APP_ID=123456
GITHUB_APP_PEM=-----BEGIN RSA PRIVATE KEY-----...
GITHUB_WEBHOOK_SECRET=...
GITHUB_APP_CLIENT_ID=...
GITHUB_APP_CLIENT_SECRET=...
GITHUB_APP_URL=https://github.com/apps/your-app
TERRATUNNEL_API_KEY=...              # If tunnel configured
TERRAT_UI_BASE=https://...           # If tunnel configured
TERRAT_WEB_BASE_URL=https://...      # If tunnel configured
```

### GitLab Output
```env
GITLAB_URL=https://gitlab.com
GITLAB_API_URL=https://gitlab.com/api/v4
GITLAB_PERSONAL_ACCESS_TOKEN=...
GITLAB_WEBHOOK_SECRET=...
GITLAB_BOT_USERNAME=...
TERRATUNNEL_API_KEY=...              # If tunnel configured
TERRAT_UI_BASE=https://...           # If tunnel configured
TERRAT_WEB_BASE_URL=https://...      # If tunnel configured
```

**Important:** Add `.env` to your `.gitignore` to prevent committing secrets!

## Next Steps After Setup

### For GitHub:
1. Review your `.env` file
2. Start Terrateam: `npm start` (or deploy to your infrastructure)
3. Install the GitHub App in your repositories
4. Configure Terrateam settings in your repositories

### For GitLab:
1. Review your `.env` file
2. Start Terrateam: `npm start` (or deploy to your infrastructure)
3. Configure webhooks in each GitLab project (see setup output for details)
4. Configure Terrateam settings in your repositories

## Telemetry

Both setup methods include optional telemetry to help improve Terrateam:
- **Opt-in by default** during setup
- Sends anonymous usage data to `https://telemetry.terrateam.io`
- Includes: email (optional), GitHub/GitLab username, setup method
- **You can opt-out** during setup or by not providing information

## Troubleshooting

### Port Already in Use
```bash
# Web UI
PORT=3001 npm start

# CLI
PORT=3001 npm start
```

### Development Mode Issues
Make sure to set the environment variable before starting:
```bash
TERRATEAM_DEV_MODE=true npm start
```

### OAuth/Callback Issues
- Ensure the callback port is not blocked by firewall
- Check that you can access localhost in your browser
- Verify no other services are using the same port

### More Help
- **CLI-specific issues:** See [`packages/cli/README.md`](packages/cli/README.md)
- **UI-specific issues:** Check the browser console and server logs
- **General issues:** Review [`CLAUDE.md`](CLAUDE.md) for development patterns

## Requirements

- Node.js >= 10.21
- Internet connection
- GitHub or GitLab account with appropriate permissions

## Architecture

This is a monorepo application:
- **Root package** - Delegates to Probot package for Web UI
- **packages/probot** - Modified Probot framework (v12.3.0) for Web UI
- **packages/cli** - Standalone CLI tool (new in this release)

Both tools share similar logic but are completely independent - you can use either one without the other.

## License

ISC

## Support

- **Documentation:** https://terrateam.io/docs
- **Issues:** https://github.com/terrateamio/terrateam-setup/issues
- **Community:** https://terrateam.io/community

## Contributing

See [`CLAUDE.md`](CLAUDE.md) for development guidelines and architecture details.
