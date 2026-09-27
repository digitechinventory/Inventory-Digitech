import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function extractOfficialLogos() {
  const outDir = 'c:/Users/KRAVEN/Documents/Digitech/Project/IMS_v0.1/FrontEnd/public';

  // 1. Crop Emblem Mark
  await sharp(path.join(outDir, 'official-full-dark-1024.png'))
    .extract({ left: 248, top: 124, width: 540, height: 568 })
    .png()
    .toFile(path.join(outDir, 'digitech-emblem-hd.png'));
  console.log('Saved digitech-emblem-hd.png!');

  // 2. Crop Text Mark (White Text for Dark backgrounds)
  await sharp(path.join(outDir, 'official-full-dark-1024.png'))
    .extract({ left: 190, top: 800, width: 648, height: 92 })
    .png()
    .toFile(path.join(outDir, 'digitech-text-white-hd.png'));

  // 3. Crop Text Mark (Dark Charcoal #0F172A for Light backgrounds)
  await sharp(path.join(outDir, 'official-full-light-1024.png'))
    .extract({ left: 190, top: 800, width: 648, height: 92 })
    .png()
    .toFile(path.join(outDir, 'digitech-text-dark-hd.png'));
  console.log('Saved cropped typography texts!');

  // 4. Create horizontal banner: [Emblem] [DIGITECH]
  // Dimensions: 520px wide, 110px high
  const emblemBuf = await sharp(path.join(outDir, 'digitech-emblem-hd.png'))
    .resize(100, 100, { fit: 'contain' })
    .toBuffer();

  const darkTextBuf = await sharp(path.join(outDir, 'digitech-text-white-hd.png'))
    .resize(null, 44)
    .toBuffer();

  const lightTextBuf = await sharp(path.join(outDir, 'digitech-text-dark-hd.png'))
    .resize(null, 44)
    .toBuffer();

  // Dark header composite (White text)
  await sharp({
    create: {
      width: 500,
      height: 110,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([
    { input: emblemBuf, top: 5, left: 5 },
    { input: darkTextBuf, top: 33, left: 125 }
  ])
  .png()
  .toFile(path.join(outDir, 'gems-digitech-official-dark.png'));

  // Light header composite (Dark charcoal text)
  await sharp({
    create: {
      width: 500,
      height: 110,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([
    { input: emblemBuf, top: 5, left: 5 },
    { input: lightTextBuf, top: 33, left: 125 }
  ])
  .png()
  .toFile(path.join(outDir, 'gems-digitech-official-light.png'));

  console.log('Saved horizontal official banners (dark & light)!');

  // Copy to primary asset filenames:
  fs.copyFileSync(path.join(outDir, 'gems-digitech-official-light.png'), path.join(outDir, 'logo-digitech.png'));
  fs.copyFileSync(path.join(outDir, 'gems-digitech-official-dark.png'), path.join(outDir, 'logo-digitech-dark.png'));
  fs.copyFileSync(path.join(outDir, 'digitech-emblem-hd.png'), path.join(outDir, 'digitech-icon.png'));
  fs.copyFileSync(path.join(outDir, 'digitech-emblem-hd.png'), path.join(outDir, 'favicon.png'));

  // Generate crisp SVGs
  const darkPngBase64 = fs.readFileSync(path.join(outDir, 'gems-digitech-official-dark.png')).toString('base64');
  const lightPngBase64 = fs.readFileSync(path.join(outDir, 'gems-digitech-official-light.png')).toString('base64');
  const emblemPngBase64 = fs.readFileSync(path.join(outDir, 'digitech-emblem-hd.png')).toString('base64');

  const svgDark = `<svg width="500" height="110" viewBox="0 0 500 110" fill="none" xmlns="http://www.w3.org/2000/svg">
  <image href="data:image/png;base64,${darkPngBase64}" width="500" height="110" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

  const svgLight = `<svg width="500" height="110" viewBox="0 0 500 110" fill="none" xmlns="http://www.w3.org/2000/svg">
  <image href="data:image/png;base64,${lightPngBase64}" width="500" height="110" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

  const svgEmblem = `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <image href="data:image/png;base64,${emblemPngBase64}" width="120" height="120" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

  fs.writeFileSync(path.join(outDir, 'logo-digitech.svg'), svgLight);
  fs.writeFileSync(path.join(outDir, 'logo-digitech-dark.svg'), svgDark);
  fs.writeFileSync(path.join(outDir, 'digitech-icon.svg'), svgEmblem);

  console.log('All official assets created and written successfully!');
}

extractOfficialLogos().catch(console.error);
