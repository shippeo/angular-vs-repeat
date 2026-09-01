/**
 * Mesure le cout du polling requestAnimationFrame de la directive, sur la vue
 * treeTable reelle de client.
 *
 * Question de TECHFRONT-1471 : le mecanisme historique planifie une frame a
 * chaque cycle de digest, uniquement pour relire un clientHeight. Combien cela
 * represente-t-il au repos, sans aucune interaction ?
 *
 * Instrumenter dans une page de test artificielle s'est revele trompeur : sans
 * la mise en page reelle, le conteneur n'est pas contraint et le virtual scroll
 * ne s'active meme pas. D'ou cette mesure in situ.
 */
import { chromium } from 'playwright';
import { join } from 'node:path';

const URL = process.argv[2] || 'https://localhost:4400/legacy#!/app/tours/orders/filter/allTours';
const PROFILE = process.env.PW_PROFILE || join(process.cwd(), '.playwright-profile');
const SHADOW_HOST = 'front-hybrid-legacy-wrapper';
const MEASURE_MS = 5000;

const context = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1600, height: 900 },
  ignoreHTTPSErrors: true,
  args: ['--ignore-certificate-errors'],
});
const page = context.pages()[0] || (await context.newPage());

// L'instrumentation doit etre en place AVANT que la page charge la directive.
await page.addInitScript(() => {
  // Only frames requested BY THE DIRECTIVE are counted: its bundle must appear
  // in the call stack. Counting every rAF on the page would also pick up the
  // browser's own and the automation tooling's, which drowns the signal
  // entirely (measured: ~60/s of pure noise).
  window.__rafCount = 0;
  const raw = window.requestAnimationFrame;
  window.requestAnimationFrame = function (cb) {
    const stack = (new Error()).stack || '';
    if (stack.indexOf('vs-repeat') !== -1) window.__rafCount += 1;
    return raw.call(window, cb);
  };
});

console.log(`Cible : ${URL}\n`);
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

for (let i = 0; i < 90; i++) {
  const ready = await page.evaluate((hostSel) => {
    const root = document.querySelector(hostSel)?.shadowRoot;
    const grid = root?.querySelector('.grid-body');
    return !!(grid && grid.querySelectorAll('.tree-table-row').length);
  }, SHADOW_HOST).catch(() => false);
  if (ready) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(2000);

console.log(`Vue chargee. Mesure au repos pendant ${MEASURE_MS / 1000} s...\n`);

const result = await page.evaluate(async ({ hostSel, ms }) => {
  const root = document.querySelector(hostSel).shadowRoot;
  const grid = root.querySelector('.grid-body');
  let scroller = grid.parentElement;
  while (scroller && !scroller.matches('.custom-scrollbar')) scroller = scroller.parentElement;

  const before = window.__rafCount;
  const t0 = performance.now();
  await new Promise((r) => setTimeout(r, ms));
  const elapsed = performance.now() - t0;
  const frames = window.__rafCount - before;

  return {
    dureeMs: Math.round(elapsed),
    rafPlanifiees: frames,
    rafParSeconde: +(frames / (elapsed / 1000)).toFixed(1),
    lignesRendues: grid.querySelectorAll('.tree-table-row').length,
    scrollerHeight: scroller ? getComputedStyle(scroller).height : null,
    scrollerClientHeight: scroller ? scroller.clientHeight : null,
    scrollerScrollHeight: scroller ? scroller.scrollHeight : null,
  };
}, { hostSel: SHADOW_HOST, ms: MEASURE_MS });

console.log(JSON.stringify(result, null, 2));
console.log('');
console.log(result.rafParSeconde > 5
  ? `>>> Polling actif : ~${result.rafParSeconde} frames/s demandees au repos.`
  : '>>> Peu ou pas de polling observe sur cette vue.');

await context.close();
