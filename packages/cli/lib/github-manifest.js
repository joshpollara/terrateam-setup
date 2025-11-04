const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const https = require('https');
const updateDotenv = require('update-dotenv');

/**
 * Load package.json
 */
function getPkg() {
  let pkg;
  try {
    pkg = require(path.join(process.cwd(), 'package.json'));
  } catch (e) {
    pkg = {};
  }
  return pkg;
}

/**
 * Generate GitHub App manifest
 */
function getManifest(baseUrl) {
  const pkg = getPkg();
  let manifest = {};

  // Try to load app.yml
  try {
    const appYmlPath = path.join(process.cwd(), 'app.yml');
    const file = fs.readFileSync(appYmlPath, 'utf8');
    manifest = yaml.safeLoad(file);
  } catch (error) {
    // App config does not exist, which is ok.
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const generatedManifest = {
    description: manifest.description || pkg.description || 'Terrateam GitOps for Infrastructure as Code',
    hook_attributes: {
      url: 'https://terrateam.io',
    },
    name: process.env.PROJECT_DOMAIN || manifest.name || pkg.name || 'terrateam',
    public: manifest.public !== undefined ? manifest.public : false,
    redirect_url: `${baseUrl}/probot/success`,
    url: manifest.url || pkg.homepage || pkg.repository || 'https://terrateam.io/',
    version: 'v1',
    ...manifest
  };

  return JSON.stringify(generatedManifest);
}

/**
 * Make HTTP request to GitHub API
 */
function makeGitHubRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const protocol = urlObj.protocol === 'http:' ? require('http') : https;

    const req = protocol.request(requestOptions, (res) => {
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
 * Create GitHub App from manifest code
 */
async function createAppFromCode(code, tunnelCredentials = null) {
  // Development mode - use mock data
  if (process.env.TERRATEAM_DEV_MODE === 'true') {
    console.log('Development mode: Using mock GitHub app data');

    const mockResponse = {
      id: 123456,
      client_id: 'Iv1.mock-client-id-dev',
      client_secret: 'mock-client-secret-for-development',
      webhook_secret: 'mock-webhook-secret-dev',
      pem: `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA2mock+private+key+for+development+mode+only
This is a mock private key for development purposes only.
Do not use this in production!
-----END RSA PRIVATE KEY-----`,
      html_url: 'https://github.com/apps/terrateam-dev-app',
      owner: {
        login: 'dev-user'
      }
    };

    // Update .env file with mock values
    await updateEnv(mockResponse, tunnelCredentials);

    return mockResponse;
  }

  // Production mode - call GitHub API
  const baseUrl = process.env.GHE_HOST
    ? `${process.env.GHE_PROTOCOL || 'https'}://${process.env.GHE_HOST}/api/v3`
    : 'https://api.github.com';

  const url = `${baseUrl}/app-manifests/${code}/conversions`;

  try {
    const response = await makeGitHubRequest(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Terrateam-Setup-CLI'
      }
    });

    const { id, client_id, client_secret, webhook_secret, pem, html_url, owner } = response;

    // Update .env file
    await updateEnv(response, tunnelCredentials);

    return {
      id,
      client_id,
      client_secret,
      webhook_secret,
      pem,
      html_url,
      owner,
      tunnelUrl: tunnelCredentials?.tunnel_url || null
    };
  } catch (error) {
    throw new Error(`Failed to create GitHub App: ${error.message}`);
  }
}

/**
 * Update .env file with GitHub App credentials
 */
async function updateEnv(appData, tunnelCredentials) {
  const envPath = path.join(process.cwd(), '.env');

  // Read existing .env file or create new one
  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    // File doesn't exist, will be created
  }

  // Prepare environment variables
  const envVars = {
    GITHUB_APP_ID: appData.id.toString(),
    GITHUB_APP_PEM: appData.pem,
    GITHUB_WEBHOOK_SECRET: appData.webhook_secret,
    GITHUB_APP_CLIENT_ID: appData.client_id,
    GITHUB_APP_CLIENT_SECRET: appData.client_secret,
    GITHUB_APP_URL: appData.html_url
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

  // Update .env file
  await updateDotenv(envVars);

  return envPath;
}

module.exports = {
  getManifest,
  createAppFromCode,
  getPkg
};
