/**
 * Fix Dependencies Script
 * 
 * This script fixes common dependency issues that can cause build errors:
 * 1. Creates empty shims for problematic dependencies
 * 2. Patches modules that use unsupported Node.js features
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Running dependency fixes...');

// Directory for shims
const shimDir = path.resolve(__dirname, '../node_modules/.shims');
if (!fs.existsSync(shimDir)) {
  fs.mkdirSync(shimDir, { recursive: true });
}

// Create a shim for @opentelemetry/exporter-jaeger if it's causing issues
const jaegerShimPath = path.resolve(shimDir, '@opentelemetry-exporter-jaeger.js');
fs.writeFileSync(jaegerShimPath, `
// Empty shim for @opentelemetry/exporter-jaeger
module.exports = {
  JaegerExporter: class JaegerExporter {
    constructor() {}
    shutdown() { return Promise.resolve(); }
  }
};
`);

// Try to patch handlebars to remove require.extensions
try {
  const handlebarsPath = path.resolve(__dirname, '../node_modules/handlebars/lib/index.js');
  
  if (fs.existsSync(handlebarsPath)) {
    let content = fs.readFileSync(handlebarsPath, 'utf8');
    
    // Replace require.extensions with empty object to avoid webpack errors
    if (content.includes('require.extensions')) {
      content = content.replace(/require\.extensions\[[^\]]+\]/g, '{}');
      fs.writeFileSync(handlebarsPath, content);
      console.log('✅ Patched handlebars/lib/index.js to fix require.extensions');
    }
  }
} catch (error) {
  console.error('❌ Error patching handlebars:', error.message);
}

// Set environment variable to disable OpenTelemetry SDK
process.env.OTEL_SDK_DISABLED = 'true';

// Create .env.local file if it doesn't exist to persist the setting
const envPath = path.resolve(__dirname, '../.env.local');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

if (!envContent.includes('OTEL_SDK_DISABLED')) {
  fs.writeFileSync(
    envPath, 
    envContent + '\n# Disable OpenTelemetry to fix build errors\nOTEL_SDK_DISABLED=true\n'
  );
}

console.log('✅ Dependency fixes completed'); 