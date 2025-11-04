# Terrateam Setup CLI - Usage Examples

This file provides real-world examples of using the CLI with command-line arguments for fast, streamlined setup.

## Table of Contents

- [Quick Start Examples](#quick-start-examples)
- [GitHub Examples](#github-examples)
- [GitLab Examples](#gitlab-examples)
- [Advanced Examples](#advanced-examples)
- [Non-Interactive Mode](#non-interactive-mode)

## Quick Start Examples

### Fastest Path - GitHub with No Tunnel

```bash
terrateam-setup --github --no-tunnel --no-telemetry
```

This skips all optional steps and gets you set up in seconds.

### GitLab with Token

```bash
terrateam-setup --gitlab --gitlab-token=glpat-xxxxxxxxxxxx --no-tunnel
```

Provide your GitLab token directly for instant setup.

### With User Information

```bash
terrateam-setup --github --no-tunnel \
  --email=you@company.com \
  --first-name=John \
  --last-name=Doe
```

## GitHub Examples

### Basic GitHub Setup

```bash
# Interactive mode (prompts for remaining info)
terrateam-setup --github

# Skip tunnel configuration
terrateam-setup --github --no-tunnel

# Skip telemetry
terrateam-setup --github --no-telemetry
```

### GitHub Enterprise Setup

```bash
# GitHub Enterprise with all options
terrateam-setup --github \
  --ghe-host=github.company.com \
  --ghe-protocol=https \
  --gh-org=my-org \
  --no-tunnel

# GHE with custom port
terrateam-setup --github \
  --ghe-host=github.internal:8443 \
  --port=3001 \
  --no-tunnel
```

### GitHub with Onboarding

```bash
terrateam-setup --github \
  --no-tunnel \
  --email=you@company.com \
  --onboarding-call
```

## GitLab Examples

### Basic GitLab Setup

```bash
# GitLab.com with PAT
terrateam-setup --gitlab \
  --gitlab-token=glpat-xxxxxxxxxxxxxxxxxxxx \
  --no-tunnel

# Self-hosted GitLab
terrateam-setup --gitlab \
  --gitlab-url=https://gitlab.company.com \
  --gitlab-token=glpat-xxxxxxxxxxxxxxxxxxxx \
  --no-tunnel
```

### GitLab with User Info

```bash
terrateam-setup --gitlab \
  --gitlab-url=https://gitlab.company.com \
  --gitlab-token=glpat-xxxxxxxxxxxxxxxxxxxx \
  --email=you@company.com \
  --first-name=Jane \
  --last-name=Smith \
  --no-tunnel
```

## Advanced Examples

### Full Configuration - GitHub

```bash
terrateam-setup --github \
  --ghe-host=github.company.com \
  --ghe-protocol=https \
  --gh-org=engineering \
  --email=devops@company.com \
  --first-name=DevOps \
  --last-name=Team \
  --onboarding-call \
  --port=3000 \
  --no-tunnel
```

### Full Configuration - GitLab

```bash
terrateam-setup --gitlab \
  --gitlab-url=https://gitlab.company.com \
  --gitlab-token=glpat-xxxxxxxxxxxxxxxxxxxx \
  --email=devops@company.com \
  --first-name=DevOps \
  --last-name=Team \
  --onboarding-call \
  --no-tunnel
```

### With Tunnel (Requires OAuth)

```bash
# Enable tunnel configuration
terrateam-setup --github \
  --tunnel \
  --email=you@company.com

# Note: This will open browser for OAuth authentication
```

## Non-Interactive Mode

Non-interactive mode uses sensible defaults for all prompts and requires all necessary arguments to be provided.

### GitHub Non-Interactive

```bash
# Minimum required arguments
terrateam-setup --non-interactive --github --no-tunnel

# With user information
terrateam-setup --non-interactive \
  --github \
  --no-tunnel \
  --email=ci-cd@company.com \
  --first-name=CI \
  --last-name=Bot \
  --no-telemetry
```

### GitLab Non-Interactive

```bash
# Minimum required arguments
terrateam-setup --non-interactive \
  --gitlab \
  --gitlab-token=glpat-xxxxxxxxxxxxxxxxxxxx \
  --no-tunnel

# With custom URL
terrateam-setup --non-interactive \
  --gitlab \
  --gitlab-url=https://gitlab.company.com \
  --gitlab-token=glpat-xxxxxxxxxxxxxxxxxxxx \
  --no-tunnel \
  --no-telemetry
```

### GitHub Enterprise Non-Interactive

```bash
terrateam-setup --non-interactive \
  --github \
  --ghe-host=github.company.com \
  --ghe-protocol=https \
  --gh-org=platform \
  --no-tunnel \
  --no-telemetry
```

## CI/CD Pipeline Examples

### GitHub Actions

```yaml
- name: Setup Terrateam
  run: |
    terrateam-setup --non-interactive \
      --github \
      --no-tunnel \
      --no-telemetry \
      --email=${{ secrets.TEAM_EMAIL }}
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### GitLab CI

```yaml
setup_terrateam:
  script:
    - |
      terrateam-setup --non-interactive \
        --gitlab \
        --gitlab-token=$GITLAB_TOKEN \
        --gitlab-url=$CI_SERVER_URL \
        --no-tunnel \
        --no-telemetry
```

### Docker

```dockerfile
RUN terrateam-setup --non-interactive \
    --github \
    --no-tunnel \
    --no-telemetry
```

## Environment Variables

You can also use environment variables in combination with flags:

```bash
# Set environment variables
export GITHUB_CLIENT_ID=xxx
export GITHUB_CLIENT_SECRET=yyy
export PORT=3001

# Run setup
terrateam-setup --github --no-tunnel
```

## Development Mode

Test the CLI without creating real apps:

```bash
# GitHub dev mode
TERRATEAM_DEV_MODE=true terrateam-setup --github --no-tunnel

# GitLab dev mode
TERRATEAM_DEV_MODE=true terrateam-setup --gitlab --no-tunnel
```

## Getting Help

```bash
# Show all available options
terrateam-setup --help

# Show version
terrateam-setup --version
```

## Tips and Tricks

### 1. Fastest Setup (GitHub)
```bash
terrateam-setup --github --no-tunnel --no-telemetry
```
This is the absolute fastest way - skips all optional prompts.

### 2. For Automation
```bash
terrateam-setup --non-interactive --github --no-tunnel --no-telemetry
```
Perfect for scripts and CI/CD - never prompts for input.

### 3. For Testing
```bash
TERRATEAM_DEV_MODE=true terrateam-setup --github --no-tunnel
```
Uses mock data - no real apps created.

### 4. Save Common Configurations
```bash
# Save as alias
alias terrateam-setup-gh='terrateam-setup --github --ghe-host=github.company.com --no-tunnel'

# Use it
terrateam-setup-gh
```

### 5. Chain with Other Commands
```bash
# Setup and immediately start
terrateam-setup --github --no-tunnel --no-telemetry && npm start

# Setup with error handling
terrateam-setup --github --no-tunnel || echo "Setup failed!"
```

## Common Patterns

### For Individuals

```bash
terrateam-setup --github --no-tunnel
```

### For Teams

```bash
terrateam-setup --github \
  --gh-org=my-organization \
  --email=team@company.com \
  --no-tunnel
```

### For Enterprises

```bash
terrateam-setup --github \
  --ghe-host=github.enterprise.com \
  --ghe-protocol=https \
  --gh-org=platform-team \
  --email=devops@enterprise.com \
  --onboarding-call \
  --no-tunnel
```

### For Self-Hosted GitLab

```bash
terrateam-setup --gitlab \
  --gitlab-url=https://gitlab.internal.com \
  --gitlab-token=$GITLAB_PAT \
  --no-tunnel
```

## Troubleshooting

### Port Already in Use

```bash
terrateam-setup --github --no-tunnel --port=3001
```

### Need More Time for GitHub App Creation

The CLI waits 10 minutes for you to create the GitHub App. If you need more time, the process will timeout and you can restart.

### Skipped Something by Accident?

Just run the command again - it will update your `.env` file.
