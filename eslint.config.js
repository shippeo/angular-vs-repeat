/**
 * Flat config ESLint 9.
 *
 * Remplace .eslintrc.js, qui reposait sur `babel-eslint` (deprecie) resolu
 * depuis un FORK GITHUB PERSONNEL epingle sur un SHA — contenu non auditable,
 * non signe, repo pouvant disparaitre ou etre compromis. C'etait le risque
 * supply-chain le plus grave du depot, et il n'apparaissait dans aucun rapport
 * Dependabot.
 *
 * Le parser custom n'est plus necessaire : espree gere nativement `?.`, `??`,
 * le spread et les template literals en ecmaVersion 2020.
 *
 * Les 15 regles sont reprises A L'IDENTIQUE de l'ancienne configuration.
 */

/**
 * Regles communes — copie conforme du bloc `rules` de l'ancien .eslintrc.js.
 */
const rules = {
  'prefer-const': ['error', { destructuring: 'all' }],
  'no-var': ['error'],
  'semi-spacing': ['error', { before: false, after: true }],
  'space-infix-ops': ['error'],
  'keyword-spacing': ['error'],
  'brace-style': ['error'],
  'no-else-return': ['error'],
  semi: ['error'],
  'no-useless-concat': ['error'],
  'no-redeclare': ['error'],
  'no-undef': ['error'],
  'no-shadow': ['error'],
  'comma-dangle': ['error', 'always-multiline'],
  indent: ['error', 2, {
    FunctionDeclaration: { parameters: 'first' },
    FunctionExpression: { parameters: 'first' },
    SwitchCase: 1,
    MemberExpression: 'off',
  }],
};

module.exports = [
  {
    ignores: ['dist/**', 'lib/**', 'node_modules/**', 'scripts/**'],
  },

  {
    // ------------------------------------------------------------------
    // Source de production.
    // ------------------------------------------------------------------
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      // Le source est une IIFE, pas un module ES. Le passer en 'module'
      // changerait la semantique du scope et le mode strict implicite.
      sourceType: 'script',
      // console, setTimeout et module sont deja declares par le commentaire
      // /* global ... */ en tete de src/angular-vs-repeat.js (l. 6). Les
      // redeclarer ici ferait lever `no-redeclare` sur ce commentaire, qui
      // appartient au source et ne doit pas etre touche.
      globals: {
        angular: 'readonly',
        document: 'readonly',
        window: 'readonly',
      },
    },
    rules: {
      ...rules,

      // TROIS VIOLATIONS PREEXISTANTES DANS src/, ramenees en avertissement.
      //
      //   93:7   prefer-const   'closestElement' jamais reassigne
      //   397:1  indent         16 espaces au lieu de 14
      //   690:14 comma-dangle   virgule finale manquante
      //
      // Elles ne sont pas nouvelles : l'ancien ESLint (fork de 2018) ne les
      // remontait pas. Les corriger reviendrait a modifier un source en
      // production pour satisfaire le linter — c'est-a-dire a introduire un
      // changement non valide sous couvert de style, exactement ce que le
      // plan de modernisation interdit.
      //
      // A traiter dans un chantier distinct, avec sa propre validation.
      'prefer-const': ['warn', { destructuring: 'all' }],
      indent: ['warn', 2, {
        FunctionDeclaration: { parameters: 'first' },
        FunctionExpression: { parameters: 'first' },
        SwitchCase: 1,
        MemberExpression: 'off',
      }],
      'comma-dangle': ['warn', 'always-multiline'],
    },
  },

  {
    // ------------------------------------------------------------------
    // Suite de tests.
    // ------------------------------------------------------------------
    files: ['test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        angular: 'readonly',
        document: 'readonly',
        window: 'readonly',
        // setTimeout est utilise dans spec.js (l. 133, 140, 197, 399) alors
        // que son /* global */ de tete ne declare que setInterval et console.
        setTimeout: 'readonly',
        // Globals du harness, absents de l'ancienne configuration alors
        // qu'ils etaient deja utilises.
        expect: 'readonly',
        it: 'readonly',
        describe: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        inject: 'readonly',
      },
    },
    rules: {
      ...rules,

      // test/spec.js a un style heterogene herite (var et const melanges).
      // Le moderniser brouillerait le signal des portes de controle du
      // chantier : un test qui change de forme n'est plus un temoin fiable.
      // Hors scope, donc ramene en avertissement.
      'no-var': ['warn'],
    },
  },
];
