/**
 * This script safely cleans the Next.js cache directory
 * It handles permission errors and locked files on Windows
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to the Next.js cache
const nextCacheDir = path.join(process.cwd(), '.next');

console.log('Cleaning Next.js cache...');

try {
  // Check if .next directory exists
  if (fs.existsSync(nextCacheDir)) {
    // Special handling for Windows platform
    if (process.platform === 'win32') {
      try {
        // First try to use rimraf if available
        try {
          // Try to use the installed rimraf
          require('rimraf').sync(nextCacheDir, { 
            maxRetries: 3, 
            glob: false 
          });
          console.log('Successfully deleted .next directory with rimraf');
        } catch (rimrafErr) {
          // Fallback to cmd on Windows - the /s flag deletes directories and contents, /q is quiet mode
          console.log('Rimraf failed, using Windows commands as fallback...');
          try {
            // Use rd /s /q to remove directory and suppress confirmation
            execSync(`rd /s /q "${nextCacheDir}"`, { stdio: 'ignore' });
            console.log('Successfully deleted .next directory with rd command');
          } catch (cmdErr) {
            // If even that fails, try selectively removing files except for 'trace'
            console.log('Selective file deletion as fallback...');
            
            // Get all files and directories in .next except trace
            const items = fs.readdirSync(nextCacheDir).filter(item => item !== 'trace');
            
            // Delete each item
            for (const item of items) {
              const itemPath = path.join(nextCacheDir, item);
              try {
                if (fs.statSync(itemPath).isDirectory()) {
                  execSync(`rd /s /q "${itemPath}"`, { stdio: 'ignore' });
                } else {
                  fs.unlinkSync(itemPath);
                }
              } catch (e) {
                console.log(`Couldn't delete ${itemPath}: ${e.message}`);
              }
            }
            console.log('Performed partial cache deletion (trace file may remain)');
          }
        }
      } catch (winError) {
        console.error(`Windows deletion failed: ${winError.message}`);
      }
    } else {
      // For non-Windows platforms, use standard fs operations
      try {
        require('rimraf').sync(nextCacheDir);
        console.log('Successfully deleted .next directory');
      } catch (nonWinError) {
        console.error(`Cache deletion failed: ${nonWinError.message}`);
      }
    }
  } else {
    console.log('.next directory does not exist, nothing to clean');
  }
  
  // Now also create a blank .next directory if it doesn't exist yet
  // This helps with initial setup
  if (!fs.existsSync(nextCacheDir)) {
    fs.mkdirSync(nextCacheDir, { recursive: true });
    console.log('Created new empty .next directory');
  }
  
  console.log('Cache cleaning complete');
} catch (error) {
  console.error(`Error during cache cleaning: ${error.message}`);
  // Exit with success anyway, so next dev still runs
  process.exit(0);
} 