#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Load environment variables from .env file if it exists
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

// Import the main CLI module
const { runCLI } = require('../lib/cli');

// Handle uncaught errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

// Run the CLI
runCLI().catch((error) => {
  console.error('CLI error:', error);
  process.exit(1);
});
