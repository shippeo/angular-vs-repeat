/**
 * Mesure du comportement de la vue treeTable — niveau 3 de la strategie de
 * validation.
 *
 * Rejoue la meme sequence sur deux cibles pour comparer objectivement :
 *   - la QA deployee (dist de production actuel, commit e586a3c) => BASELINE
 *   - le serveur local avec le portal vers la branche de modernisation
 *
 * La comparaison visuelle sur six criteres, repetee a plusieurs heures
 * d'intervalle, n'est pas fiable. Le comptage de lignes rendues a positions de
 * scroll fixes est le seul controle objectif dont on dispose sur du virtual
 * scroll.
 *
 * Usage :
 *   node scripts/measure-treetable.mjs --url <url> --label <nom> [--headless]
 *
 * Le navigateur s'ouvre en mode visible par defaut et sonde la page jusqu'a ce
 * que la vue treeTable soit chargee : l'operateur se connecte a son rythme, la
 * mesure demarre d'elle-meme. Aucune saisie clavier requise.
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const URL = getArg('url', 'https://frontoffice-legacy.core.qa.shippeo.com/legacy#!/app/tours/orders/filter/allTours');
const LABEL = getArg('label', 'baseline');
const OUT_DIR = getArg('out', join(process.cwd(), 'measures'));
const HEADLESS = args.includes('--headless');
const PROFILE = join(process.cwd(), '.playwright-profile');

/** Positions de scroll mesurees, en fraction de la hauteur scrollable. */
const SCROLL_POSITIONS = [0, 0.25, 0.5, 0.75, 1];

/**
 * Selecteurs releves dans treeTable.tpl.html (l. 27-40) :
 *   - .custom-scrollbar : le scrollParent configure dans l'attribut vs-repeat ;
 *   - .grid-body        : l'element qui porte la directive vs-repeat ;
 *   - .tree-table-row   : les lignes ng-repeatees, c'est ce qu'on compte.
 * Compter un selecteur plus large ([ng-repeat]) ramenerait des lignes d'autres
 * composants de la page et fausserait la mesure.
 */
const SCROLL_PARENT = '.custom-scrollbar';
const VS_REPEAT_CONTAINER = '.grid-body';
const ROW_SELECTOR = '.tree-table-row';

/**
 * Hote du Shadow DOM qui encapsule toute l'application AngularJS.
 *
 * apps/frontoffice-legacy/src/hybrid/hybrid-legacy-wrapper/
 * hybrid-legacy-wrapper.component.ts declare explicitement
 * `encapsulation: ViewEncapsulation.ShadowDom`. Consequence : la vue legacy —
 * donc la treeTable et son scrollParent — vit dans un shadow root, et un
 * document.querySelector classique ne voit RIEN (verifie : 0 partout au niveau
 * document, 14 lignes dans le shadow root).
 *
 * Toutes les requetes DOM de ce script passent donc par `root()` ci-dessous.
 */
const SHADOW_HOST = 'front-hybrid-legacy-wrapper';

/**
 * Attend que la vue treeTable soit reellement chargee, en sondant la page.
 *
 * Pas de saisie clavier : l'operateur se connecte a son rythme dans la fenetre,
 * et la mesure demarre d'elle-meme des que la grille contient des lignes.
 */
async function waitForTreeTable(page, { timeoutMs = 600000, sel, containerSel, rowSel }) {
  const start = Date.now();
  let lastState = '';

  while (Date.now() - start < timeoutMs) {
    const state = await page.evaluate(({ sel, containerSel, rowSel, hostSel }) => {
      const host = document.querySelector(hostSel);
      if (!host) return { ready: false, why: `en attente de l'hote hybride (${hostSel})` };
      const root = host.shadowRoot;
      if (!root) return { ready: false, why: 'hote present mais shadowRoot non attache' };

      const scroller = root.querySelector(sel);
      const grid = root.querySelector(containerSel);
      const rows = grid ? grid.querySelectorAll(rowSel).length : 0;
      if (!scroller) return { ready: false, why: 'en attente du scrollParent (.custom-scrollbar)' };
      if (!grid) return { ready: false, why: 'en attente de la grille (.grid-body)' };
      if (rows === 0) return { ready: false, why: 'grille presente, en attente des lignes' };
      return { ready: true, rows, scrollable: scroller.scrollHeight > scroller.clientHeight };
    }, { sel, containerSel, rowSel, hostSel: SHADOW_HOST })
      .catch(() => ({ ready: false, why: 'page en cours de navigation' }));

    if (state.ready) {
      // Laisse le rendu se stabiliser avant de mesurer.
      await page.waitForTimeout(1500);
      return state;
    }

    if (state.why !== lastState) {
      const elapsed = Math.round((Date.now() - start) / 1000);
      console.log(`  [${String(elapsed).padStart(3)}s] ${state.why}`);
      lastState = state.why;
    }
    await page.waitForTimeout(2000);
  }
  throw new Error('la vue treeTable n\'est pas apparue dans le delai imparti');
}

