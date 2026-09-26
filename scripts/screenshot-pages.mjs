// Screenshots of the pages a data update changes, for the reviewer of the update pull request.
// Reads .data-release/pages-to-check.json (written by npm run data:live): the landing page, then
// the clubs whose level changes, then clubs whose kits change, at most --max club pages.
//
//   npx serve out -l 4173 &
//   node scripts/screenshot-pages.mjs [--site http://localhost:4173] [--out screenshots] [--max 12]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const SITE = arg('site', 'http://localhost:4173').replace(/\/$/, '');
const OUT = path.resolve(arg('out', 'screenshots'));
const MAX = Number(arg('max', 12));
const LIST = path.resolve(process.env.BTJ_DATA_DIR ?? '.data-release', 'pages-to-check.json');

const { levelChanged = [], kitsChanged = [] } = fs.existsSync(LIST) ? JSON.parse(fs.readFileSync(LIST, 'utf8')) : {};
const clubs = [...new Set([...levelChanged, ...kitsChanged])].slice(0, MAX);
const pages = ['/', ...clubs.map((id) => `/clubs/${id}/`)];

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const p of pages) {
  await page.goto(`${SITE}${p}`, { waitUntil: 'networkidle' });
  const file = path.join(OUT, `${p.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'landing'}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`${p} → ${path.relative(process.cwd(), file)}`);
}
await browser.close();
