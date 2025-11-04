# Terrateam Setup CLI

⚡ **Lightning-fast setup for Terrateam** - Pure Go, zero dependencies, instant setup.

A standalone CLI tool for setting up Terrateam with GitHub or GitLab. Written in Go for maximum speed and simplicity.

## Quick Start

### Fastest Way (Interactive Script)

```bash
./quick-start.sh
```

The script will guide you through the setup process with an interactive menu.

### Using Makefile

```bash
# GitHub setup
make docker-github

# GitLab setup
GITLAB_TOKEN=glpat-xxx make docker-gitlab
```

### Manual (Docker/Podman)

```bash
# Using helper script (recommended)
./docker-run.sh build
./docker-run.sh github

# Or using docker-compose (if available)
docker-compose build
docker-compose run --rm terrateam-setup --github
```

### Manual (Go)

```bash
cd cmd/terrateam-setup
go build -o terrateam-setup
./terrateam-setup --github
```

That's it! The CLI will open your browser to create a GitHub App, then save your credentials to `.env`.

## Features

- ⚡ **Blazing Fast** - Compiles to single binary, starts instantly
- 🚫 **No Prompts** - All configuration via command-line arguments
- 🐙 **GitHub Support** - Automatic GitHub App creation
- 🦊 **GitLab Support** - Personal Access Token configuration
- 📦 **Single Binary** - No runtime dependencies
- 🎯 **CI/CD Ready** - Perfect for automation

## Installation

### Option 1: Docker/Podman (Recommended)

No Go installation required! Works with both Docker and Podman. See [DOCKER.md](DOCKER.md) for detailed instructions.

```bash
# Using Makefile (easiest)
make docker-build
make docker-github

# Or using helper script directly
./docker-run.sh build
./docker-run.sh github

# Or using docker-compose (if compatible)
docker-compose build
docker-compose run --rm terrateam-setup --github
```

The `.env` file will be created in your current directory.

### Option 2: Using Makefile (Local Build)

```bash
# Build and run in one command
make run-github

# Or build separately
make build
./terrateam-setup --github
```

### Option 3: Build from Source Manually

```bash
cd cmd/terrateam-setup
go build -o ../../terrateam-setup
cd ../..
./terrateam-setup --github
```

## Usage

### GitHub

```bash
# Basic setup
./terrateam-setup --github

# GitHub Enterprise
./terrateam-setup --github --ghe-host github.company.com

# With organization
./terrateam-setup --github --gh-org my-org
```

### GitLab

```bash
# GitLab.com
./terrateam-setup --gitlab --gitlab-token glpat-xxxxxxxxxxxxxxxxxxxx

# Self-hosted GitLab
./terrateam-setup --gitlab \
  --gitlab-url https://gitlab.company.com \
  --gitlab-token glpat-xxxxxxxxxxxxxxxxxxxx
```

## Documentation

- **[Docker Usage](DOCKER.md)** - Running with Docker (recommended)
- **[CLI Documentation](cmd/terrateam-setup/README.md)** - Comprehensive CLI guide

Additional topics covered:
- All available flags
- GitHub Enterprise setup
- GitLab configuration
- Troubleshooting
- Architecture details

## Requirements

### Docker/Podman (Option 1)
- Docker OR Podman (with docker-run.sh script)
- Internet connection
- GitHub or GitLab account

### Building from Source (Options 2-3)
- Go 1.21+
- Internet connection
- GitHub or GitLab account

## Output

Creates a `.env` file with all necessary credentials for running Terrateam.

## Why Go?

- **10x faster** than Node.js version
- **Single binary** - no npm install needed
- **Lower memory** - more efficient
- **No dependencies** - self-contained
- **Better for CI/CD** - perfect for automation

## License

ISC

## Support

- **Documentation:** https://terrateam.io/docs
- **Issues:** https://github.com/terrateamio/terrateam-setup/issues
