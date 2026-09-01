/**
 * Sonde de diagnostic : decrit ce qui est REELLEMENT present dans le DOM.
 *
 * Sert quand measure-treetable.mjs reste bloque sur un selecteur : plutot que
 * de deviner, on regarde.
 *
 * PROFIL PERSISTANT : la session de connexion est conservee dans
 * .playwright-profile/ (git-ignore). Une fois connecte, les lancements
 * suivants — sonde comme mesure — retrouvent la session.
 */
import { chromium } from 'playwright';
import { join } from 'node:path';

const URL = process.argv[2] || 'https://frontoffice-legacy.core.qa.shippeo.com/legacy#!/app/tours/orders/filter/allTours';
const PROFILE = join(process.cwd(), '.playwright-profile');

const context = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1600, height: 900 },
  ignoreHTTPSErrors: true,
  args: ['--ignore-certificate-errors'],
});

const page = context.pages()[0] || (await context.newPage());

console.log(`Cible  : ${URL}`);
console.log(`Profil : ${PROFILE}`);
console.log('>>> Connecte-toi dans cette fenetre. Diagnostic toutes les 5 s.\n');
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

for (let i = 0; i < 120; i++) {
  const snap = await page.evaluate(() => {
    const q = (s) => document.querySelectorAll(s).length;
    const vs = document.querySelector('[vs-repeat]');
    return {
      url: location.href.slice(0, 110),
      customScrollbar: q('.custom-scrollbar'),
      gridBody: q('.grid-body'),
      treeTableRow: q('.tree-table-row'),
      vsRepeatAttr: q('[vs-repeat]'),
      beforeContent: q('.vs-repeat-before-content'),
      shipTreeTable: q('ship-tree-table, [ship-tree-table]'),
      vsRepeatClasses: vs ? String(vs.className).slice(0, 100) : null,
      angularPresent: typeof window.angular !== 'undefined',
      scrollishClasses: [...new Set(
        [...document.querySelectorAll('[class*="scroll"]')]
          .map((e) => e.className)
          .filter((c) => typeof c === 'string')
      )].slice(0, 6),

      // --- Hypothese Shadow DOM ------------------------------------------
      // treeTable est un composant AngularJS (pas de shadow root), et Angular
      // n'en cree pas en encapsulation Emulated (attributs, pas de shadow).
      // Mais on verifie plutot que de supposer.
      shadowHosts: (() => {
        const hosts = [];
        const walk = (root, depth) => {
          if (depth > 6) return;
          for (const el of root.querySelectorAll('*')) {
            if (el.shadowRoot) {
              hosts.push({
                tag: el.tagName.toLowerCase(),
                rows: el.shadowRoot.querySelectorAll('.tree-table-row').length,
                scrollbar: el.shadowRoot.querySelectorAll('.custom-scrollbar').length,
              });
              walk(el.shadowRoot, depth + 1);
            }
          }
        };
        try { walk(document, 0); } catch (e) { return [{ error: e.message.slice(0, 60) }]; }
        return hosts.slice(0, 10);
      })(),

      iframes: [...document.querySelectorAll('iframe')].map((f) => String(f.src).slice(0, 90)).slice(0, 5),
    };
  }).catch((e) => ({ error: e.message.slice(0, 120) }));

  console.log(`--- ${new Date().toLocaleTimeString()} ---`);
  console.log(JSON.stringify(snap, null, 1));

  if (snap.treeTableRow > 0) {
    console.log('\n>>> LIGNES DETECTEES — la vue est chargee, les selecteurs sont bons.');
    break;
  }
  await page.waitForTimeout(5000);
}

console.log('\nLa fenetre reste ouverte 10 min (la session est conservee dans le profil).');
await page.waitForTimeout(600000);
await context.close();
