import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');

// SVG content for the bookshelf icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1f2937">
  <rect x="2" y="8" width="2" height="10" />
  <rect x="4.5" y="6" width="2" height="12" />
  <rect x="7" y="7" width="2" height="11" />
  <rect x="9.5" y="5" width="2" height="13" />
  <rect x="12" y="7" width="2" height="11" />
  <rect x="14.5" y="6" width="2" height="12" />
  <rect x="17" y="8" width="2" height="10" />
  <rect x="19.5" y="7" width="2" height="11" />
  <line x1="1" y1="19" x2="23" y2="19" stroke="#1f2937" stroke-width="1.5" />
</svg>`;

// Dynamic import of sharp
async function generateFavicons() {
  try {
    const sharp = (await import('sharp')).default;
    
    // Create SVG buffer
    const svgBuffer = Buffer.from(svgContent);
    
    // Generate favicon.ico (32x32)
    await sharp(svgBuffer, { density: 384 })
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(publicDir, 'favicon.ico'));
    
    // Generate apple-touch-icon.png (180x180)
    await sharp(svgBuffer, { density: 1080 })
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    
    // Generate icon-192.png for manifest (192x192)
    await sharp(svgBuffer, { density: 576 })
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(publicDir, 'icon-192.png'));
    
    // Generate icon-512.png for manifest (512x512)
    await sharp(svgBuffer, { density: 1536 })
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(publicDir, 'icon-512.png'));
    
    console.log('✓ Favicons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('sharp is not installed. Run: npm install --save-dev sharp');
      process.exit(1);
    }
    throw error;
  }
}

generateFavicons();
