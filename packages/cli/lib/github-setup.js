const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const open = require('open');
const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const updateDotenv = require('update-dotenv');
const { getManifest, createAppFromCode } = require('./github-manifest');

/**
 * Start a local server to serve manifest submission page and receive callback
 */
function startCallbackServerWithManifest(port = 3000, manifest, createAppUrl) {
  const app = express();
  let server;

  const promise = new Promise((resolve, reject) => {
    // Serve the manifest submission page
    app.get('/create-app', (req, res) => {
      res.send(`
        <html>
        <head>
          <title>Create Terrateam GitHub App</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 2rem;
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 12px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 600px;
            }
            h1 { color: #2d3748; margin-bottom: 1rem; }
            p { color: #718096; line-height: 1.6; margin-bottom: 2rem; }
            .btn {
              background: #667eea;
              color: white;
              border: none;
              padding: 1rem 2rem;
              font-size: 1rem;
              border-radius: 6px;
              cursor: pointer;
              transition: background 0.2s;
            }
            .btn:hover {
              background: #5568d3;
            }
            .spinner {
              display: none;
              margin-top: 1rem;
            }
            .spinner.active {
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 Create Terrateam GitHub App</h1>
            <p>Click the button below to create your GitHub App. You'll be taken to GitHub to review and approve the app permissions.</p>
            <form id="create-app-form" action="${createAppUrl}" method="POST" target="_self">
              <input type="hidden" name="manifest" value='${manifest}'>
              <button type="submit" class="btn" onclick="showSpinner()">Create GitHub App</button>
            </form>
            <div class="spinner" id="spinner">
              <p>Redirecting to GitHub...</p>
            </div>
          </div>
          <script>
            function showSpinner() {
              document.getElementById('spinner').classList.add('active');
            }
          </script>
        </body>
        </html>
      `);
    });

    // Callback route to receive the code from GitHub
    app.get('/probot/success', (req, res) => {
      const { code } = req.query;

      if (code) {
        res.send(`
          <html>
          <head>
            <title>Terrateam Setup - Success</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                background: white;
                padding: 3rem;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                text-align: center;
                max-width: 500px;
              }
              h1 { color: #2d3748; margin-bottom: 1rem; }
              p { color: #718096; line-height: 1.6; }
              .success-icon { font-size: 4rem; margin-bottom: 1rem; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success-icon">✅</div>
              <h1>GitHub App Created Successfully!</h1>
              <p>Your Terrateam GitHub App has been created. You can now close this window and return to the terminal.</p>
            </div>
          </body>
          </html>
        `);

        // Close the server and resolve with the code
        setTimeout(() => {
          server.close();
          resolve(code);
        }, 1000);
      } else {
        res.status(400).send(`
          <html>
          <head><title>Error</title></head>
          <body>
            <h1>Error: Missing code parameter</h1>
            <p>Please try again from the CLI.</p>
          </body>
          </html>
        `);
        server.close();
        reject(new Error('Missing code parameter'));
      }
    });

    // Start server
    server = app.listen(port, '127.0.0.1', () => {
      console.log(chalk.gray(`Local callback server started on http://127.0.0.1:${port}\n`));
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use. Please free up the port and try again.`));
      } else {
        reject(error);
      }
    });

    // Timeout after 10 minutes
    setTimeout(() => {
      if (server) {
        server.close();
      }
      reject(new Error('Timeout waiting for GitHub App creation'));
    }, 10 * 60 * 1000);
  });

  // Cleanup function
  const cleanup = () => {
    if (server) {
      try {
        server.close();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  };

  return { promise, cleanup };
}

/**
 * Setup GitHub App
 */
async function setupGitHub(userInfo, tunnelCredentials) {
  console.log(chalk.bold('\n🐙 GitHub App Setup\n'));

  // Check for development mode
  const isDevelopmentMode = process.env.TERRATEAM_DEV_MODE === 'true';

  if (isDevelopmentMode) {
    console.log(chalk.yellow('⚠️  Development mode enabled - using mock data\n'));
  }

  // Ask about GitHub Enterprise
  const { useGHE } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useGHE',
      message: 'Are you using GitHub Enterprise Server (GHE)?',
      default: false
    }
  ]);

  let gheHost, gheProtocol, ghOrg;
  if (useGHE) {
    const gheAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'gheHost',
        message: 'GitHub Enterprise Host (e.g., github.company.com):',
        validate: (input) => input.length > 0 || 'Host is required'
      },
      {
        type: 'list',
        name: 'gheProtocol',
        message: 'Protocol:',
        choices: ['https', 'http'],
        default: 'https'
      },
      {
        type: 'input',
        name: 'ghOrg',
        message: 'Organization name (optional):',
        default: ''
      }
    ]);

    gheHost = gheAnswers.gheHost;
    gheProtocol = gheAnswers.gheProtocol;
    ghOrg = gheAnswers.ghOrg;

    // Set environment variables for GHE
    process.env.GHE_HOST = gheHost;
    process.env.GHE_PROTOCOL = gheProtocol;
    if (ghOrg) {
      process.env.GH_ORG = ghOrg;
    }
  }

  // Determine callback port
  const callbackPort = process.env.PORT || 3000;
  const baseUrl = `http://127.0.0.1:${callbackPort}`;

  // Development mode shortcut
  if (isDevelopmentMode) {
    const spinner = ora('Creating mock GitHub App...').start();

    try {
      // Use mock data
      const mockCode = 'dev-mock-code-' + Date.now();
      const result = await createAppFromCode(mockCode, tunnelCredentials);

      spinner.succeed('Mock GitHub App created successfully!');

      // Display credentials
      displayGitHubCredentials(result, baseUrl);

      return {
        success: true,
        username: 'dev-user',
        envPath: path.join(process.cwd(), '.env')
      };
    } catch (error) {
      spinner.fail('Failed to create mock GitHub App');
      throw error;
    }
  }

  // Get app manifest
  const manifest = getManifest(baseUrl);
  const githubHost = gheHost || 'github.com';
  const protocol = gheProtocol || 'https';
  let createAppUrl = `${protocol}://${githubHost}`;

  if (ghOrg) {
    createAppUrl += `/organizations/${ghOrg}/settings/apps/new`;
  } else {
    createAppUrl += '/settings/apps/new';
  }

  console.log(chalk.bold('\n📝 Create GitHub App\n'));
  console.log(chalk.gray('We will now open your browser to create a GitHub App.\n'));
  console.log(chalk.gray('Steps:'));
  console.log(chalk.gray('1. Review the app permissions'));
  console.log(chalk.gray('2. Click "Create GitHub App"'));
  console.log(chalk.gray('3. You will be redirected back to this CLI\n'));

  const { readyToContinue } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'readyToContinue',
      message: 'Ready to open browser and create GitHub App?',
      default: true
    }
  ]);

  if (!readyToContinue) {
    throw new Error('User cancelled');
  }

  // Start local callback server (includes manifest submission page)
  console.log(chalk.gray('\nStarting local callback server...'));
  const serverResult = startCallbackServerWithManifest(callbackPort, manifest, createAppUrl);
  const codePromise = serverResult.promise;
  const serverCleanup = serverResult.cleanup;

  // Open browser to local manifest submission page
  const spinner = ora('Waiting for GitHub App creation...').start();
  spinner.text = 'Opening browser...';

  try {
    const localManifestUrl = `http://127.0.0.1:${callbackPort}/create-app`;
    await open(localManifestUrl);
    spinner.text = 'Waiting for GitHub App creation in browser...';
    spinner.info('Browser opened. Please complete the GitHub App creation in your browser.');

    // Wait for callback
    const code = await codePromise;

    spinner.text = 'Creating GitHub App from code...';
    spinner.start();

    // Create app from code
    const result = await createAppFromCode(code, tunnelCredentials);

    spinner.succeed('GitHub App created successfully!');

    // Display credentials
    displayGitHubCredentials(result, result.html_url);

    return {
      success: true,
      username: result.owner?.login || 'unknown',
      envPath: path.join(process.cwd(), '.env')
    };

  } catch (error) {
    // Clean up server on error
    if (serverCleanup) {
      try {
        serverCleanup();
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    spinner.fail('Failed to create GitHub App');
    throw error;
  }
}

/**
 * Display GitHub App credentials
 */
function displayGitHubCredentials(result, appUrl) {
  console.log('\n' + chalk.green.bold('✅ GitHub App Created!\n'));
  console.log(chalk.cyan.bold('App Details:'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.white('App ID:          ') + chalk.yellow(result.id));
  console.log(chalk.white('App URL:         ') + chalk.blue(appUrl));
  console.log(chalk.white('Client ID:       ') + chalk.yellow(result.client_id));
  console.log(chalk.white('Client Secret:   ') + chalk.yellow(result.client_secret.substring(0, 20) + '...'));
  console.log(chalk.white('Webhook Secret:  ') + chalk.yellow(result.webhook_secret.substring(0, 20) + '...'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.gray('\nThese credentials have been saved to your .env file.\n'));

  if (result.tunnelUrl) {
    console.log(chalk.cyan.bold('Tunnel Configuration:'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.white('Tunnel URL:      ') + chalk.blue(result.tunnelUrl));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.gray('\nYour tunnel is configured and ready to receive webhooks.\n'));
  }
}

module.exports = { setupGitHub };
