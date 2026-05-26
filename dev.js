import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';

const getLanUrls = () => {
  const urls = [];
  const networks = os.networkInterfaces();

  for (const interfaces of Object.values(networks)) {
    for (const net of interfaces || []) {
      if (net.family === 'IPv4' && !net.internal) {
        urls.push(`http://${net.address}:5173`);
      }
    }
  }

  return urls;
};

console.log(`${GREEN}Starting WhisperWall local realtime servers...${RESET}\n`);

const server = spawn(process.execPath, ['server/server.js'], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env }
});

const viteBin = path.join(__dirname, 'client', 'node_modules', 'vite', 'bin', 'vite.js');
const client = spawn(process.execPath, [viteBin, '--host', '0.0.0.0'], {
  cwd: path.join(__dirname, 'client'),
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env }
});

let printedLanUrls = false;

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

client.stdout.on('data', (data) => {
  for (const line of data.toString().split('\n').filter(Boolean)) {
    console.log(`${MAGENTA}[client]${RESET} ${line}`);
  }

  if (!printedLanUrls) {
    printedLanUrls = true;
    const lanUrls = getLanUrls();
    if (lanUrls.length > 0) {
      console.log(`\n${GREEN}Open this app on another device on the same Wi-Fi:${RESET}`);
      lanUrls.forEach((url) => console.log(`${GREEN}${url}${RESET}`));
      console.log('');
    }
  }
});

client.stderr.on('data', (data) => {
  for (const line of data.toString().split('\n').filter(Boolean)) {
    console.error(`${MAGENTA}[client]${RESET} ${RED}${line}${RESET}`);
  }
});

const safeKill = (child) => {
  try {
    if (child) child.kill();
  } catch {
    // ignore shutdown races
  }
};

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

process.on('SIGINT', () => {
  console.log(`\n${GREEN}Shutting down...${RESET}`);
  safeKill(server);
  safeKill(client);
  process.exit(0);
});
