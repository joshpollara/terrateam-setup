const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const open = require('open');
const path = require('path');
const fs = require('fs');
const updateDotenv = require('update-dotenv');

/**
 * Setup GitLab with Personal Access Token
 */
async function setupGitLab(userInfo, tunnelCredentials) {
  console.log(chalk.bold('\n🦊 GitLab Setup\n'));

  console.log(chalk.gray('GitLab setup requires a Personal Access Token (PAT) for the bot account.\n'));

  // Ask about GitLab instance
  const { gitlabInstance } = await inquirer.prompt([
    {
      type: 'list',
      name: 'gitlabInstance',
      message: 'Which GitLab instance are you using?',
      choices: [
        {
          name: 'GitLab.com (SaaS)',
          value: 'gitlab.com',
          short: 'GitLab.com'
        },
        {
          name: 'Self-hosted GitLab',
          value: 'self-hosted',
          short: 'Self-hosted'
        }
      ]
    }
  ]);

  let gitlabUrl = 'https://gitlab.com';
  let gitlabApiUrl = 'https://gitlab.com/api/v4';

  if (gitlabInstance === 'self-hosted') {
    const { customUrl } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customUrl',
        message: 'Enter your GitLab instance URL (e.g., https://gitlab.company.com):',
        validate: (input) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        }
      }
    ]);

    gitlabUrl = customUrl.replace(/\/$/, ''); // Remove trailing slash
    gitlabApiUrl = `${gitlabUrl}/api/v4`;
  }

  // Display instructions for creating PAT
  console.log(chalk.bold('\n📝 Create Personal Access Token\n'));
  console.log(chalk.gray('You need to create a Personal Access Token with the following scopes:\n'));
  console.log(chalk.white('  • ') + chalk.cyan('api') + chalk.gray(' - Full API access'));
  console.log(chalk.white('  • ') + chalk.cyan('read_repository') + chalk.gray(' - Read repository data'));
  console.log(chalk.white('  • ') + chalk.cyan('write_repository') + chalk.gray(' - Write to repository'));
  console.log('');

  const { openBrowser } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'openBrowser',
      message: `Open browser to create token at ${gitlabUrl}?`,
      default: true
    }
  ]);

  if (openBrowser) {
    const tokenUrl = `${gitlabUrl}/-/profile/personal_access_tokens`;
    await open(tokenUrl);
    console.log(chalk.gray(`\nOpened: ${tokenUrl}\n`));
  } else {
    console.log(chalk.gray(`\nManually visit: ${gitlabUrl}/-/profile/personal_access_tokens\n`));
  }

  // Prompt for PAT
  const { personalAccessToken } = await inquirer.prompt([
    {
      type: 'password',
      name: 'personalAccessToken',
      message: 'Enter your GitLab Personal Access Token:',
      validate: (input) => input.length > 0 || 'Token is required'
    }
  ]);

  // Validate the token by making a test API call
  const spinner = ora('Validating token...').start();

  try {
    const userResponse = await makeGitLabRequest(`${gitlabApiUrl}/user`, {
      headers: {
        'PRIVATE-TOKEN': personalAccessToken
      }
    });

    spinner.succeed(`Token validated! Authenticated as: ${chalk.cyan(userResponse.username)}`);

    // Ask for webhook token
    console.log(chalk.bold('\n🔐 Webhook Secret Token\n'));
    console.log(chalk.gray('Create a secret token to secure your GitLab webhooks.\n'));

    const { webhookToken } = await inquirer.prompt([
      {
        type: 'input',
        name: 'webhookToken',
        message: 'Enter webhook secret token (or press Enter to generate):',
        default: () => generateWebhookToken()
      }
    ]);

    // Save configuration to .env
    spinner.text = 'Saving configuration...';
    spinner.start();

    const envPath = await updateGitLabEnv({
      gitlabUrl,
      gitlabApiUrl,
      personalAccessToken,
      webhookToken,
      username: userResponse.username
    }, tunnelCredentials);

    spinner.succeed('Configuration saved!');

    // Display setup instructions
    displayGitLabInstructions(gitlabUrl, webhookToken, tunnelCredentials);

    return {
      success: true,
      username: userResponse.username,
      envPath
    };

  } catch (error) {
    spinner.fail('Token validation failed');
    throw new Error(`Failed to validate GitLab token: ${error.message}`);
  }
}

