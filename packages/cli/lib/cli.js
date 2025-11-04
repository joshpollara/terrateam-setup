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
async function collectUserInfo(options = {}) {
  // Use provided options or prompt for missing ones
  const questions = [];

  if (options.nonInteractive) {
    // In non-interactive mode, use defaults
    return {
      firstName: options.firstName || '',
      lastName: options.lastName || '',
      email: options.email || '',
      onboardingCall: options.onboardingCall || false,
      sendTelemetry: options.telemetry !== false // Default to true unless explicitly disabled
    };
  }

  // If user explicitly disabled telemetry and didn't provide any user info, skip all prompts
  const hasUserInfo = options.firstName || options.lastName || options.email || options.onboardingCall;
  if (options.telemetry === false && !hasUserInfo) {
    // Skip all user info collection when telemetry is disabled and no user info provided
    return {
      firstName: '',
      lastName: '',
      email: '',
      onboardingCall: false,
      sendTelemetry: false
    };
  }

  // Only prompt for missing information
  if (!options.firstName && !options.lastName && !options.email && !options.onboardingCall) {
    console.log(chalk.bold('\n📋 User Information (Optional)\n'));
    console.log(chalk.gray('Help us improve Terrateam by sharing your information.\n'));
  }

  if (options.firstName === undefined) {
    questions.push({
      type: 'input',
      name: 'firstName',
      message: 'First Name:',
      default: ''
    });
  }

  if (options.lastName === undefined) {
    questions.push({
      type: 'input',
      name: 'lastName',
      message: 'Last Name:',
      default: ''
    });
  }

  if (options.email === undefined) {
    questions.push({
      type: 'input',
      name: 'email',
      message: 'Email:',
      default: '',
      validate: (input) => {
        if (input === '') return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input) || 'Please enter a valid email address';
      }
    });
  }

  if (options.onboardingCall === undefined) {
    questions.push({
      type: 'confirm',
      name: 'onboardingCall',
      message: 'Would you like help getting started with Terrateam? (Optional onboarding call)',
      default: false
    });
  }

  if (options.telemetry === undefined) {
    questions.push({
      type: 'confirm',
      name: 'sendTelemetry',
      message: 'Send telemetry to help improve Terrateam?',
      default: true
    });
  }

  const answers = questions.length > 0 ? await inquirer.prompt(questions) : {};

  return {
    firstName: options.firstName || answers.firstName || '',
    lastName: options.lastName || answers.lastName || '',
    email: options.email || answers.email || '',
    onboardingCall: options.onboardingCall || answers.onboardingCall || false,
    sendTelemetry: options.telemetry !== false ? (answers.sendTelemetry !== false) : false
  };
}

/**
 * Select VCS provider
 */
async function selectVCS(options = {}) {
  // Use provided option or prompt
  if (options.github) {
    return 'github';
  }

  if (options.gitlab) {
    return 'gitlab';
  }

  if (options.nonInteractive) {
    // Default to GitHub in non-interactive mode
    return 'github';
  }

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
async function runCLI(options = {}) {
  try {
    // Display welcome banner (skip in non-interactive mode)
    if (!options.nonInteractive) {
      displayBanner();
    } else {
      console.log(chalk.cyan.bold('\nTerrateam Setup (Non-Interactive Mode)\n'));
    }

    // Set environment variables from options
    if (options.gheHost) {
      process.env.GHE_HOST = options.gheHost;
    }
    if (options.gheProtocol) {
      process.env.GHE_PROTOCOL = options.gheProtocol;
    }
    if (options.ghOrg) {
      process.env.GH_ORG = options.ghOrg;
    }
    if (options.port) {
      process.env.PORT = options.port;
    }

    // Collect user information
    const userInfo = await collectUserInfo(options);

    // Select VCS provider
    const vcsProvider = await selectVCS(options);

    // Configure tunnel
    let tunnelCredentials = null;
    if (options.tunnel === true) {
      // Explicitly requested tunnel
      tunnelCredentials = await configureTunnel(vcsProvider, options);
    } else if (options.tunnel === false) {
      // Explicitly disabled tunnel
      console.log(chalk.gray('\n✓ Skipping tunnel configuration (--no-tunnel flag)\n'));
      tunnelCredentials = null;
    } else if (!options.nonInteractive) {
      // Interactive mode - let configureTunnel handle prompts
      tunnelCredentials = await configureTunnel(vcsProvider, options);
    }
    // In non-interactive mode without --tunnel, skip tunnel

    // Setup based on VCS provider
    let setupResult;
    if (vcsProvider === 'github') {
      setupResult = await setupGitHub(userInfo, tunnelCredentials, options);
    } else {
      setupResult = await setupGitLab(userInfo, tunnelCredentials, options);
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
      console.error(chalk.yellow('Hint: Use --non-interactive flag for non-interactive mode'));
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
