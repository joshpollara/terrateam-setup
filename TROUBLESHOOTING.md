# Troubleshooting Guide

This guide covers common issues and their solutions.

## Issues Fixed in Latest Version

### ✅ .env File Not Created in Repository Root

**Problem:** When using `make run-github`, the .env file was created in `cmd/terrateam-setup/` instead of the repository root.

**Solution:** Updated Makefile to build binary to repository root and run from there.

```bash
# Now works correctly
make run-github
# .env is created in current directory
```

### ✅ Docker Compose Compatibility with Podman

**Problem:** `docker-compose build` failed with Podman showing SSL version error:
```
TypeError: kwargs_from_env() got an unexpected keyword argument 'ssl_version'
```

**Solution:**
1. Updated Dockerfile to use fully qualified image names
2. Created `docker-run.sh` script that works with both Docker and Podman
3. Updated Makefile to use the helper script

```bash
# Now works with Podman
make docker-build
make docker-github
```

### ✅ Podman Image Registry Issues

**Problem:** Podman couldn't resolve short image names:
```
Error: short-name "golang:1.21-alpine" did not resolve to an alias
```

**Solution:** Updated Dockerfile to use fully qualified registry names:
```dockerfile
FROM docker.io/library/golang:1.21-alpine AS builder
FROM docker.io/library/alpine:latest
```

## Common Issues

### Docker/Podman Issues

#### Issue: Container Can't Be Built

**Symptoms:**
- Build fails with registry errors
- Cannot find base images

**Solutions:**

1. **For Podman users:** Use the `docker-run.sh` script:
   ```bash
   ./docker-run.sh build
   ```

2. **Check container runtime:**
   ```bash
   docker --version  # or
   podman --version
   ```

3. **Verify internet connection** - images need to be pulled from docker.io

#### Issue: .env File Not Created

**Symptoms:**
- Container runs but no .env file appears
- File created inside container but not on host

**Solutions:**

1. **Check volume mount:** Ensure you're in the repository root:
   ```bash
   pwd  # Should show .../terrateam-setup
   ls -la  # Should see Dockerfile, docker-compose.yml
   ```

2. **Use correct command:**
   ```bash
   # Correct (from repository root)
   make docker-github
   ./docker-run.sh github

   # Wrong (from subdirectory)
   cd cmd/terrateam-setup && make docker-github  # Don't do this
   ```

3. **Check SELinux permissions (Podman on Fedora/RHEL):**
   The `:Z` flag in volume mounts handles this automatically:
   ```yaml
   volumes:
     - ./:/output:Z
   ```

#### Issue: OAuth Callback Fails

**Symptoms:**
- Browser can't connect to localhost:3000
- "Connection refused" error after GitHub App creation

**Solutions:**

1. **Verify network mode:** Should be `host` in docker-compose.yml:
   ```yaml
   network_mode: "host"
   ```

2. **Check port availability:**
   ```bash
   # Check if port 3000 is in use
   netstat -tulpn | grep 3000
   # or
   ss -tulpn | grep 3000
   ```

3. **Use custom port if needed:**
   ```bash
   ./docker-run.sh run --github --port 8080
   ```

### Local Build Issues

#### Issue: Binary Built in Wrong Location

**Symptoms:**
- `./terrateam-setup` not found after building
- Binary in `cmd/terrateam-setup/` instead of root

**Solution:** Use Makefile or build with correct output path:
```bash
# Using Makefile (recommended)
make build

# Manual build
cd cmd/terrateam-setup
go build -o ../../terrateam-setup
cd ../..
```

#### Issue: Go Dependencies Not Found

**Symptoms:**
```
go: missing go.sum entry for module
```

**Solution:**
```bash
cd cmd/terrateam-setup
go mod tidy
go build -o ../../terrateam-setup
```

#### Issue: .env Created in Wrong Directory

**Symptoms:**
- Ran binary from `cmd/terrateam-setup/`
- .env created there instead of repository root

**Solution:** Always run from repository root:
```bash
# Correct
./terrateam-setup --github

# Wrong
cd cmd/terrateam-setup && ./terrateam-setup --github
```

### GitHub Setup Issues

#### Issue: Browser Opens but Form is Empty

**Symptoms:**
- GitHub App creation page opens
- No manifest data visible
- Form fields are empty

**Current Behavior:** This is normal. The CLI creates a local page with a button to submit the manifest. Click the button to proceed.

**Workaround:** Ensure JavaScript is enabled in your browser.

#### Issue: GitHub API Rate Limit

**Symptoms:**
```
Error: GitHub API rate limit exceeded
```

**Solution:** Wait an hour or authenticate with a personal access token (future enhancement).

### GitLab Setup Issues

#### Issue: Invalid Token Error

**Symptoms:**
```
Error: Failed to validate GitLab token
```

**Solutions:**

1. **Verify token scopes:** Token needs `api` scope
2. **Check token expiration:** Generate new token if expired
3. **Verify GitLab URL:** Ensure URL is correct for self-hosted instances

```bash
# GitLab.com
./terrateam-setup --gitlab --gitlab-token glpat-xxx

# Self-hosted
./terrateam-setup --gitlab --gitlab-url https://gitlab.company.com --gitlab-token glpat-xxx
```

## Verification Steps

After setup completes, verify everything worked:

```bash
# Check .env file exists in repository root
ls -la .env

# Verify credentials are present
cat .env

# Using Make
make validate
```

Expected .env contents:

### For GitHub:
```
GITHUB_APP_ID=123456
GITHUB_APP_CLIENT_ID=Iv1.abc123...
GITHUB_APP_CLIENT_SECRET=abc123...
GITHUB_APP_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
...
GITHUB_APP_WEBHOOK_SECRET=abc123...
```

### For GitLab:
```
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
GITLAB_WEBHOOK_SECRET=abc123...
```

## Getting Help

If you encounter issues not covered here:

1. **Check logs:**
   ```bash
   # Docker/Podman logs
   podman logs terrateam-setup
   # or
   docker logs terrateam-setup
   ```

2. **Run with verbose output:**
   ```bash
   ./terrateam-setup --github --help
   ```

3. **Verify system requirements:**
   ```bash
   # For Docker/Podman
   docker --version || podman --version

   # For local builds
   go version  # Should be 1.21 or higher
   ```

4. **Check file permissions:**
   ```bash
   ls -la
   # Ensure docker-run.sh is executable
   chmod +x docker-run.sh
   ```

5. **Open an issue:** https://github.com/terrateamio/terrateam-setup/issues

## Quick Reference

### Working Commands

```bash
# Docker/Podman
make docker-build
make docker-github
GITLAB_TOKEN=xxx make docker-gitlab

# Alternative Docker/Podman
./docker-run.sh build
./docker-run.sh github
GITLAB_TOKEN=xxx ./docker-run.sh gitlab

# Local Go build
make build
make run-github
GITLAB_TOKEN=xxx make run-gitlab

# Manual
./terrateam-setup --github
./terrateam-setup --gitlab --gitlab-token xxx
```

### Files Created

- `terrateam-setup` - Binary in repository root
- `.env` - Credentials in repository root
- `*.pem` - Private key files (GitHub only)

### Clean Up

```bash
# Clean all build artifacts and credentials
make clean

# Clean Docker/Podman images
make docker-clean
```
