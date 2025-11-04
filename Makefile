.PHONY: help build run-github run-gitlab clean test docker-build docker-github docker-gitlab docker-clean

help:
	@echo "Terrateam Setup - Available commands:"
	@echo ""
	@echo "  Docker commands (recommended):"
	@echo "    make docker-build    - Build Docker image"
	@echo "    make docker-github   - Run GitHub setup with Docker"
	@echo "    make docker-gitlab   - Run GitLab setup with Docker (set GITLAB_TOKEN)"
	@echo "    make docker-clean    - Remove Docker image"
	@echo ""
	@echo "  Local Go commands:"
	@echo "    make build          - Build Go binary locally"
	@echo "    make run-github     - Run GitHub setup locally"
	@echo "    make run-gitlab     - Run GitLab setup locally (set GITLAB_TOKEN)"
	@echo "    make test           - Run tests"
	@echo "    make clean          - Clean build artifacts and .env"
	@echo ""
	@echo "Examples:"
	@echo "  make docker-github"
	@echo "  GITLAB_TOKEN=glpat-xxx make docker-gitlab"

# Docker commands
docker-build:
	docker-compose build

docker-github:
	docker-compose run --rm terrateam-setup --github

docker-gitlab:
ifndef GITLAB_TOKEN
	@echo "Error: GITLAB_TOKEN is required"
	@echo "Usage: GITLAB_TOKEN=glpat-xxx make docker-gitlab"
	@exit 1
endif
	docker-compose run --rm terrateam-setup --gitlab --gitlab-token=$(GITLAB_TOKEN)

docker-clean:
	docker-compose down --rmi all

# Local Go commands
build:
	cd cmd/terrateam-setup && go build -o terrateam-setup

run-github: build
	cd cmd/terrateam-setup && ./terrateam-setup --github

run-gitlab: build
ifndef GITLAB_TOKEN
	@echo "Error: GITLAB_TOKEN is required"
	@echo "Usage: GITLAB_TOKEN=glpat-xxx make run-gitlab"
	@exit 1
endif
	cd cmd/terrateam-setup && ./terrateam-setup --gitlab --gitlab-token=$(GITLAB_TOKEN)

test:
	cd cmd/terrateam-setup && go test ./...

clean:
	rm -f cmd/terrateam-setup/terrateam-setup
	rm -f terrateam-setup
	rm -f .env
	rm -f *.pem

# Quick validation
validate:
	@echo "Validating setup..."
	@if [ -f .env ]; then \
		echo "✓ .env file exists"; \
		if grep -q "GITHUB_APP_ID" .env || grep -q "GITLAB_TOKEN" .env; then \
			echo "✓ .env contains valid credentials"; \
		else \
			echo "✗ .env exists but appears empty"; \
			exit 1; \
		fi \
	else \
		echo "✗ .env file not found - run setup first"; \
		exit 1; \
	fi
