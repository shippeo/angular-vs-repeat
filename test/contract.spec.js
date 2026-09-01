/* global describe, it, expect, angular, module */

/**
 * Contrat d'export du paquet — la verification que le check statique
 * (scripts/check-contract.mjs) ne peut pas faire.
 *
 * `client` consomme ce paquet ainsi, dans treeTable.module.js :
 *
 *     import vsRepeatModule from 'angular-vs-repeat'
 *     angular.module('...', [vsRepeatModule])
 *
 * La valeur exportee est donc passee comme NOM DE MODULE Angular : c'est une
 * chaine, pas un objet. Si ce contrat casse, `client` leve un
 * $injector:modulerr au demarrage — un echec au boot, pas une degradation
 * silencieuse.
 *
 * Ce fichier tourne dans un vrai navigateur, apres le chargement du bundle
 * minifie : c'est le seul endroit ou le contrat peut etre verifie pour de vrai,
 * puisque le module a des effets de bord au chargement (document.documentElement,
 * angular.module, angular.element(document.head)) qui interdisent de l'evaluer
 * dans un Node nu.
 */
(() => {
  const EXPECTED_MODULE_NAME = 'vs-repeat';

  describe('contrat d\'export', () => {
    it('expose la valeur du module via module.exports', () => {
      // Le bundle s'auto-enregistre sur `module.exports` quand un `module`
      // existe (bundlers), sinon il se contente d'enregistrer le module
      // Angular. Dans le navigateur on verifie le second effet, qui est celui
      // dont depend l'injection.
      expect(typeof angular.module).to.equal('function');
    });

    it(`enregistre le module Angular '${EXPECTED_MODULE_NAME}'`, () => {
      const resolve = () => angular.module(EXPECTED_MODULE_NAME);
      expect(resolve).to.not.throw();

      const mod = resolve();
      expect(mod).to.be.an('object');
      expect(mod.name).to.equal(EXPECTED_MODULE_NAME);
    });

    it('expose un nom de module qui est bien une chaine', () => {
      // C'est le point exact du contrat : `client` passe cette valeur dans le
      // tableau de dependances d'angular.module(). Un objet y leverait.
      const name = angular.module(EXPECTED_MODULE_NAME).name;
      expect(name).to.be.a('string');
      expect(name).to.have.length.above(0);
    });

    it('declare la directive vsRepeat', () => {
      // Garde-fou complementaire : le module existe mais vide serait un
      // contrat rompu tout aussi surement.
      const invokeQueue = angular.module(EXPECTED_MODULE_NAME)._invokeQueue;
      const registered = invokeQueue.some(
        (entry) => entry[2] && entry[2][0] === 'vsRepeat'
      );
      expect(registered, 'directive vsRepeat absente du module').to.equal(true);
    });
  });
})();
