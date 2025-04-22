// Simple script to start Next.js on port 3001
const { spawn } = require('child_process');
const os = require('os');

console.log('Starting VerdantAI on port 3001...');

// Determine correct command based on OS
const command = os.platform() === 'win32' ? 'npx.cmd' : 'npx';

// Start Next.js on port 3001
const nextProcess = spawn(command, ['next', 'dev', '-p', '3001'], {
  stdio: 'inherit',
  shell: true
});

nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
});

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\nStopping VerdantAI...');
  nextProcess.kill('SIGINT');
  process.exit(0);
});

console.log('VerdantAI is running at http://localhost:3001'); 