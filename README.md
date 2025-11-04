# Terrateam Setup CLI

⚡ **Lightning-fast setup for Terrateam** - Pure Go, zero dependencies, instant setup.

A standalone CLI tool for setting up Terrateam with GitHub or GitLab. Written in Go for maximum speed and simplicity.

## Quick Start

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

### Option 1: Docker (Recommended)

No Go installation required! See [DOCKER.md](DOCKER.md) for detailed instructions.

```bash
# Build the image
docker-compose build

# Run setup
docker-compose run --rm terrateam-setup --github
```

The `.env` file will be created in your current directory.

### Option 2: Build from Source

```bash
cd cmd/terrateam-setup
go build -o terrateam-setup
```

### Option 3: Run Without Building

```bash
cd cmd/terrateam-setup
go run main.go --github
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

### Docker (Option 1)
- Docker and Docker Compose
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
