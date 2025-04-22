const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Ensure icons directory exists
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to generate a simple plant icon
async function generateIcons() {
  try {
    const sizes = [192, 512];
    
    for (const size of sizes) {
      // Create canvas with the desired size
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Set background
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(0, 0, size, size);
      
      // Draw a simple plant icon
      const padding = size * 0.2;
      const centerX = size / 2;
      
      // Draw stem
      ctx.beginPath();
      ctx.strokeStyle = '#388E3C';
      ctx.lineWidth = size * 0.08;
      ctx.moveTo(centerX, size - padding);
      ctx.lineTo(centerX, padding * 2);
      ctx.stroke();
      
      // Draw leaves
      ctx.fillStyle = '#81C784';
      
      // Left leaf
      ctx.beginPath();
      ctx.ellipse(
        centerX - padding, 
        size / 2, 
        size * 0.25, 
        size * 0.15, 
        Math.PI / 4, 
        0, 
        2 * Math.PI
      );
      ctx.fill();
      
      // Right leaf
      ctx.beginPath();
      ctx.ellipse(
        centerX + padding * 0.8, 
        size / 2 - padding * 0.3, 
        size * 0.25, 
        size * 0.15, 
        -Math.PI / 4, 
        0, 
        2 * Math.PI
      );
      ctx.fill();
      
      // Save the image
      const buffer = canvas.toBuffer('image/png');
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`Generated ${outputPath}`);
    }
    
    console.log('Icon generation completed successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Run the icon generation
generateIcons(); 