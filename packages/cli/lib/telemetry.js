const https = require('https');
const chalk = require('chalk');

/**
 * Send telemetry data
 */
async function sendTelemetry(data) {
  const { email, firstName, lastName, username, vcsProvider, sendTelemetry } = data;

  // Skip if user opted out
  if (!sendTelemetry) {
    return;
  }

  // Build query parameters
  const params = new URLSearchParams();

  if (username) {
    if (vcsProvider === 'github') {
      params.append('github', username);
    } else if (vcsProvider === 'gitlab') {
      params.append('gitlab', username);
    }
  }

  if (email) {
    params.append('email', email);
  }

  if (firstName) {
    params.append('firstName', firstName);
  }

  if (lastName) {
    params.append('lastName', lastName);
  }

  // Only send if we have at least one parameter
  if (params.toString().length === 0) {
    return;
  }

  const url = `https://telemetry.terrateam.io/event/terrateam-setup/opt-in?${params.toString()}`;

  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Terrateam-Setup-CLI'
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          // Don't fail the setup if telemetry fails
          console.log(chalk.gray('Note: Telemetry submission failed (non-critical)'));
          resolve();
        }
      });
    }).on('error', (error) => {
      // Don't fail the setup if telemetry fails
      console.log(chalk.gray('Note: Telemetry submission failed (non-critical)'));
      resolve();
    });
  });
}

module.exports = { sendTelemetry };
