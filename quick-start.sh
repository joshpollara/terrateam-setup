#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Terrateam Setup - Quick Start       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo ""
    echo "Please install Docker first:"
    echo "  • macOS: https://docs.docker.com/desktop/install/mac-install/"
    echo "  • Linux: https://docs.docker.com/engine/install/"
    echo "  • Windows: https://docs.docker.com/desktop/install/windows-install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if docker-compose is available
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo -e "${RED}✗ Docker Compose is not available${NC}"
    echo ""
    echo "Please install Docker Compose:"
    echo "  https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose is available${NC}"
echo ""

# Prompt for VCS choice
echo -e "${YELLOW}Which version control system are you using?${NC}"
echo "  1) GitHub (github.com)"
echo "  2) GitHub Enterprise"
echo "  3) GitLab (gitlab.com)"
echo "  4) GitLab Self-Hosted"
echo ""
read -p "Enter your choice [1-4]: " vcs_choice

echo ""
echo -e "${BLUE}Building Docker image...${NC}"
$COMPOSE_CMD build

echo ""

case $vcs_choice in
    1)
        echo -e "${BLUE}Starting GitHub setup...${NC}"
        echo ""
        echo "This will:"
        echo "  1. Open your browser to create a GitHub App"
        echo "  2. Wait for you to complete the setup"
        echo "  3. Save credentials to .env"
        echo ""
        read -p "Press Enter to continue..."
        echo ""
        $COMPOSE_CMD run --rm terrateam-setup --github
        ;;
    2)
        echo -e "${YELLOW}GitHub Enterprise Setup${NC}"
        echo ""
        read -p "Enter your GitHub Enterprise hostname (e.g., github.company.com): " ghe_host
        read -p "Enter protocol [https]: " ghe_protocol
        ghe_protocol=${ghe_protocol:-https}
        echo ""
        $COMPOSE_CMD run --rm terrateam-setup --github --ghe-host "$ghe_host" --ghe-protocol "$ghe_protocol"
        ;;
    3)
        echo -e "${YELLOW}GitLab.com Setup${NC}"
        echo ""
        echo "You need a GitLab Personal Access Token with 'api' scope."
        echo "Create one at: https://gitlab.com/-/profile/personal_access_tokens"
        echo ""
        read -p "Enter your GitLab token: " gitlab_token
        echo ""
        $COMPOSE_CMD run --rm terrateam-setup --gitlab --gitlab-token "$gitlab_token"
        ;;
    4)
        echo -e "${YELLOW}GitLab Self-Hosted Setup${NC}"
        echo ""
        read -p "Enter your GitLab URL (e.g., https://gitlab.company.com): " gitlab_url
        echo ""
        echo "You need a GitLab Personal Access Token with 'api' scope."
        echo "Create one at: $gitlab_url/-/profile/personal_access_tokens"
        echo ""
        read -p "Enter your GitLab token: " gitlab_token
        echo ""
        $COMPOSE_CMD run --rm terrateam-setup --gitlab --gitlab-url "$gitlab_url" --gitlab-token "$gitlab_token"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Check if .env was created
if [ -f .env ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          Setup Successful! ✓           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}✓ Credentials saved to .env${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review your .env file"
    echo "  2. Use these credentials to run Terrateam"
    echo "  3. See README.md for more information"
else
    echo ""
    echo -e "${RED}✗ Setup failed - .env file not created${NC}"
    echo ""
    echo "Please check the output above for errors."
    exit 1
fi
