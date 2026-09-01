import { playwrightLauncher } from '@web/test-runner-playwright';

/**
 * Harness de test — remplacant de Karma (abandonne : plus maintenu, et racine
 * de vulnerabilites `critical`).
 *
 * Les 14 tests manipulent du layout reel (scrollTop, scrollHeight, geometrie),
 * donc jsdom est exclu d'office : il ne calcule pas de layout. Il faut un vrai
 * navigateur.
 *
 * Le fichier de test est une PAGE HTML (test/index.html) et non un module :
 * test/spec.js est une IIFE qui depend de globals et de l'ordre de chargement
 * des scripts. Cf. les commentaires de test/index.html.
 */
export default {
  files: ['test/index.html'],

  // VIEWPORT FIXE — parametre critique, ne pas retirer.
  // Plusieurs tests asservissent leurs assertions a des dimensions reelles
  // (.container { max-height: 200px }, elements de 110 px). Karma et
  // @web/test-runner n'ont pas les memes valeurs par defaut : sans taille
  // explicite la suite devient non deterministe, et un test de layout peut
  // passer PAR ACCIDENT sous un viewport different.
  browsers: [
    playwrightLauncher({
      product: 'chromium',
      createBrowserContext: ({ browser }) =>
        browser.newContext({ viewport: { width: 1280, height: 720 } }),
    }),
  ],

  // Une page a la fois : les tests injectent leurs propres <style> dans le
  // <head> et mesurent de la geometrie. Le parallelisme les rendrait instables.
  concurrency: 1,

  nodeResolve: true,
  testsFinishTimeout: 120000,
};
