import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const pythonCmd = isWindows ? 'python' : 'python3';

console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════════');
console.log('\x1b[36m%s\x1b[0m', '  Starting Monetunes (Python FastAPI + React JSX)');
console.log('\x1b[36m%s\x1b[0m', '  Backend:  http://localhost:3001  (FastAPI Swagger: /docs)');
console.log('\x1b[36m%s\x1b[0m', '  Frontend: http://localhost:5173');
console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════════\n');

// Start Python FastAPI backend
const backend = spawn(pythonCmd, ['-m', 'uvicorn', 'main:app', '--reload', '--port', '3001', '--app-dir', 'backend'], {
  cwd: path.resolve(__dirname),
  stdio: 'pipe',
  shell: true,
});

backend.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[34m[FastAPI Backend]\x1b[0m ${data.toString()}`);
});

backend.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[31m[FastAPI Error]\x1b[0m ${data.toString()}`);
});

// Start React frontend
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.resolve(__dirname, 'frontend'),
  stdio: 'pipe',
  shell: true,
});

frontend.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[32m[React Frontend]\x1b[0m ${data.toString()}`);
});

frontend.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[31m[Frontend Error]\x1b[0m ${data.toString()}`);
});

function cleanup() {
  console.log('\nStopping all services...');
  if (isWindows) {
    if (backend.pid) spawn('taskkill', ['/pid', backend.pid.toString(), '/f', '/t']);
    if (frontend.pid) spawn('taskkill', ['/pid', frontend.pid.toString(), '/f', '/t']);
  } else {
    backend.kill('SIGINT');
    frontend.kill('SIGINT');
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
