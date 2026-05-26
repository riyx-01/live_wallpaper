import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Colors for log prefixes
const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';

console.log(`${GREEN}🚀 Starting WhisperWall development servers...${RESET}\n`);

// 1. Start backend server directly with node
const server = spawn(process.execPath, ['server/server.js'], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env }
});

// 2. Start Vite dev server directly with node
const viteBin = path.join(__dirname, 'client', 'node_modules', 'vite', 'bin', 'vite.js');
const client = spawn(process.execPath, [viteBin], {
  cwd: path.join(__dirname, 'client'),
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env }
});

// Pipe server output with prefix
server.stdout.on('data', (data) => {
  for (const line of data.toString().split('\n').filter(Boolean)) {
    console.log(`${CYAN}[server]${RESET} ${line}`);
  }
});
server.stderr.on('data', (data) => {
  for (const line of data.toString().split('\n').filter(Boolean)) {
    console.error(`${CYAN}[server]${RESET} ${RED}${line}${RESET}`);
  }
});

// Pipe client output with prefix
client.stdout.on('data', (data) => {
  for (const line of data.toString().split('\n').filter(Boolean)) {
    console.log(`${MAGENTA}[client]${RESET} ${line}`);
  }
});
client.stderr.on('data', (data) => {
  for (const line of data.toString().split('\n').filter(Boolean)) {
    console.error(`${MAGENTA}[client]${RESET} ${RED}${line}${RESET}`);
  }
});

const safeKill = (child) => {
  try {
    if (child) {
      child.kill();
    }
  } catch (e) {
    // ignore
  }
};

// Handle exits
server.on('close', (code) => {
  console.log(`${CYAN}[server]${RESET} exited with code ${code}`);
  safeKill(client);
  process.exit(code);
});

client.on('close', (code) => {
  console.log(`${MAGENTA}[client]${RESET} exited with code ${code}`);
  safeKill(server);
  process.exit(code);
});

// Forward Ctrl+C to both children
process.on('SIGINT', () => {
  console.log(`\n${GREEN}Shutting down...${RESET}`);
  safeKill(server);
  safeKill(client);
  process.exit(0);
});
