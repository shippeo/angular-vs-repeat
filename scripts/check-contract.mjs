/**
 * Verification du contrat de `dist/` — niveau 1 de la strategie de validation.
 *
 * A lancer apres CHAQUE phase du chantier de modernisation, y compris celles
 * qui ne touchent pas au build : une modification de `files` ou un rebuild lors
 * d'un bump de version peuvent casser le contrat.
 *
 * PORTEE VOLONTAIREMENT LIMITEE. Le bundle a des effets de bord au chargement —
 * il lit `document.documentElement`, appelle `angular.module()` puis
 * `angular.element(document.head).append()` — donc l'evaluer dans un Node nu
 * jette avant d'atteindre le `module.exports`. Simuler `angular` serait fragile
 * et couteux ; ce script s'en tient donc a des verifications statiques, ce qui
 * le garde a ~5 s sans navigateur ni dependance.
 *
 * La preuve forte du contrat (le module exporte bien la chaine 'vs-repeat')
 * appartient a la suite de tests, qui tourne dans un vrai navigateur.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(root, 'dist', 'angular-vs-repeat.js');
const MIN = join(root, 'dist', 'angular-vs-repeat.min.js');

/** Nom du module Angular declare dans src (l. 183) — c'est la valeur exportee. */
const MODULE_NAME = 'vs-repeat';
/** Au-dela de ce ratio min/dist, la minification n'a manifestement pas eu lieu. */
const MAX_MIN_RATIO = 0.5;

const failures = [];
const notes = [];

function check(label, fn) {
  try {
    const note = fn();
    console.log(`  ok   ${label}${note ? ` — ${note}` : ''}`);
  } catch (err) {
    failures.push(`${label} — ${err.message}`);
    console.log(`  FAIL ${label} — ${err.message}`);
  }
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

console.log('Verification du contrat dist/\n');

// 1. Les deux artefacts existent et sont non vides.
for (const [label, path] of [['dist', DIST], ['dist.min', MIN]]) {
  check(`${label} existe et est non vide`, () => {
    assert(existsSync(path), `fichier absent : ${path}`);
    const size = readFileSync(path).length;
    assert(size > 0, 'fichier vide');
    return `${(size / 1024).toFixed(1)} K`;
  });
}

if (failures.length > 0) {
  console.error('\nArtefacts manquants — les verifications suivantes sont sans objet.');
  process.exit(1);
}

const distSource = readFileSync(DIST, 'utf8');
const minSource = readFileSync(MIN, 'utf8');

// 2. Les deux fichiers parsent. `new Function` compile sans executer : on valide
//    la syntaxe sans declencher les effets de bord du module.
for (const [label, source] of [['dist', distSource], ['dist.min', minSource]]) {
  check(`${label} parse sans erreur de syntaxe`, () => {
    try {
      new Function(source);
    } catch (err) {
      throw new Error(`erreur de syntaxe : ${err.message}`);
    }
    return null;
  });
}

// 3. Contrat d'export, verifie textuellement.
//    `treeTable.module.js` dans `client` fait :
//        import vsRepeatModule from 'angular-vs-repeat'
//    et passe la valeur comme nom de module Angular. Si l'export disparait ou
//    si le nom du module change, `client` leve un $injector:modulerr au boot.
check('dist.min exporte via module.exports', () => {
  assert(
    /module\s*\.\s*exports\s*=/.test(minSource),
    'aucune affectation `module.exports =` trouvee'
  );
  return null;
});

check(`dist.min contient le nom de module '${MODULE_NAME}'`, () => {
  assert(
    minSource.includes(`"${MODULE_NAME}"`) || minSource.includes(`'${MODULE_NAME}'`),
    `litteral '${MODULE_NAME}' absent du bundle`
  );
  return null;
});

// 4. La minification a bien eu lieu.
check('dist.min est significativement plus petit que dist', () => {
  const ratio = minSource.length / distSource.length;
  assert(
    ratio < MAX_MIN_RATIO,
    `ratio ${ratio.toFixed(2)} >= ${MAX_MIN_RATIO} — minification absente ou incomplete`
  );
  return `ratio ${ratio.toFixed(2)}`;
});

notes.push(
  'Le contrat reel (module.exports === \'vs-repeat\') est verifie par la suite de',
  'tests, qui charge le bundle dans un vrai navigateur. Ce script ne fait que du',
  'statique — cf. l\'en-tete du fichier.'
);

if (failures.length > 0) {
  console.error(`\n${failures.length} verification(s) en echec :`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('\nContrat verifie.');
for (const n of notes) console.log(`  ${n}`);
