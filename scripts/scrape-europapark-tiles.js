/**
 * Europa-Park Map Tile Scraper
 * 
 * Downloads all map tiles from Europa-Park's interactive map.
 * Tiles are saved in: public/tiles/{z}/{x}/{y}.png
 * 
 * Usage: node scripts/scrape-europapark-tiles.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const BASE_URL = 'https://www.europapark.de/modules/custom/ep8_parkplan/map/ep/offseason';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'tiles');

// Zoom levels to scrape (adjust based on what you see in Network tab)
const MIN_ZOOM = 2;
const MAX_ZOOM = 7;

// Rate limiting (ms between requests) - be nice to their server
const DELAY_MS = 100;

// Request timeout (ms)
const TIMEOUT_MS = 10000;

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadTile(z, x, y) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/${z}/${x}/${y}.png`;
    const dir = path.join(OUTPUT_DIR, String(z), String(x));
    const filePath = path.join(dir, `${y}.png`);

    // Skip if already exists
    if (fs.existsSync(filePath)) {
      resolve({ status: 'exists', z, x, y });
      return;
    }

    fs.mkdirSync(dir, { recursive: true });

    const request = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.europapark.de/freizeitpark/attraktionen/interaktiver-europa-park-parkplan',
        'Accept': 'image/png,image/*,*/*;q=0.8',
      },
      timeout: TIMEOUT_MS,
    }, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(filePath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve({ status: 'downloaded', z, x, y });
        });
        file.on('error', (err) => {
          fs.unlinkSync(filePath);
          reject(err);
        });
      } else if (response.statusCode === 404) {
        resolve({ status: 'notfound', z, x, y });
      } else {
        resolve({ status: 'error', z, x, y, code: response.statusCode });
      }
    });

    request.on('error', (err) => {
      resolve({ status: 'error', z, x, y, error: err.message });
    });

    request.on('timeout', () => {
      request.destroy();
      resolve({ status: 'timeout', z, x, y });
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DISCOVERY: Find tile bounds for each zoom level
// ═══════════════════════════════════════════════════════════════════════════

async function discoverBounds(z, startX = 0, startY = 0, maxSearch = 100) {
  console.log(`\n🔍 Discovering bounds for zoom level ${z}...`);
  
  let minX = Infinity, maxX = -1;
  let minY = Infinity, maxY = -1;
  let foundTiles = 0;

  // Search in expanding squares from a starting point
  // First, find any valid tile
  let foundFirst = false;
  
  for (let x = startX; x < startX + maxSearch && !foundFirst; x++) {
    for (let y = startY; y < startY + maxSearch && !foundFirst; y++) {
      const result = await downloadTile(z, x, y);
      if (result.status === 'downloaded' || result.status === 'exists') {
        minX = maxX = x;
        minY = maxY = y;
        foundFirst = true;
        console.log(`   Found first tile at ${z}/${x}/${y}`);
      }
      await sleep(50);
    }
  }

  if (!foundFirst) {
    console.log(`   No tiles found for zoom ${z}`);
    return null;
  }

  // Expand in all directions to find bounds
  // Expand left
  let x = minX - 1;
  while (x >= 0) {
    const result = await downloadTile(z, x, minY);
    if (result.status === 'downloaded' || result.status === 'exists') {
      minX = x;
      x--;
    } else break;
    await sleep(50);
  }

  // Expand right
  x = maxX + 1;
  while (x < 1000) {
    const result = await downloadTile(z, x, minY);
    if (result.status === 'downloaded' || result.status === 'exists') {
      maxX = x;
      x++;
    } else break;
    await sleep(50);
  }

  // Expand up
  let y = minY - 1;
  while (y >= 0) {
    const result = await downloadTile(z, minX, y);
    if (result.status === 'downloaded' || result.status === 'exists') {
      minY = y;
      y--;
    } else break;
    await sleep(50);
  }

  // Expand down
  y = maxY + 1;
  while (y < 1000) {
    const result = await downloadTile(z, minX, y);
    if (result.status === 'downloaded' || result.status === 'exists') {
      maxY = y;
      y++;
    } else break;
    await sleep(50);
  }

  console.log(`   Bounds: x=${minX}-${maxX}, y=${minY}-${maxY}`);
  return { minX, maxX, minY, maxY };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCRAPER
// ═══════════════════════════════════════════════════════════════════════════

async function scrapeZoomLevel(z, bounds) {
  const { minX, maxX, minY, maxY } = bounds;
  const totalTiles = (maxX - minX + 1) * (maxY - minY + 1);
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`\n📥 Downloading zoom level ${z} (${totalTiles} tiles)...`);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const result = await downloadTile(z, x, y);
      
      if (result.status === 'downloaded') {
        downloaded++;
        process.stdout.write(`\r   Progress: ${downloaded + skipped}/${totalTiles} (${downloaded} new, ${skipped} cached)`);
      } else if (result.status === 'exists') {
        skipped++;
        process.stdout.write(`\r   Progress: ${downloaded + skipped}/${totalTiles} (${downloaded} new, ${skipped} cached)`);
      } else {
        failed++;
      }
      
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n   ✅ Done: ${downloaded} downloaded, ${skipped} cached, ${failed} failed`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Europa-Park Map Tile Scraper');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Zoom levels: ${MIN_ZOOM} to ${MAX_ZOOM}`);
  console.log(`Delay between requests: ${DELAY_MS}ms`);

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Known starting points (from your screenshot: z=5, x=6, y=12)
  // At lower zooms, coordinates are halved
  const startHints = {
    2: { x: 0, y: 1 },
    3: { x: 1, y: 3 },
    4: { x: 3, y: 6 },
    5: { x: 6, y: 12 },
    6: { x: 12, y: 24 },
    7: { x: 24, y: 48 },
  };

  const allBounds = {};

  // Phase 1: Discover bounds for each zoom level
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  PHASE 1: Discovering tile bounds');
  console.log('═══════════════════════════════════════════════════════════════');

  for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
    const hint = startHints[z] || { x: 0, y: 0 };
    const bounds = await discoverBounds(z, hint.x, hint.y);
    if (bounds) {
      allBounds[z] = bounds;
    }
  }

  // Phase 2: Download all tiles
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  PHASE 2: Downloading all tiles');
  console.log('═══════════════════════════════════════════════════════════════');

  for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
    if (allBounds[z]) {
      await scrapeZoomLevel(z, allBounds[z]);
    }
  }

  // Save bounds info for reference
  const boundsFile = path.join(OUTPUT_DIR, 'bounds.json');
  fs.writeFileSync(boundsFile, JSON.stringify(allBounds, null, 2));
  console.log(`\n📄 Bounds saved to ${boundsFile}`);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ✅ COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Tiles saved to: ${OUTPUT_DIR}`);
  console.log('\nTo use in Leaflet:');
  console.log(`  L.tileLayer('/tiles/{z}/{x}/{y}.png').addTo(map);`);
}

main().catch(console.error);
