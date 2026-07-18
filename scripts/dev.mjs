// Zero-dependency dev runner: starts the server and web dev servers together,
// prefixes their output, and shuts both down on Ctrl+C or if either exits.
// (Replaces the `concurrently` dependency so `npm run dev` needs only Node.)

import { spawn } from 'node:child_process';

const RESET = '\x1b[0m';
const targets = [
  { name: 'server', color: '\x1b[34m', script: 'dev:server' }, // blue
  { name: 'web', color: '\x1b[32m', script: 'dev:web' }, // green
];

const children = [];
let shuttingDown = false;

function pipe(stream, name, color) {
  let buffer = '';
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) process.stdout.write(`${color}[${name}]${RESET} ${line}\n`);
  });
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGINT');
  }
  setTimeout(() => process.exit(code), 300);
}

for (const target of targets) {
  // shell:true so `npm` resolves on all platforms and the child gets node_modules/.bin on PATH.
  const child = spawn(`npm run ${target.script}`, { shell: true });
  pipe(child.stdout, target.name, target.color);
  pipe(child.stderr, target.name, target.color);
  child.on('exit', (code) => {
    process.stdout.write(`${target.color}[${target.name}]${RESET} exited (code ${code})\n`);
    shutdown(code ?? 0);
  });
  children.push(child);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
