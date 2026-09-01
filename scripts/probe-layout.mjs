/**
 * Sonde de structure : le scrollParent de la treeTable a-t-il un parent dont
 * la hauteur est independante de son contenu ?
 *
 * Question posee par TECHFRONT-1471. Remplacer le polling requestAnimationFrame
 * par un ResizeObserver bute sur un probleme structurel : sur un conteneur
 * dimensionne par max-height, la taille visible depend AUSSI du contenu tant
 * que le maximum n'est pas atteint — et c'est precisement le contenu que
 * reinitialize() modifie, d'ou une boucle de notifications.
 *
 * Une sentinelle placee dans un parent A HAUTEUR PROPRE echappe a ce piege
 * (mesure en isolation : le contenu ne declenche plus rien). Reste a savoir si
 * la treeTable est dans ce cas — sinon l'optimisation n'apporterait rien la ou
 * elle compte.
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
await page.waitForTimeout(1500);

const report = await page.evaluate((hostSel) => {
  const root = document.querySelector(hostSel).shadowRoot;
  const grid = root.querySelector('.grid-body');

  // Meme remontee que la directive (closestElement, src l. 93-104).
  let scroller = grid.parentElement;
  while (scroller && !scroller.matches('.custom-scrollbar')) scroller = scroller.parentElement;
  if (!scroller) return { error: 'scrollParent introuvable' };

  const describe = (el, label) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      role: label,
      tag: el.tagName.toLowerCase(),
      classes: String(el.className).slice(0, 70),
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      // Ce qui compte : une hauteur EXPLICITE rend l'element independant de
      // son contenu. height:auto signifie qu'il s'y adapte.
      height: cs.height,
      maxHeight: cs.maxHeight,
      flex: cs.flex,
      display: cs.display,
      position: cs.position,
    };
  };

  const chain = [describe(scroller, 'scrollParent (.custom-scrollbar)')];
  let cur = scroller.parentElement;
  for (let i = 0; i < 4 && cur; i++) {
    chain.push(describe(cur, `parent +${i + 1}`));
    cur = cur.parentElement;
  }

  return { chain };
}, SHADOW_HOST);

if (report.error) {
  console.error(report.error);
} else {
  for (const el of report.chain) {
    console.log(`--- ${el.role} <${el.tag}> ---`);
    console.log(`  classes      : ${el.classes}`);
    console.log(`  clientHeight : ${el.clientHeight}   scrollHeight : ${el.scrollHeight}`);
    console.log(`  height       : ${el.height}   max-height : ${el.maxHeight}`);
    console.log(`  display      : ${el.display}   flex : ${el.flex}   position : ${el.position}`);
    console.log('');
  }

  // Verdict : un parent dont la hauteur est explicite (px, %, ou impose par un
  // flex) ne suit pas son contenu — c'est ce qu'il faut pour la sentinelle.
  const parents = report.chain.slice(1);
  const stable = parents.find((p) => p && p.height !== 'auto' && p.height !== '');
  console.log(stable
    ? `>>> Parent a hauteur propre trouve : ${stable.role} (height: ${stable.height})`
    : '>>> AUCUN parent a hauteur propre dans les 4 niveaux remontes.');
}

await context.close();
