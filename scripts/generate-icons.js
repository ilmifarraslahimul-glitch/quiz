import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const svgPath = path.resolve('./public/icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('./public/pwa-192x192.png');
  console.log('Generated pwa-192x192.png');

  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('./public/pwa-512x512.png');
  console.log('Generated pwa-512x512.png');

  // Apple touch icon 180x180 PNG
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('./public/apple-touch-icon.png');
  console.log('Generated apple-touch-icon.png');

  // Maskable icon with 15% safe area padding (background gradient bleed, resized icon inside)
  const innerSize = Math.round(512 * 0.76); // safe zone 389px
  const innerIcon = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .toBuffer();

  // Create 512x512 background canvas and composite inner icon in center
  const bgSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4F46E5" />
        <stop offset="50%" stop-color="#7C3AED" />
        <stop offset="100%" stop-color="#06B6D4" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#g)" />
  </svg>`;

  await sharp(Buffer.from(bgSvg))
    .composite([
      {
        input: innerIcon,
        top: Math.round((512 - innerSize) / 2),
        left: Math.round((512 - innerSize) / 2),
      },
    ])
    .png()
    .toFile('./public/pwa-maskable-512x512.png');
  console.log('Generated pwa-maskable-512x512.png');

  // Also create favicon.ico / favicon.png
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile('./public/favicon.png');
  console.log('Generated favicon.png');
}

generateIcons().catch((err) => {
  console.error(err);
  process.exit(1);
});
