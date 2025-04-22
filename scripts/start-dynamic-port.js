/**
 * Start Next.js server on a dynamically assigned port
 */

const { spawn } = require('child_process');
const { main: findPort } = require('./find-available-port');

async function startServer() {
  try {
    console.log('🚀 Starting Next.js server with dynamic port...');
    
    // Find an available port
    const port = await findPort();
    
    // Start the Next.js dev server with the available port
    const nextProcess = spawn('npx', ['next', 'dev', '-p', port.toString()], {
      stdio: 'inherit',
      shell: true
    });
    
    // Handle process exit
    nextProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Next.js process exited with code ${code}`);
      }
    });
    
    // Handle signals to properly close the server
    process.on('SIGINT', () => {
      console.log('\nShutting down server...');
      nextProcess.kill('SIGINT');
    });
    
    process.on('SIGTERM', () => {
      console.log('\nShutting down server...');
      nextProcess.kill('SIGTERM');
    });
    
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer(); 