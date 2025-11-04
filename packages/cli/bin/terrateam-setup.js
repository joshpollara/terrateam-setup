#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { program } = require('commander');

// Load environment variables from .env file if it exists
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

// Import the main CLI module
const { runCLI } = require('../lib/cli');

// Parse command-line arguments
program
  .name('terrateam-setup')
  .description('CLI tool for setting up Terrateam with GitHub or GitLab')
  .version('1.0.0')
  .option('--github', 'Use GitHub as VCS provider')
  .option('--gitlab', 'Use GitLab as VCS provider')
  .option('--no-tunnel', 'Skip tunnel configuration')
  .option('--tunnel', 'Enable tunnel configuration (requires OAuth)')
  .option('--no-telemetry', 'Disable telemetry')
  .option('--email <email>', 'Your email address')
  .option('--first-name <name>', 'Your first name')
  .option('--last-name <name>', 'Your last name')
  .option('--onboarding-call', 'Request an onboarding call')
  .option('--ghe-host <host>', 'GitHub Enterprise host (e.g., github.company.com)')
  .option('--ghe-protocol <protocol>', 'GitHub Enterprise protocol (http or https)', 'https')
  .option('--gh-org <org>', 'GitHub organization name')
  .option('--gitlab-url <url>', 'GitLab instance URL (e.g., https://gitlab.company.com)')
  .option('--gitlab-token <token>', 'GitLab Personal Access Token')
  .option('--non-interactive', 'Run in non-interactive mode with defaults')
  .option('--port <port>', 'Port for local callback server', '3000')
  .parse(process.argv);

const options = program.opts();

// Handle uncaught errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

// Run the CLI with parsed options
runCLI(options).catch((error) => {
  console.error('CLI error:', error);
  process.exit(1);
});
