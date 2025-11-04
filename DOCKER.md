# Running terrateam-setup with Docker

This guide explains how to run the terrateam-setup CLI using Docker while ensuring the `.env` file is written to your host machine.

## Prerequisites

- Docker installed and running
- Docker Compose (optional, but recommended)
- Access to a web browser on your host machine

## Quick Start

### Using Docker Compose (Recommended)

1. **Build the image:**
   ```bash
   docker-compose build
   ```

2. **Run setup for GitHub:**
   ```bash
   docker-compose run --rm terrateam-setup --github
   ```

3. **Run setup for GitLab:**
   ```bash
   docker-compose run --rm terrateam-setup --gitlab --gitlab-url https://gitlab.com --gitlab-token YOUR_TOKEN
   ```

The `.env` file will be created in your current directory on the host machine.

### Using Docker CLI

1. **Build the image:**
   ```bash
   docker build -t terrateam-setup .
   ```

2. **Run setup for GitHub:**
   ```bash
   docker run --rm -it \
     --network host \
     -v "$(pwd):/output" \
     -w /output \
     terrateam-setup --github
   ```

3. **Run setup for GitLab:**
   ```bash
   docker run --rm -it \
     --network host \
     -v "$(pwd):/output" \
     -w /output \
     terrateam-setup --gitlab --gitlab-url https://gitlab.com --gitlab-token YOUR_TOKEN
   ```

## Important Notes

### Network Mode

The `--network host` flag is **required** for the OAuth flow to work correctly. This is because:

1. The CLI starts a local web server to handle OAuth callbacks
2. Your browser needs to connect to `http://localhost:3000` (or custom port)
3. Host networking allows the container to bind to localhost ports accessible from your host browser

### Volume Mounting

The `-v "$(pwd):/output"` flag mounts your current directory into the container, ensuring:

- The `.env` file is written to your host machine (not inside the container)
- The file persists after the container exits
- You can immediately use the credentials

### Working Directory

The `-w /output` flag sets the working directory inside the container to the mounted volume, so the `.env` file is created in the right location.

## Complete Examples

### GitHub Setup (All Options)

```bash
docker run --rm -it \
  --network host \
  -v "$(pwd):/output" \
  -w /output \
  terrateam-setup \
  --github \
  --port 3000 \
  --email your@email.com \
  --first-name "Your" \
  --last-name "Name"
```

With Docker Compose:
```bash
docker-compose run --rm terrateam-setup \
  --github \
  --port 3000 \
  --email your@email.com \
  --first-name "Your" \
  --last-name "Name"
```

### GitHub Enterprise Setup

```bash
docker run --rm -it \
  --network host \
  -v "$(pwd):/output" \
  -w /output \
  terrateam-setup \
  --github \
  --ghe-host github.mycompany.com \
  --ghe-protocol https
```

With Docker Compose:
```bash
docker-compose run --rm terrateam-setup \
  --github \
  --ghe-host github.mycompany.com \
  --ghe-protocol https
```

### GitLab Setup

```bash
docker run --rm -it \
  --network host \
  -v "$(pwd):/output" \
  -w /output \
  terrateam-setup \
  --gitlab \
  --gitlab-url https://gitlab.com \
  --gitlab-token glpat-xxxxxxxxxxxxxxxxxxxx
```

With Docker Compose:
```bash
docker-compose run --rm terrateam-setup \
  --gitlab \
  --gitlab-url https://gitlab.com \
  --gitlab-token glpat-xxxxxxxxxxxxxxxxxxxx
```

### Self-Hosted GitLab

```bash
docker run --rm -it \
  --network host \
  -v "$(pwd):/output" \
  -w /output \
  terrateam-setup \
  --gitlab \
  --gitlab-url https://gitlab.mycompany.com \
  --gitlab-token glpat-xxxxxxxxxxxxxxxxxxxx
```

## Custom Port

If port 3000 is already in use on your host:

```bash
docker run --rm -it \
  --network host \
  -v "$(pwd):/output" \
  -w /output \
  terrateam-setup \
  --github \
  --port 8080
```

Then access the OAuth callback at `http://localhost:8080`.

## Troubleshooting

### Browser Can't Connect to OAuth Callback

**Problem:** Browser shows "connection refused" when redirected after GitHub App creation.

**Solution:** Make sure you're using `--network host` mode. Without it, the container's localhost is different from your host machine's localhost.

### .env File Not Created

**Problem:** The `.env` file doesn't appear on your host machine.

**Solutions:**
1. Verify the volume mount: `-v "$(pwd):/output"`
2. Verify the working directory: `-w /output`
3. Check file permissions on your current directory
4. On Windows, use `${PWD}` instead of `$(pwd)` in PowerShell

### Permission Denied on Linux

**Problem:** `.env` file is created but owned by root.

**Solution:** Add user mapping to the docker run command:
```bash
docker run --rm -it \
  --network host \
  --user $(id -u):$(id -g) \
  -v "$(pwd):/output" \
  -w /output \
  terrateam-setup --github
```

With Docker Compose, add to `docker-compose.yml`:
```yaml
services:
  terrateam-setup:
    user: "${UID}:${GID}"
```

Then run:
```bash
UID=$(id -u) GID=$(id -g) docker-compose run --rm terrateam-setup --github
```

## Platform-Specific Notes

### Linux
Use the examples as shown. May need user mapping for file permissions.

### macOS
Use the examples as shown. Docker Desktop handles file permissions automatically.

### Windows (PowerShell)
Replace `$(pwd)` with `${PWD}`:
```powershell
docker run --rm -it `
  --network host `
  -v "${PWD}:/output" `
  -w /output `
  terrateam-setup --github
```

### Windows (Command Prompt)
Replace `$(pwd)` with `%cd%`:
```cmd
docker run --rm -it ^
  --network host ^
  -v "%cd%:/output" ^
  -w /output ^
  terrateam-setup --github
```

## Verifying the .env File

After successful setup, verify the `.env` file exists:

```bash
# Linux/macOS
ls -la .env
cat .env

# Windows
dir .env
type .env
```

The file should contain your GitHub App or GitLab credentials.

## Cleaning Up

Remove the Docker image when no longer needed:

```bash
docker rmi terrateam-setup
```

Or with Docker Compose:

```bash
docker-compose down --rmi all
```

## Advanced: Using in CI/CD

For automated setups (GitLab only, as GitHub requires browser interaction):

```bash
docker run --rm \
  -v "$(pwd):/output" \
  -w /output \
  terrateam-setup \
  --gitlab \
  --gitlab-url https://gitlab.com \
  --gitlab-token ${GITLAB_TOKEN}
```

**Note:** GitHub setup requires browser interaction and cannot be fully automated.

## See Also

- [Main README](README.md) - Installation and usage without Docker
- [Go CLI README](cmd/terrateam-setup/README.md) - Detailed CLI documentation
