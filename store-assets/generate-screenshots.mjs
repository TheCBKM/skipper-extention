import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = __dirname;

const assets = [
  { html: 'screenshot-1280x800.html', output: 'screenshot-1280x800.png', width: 1280, height: 800 },
  { html: 'screenshot-440x280.html', output: 'screenshot-440x280.png', width: 440, height: 280 },
  { html: 'screenshot-1400x560.html', output: 'screenshot-1400x560.png', width: 1400, height: 560 },
];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const asset of assets) {
  const filePath = path.join(outDir, asset.html);
  await page.setViewportSize({ width: asset.width, height: asset.height });
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(asset.html.includes('iframe') ? 500 : 100);
  await page.screenshot({
    path: path.join(outDir, asset.output),
    type: 'png',
    omitBackground: false,
  });
  console.log(`Created ${asset.output}`);
}

await browser.close();
