const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const { setupGitHub } = require('./github-setup');
const { setupGitLab } = require('./gitlab-setup');
const { configureTunnel } = require('./tunnel-config');
const { sendTelemetry } = require('./telemetry');

/**
 * Display welcome banner
 */
function displayBanner() {
  console.log('\n' + chalk.cyan.bold('╔═══════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║                                                               ║'));
  console.log(chalk.cyan.bold('║          ') + chalk.white.bold('Welcome to Terrateam Setup CLI!') + chalk.cyan.bold('                ║'));
  console.log(chalk.cyan.bold('║                                                               ║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════════╝') + '\n');
  console.log(chalk.gray('This wizard will guide you through setting up Terrateam for your'));
  console.log(chalk.gray('infrastructure-as-code workflows with GitHub or GitLab.\n'));
}

/**
 * Collect user information and telemetry preferences
 */
async function collectUserInfo() {
  console.log(chalk.bold('\n📋 User Information (Optional)\n'));
  console.log(chalk.gray('Help us improve Terrateam by sharing your information.\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'firstName',
      message: 'First Name:',
      default: ''
    },
    {
      type: 'input',
      name: 'lastName',
      message: 'Last Name:',
      default: ''
    },
    {
      type: 'input',
      name: 'email',
      message: 'Email:',
      default: '',
      validate: (input) => {
        if (input === '') return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input) || 'Please enter a valid email address';
      }
    },
    {
      type: 'confirm',
      name: 'onboardingCall',
      message: 'Would you like help getting started with Terrateam? (Optional onboarding call)',
      default: false
    },
    {
      type: 'confirm',
      name: 'sendTelemetry',
      message: 'Send telemetry to help improve Terrateam?',
      default: true
    }
  ]);

  return answers;
}

/**
 * Select VCS provider
 */
async function selectVCS() {
  console.log(chalk.bold('\n🔧 Choose Your Version Control System\n'));

  const { vcsProvider } = await inquirer.prompt([
    {
      type: 'list',
      name: 'vcsProvider',
      message: 'Select your VCS provider:',
      choices: [
        {
          name: 'GitHub - Create a GitHub App for Terrateam',
          value: 'github',
          short: 'GitHub'
        },
        {
          name: 'GitLab - Configure GitLab with Personal Access Token',
          value: 'gitlab',
          short: 'GitLab'
        }
      ]
    }
  ]);

  return vcsProvider;
}

/**
 * Main CLI runner
 */
async function runCLI() {
  try {
    // Display welcome banner
    displayBanner();

    // Collect user information
    const userInfo = await collectUserInfo();

    // Select VCS provider
    const vcsProvider = await selectVCS();

    // Configure tunnel (function handles its own prompts)
    let tunnelCredentials = null;
    tunnelCredentials = await configureTunnel(vcsProvider);

    // Setup based on VCS provider
    let setupResult;
    if (vcsProvider === 'github') {
      setupResult = await setupGitHub(userInfo, tunnelCredentials);
    } else {
      setupResult = await setupGitLab(userInfo, tunnelCredentials);
    }

    // Send telemetry if user opted in
    if (userInfo.sendTelemetry && setupResult.success) {
      await sendTelemetry({
        ...userInfo,
        vcsProvider,
        username: setupResult.username
      });
    }

    // Display final success message
    console.log('\n' + chalk.green.bold('✅ Setup Complete!\n'));

    if (setupResult.envPath) {
      console.log(chalk.gray(`Configuration saved to: ${chalk.white(setupResult.envPath)}\n`));
    }

    console.log(chalk.cyan.bold('Next Steps:'));
    console.log(chalk.gray('1. Review your .env file'));
    console.log(chalk.gray('2. Start Terrateam: ') + chalk.white('npm start'));

    if (vcsProvider === 'github') {
      console.log(chalk.gray('3. Install the GitHub App in your repositories'));
    } else {
      console.log(chalk.gray('3. Configure your GitLab webhooks'));
    }

    console.log('');

  } catch (error) {
    if (error.isTtyError) {
      console.error(chalk.red('\n❌ CLI Error: Terminal does not support interactive prompts'));
    } else if (error.message === 'User cancelled') {
      console.log(chalk.yellow('\n⚠️  Setup cancelled by user'));
      process.exit(0);
    } else {
      console.error(chalk.red('\n❌ Setup failed:'), error.message);
      if (process.env.DEBUG) {
        console.error(error);
      }
    }
    process.exit(1);
  }
}

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n⚠️  Setup interrupted by user'));
  process.exit(0);
});

module.exports = { runCLI };
