#!/bin/bash
# Build and run script for Podman/Docker compatibility

set -e

# Detect container runtime
if command -v podman &> /dev/null; then
    CONTAINER_CMD="podman"
elif command -v docker &> /dev/null; then
    CONTAINER_CMD="docker"
else
    echo "Error: Neither podman nor docker found"
    exit 1
fi

IMAGE_NAME="terrateam-setup:latest"

# Function to build image
build_image() {
    echo "Building image with $CONTAINER_CMD..."
    $CONTAINER_CMD build -t $IMAGE_NAME .
}

# Function to run GitHub setup
run_github() {
    echo "Running GitHub setup..."
    $CONTAINER_CMD run --rm -it \
        --network host \
        -v "$(pwd):/output:Z" \
        -w /output \
        $IMAGE_NAME --github "$@"
}

# Function to run GitLab setup
run_gitlab() {
    if [ -z "$GITLAB_TOKEN" ]; then
        echo "Error: GITLAB_TOKEN environment variable is required"
        echo "Usage: GITLAB_TOKEN=glpat-xxx $0 gitlab"
        exit 1
    fi

    echo "Running GitLab setup..."
    $CONTAINER_CMD run --rm -it \
        --network host \
        -v "$(pwd):/output:Z" \
        -w /output \
        $IMAGE_NAME --gitlab --gitlab-token="$GITLAB_TOKEN" "$@"
}

# Function to run with custom args
run_custom() {
    echo "Running with custom arguments..."
    $CONTAINER_CMD run --rm -it \
        --network host \
        -v "$(pwd):/output:Z" \
        -w /output \
        $IMAGE_NAME "$@"
}

# Main command handling
case "${1:-help}" in
    build)
        build_image
        ;;
    github)
        shift
        run_github "$@"
        ;;
    gitlab)
        shift
        run_gitlab "$@"
        ;;
    run)
        shift
        run_custom "$@"
        ;;
    help|--help|-h)
        echo "Terrateam Setup - Docker/Podman Helper Script"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  build              Build the Docker/Podman image"
        echo "  github [opts]      Run GitHub setup"
        echo "  gitlab [opts]      Run GitLab setup (requires GITLAB_TOKEN env var)"
        echo "  run <args>         Run with custom arguments"
        echo "  help               Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 build"
        echo "  $0 github"
        echo "  $0 github --ghe-host github.company.com"
        echo "  GITLAB_TOKEN=glpat-xxx $0 gitlab"
        echo "  $0 run --help"
        echo ""
        echo "Using: $CONTAINER_CMD"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
