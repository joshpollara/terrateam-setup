const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const open = require('open');
const express = require('express');
const https = require('https');

/**
 * Configure Terratunnel with OAuth
 */
async function configureTunnel(vcsProvider = 'github') {
  console.log(chalk.bold('\n🌐 Tunnel Configuration\n'));

  console.log(chalk.gray('Terratunnel provides a secure tunnel for webhook delivery.'));
  console.log(chalk.gray('This is useful if you don\'t have a publicly accessible URL.\n'));

  const isDevelopmentMode = process.env.TERRATEAM_DEV_MODE === 'true';

  if (isDevelopmentMode) {
    console.log(chalk.yellow('⚠️  Development mode - using mock tunnel credentials\n'));

    return {
      tunnel_id: 'dev_tunnel_' + Date.now(),
      tunnel_url: `https://dev-tunnel-${Date.now()}.tunnel.terrateam.dev`,
      api_key: 'dev_api_key_' + Math.random().toString(36).substring(7)
    };
  }

  console.log(chalk.gray(`We'll authenticate with ${vcsProvider === 'github' ? 'GitHub' : 'GitLab'} to set up your tunnel.\n`));

  const { readyToAuthenticate } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'readyToAuthenticate',
      message: `Ready to authenticate with ${vcsProvider === 'github' ? 'GitHub' : 'GitLab'}?`,
      default: true
    }
  ]);

  if (!readyToAuthenticate) {
    console.log(chalk.yellow('\n⚠️  Skipping tunnel configuration. You can configure this later.\n'));
    return null;
  }

  // Start local OAuth callback server
  const callbackPort = 3001; // Use different port from main app
  const spinner = ora('Starting OAuth flow...').start();

  try {
    // Initiate OAuth flow
    const oauthUrl = vcsProvider === 'github'
      ? 'https://tunnel.terrateam.dev/api/auth/github'
      : 'https://tunnel.terrateam.dev/api/auth/gitlab';

    const redirectUrl = `http://127.0.0.1:${callbackPort}/callback`;
    const fullOauthUrl = `${oauthUrl}?redirect_uri=${encodeURIComponent(redirectUrl)}`;

    // Create callback server
    const credentials = await startOAuthServer(callbackPort, spinner);

    spinner.text = 'Opening browser for authentication...';

    // Open browser
    await open(fullOauthUrl);

    spinner.text = 'Waiting for authentication...';
    spinner.info('Browser opened. Please complete authentication in your browser.');

    // Wait for OAuth callback
    const result = await credentials;

    spinner.succeed('Tunnel configured successfully!');

    console.log('\n' + chalk.green('✓ ') + chalk.gray(`Tunnel URL: ${chalk.white(result.tunnel_url)}`));

    return result;

  } catch (error) {
    spinner.fail('Tunnel configuration failed');

    // Ask if user wants to continue without tunnel
    const { continueWithoutTunnel } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueWithoutTunnel',
        message: 'Continue setup without tunnel configuration?',
        default: true
      }
    ]);

    if (!continueWithoutTunnel) {
      throw new Error('Setup cancelled - tunnel configuration required');
    }

    console.log(chalk.yellow('\n⚠️  Continuing without tunnel. You can configure this later.\n'));
    return null;
  }
}

/**
 * Start OAuth callback server
 */
function startOAuthServer(port, spinner) {
  return new Promise((resolve, reject) => {
    const app = express();
    let server;

    app.get('/callback', (req, res) => {
      const { code, state, error } = req.query;

      if (error) {
        res.send(`
          <html>
          <head>
            <title>Terrateam Tunnel - Error</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
              .error-icon { font-size: 4rem; margin-bottom: 1rem; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error-icon">❌</div>
              <h1>Authentication Failed</h1>
              <p>${error}</p>
              <p>Please close this window and try again from the terminal.</p>
            </div>
          </body>
          </html>
        `);

        server.close();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (!code) {
        res.status(400).send('Missing authorization code');
        server.close();
        reject(new Error('Missing authorization code'));
        return;
      }

      // Exchange code for tunnel credentials
      exchangeOAuthCode(code, state)
        .then((credentials) => {
          res.send(`
            <html>
            <head>
              <title>Terrateam Tunnel - Success</title>
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
                <h1>Tunnel Configured!</h1>
                <p>Your Terratunnel has been configured successfully.</p>
                <p>You can now close this window and return to the terminal.</p>
              </div>
            </body>
            </html>
          `);

          setTimeout(() => {
            server.close();
            resolve(credentials);
          }, 1000);
        })
        .catch((error) => {
          res.status(500).send(`
            <html>
            <head><title>Error</title></head>
            <body>
              <h1>Failed to configure tunnel</h1>
              <p>${error.message}</p>
            </body>
            </html>
          `);

          server.close();
          reject(error);
        });
    });

    server = app.listen(port, '127.0.0.1', () => {
      // Server started
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use`));
      } else {
        reject(error);
      }
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Timeout waiting for OAuth callback'));
    }, 5 * 60 * 1000);
  });
}

/**
 * Exchange OAuth code for tunnel credentials
 */
function exchangeOAuthCode(code, state) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      code,
      state
    });

    const options = {
      hostname: 'tunnel.terrateam.dev',
      port: 443,
      path: '/api/auth/exchange',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Terrateam-Setup-CLI'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(new Error(result.message || `HTTP ${res.statusCode}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

module.exports = { configureTunnel };
