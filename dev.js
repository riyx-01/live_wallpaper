import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';

const isPortFree = (port) => new Promise((resolve) => {
  const probe = net.createServer();

  probe.once('error', () => resolve(false));
  probe.once('listening', () => {
    probe.close(() => resolve(true));
  });
  probe.listen(port, '0.0.0.0');
});

const findFreePort = async (startPort) => {
  for (let port = startPort; port < startPort + 50; port += 1) {
    if (await isPortFree(port)) return port;
  }

  throw new Error(`Could not find a free port from ${startPort} to ${startPort + 49}`);
};

const getLanUrls = (clientPort) => {
  const urls = [];
  const networks = os.networkInterfaces();

  for (const interfaces of Object.values(networks)) {
    for (const netInfo of interfaces || []) {
      if (netInfo.family === 'IPv4' && !netInfo.internal) {
        urls.push(`http://${netInfo.address}:${clientPort}`);
      }
    }
  }

  return urls;
};

const safeKill = (child) => {
  try {
    if (child) child.kill();
  } catch {
    // ignore shutdown races
  }
};

const main = async () => {
  console.log(`${GREEN}Starting WhisperWall local realtime servers...${RESET}\n`);

  const serverPort = await findFreePort(5000);
  const clientPort = await findFreePort(5173);

  if (serverPort !== 5000) {
    console.log(`${YELLOW}Port 5000 is busy, using backend port ${serverPort}.${RESET}`);
  }

  if (clientPort !== 5173) {
    console.log(`${YELLOW}Port 5173 is busy, using client port ${clientPort}.${RESET}`);
  }

  const server = spawn(process.execPath, ['server/server.js'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: String(serverPort)
    }
  });

  const viteBin = path.join(__dirname, 'client', 'node_modules', 'vite', 'bin', 'vite.js');
  const client = spawn(process.execPath, [viteBin, '--host', '0.0.0.0', '--port', String(clientPort)], {
    cwd: path.join(__dirname, 'client'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      BACKEND_URL: `http://localhost:${serverPort}`
    }
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
      console.log(`\n${GREEN}Local app:${RESET} ${GREEN}http://localhost:${clientPort}${RESET}`);

      const lanUrls = getLanUrls(clientPort);
      if (lanUrls.length > 0) {
        console.log(`${GREEN}Open this app on another device on the same Wi-Fi:${RESET}`);
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
};

main().catch((error) => {
  console.error(`${RED}${error.message}${RESET}`);
  process.exit(1);
});