/**
 * Make HTTP request to GitLab API
 */
function makeGitLabRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const urlObj = new URL(url);

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsedData.message || data}`));
          }
        } catch (parseError) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Generate a random webhook token
 */
function generateWebhookToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

/**
 * Update .env file with GitLab configuration
 */
async function updateGitLabEnv(gitlabConfig, tunnelCredentials) {
  const envPath = path.join(process.cwd(), '.env');

  const envVars = {
    GITLAB_URL: gitlabConfig.gitlabUrl,
    GITLAB_API_URL: gitlabConfig.gitlabApiUrl,
    GITLAB_PERSONAL_ACCESS_TOKEN: gitlabConfig.personalAccessToken,
    GITLAB_WEBHOOK_SECRET: gitlabConfig.webhookToken,
    GITLAB_BOT_USERNAME: gitlabConfig.username
  };

  // Add tunnel configuration if provided
  if (tunnelCredentials) {
    if (tunnelCredentials.api_key) {
      envVars.TERRATUNNEL_API_KEY = tunnelCredentials.api_key;
    }

    if (tunnelCredentials.tunnel_url) {
      let tunnelUrl = tunnelCredentials.tunnel_url;
      // Ensure proper protocol
      if (!tunnelUrl.startsWith('https://') && !tunnelUrl.startsWith('http://')) {
        tunnelUrl = `https://${tunnelUrl}`;
      }
      envVars.TERRAT_UI_BASE = tunnelUrl;
      envVars.TERRAT_WEB_BASE_URL = tunnelUrl;
    }
  }

  await updateDotenv(envVars);

  return envPath;
}

/**
 * Display GitLab setup instructions
 */
function displayGitLabInstructions(gitlabUrl, webhookToken, tunnelCredentials) {
  console.log('\n' + chalk.green.bold('✅ GitLab Configuration Complete!\n'));

  console.log(chalk.cyan.bold('Configuration Details:'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.white('GitLab URL:      ') + chalk.blue(gitlabUrl));
  console.log(chalk.white('Webhook Secret:  ') + chalk.yellow(webhookToken.substring(0, 20) + '...'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.gray('\nConfiguration saved to .env file.\n'));

  if (tunnelCredentials?.tunnel_url) {
    console.log(chalk.cyan.bold('Tunnel Configuration:'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.white('Tunnel URL:      ') + chalk.blue(tunnelCredentials.tunnel_url));
    console.log(chalk.gray('─'.repeat(60)));
    console.log('');
  }

  console.log(chalk.yellow.bold('⚠️  Manual Setup Required\n'));
  console.log(chalk.gray('GitLab does not support automatic webhook creation via API.'));
  console.log(chalk.gray('You must manually configure webhooks for each project:\n'));

  const webhookUrl = tunnelCredentials?.tunnel_url
    ? `${tunnelCredentials.tunnel_url}/webhooks/gitlab`
    : 'https://your-terrateam-url/webhooks/gitlab';

  console.log(chalk.white('1. Go to your GitLab project'));
  console.log(chalk.white('2. Navigate to: ') + chalk.cyan('Settings > Webhooks'));
  console.log(chalk.white('3. Add webhook URL: ') + chalk.blue(webhookUrl));
  console.log(chalk.white('4. Set Secret Token: ') + chalk.yellow(webhookToken));
  console.log(chalk.white('5. Enable these triggers:'));
  console.log(chalk.gray('   • Issues events'));
  console.log(chalk.gray('   • Merge request events'));
  console.log(chalk.gray('   • Push events'));
  console.log(chalk.gray('   • Pipeline events'));
  console.log(chalk.gray('   • Note events (comments)'));
  console.log('');
}

module.exports = { setupGitLab };