const consoleErrors = [];

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  // Profil persistant : la session de connexion est conservee entre les
  // lancements (.playwright-profile/, git-ignore). Sans cela, chaque mesure
  // repartirait d'un profil vierge et exigerait une reconnexion.
  const context = await chromium.launchPersistentContext(PROFILE, {
    headless: HEADLESS,
    viewport: { width: 1600, height: 900 },
    ignoreHTTPSErrors: true,
    args: ['--ignore-certificate-errors'],
  });
  const page = context.pages()[0] || (await context.newPage());

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`PAGEERROR: ${err.message}`));

  console.log(`\nCible : ${URL}`);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

  console.log(
    '\n>>> Connecte-toi dans la fenetre qui vient de s\'ouvrir, puis va sur la\n' +
    '    vue treeTable. La mesure demarre TOUTE SEULE des que les lignes sont la.\n'
  );

  const ready = await waitForTreeTable(page, {
    sel: SCROLL_PARENT,
    containerSel: VS_REPEAT_CONTAINER,
    rowSel: ROW_SELECTOR,
  });
  console.log(`\nVue detectee : ${ready.rows} lignes rendues, scrollable=${ready.scrollable}`);

  // --- Reperage du conteneur de scroll -------------------------------------
  const found = await page.evaluate(({ sel, containerSel, rowSel, hostSel }) => {
    const root = document.querySelector(hostSel).shadowRoot;
    const grid = root.querySelector(containerSel);
    if (!grid) return { found: false, missing: containerSel };

    // La page contient plusieurs .custom-scrollbar (15 relevees). Prendre la
    // premiere serait arbitraire : on remonte depuis la grille, exactement
    // comme le fait closestElement() dans la directive (src l. 93-104), pour
    // designer LE scrollParent que vs-repeat utilise reellement.
    let el = grid.parentElement;
    while (el && !el.matches(sel)) el = el.parentElement;
    if (!el) return { found: false, missing: `${sel} (ancetre de ${containerSel})` };

    const all = root.querySelectorAll(sel).length;
    return {
      found: true,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollable: el.scrollHeight > el.clientHeight,
      totalRowsAtRest: grid.querySelectorAll(rowSel).length,
      candidatesInPage: all,
    };
  }, { sel: SCROLL_PARENT, containerSel: VS_REPEAT_CONTAINER, rowSel: ROW_SELECTOR, hostSel: SHADOW_HOST });

  if (!found.found) {
    console.error(`\n!! Element "${found.missing}" introuvable sur la page.`);
    console.error('   La vue treeTable est-elle bien affichee et chargee ?');
    await context.close();
    process.exit(1);
  }

  console.log(
    `\nConteneur trouve : scrollHeight=${found.scrollHeight}, ` +
    `clientHeight=${found.clientHeight}, lignes au repos=${found.totalRowsAtRest}`
  );
  if (!found.scrollable) {
    console.error('!! Le conteneur n\'est pas scrollable : pas assez de donnees.');
    console.error('   Il faut une liste plus longue pour que le virtual scroll soit observable.');
  }

  // --- Mesures a chaque position -------------------------------------------
  const measures = [];
  for (const pos of SCROLL_POSITIONS) {
    const m = await page.evaluate(async ({ sel, rowSel, containerSel, hostSel, pos }) => {
      const root = document.querySelector(hostSel).shadowRoot;
      const grid = root.querySelector(containerSel);

      // Meme remontee que ci-dessus : on scrolle LE conteneur que vs-repeat
      // ecoute, pas le premier .custom-scrollbar venu.
      let container = grid.parentElement;
      while (container && !container.matches(sel)) container = container.parentElement;

      const max = container.scrollHeight - container.clientHeight;
      container.scrollTop = Math.round(max * pos);
      container.dispatchEvent(new Event('scroll'));
      // Deux frames : une pour le recalcul angular, une pour le layout.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const rows = grid.querySelectorAll(rowSel);
      const before = root.querySelector('.vs-repeat-before-content');
      const after = root.querySelector('.vs-repeat-after-content');
      const px = (el, prop) => (el ? Math.round(parseFloat(getComputedStyle(el)[prop]) || 0) : null);

      return {
        scrollTop: container.scrollTop,
        renderedRows: rows.length,
        // Les deux spacers portent la geometrie du virtual scroll : si le
        // recyclage change, leur hauteur change.
        beforeHeight: px(before, 'height'),
        afterHeight: px(after, 'height'),
      };
    }, { sel: SCROLL_PARENT, rowSel: ROW_SELECTOR, containerSel: VS_REPEAT_CONTAINER, hostSel: SHADOW_HOST, pos });

    measures.push({ position: pos, ...m });
    console.log(
      `  scroll ${String(Math.round(pos * 100)).padStart(3)}% ` +
      `-> ${String(m.renderedRows).padStart(4)} lignes rendues, ` +
      `spacers ${m.beforeHeight}/${m.afterHeight}`
    );

    await page.screenshot({
      path: join(OUT_DIR, `${LABEL}-scroll-${Math.round(pos * 100)}.png`),
    });
  }

  // --- Controle du contrat d'injection Angular -----------------------------
  const moduleOk = await page.evaluate(() => {
    try {
      const ng = window.angular;
      if (!ng) return 'angular absent';
      ng.module('vs-repeat');
      return 'ok';
    } catch (e) {
      return `ECHEC: ${e.message.slice(0, 120)}`;
    }
  });

  const report = {
    label: LABEL,
    url: URL,
    capturedAt: new Date().toISOString(),
    container: found,
    vsRepeatModule: moduleOk,
    measures,
    consoleErrors: consoleErrors.slice(0, 20),
  };

  const outFile = join(OUT_DIR, `${LABEL}.json`);
  writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log(`\nmodule 'vs-repeat' : ${moduleOk}`);
  console.log(`erreurs console    : ${consoleErrors.length}`);
  if (consoleErrors.length) {
    consoleErrors.slice(0, 5).forEach((e) => console.log(`   - ${e.slice(0, 120)}`));
  }
  console.log(`\nRapport   : ${outFile}`);
  console.log(`Captures  : ${OUT_DIR}\\${LABEL}-scroll-*.png`);

  await context.close();
}

main().catch((err) => {
  console.error('\nEchec de la mesure :', err.message);
  process.exit(1);
});
