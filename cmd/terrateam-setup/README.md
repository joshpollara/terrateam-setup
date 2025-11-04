# Terrateam Setup CLI (Go)

⚡ **Lightning-fast setup for Terrateam in pure Go** - No dependencies, no prompts, just arguments.

A standalone CLI tool written in Go for setting up Terrateam with GitHub or GitLab. This is a complete rewrite focused on speed, simplicity, and zero interactive prompts.

## Features

- ⚡ **Blazing Fast** - Written in Go, compiles to a single binary
- 🚫 **No Interactive Prompts** - All configuration via command-line arguments
- 🐙 **GitHub Support** - Automatic GitHub App creation via manifest
- 🦊 **GitLab Support** - Personal Access Token (PAT) configuration
- 🔐 **Secure** - Credentials saved to local `.env` file
- 📦 **Single Binary** - No runtime dependencies
- 🎯 **CI/CD Ready** - Perfect for automation

## Installation

### Docker (Recommended)

No Go installation required! See [../../DOCKER.md](../../DOCKER.md) for detailed instructions.

From the repository root:
```bash
docker-compose build
docker-compose run --rm terrateam-setup --github
```

### Build from Source

```bash
cd cmd/terrateam-setup
go build -o terrateam-setup
```

### Install Globally

```bash
cd cmd/terrateam-setup
go install
```

## Usage

### GitHub Setup (Fastest)

```bash
./terrateam-setup --github
```

This will:
1. Open your browser to create a GitHub App
2. Wait for you to complete the creation
3. Save credentials to `.env`

### GitLab Setup

```bash
./terrateam-setup --gitlab --gitlab-token=glpat-xxxxxxxxxxxxxxxxxxxx
```

This will:
1. Validate your GitLab token
2. Generate webhook secret
3. Save credentials to `.env`
4. Show manual webhook setup instructions

## Command-Line Arguments

### Required Flags

You must specify **ONE** of:
- `--github` - Use GitHub as VCS provider
- `--gitlab` - Use GitLab as VCS provider

### GitHub Options

| Flag | Description | Default |
|------|-------------|---------|
| `--ghe-host` | GitHub Enterprise host | `github.com` |
| `--ghe-protocol` | GHE protocol (`http` or `https`) | `https` |
| `--gh-org` | GitHub organization name | - |

### GitLab Options

| Flag | Description | Default |
|------|-------------|---------|
| `--gitlab-url` | GitLab instance URL | `https://gitlab.com` |
| `--gitlab-token` | GitLab Personal Access Token | **Required** |

### Other Options

| Flag | Description | Default |
|------|-------------|---------|
| `--email` | Your email address | - |
| `--first-name` | Your first name | - |
| `--last-name` | Your last name | - |
| `--port` | Port for local callback server | `3000` |
| `--no-tunnel` | Skip tunnel configuration | `true` |
| `--help` | Show help message | - |
| `--version` | Show version | - |

## Examples

### Basic GitHub Setup

```bash
# Simplest form
./terrateam-setup --github

# With user info
./terrateam-setup --github \
  --email=you@company.com \
  --first-name=John \
  --last-name=Doe
```

### GitHub Enterprise

```bash
./terrateam-setup --github \
  --ghe-host=github.company.com \
  --ghe-protocol=https

# With organization
./terrateam-setup --github \
  --ghe-host=github.company.com \
  --gh-org=my-org
```

### GitLab.com

```bash
./terrateam-setup --gitlab \
  --gitlab-token=glpat-xxxxxxxxxxxxxxxxxxxx
```

### Self-Hosted GitLab

```bash
./terrateam-setup --gitlab \
  --gitlab-url=https://gitlab.company.com \
  --gitlab-token=glpat-xxxxxxxxxxxxxxxxxxxx
```

### Custom Port

```bash
# If port 3000 is in use
./terrateam-setup --github --port=3001
```

## How It Works

### GitHub Flow

1. Generates a GitHub App manifest
2. Starts a local web server on the specified port
3. Opens your browser to GitHub's app creation page
4. You review permissions and create the app
5. GitHub redirects back to the local server with a code
6. CLI exchanges code for app credentials
7. Credentials are saved to `.env` file

### GitLab Flow

1. Validates the provided Personal Access Token
2. Generates a secure webhook secret
3. Saves configuration to `.env` file
4. Displays manual webhook setup instructions

## Output

The CLI creates/updates a `.env` file in your current directory with:

### GitHub

```env
GITHUB_APP_ID=123456
GITHUB_APP_CLIENT_ID=Iv1.xxxxxxxxxxxx
GITHUB_APP_CLIENT_SECRET=xxxxxxxxxxxx
GITHUB_WEBHOOK_SECRET=xxxxxxxxxxxx
GITHUB_APP_PEM=-----BEGIN RSA PRIVATE KEY-----...
GITHUB_APP_URL=https://github.com/apps/your-app
```

### GitLab

```env
GITLAB_URL=https://gitlab.com
GITLAB_API_URL=https://gitlab.com/api/v4
GITLAB_PERSONAL_ACCESS_TOKEN=glpat-xxxxxxxxxxxx
GITLAB_WEBHOOK_SECRET=xxxxxxxxxxxx
GITLAB_BOT_USERNAME=your-username
```

## Requirements

- Go 1.21+ (for building)
- Internet connection
- GitHub or GitLab account with appropriate permissions

### GitLab Token Requirements

Your Personal Access Token must have these scopes:
- `api` - Full API access
- `read_repository` - Read repository data
- `write_repository` - Write to repository

Create one at: `https://gitlab.com/-/profile/personal_access_tokens`

## Troubleshooting

### Port Already in Use

```bash
./terrateam-setup --github --port=3001
```

### Browser Doesn't Open

The URL will be displayed in the terminal. Copy and paste it into your browser manually.

### GitHub App Creation Times Out

The CLI waits 10 minutes. If you need more time, just restart the command.

### GitLab Token Invalid

Ensure your token has the required scopes (`api`, `read_repository`, `write_repository`).

## Advantages Over Node.js Version

- ✅ **10x faster startup time** - No Node.js runtime needed
- ✅ **Single binary** - Easier distribution
- ✅ **Lower memory usage** - Go is more efficient
- ✅ **No npm install** - Just download and run
- ✅ **Better for CI/CD** - No external dependencies
- ✅ **Simpler codebase** - Easier to maintain

## Development

### Build

```bash
go build -o terrateam-setup
```

### Run Without Building

```bash
go run main.go --github
```

### Dependencies

```bash
go mod download
go mod tidy
```

## Architecture

```
cmd/terrateam-setup/
├── main.go                    # CLI entry point with Cobra
├── go.mod                     # Go module definition
├── internal/
│   ├── config/
│   │   └── config.go          # Configuration struct
│   ├── github/
│   │   └── app.go             # GitHub App creation logic
│   ├── gitlab/
│   │   └── config.go          # GitLab PAT configuration
│   └── dotenv/
│       └── writer.go          # .env file writer
└── README.md
```

## Why Go?

1. **Performance** - Compiled binary with no runtime overhead
2. **Simplicity** - No dependencies to install, just run
3. **Reliability** - Strong typing and excellent error handling
4. **Distribution** - Single binary for easy deployment
5. **CI/CD** - Perfect for automated pipelines

## License

ISC

## Support

- **Documentation:** https://terrateam.io/docs
- **Issues:** https://github.com/terrateamio/terrateam-setup/issues
