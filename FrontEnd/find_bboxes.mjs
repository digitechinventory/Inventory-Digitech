import sharp from 'sharp';

async function findBBoxes() {
  const { data, info } = await sharp('public/official-full-dark-1024.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minXEmblem = 1024, maxXEmblem = 0, minYEmblem = 1024, maxYEmblem = 0;
  let minXText = 1024, maxXText = 0, minYText = 1024, maxYText = 0;

  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const alpha = data[(y * 1024 + x) * 4 + 3];
      if (alpha > 20) {
        if (y < 700) {
          if (x < minXEmblem) minXEmblem = x;
          if (x > maxXEmblem) maxXEmblem = x;
          if (y < minYEmblem) minYEmblem = y;
          if (y > maxYEmblem) maxYEmblem = y;
        } else {
          if (x < minXText) minXText = x;
          if (x > maxXText) maxXText = x;
          if (y < minYText) minYText = y;
          if (y > maxYText) maxYText = y;
        }
      }
    }
  }

  console.log('Emblem BBox:', { minX: minXEmblem, maxX: maxXEmblem, minY: minYEmblem, maxY: maxYEmblem, width: maxXEmblem - minXEmblem, height: maxYEmblem - minYEmblem });
  console.log('Text BBox:', { minX: minXText, maxX: maxXText, minY: minYText, maxY: maxYText, width: maxXText - minXText, height: maxYText - minYText });
}

findBBoxes().catch(console.error);
