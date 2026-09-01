/**
 * Covers the size-detection mechanism, which picks between a ResizeObserver
 * and the historical per-digest polling depending on how the scroll container
 * is sized.
 *
 * Every fixture in spec.js caps its container with max-height, so those tests
 * exercise the fallback exclusively — the observer branch would otherwise ship
 * without ever being run by CI.
 *
 * These tests assert the CHOICE and its consequences, not the rendering: the
 * rendering is already covered by spec.js and must stay identical either way.
 */
(() => {
  const CONTAINER_SIZE = 200;
  const ITEM_SIZE = 20;
  const ITEM_COUNT = 100;

  function items(count) {
    const out = [];
    for (let i = 0; i < count; i++) {
      out.push({ value: i });
    }

    return out;
  }

  describe('size detection', () => {
    let $compile;
    let $scope;
    let $element;
    let observed;
    let framesRequested;
    let RealResizeObserver;
    let realRequestAnimationFrame;

    beforeEach(angular.mock.module('vs-repeat'));
    beforeEach(inject(($injector, $rootScope) => {
      $compile = $injector.get('$compile');
      $scope = $rootScope.$new();
      $element = null;

      // Count what the directive actually sets up, rather than guessing from
      // the rendering.
      observed = [];
      RealResizeObserver = window.ResizeObserver;
      window.ResizeObserver = function (callback) {
        const instance = new RealResizeObserver(callback);
        const realObserve = instance.observe.bind(instance);
        instance.observe = (target) => {
          observed.push(target);
          return realObserve(target);
        };
        return instance;
      };

      framesRequested = 0;
      realRequestAnimationFrame = window.requestAnimationFrame;
      window.requestAnimationFrame = function (callback) {
        framesRequested += 1;
        return realRequestAnimationFrame.call(window, callback);
      };

      angular.element(document.head).append(
        `<style id="resize-detection-style">
          .fixed-height { height: ${CONTAINER_SIZE}px; overflow: auto; }
          .capped-height { max-height: ${CONTAINER_SIZE}px; overflow: auto; }
          .capped-width {
            max-width: ${CONTAINER_SIZE}px;
            overflow: auto;
            display: flex;
            flex-flow: row nowrap;
          }
          .detection-item { width: 100%; height: ${ITEM_SIZE}px; }
          .capped-width .detection-item { width: ${ITEM_SIZE}px; height: 100%; flex: 0 0 auto; }
        </style>`,
      );
    }));

    afterEach(() => {
      window.ResizeObserver = RealResizeObserver;
      window.requestAnimationFrame = realRequestAnimationFrame;
      angular.element(document.querySelector('#resize-detection-style')).remove();
      if ($element) {
        $element.remove();
      }

      $scope.$destroy();
    });

    function render(containerClass, options) {
      $element = $compile([
        `<div vs-repeat="${options}" class="${containerClass}">`,
        '  <div ng-repeat="item in items" class="detection-item">',
        '    <span class="value">{{item.value}}</span>',
        '  </div>',
        '</div>',
      ].join(''))($scope);

      angular.element(document.body).append($element);
      $scope.items = items(ITEM_COUNT);
      $scope.$digest();
    }

    it('observes a container whose size is imposed from the outside', (done) => {
      render('fixed-height', `{size: ${ITEM_SIZE}}`);

      setTimeout(() => {
        expect(observed.length).to.equal(1);
        expect(observed[0]).to.equal($element[0]);
        done();
      });
    });

    it('stops requesting frames once the observer is in place', (done) => {
      render('fixed-height', `{size: ${ITEM_SIZE}}`);

      setTimeout(() => {
        // Let the setup settle, then watch a few digests go by.
        framesRequested = 0;
        for (let i = 0; i < 5; i++) {
          $scope.$root.$digest();
        }

        expect(framesRequested).to.equal(0);
        done();
      }, 50);
    });

    it('falls back to polling for a container capped by max-height', (done) => {
      render('capped-height', `{size: ${ITEM_SIZE}}`);

      setTimeout(() => {
        expect(observed.length).to.equal(0);

        framesRequested = 0;
        $scope.$root.$digest();
        expect(framesRequested).to.be.greaterThan(0);
        done();
      }, 50);
    });

    it('falls back to polling for a horizontal container capped by max-width', (done) => {
      // The cap has to be read on the axis the directive scrolls: a horizontal
      // container capped by max-width has `maxHeight: none`, and checking the
      // vertical axis alone would wrongly send it to the observer branch.
      render('capped-width', `{size: ${ITEM_SIZE}, horizontal: true}`);

      setTimeout(() => {
        expect(observed.length).to.equal(0);
        done();
      }, 50);
    });

    it('disconnects the observer when the scope is destroyed', (done) => {
      let disconnected = false;
      window.ResizeObserver = function (callback) {
        const instance = new RealResizeObserver(callback);
        const realDisconnect = instance.disconnect.bind(instance);
        instance.disconnect = () => {
          disconnected = true;
          return realDisconnect();
        };
        return instance;
      };

      render('fixed-height', `{size: ${ITEM_SIZE}}`);

      setTimeout(() => {
        $scope.$destroy();
        expect(disconnected).to.equal(true);
        done();
      }, 50);
    });

    it('renders the same rows whichever mechanism is picked', (done) => {
      render('fixed-height', `{size: ${ITEM_SIZE}}`);

      setTimeout(() => {
        const observedRows = $element[0].querySelectorAll('.value').length;
        // Keep the root before destroying the scope: $root is null afterwards.
        const $root = $scope.$root;
        $element.remove();
        $scope.$destroy();

        // Same content, same geometry, but a capped container — so the polling
        // fallback is used instead.
        const fallbackScope = $root.$new();
        const fallbackElement = $compile([
          `<div vs-repeat="{size: ${ITEM_SIZE}}" class="capped-height">`,
          '  <div ng-repeat="item in items" class="detection-item">',
          '    <span class="value">{{item.value}}</span>',
          '  </div>',
          '</div>',
        ].join(''))(fallbackScope);
        angular.element(document.body).append(fallbackElement);
        fallbackScope.items = items(ITEM_COUNT);
        fallbackScope.$digest();

        setTimeout(() => {
          const fallbackRows = fallbackElement[0].querySelectorAll('.value').length;
          fallbackElement.remove();
          fallbackScope.$destroy();

          expect(fallbackRows).to.equal(observedRows);
          $element = null;
          done();
        }, 50);
      }, 50);
    });
  });
})();
