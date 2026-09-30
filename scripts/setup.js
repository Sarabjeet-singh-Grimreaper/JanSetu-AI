#!/usr/bin/env node
/**
 * JanSetu AI (जनसेतु) - 1-Click Automated Setup Script
 * Sets up dependencies, environment configurations, and builds the client.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

function logStep(step, message) {
  console.log(`\n${colors.cyan}${colors.bright}[Step ${step}]${colors.reset} ${colors.bright}${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logWarn(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✖ ${message}${colors.reset}`);
}

console.log(`${colors.magenta}${colors.bright}
========================================================================
   JanSetu AI (जनसेतु) - 1-Click Automated Platform Setup
   Digital Public Good for Citizen Voice & Infrastructure Intelligence
========================================================================${colors.reset}`);

try {
  // 1. Check Node.js Version
  logStep('1/5', 'Checking Node.js environment...');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.replace(/^v/, '').split('.')[0], 10);
  console.log(`  Current Node.js version: ${nodeVersion}`);

  if (majorVersion < 18) {
    logWarn(`Node.js v18 or higher is required (found ${nodeVersion}). Please update Node.js.`);
  } else {
    logSuccess(`Node.js version compatible (${nodeVersion})`);
  }

  // 2. Install Root Dependencies
  logStep('2/5', 'Installing Root dependencies...');
  execSync('npm install', { cwd: rootDir, stdio: 'inherit' });
  logSuccess('Root dependencies ready');

  // 3. Install Server Dependencies
  logStep('3/5', 'Installing Server dependencies (Express, Gemini SDK)...');
  execSync('npm install', { cwd: serverDir, stdio: 'inherit' });
  logSuccess('Server dependencies ready');

  // 4. Install Client Dependencies
  logStep('4/5', 'Installing Client dependencies (React 19, Leaflet, Tailwind)...');
  execSync('npm install', { cwd: clientDir, stdio: 'inherit' });
  logSuccess('Client dependencies ready');

  // 5. Setup Environment File
  logStep('5/5', 'Configuring environment files...');
  const serverEnv = path.join(serverDir, '.env');
  const serverEnvExample = path.join(serverDir, '.env.example');
  
  if (!fs.existsSync(serverEnv)) {
    if (fs.existsSync(serverEnvExample)) {
      fs.copyFileSync(serverEnvExample, serverEnv);
      logSuccess('Created server/.env from template (.env.example)');
    } else {
      const defaultEnv = 'PORT=5000\nGEMINI_API_KEY=\nGEMINI_MODEL=gemini-2.5-flash\nNODE_ENV=development\n';
      fs.writeFileSync(serverEnv, defaultEnv);
      logSuccess('Generated default server/.env');
    }
  } else {
    logSuccess('Existing server/.env detected (retained)');
  }

  // 6. Build Client
  console.log(`\n${colors.cyan}${colors.bright}[Build]${colors.reset} ${colors.bright}Building frontend production bundle...${colors.reset}`);
  execSync('npm run build --prefix client', { cwd: rootDir, stdio: 'inherit' });
  logSuccess('Frontend bundle built successfully');

  // All Done!
  console.log(`\n${colors.green}${colors.bright}
========================================================================
   🎉 JanSetu AI Platform Setup Complete!
========================================================================${colors.reset}

${colors.bright}How to run:${colors.reset}

  ${colors.cyan}1. Development Mode (with hot-reload for client & server):${colors.reset}
     ${colors.yellow}npm run dev${colors.reset}
     → Server: http://localhost:5000
     → Client: http://localhost:5173

  ${colors.cyan}2. Production / Single-Server Demo Mode:${colors.reset}
     ${colors.yellow}npm start${colors.reset}
     → Unified Fullstack App: http://localhost:5000

  ${colors.cyan}3. Google AI Studio (Optional):${colors.reset}
     Add your API key into ${colors.yellow}server/.env${colors.reset} or set it in the
     in-app AI Studio settings modal. If left blank, JanSetu AI automatically
     runs its built-in intelligent offline engine!
`);

} catch (error) {
  logError(`Setup encountered an issue: ${error.message}`);
  console.log(`
${colors.yellow}Troubleshooting tips:${colors.reset}
  - Ensure you have network access for npm packages.
  - Run ${colors.yellow}npm cache clean --force${colors.reset} and re-run ${colors.yellow}npm run setup${colors.reset}.
  - For manual installation:
      cd server && npm install
      cd ../client && npm install && npm run build
      cd .. && npm start
`);
  process.exit(1);
}
