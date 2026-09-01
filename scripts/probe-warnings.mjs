/**
 * Sonde ciblee : le warning « vsRepeat: size mismatch » se declenche-t-il
 * reellement sur la vue treeTable de client ?
 *
 * Question posee par le commit amont ea4bbe8 (2.0.14), qui ajoute un provider
 * `vsRepeatConfig` permettant de faire taire ce warning. Savoir s'il est utile
 * de porter ce commit revient a savoir si le warning apparait chez nous — et
 * a quelle frequence.
 *
 * Le script de mesure ne captait que les `console.error` : les `warn` lui
 * echappaient, donc leur absence dans les rapports ne prouvait rien.
 */
import { chromium } from 'playwright';
import { join } from 'node:path';

const URL = process.argv[2] || 'https://localhost:4400/legacy#!/app/tours/orders/filter/allTours';
const PROFILE = join(process.cwd(), '.playwright-profile');
const SHADOW_HOST = 'front-hybrid-legacy-wrapper';

const context = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1600, height: 900 },
  ignoreHTTPSErrors: true,
  args: ['--ignore-certificate-errors'],
});
const page = context.pages()[0] || (await context.newPage());

const warnings = [];
const all = [];
page.on('console', (msg) => {
  const text = msg.text();
  all.push({ type: msg.type(), text: text.slice(0, 160) });
  if (/vsRepeat|size mismatch/i.test(text)) warnings.push({ type: msg.type(), text });
});

console.log(`Cible : ${URL}`);
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

// Attend la grille, puis scrolle : le warning est emis dans un $$postDigest
// apres un recalcul, donc il faut provoquer plusieurs cycles.
for (let i = 0; i < 90; i++) {
  const ready = await page.evaluate((hostSel) => {
    const host = document.querySelector(hostSel);
    const root = host && host.shadowRoot;
    if (!root) return false;
    const grid = root.querySelector('.grid-body');
    return !!(grid && grid.querySelectorAll('.tree-table-row').length);
  }, SHADOW_HOST).catch(() => false);
  if (ready) break;
  await page.waitForTimeout(2000);
}

console.log('Grille detectee, on provoque des recalculs...');

await page.evaluate(async (hostSel) => {
  const root = document.querySelector(hostSel).shadowRoot;
  const grid = root.querySelector('.grid-body');
  let sc = grid.parentElement;
  while (sc && !sc.matches('.custom-scrollbar')) sc = sc.parentElement;
  const max = sc.scrollHeight - sc.clientHeight;
  for (const p of [0, 0.3, 0.6, 1, 0.5, 0]) {
    sc.scrollTop = Math.round(max * p);
    sc.dispatchEvent(new Event('scroll'));
    await new Promise((r) => setTimeout(r, 400));
  }
}, SHADOW_HOST);

await page.waitForTimeout(2000);

console.log('');
console.log(`messages console totaux : ${all.length}`);
console.log(`dont lies a vsRepeat    : ${warnings.length}`);
console.log('');
if (warnings.length) {
  console.log('>>> LE WARNING SE DECLENCHE :');
  warnings.slice(0, 5).forEach((w) => console.log(`  [${w.type}] ${w.text.slice(0, 200)}`));
} else {
  console.log('>>> Aucun warning vsRepeat sur ce parcours.');
  console.log('    Repartition des messages captes :');
  const byType = {};
  for (const m of all) byType[m.type] = (byType[m.type] || 0) + 1;
  console.log('   ', JSON.stringify(byType));
}

await context.close();
