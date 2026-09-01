"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/**
 * Copyright Kamil Pękala http://github.com/kamilkp
 * Angular Virtual Scroll Repeat v2.0.13 2018/04/02
 */

/* global console, setTimeout, module */

(function (window, angular) {
  /**
   * DESCRIPTION:
   * vsRepeat directive stands for Virtual Scroll Repeat. It turns a standard ngRepeated set of elements in a scrollable container
   * into a component, where the user thinks he has all the elements rendered and all he needs to do is scroll (without any kind of
   * pagination - which most users loath) and at the same time the browser isn't overloaded by that many elements/angular bindings etc.
   * The directive renders only so many elements that can fit into current container's clientHeight/clientWidth.
    * LIMITATIONS:
   * - current version only supports an Array as a right-hand-side object for ngRepeat
   * - all rendered elements must have the same height/width or the sizes of the elements must be known up front
    * USAGE:
   * In order to use the vsRepeat directive you need to place a vs-repeat attribute on a direct parent of an element with ng-repeat
   * example:
   * <div vs-repeat="options">
   *      <div ng-repeat="item in someArray">
   *          <!-- content -->
   *      </div>
   * </div>
    * or:
   * <div vs-repeat="options">
   *      <div ng-repeat-start="item in someArray">
   *          <!-- content -->
   *      </div>
   *      <div>
   *         <!-- something in the middle -->
   *      </div>
   *      <div ng-repeat-end>
   *          <!-- content -->
   *      </div>
   * </div>
    * You can also measure the single element's height/width (including all paddings and margins), and then speficy it as a value
   * of the option's `size` property. This can be used if one wants to override the automatically computed element size.
   * example:
   * <div vs-repeat="{size: 50}"> <!-- the specified element height is 50px -->
   *      <div ng-repeat="item in someArray">
   *          <!-- content -->
   *      </div>
   * </div>
    * IMPORTANT!
    * - the vsRepeat directive must be applied to a direct parent of an element with ngRepeat
   * - the value of vsRepeat attribute is the single element's height/width measured in pixels. If none provided, the directive
   *      will compute it automatically
    * OPTIONAL PARAMETERS (attributes):
   * vs-repeat-container="selector" - selector for element containing ng-repeat. (defaults to the current element)
    * OPTIONS:
   * Options shall be passed as an object to the `vs-repeat` attribute e.g.: `<div vs-repeat="{scrollParent: 'window', size: 20}"></div>`
   *
   * Available options:
   * `horizontal` - stack repeated elements horizontally instead of vertically
   * `offset-before` - top/left offset in pixels (defaults to 0)
   * `offset-after` - bottom/right offset in pixels (defaults to 0)
   * `scroll-margin` - how many pixels ahead should elements be rendered while scrolling
   * `latch` - if true, elements will be rendered gradually but won't be removed when scrolled away (defaults to false)
    * `size` - a property name of the items in collection that is a number denoting the element size (in pixels)
   * `autoresize` - use this attribute without vs-size and without specifying element's size. The automatically computed element style will
   *              readjust upon window resize if the size is dependable on the viewport size
   * `scrolled-to-end` - callback will be called when the last item of the list is rendered
   * `scrolled-to-end-offset` - set this number to trigger the scrolledToEnd callback n items before the last gets rendered
   * `scrolled-to-beginning` - callback will be called when the first item of the list is rendered
   * `scrolled-to-beginning-offset` - set this number to trigger the scrolledToBeginning callback n items before the first gets rendered
    * EVENTS:
   * - `vsRepeatTrigger` - an event the directive listens for to manually trigger reinitialization
   * - `vsRepeatReinitialized` - an event the directive emits upon reinitialization done
   */
  var matchingFunction = ['matches', 'matchesSelector', 'webkitMatches', 'webkitMatchesSelector', 'msMatches', 'msMatchesSelector', 'mozMatches', 'mozMatchesSelector'].reduce(function (res, prop) {
    return res !== null && res !== void 0 ? res : prop in document.documentElement ? prop : null;
  }, null);
  var closestElement = function closestElement(selector) {
    var _el;
    var el = this[0].parentNode;
    while (el !== document.documentElement && el != null && !el[matchingFunction](selector)) {
      el = el.parentNode;
    }
    if ((_el = el) !== null && _el !== void 0 && _el[matchingFunction](selector)) {
      return angular.element(el);
    }
    return angular.element();
  };
  function getWindowScroll() {
    var _ref, _document$documentEle, _ref2, _document$documentEle2;
    if ('pageYOffset' in window) {
      return {
        scrollTop: window.pageYOffset,
        scrollLeft: window.pageXOffset
      };
    }
    return {
      scrollTop: (_ref = (_document$documentEle = document.documentElement.scrollTop) !== null && _document$documentEle !== void 0 ? _document$documentEle : document.body.scrollTop) !== null && _ref !== void 0 ? _ref : 0,
      scrollLeft: (_ref2 = (_document$documentEle2 = document.documentElement.scrollLeft) !== null && _document$documentEle2 !== void 0 ? _document$documentEle2 : document.body.scrollLeft) !== null && _ref2 !== void 0 ? _ref2 : 0
    };
  }
  function getClientSize(element, sizeProp) {
    if (element === window) {
      return sizeProp === 'clientWidth' ? window.innerWidth : window.innerHeight;
    }
    return element[sizeProp];
  }
  function getScrollPos(element, scrollProp) {
    return element === window ? getWindowScroll()[scrollProp] : element[scrollProp];
  }
  function getScrollOffset(vsElement, scrollElement, isHorizontal) {
    var vsPos = vsElement.getBoundingClientRect()[isHorizontal ? 'left' : 'top'];
    var scrollPos = scrollElement === window ? 0 : scrollElement.getBoundingClientRect()[isHorizontal ? 'left' : 'top'];
    var scrollValue = (scrollElement === window ? getWindowScroll() : scrollElement)[isHorizontal ? 'scrollLeft' : 'scrollTop'];
    return vsPos - scrollPos + scrollValue;
  }
  function analyzeNgRepeatUsage(element) {
    var options = ['ng-repeat', 'data-ng-repeat', 'ng-repeat-start', 'data-ng-repeat-start'];
    for (var _i = 0, _options = options; _i < _options.length; _i++) {
      var opt = _options[_i];
      if (element.attr(opt)) {
        return [opt, element.attr(opt), opt.indexOf('-start') >= 0];
      }
    }
    throw new Error('angular-vs-repeat: no ng-repeat directive on a child element');
  }
  function printDeprecationWarning($element, message) {
    console.warn("vs-repeat deprecation: ".concat(message), $element[0]);
  }
  function attrDeprecated(attrname, $element) {
    printDeprecationWarning($element, "".concat(attrname, " attribute is deprecated. Pass the options object to vs-repeat attribute instead https://github.com/kamilkp/angular-vs-repeat#options"));
  }
  var defaultOptions = {
    latch: false,
    preserveLatchOnRefresh: false,
    container: null,
    scrollParent: null,
    size: null,
    offsetBefore: 0,
    offsetAfter: 0,
    scrolledToBeginning: angular.noop,
    scrolledToEnd: angular.noop,
    scrolledToBeginningOffset: 0,
    scrolledToEndOffset: 0,
    scrollMargin: 0,
    horizontal: false,
    autoresize: false,
    hunked: false,
    hunkSize: 0
  };
  var vsRepeatModule = angular.module('vs-repeat', []).directive('vsRepeat', ['$compile', '$parse', function ($compile, $parse) {
    return {
      restrict: 'A',
      scope: true,
      compile: function compile(compileElement, compileAttrs) {
        var compileRepeatContainer = 'vsRepeatContainer' in compileAttrs ? angular.element(compileElement[0].querySelector(compileAttrs.vsRepeatContainer)) : compileElement;
        var repeatContainerChildren = compileRepeatContainer.children();
        var ngRepeatChild = repeatContainerChildren.eq(0);
        var childCloneHtml = ngRepeatChild[0].outerHTML;
        var collectionName = '$vs_collection'; // TODO: make configurable?

        ['vsSize', 'vsScrollParent', 'vsSizeProperty', 'vsHorizontal', 'vsOffsetBefore', 'vsOffsetAfter', 'vsScrolledToEndOffset', 'vsScrolledToBeginningOffset', 'vsExcess', 'vsScrollMargin'].forEach(function (attrname) {
          if (attrname in compileAttrs) {
            attrDeprecated(attrname, compileElement);
          }
        });
        var _analyzeNgRepeatUsage = analyzeNgRepeatUsage(ngRepeatChild),
          _analyzeNgRepeatUsage2 = _slicedToArray(_analyzeNgRepeatUsage, 3),
          originalNgRepeatAttr = _analyzeNgRepeatUsage2[0],
          ngRepeatExpression = _analyzeNgRepeatUsage2[1],
          isNgRepeatStart = _analyzeNgRepeatUsage2[2];
        var expressionMatches = /^\s*(\S+)\s+in\s+([\S\s]+?)(track\s+by\s+\S+)?$/.exec(ngRepeatExpression);
        var _expressionMatches = _slicedToArray(expressionMatches, 4),
          lhs = _expressionMatches[1],
          rhs = _expressionMatches[2],
          rhsSuffix = _expressionMatches[3];
        if (isNgRepeatStart) {
          var index = 0;
          var repeaterElement = repeatContainerChildren.eq(index);
          while (repeaterElement.attr('ng-repeat-end') == null && repeaterElement.attr('data-ng-repeat-end') == null) {
            index++;
            repeaterElement = repeatContainerChildren.eq(index);
            childCloneHtml += repeaterElement[0].outerHTML;
          }
        }
        compileRepeatContainer.empty();
        return {
          pre: function pre($scope, $element, $attrs) {
            var _$scope$$eval;
            function _parseSize(options) {
              if (typeof options.size === 'number') {
                options.getSize = function () {
                  return options.size;
                };
              } else {
                var parsed = $parse(String(options.size));
                options.getSize = function (item) {
                  return parsed($scope, _defineProperty({}, lhs, item));
                };
              }
            }
            $scope.vsRepeat = {
              options: _objectSpread(_objectSpread({}, defaultOptions), (_$scope$$eval = $scope.$eval($attrs.vsRepeat)) !== null && _$scope$$eval !== void 0 ? _$scope$$eval : {})
            };
            var options = $scope.vsRepeat.options;
            _parseSize(options);
            var repeatContainer = angular.isDefined($attrs.vsRepeatContainer) ? angular.element($element[0].querySelector($attrs.vsRepeatContainer)) : $element;
            var childClone = angular.element(childCloneHtml);
            var childTagName = childClone[0].tagName.toLowerCase();
            var originalCollection = [];
            var originalLength;
            var $beforeContent = angular.element('<' + childTagName + ' class="vs-repeat-before-content"></' + childTagName + '>');
            var $afterContent = angular.element('<' + childTagName + ' class="vs-repeat-after-content"></' + childTagName + '>');
            var autosizingRequired = options.size === null;
            var $scrollParent = options.scrollParent ? options.scrollParent === 'window' ? angular.element(window) : closestElement.call(repeatContainer, options.scrollParent) : repeatContainer;
            var clientSize = options.horizontal ? 'clientWidth' : 'clientHeight';
            var offsetSize = options.horizontal ? 'offsetWidth' : 'offsetHeight';
            var scrollSize = options.horizontal ? 'scrollWidth' : 'scrollHeight';
            var scrollPos = options.horizontal ? 'scrollLeft' : 'scrollTop';
            $scope.vsRepeat.totalSize = 0;
            if ($scrollParent.length === 0) {
              throw 'Specified scroll parent selector did not match any element';
            }
            $scope.vsRepeat.$scrollParent = $scrollParent;
            $scope.vsRepeat.sizesCumulative = [];
            if (options.debug) {
              var $debugParent = options.scrollParent === 'window' ? angular.element(document.body) : $scrollParent;
              var $debug = angular.element('<div class="vs-repeat-debug-element"></div>');
              $debug.css('position', options.scrollParent === 'window' ? 'fixed' : 'absolute');
              $debugParent.append($debug);
              $scope.$on('$destroy', function () {
                $debug.remove();
              });
            }
            var measuredSize = getClientSize($scrollParent[0], clientSize) || 50;
            if (options.horizontal) {
              $beforeContent.css('height', '100%');
              $afterContent.css('height', '100%');
            } else {
              $beforeContent.css('width', '100%');
              $afterContent.css('width', '100%');
            }
            if ($attrs.vsRepeatOptions) {
              $scope.$watchCollection($attrs.vsRepeatOptions, function (newOpts) {
                var mergedOptions = _objectSpread(_objectSpread({}, options), newOpts);
                if (JSON.stringify(mergedOptions) !== JSON.stringify(options)) {
                  Object.assign(options, newOpts);
                  _parseSize(options);
                  reinitialize();
                }
              });
            }
            $scope.$watchCollection(rhs, function () {
              var coll = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
              originalCollection = coll;
              refresh();
            });
            function refresh() {
              if (!originalCollection || originalCollection.length < 1) {
                $scope[collectionName] = [];
                originalLength = 0;
                $scope.vsRepeat.sizesCumulative = [0];
              } else {
                originalLength = originalCollection.length;
                if (options.size) {
                  _mapSize();
                } else {
                  getFromMeasured();
                }
              }
              reinitialize();
            }
            function _mapSize() {
              var hardSize = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
              var sizes = originalCollection.map(function (item) {
                return hardSize !== null && hardSize !== void 0 ? hardSize : options.getSize(item);
              });
              var sum = 0;
              $scope.vsRepeat.sizesCumulative = [0].concat(_toConsumableArray(sizes.map(function (size) {
                return sum += size;
              })));
            }
            function getFromMeasured() {
              if (autosizingRequired) {
                $scope.$$postDigest(function () {
                  if (repeatContainer[0].offsetHeight || repeatContainer[0].offsetWidth) {
                    // element is visible
                    var children = repeatContainer.children();
                    var i = 0;
                    var gotSomething = false;
                    var insideStartEndSequence = false;
                    while (i < children.length) {
                      if (children[i].attributes[originalNgRepeatAttr] != null || insideStartEndSequence) {
                        if (!gotSomething) {
                          measuredSize = 0;
                        }
                        gotSomething = true;
                        if (children[i][offsetSize]) {
                          measuredSize += children[i][offsetSize];
                        }
                        if (isNgRepeatStart) {
                          if (children[i].attributes['ng-repeat-end'] != null || children[i].attributes['data-ng-repeat-end'] != null) {
                            break;
                          } else {
                            insideStartEndSequence = true;
                          }
                        } else {
                          break;
                        }
                      }
                      i++;
                    }
                    if (gotSomething) {
                      _mapSize(measuredSize);
                      reinitialize();
                      autosizingRequired = false;
                      if ($scope.$root && !$scope.$root.$$phase) {
                        $scope.$digest();
                      }
                    }
                  } else {
                    var dereg = $scope.$watch(function () {
                      if (repeatContainer[0].offsetHeight || repeatContainer[0].offsetWidth) {
                        dereg();
                        getFromMeasured();
                      }
                    });
                  }
                });
              } else {
                _mapSize(measuredSize);
              }
            }
            function getLayoutProps(value) {
              var layoutProp = options.horizontal ? 'width' : 'height';
              return ['', 'min-', 'max-'].reduce(function (acc, prop) {
                return acc["".concat(prop).concat(layoutProp)] = value, acc;
              }, {});
            }
            childClone.eq(0).attr(originalNgRepeatAttr, lhs + ' in ' + collectionName + (rhsSuffix ? ' ' + rhsSuffix : ''));
            childClone.addClass('vs-repeat-repeated-element');
            repeatContainer.append($beforeContent);
            repeatContainer.append(childClone);
            $compile(childClone)($scope);
            repeatContainer.append($afterContent);
            $scope.vsRepeat.startIndex = 0;
            $scope.vsRepeat.endIndex = 0;
            function scrollHandler() {
              var pos = $scrollParent[0][scrollPos];
              if (updateInnerCollection()) {
                $scope.$digest();
                if (options._ensureScrollIntegrity) {
                  $scrollParent[0][scrollPos] = pos;
                }
              }
            }
            $scrollParent.on('scroll', scrollHandler);
            function onWindowResize() {
              if (options.autoresize) {
                autosizingRequired = true;
                getFromMeasured();
                if ($scope.$root && !$scope.$root.$$phase) {
                  $scope.$digest();
                }
              }
              if (updateInnerCollection()) {
                $scope.$digest();
              }
            }
            angular.element(window).on('resize', onWindowResize);
            $scope.$on('$destroy', function () {
              angular.element(window).off('resize', onWindowResize);
              $scrollParent.off('scroll', scrollHandler);
            });
            $scope.$on('vsRepeatTrigger', refresh);
            $scope.$on('vsRepeatResize', function () {
              autosizingRequired = true;
              getFromMeasured();
            });
            var _prevStartIndex, _prevEndIndex, _minStartIndex, _maxEndIndex;
            $scope.$on('vsRenderAll', function () {
              if (!options.latch) {
                return;
              }
              if ($scope.vsRepeat.endIndex === originalLength) {
                $scope.$emit('vsRenderAllDone');
                return;
              }
              setTimeout(function () {
                // var __endIndex = Math.min($scope.vsRepeat.endIndex + (quantum || 1), originalLength);
                var __endIndex = originalLength;
                _maxEndIndex = Math.max(__endIndex, _maxEndIndex);
                $scope.vsRepeat.endIndex = options.latch ? _maxEndIndex : __endIndex;
                $scope[collectionName] = originalCollection.slice($scope.vsRepeat.startIndex, $scope.vsRepeat.endIndex);
                _prevEndIndex = $scope.vsRepeat.endIndex;
                $beforeContent.css(getLayoutProps(0));
                $afterContent.css(getLayoutProps(0));
                $scope.$emit('vsRenderAllDone');
                if ($scope.$root && !$scope.$root.$$phase) {
                  $scope.$digest();
                }
              });
            });
            function reinitialize() {
              _prevStartIndex = void 0;
              _prevEndIndex = void 0;
              if (!options.preserveLatchOnRefresh || _minStartIndex === undefined || _maxEndIndex === undefined) {
                _minStartIndex = originalLength;
                _maxEndIndex = 0;
              }
              updateTotalSize($scope.vsRepeat.sizesCumulative[originalLength]);
              updateInnerCollection();
              $scope.$emit('vsRepeatReinitialized', $scope.vsRepeat.startIndex, $scope.vsRepeat.endIndex);
            }
            function updateTotalSize(size) {
              $scope.vsRepeat.totalSize = options.offsetBefore + size + options.offsetAfter;
            }
            var _prevClientSize;
            function reinitOnClientHeightChange() {
              var ch = getClientSize($scrollParent[0], clientSize);
              if (ch !== _prevClientSize) {
                reinitialize();
                if ($scope.$root && !$scope.$root.$$phase) {
                  $scope.$digest();
                }
              }
              _prevClientSize = ch;
            }
            $scope.$watch(function () {
              if (typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame(reinitOnClientHeightChange);
              } else {
                reinitOnClientHeightChange();
              }
            });
            function binaryFind(array, threshold) {
              var a = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
              var b = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : array.length - 1;
              var d = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
              if (array[a] === threshold) {
                return [a, a, d];
              }
              if (array[b] === threshold) {
                return [b, b, d];
              }
              if (b - a > 1) {
                var m = Math.floor((a + b) / 2);
                if (array[m] > threshold) {
                  return binaryFind(array, threshold, a, m, d + 1);
                }
                return binaryFind(array, threshold, m, b, d + 1);
              }
              return [threshold > array[b] ? b : a, threshold < array[a] ? a : b, d];
            }
            function updateInnerCollection() {
              var $scrollPosition = getScrollPos($scrollParent[0], scrollPos);
              var $clientSize = getClientSize($scrollParent[0], clientSize);
              if (options.debug) {
                $clientSize /= 2;
              }
              var scrollOffset = repeatContainer[0] === $scrollParent[0] ? 0 : getScrollOffset(repeatContainer[0], $scrollParent[0], options.horizontal);
              var __startIndex = $scope.vsRepeat.startIndex;
              var __endIndex = $scope.vsRepeat.endIndex;
              if (autosizingRequired && !options.size) {
                __startIndex = 0;
                __endIndex = 1;
              } else {
                _warnMismatch();
                var relativeScroll = $scrollPosition - options.offsetBefore - scrollOffset;
                var _binaryFind = binaryFind($scope.vsRepeat.sizesCumulative, relativeScroll - options.scrollMargin);
                var _binaryFind2 = _slicedToArray(_binaryFind, 1);
                __startIndex = _binaryFind2[0];
                __startIndex = Math.max(__startIndex, 0);
                var _binaryFind3 = binaryFind($scope.vsRepeat.sizesCumulative, relativeScroll + options.scrollMargin + $clientSize, __startIndex);
                var _binaryFind4 = _slicedToArray(_binaryFind3, 2);
                __endIndex = _binaryFind4[1];
                __endIndex = Math.min(__endIndex, originalLength);
              }
              _minStartIndex = Math.min(__startIndex, _minStartIndex);
              _maxEndIndex = Math.max(__endIndex, _maxEndIndex);
              $scope.vsRepeat.startIndex = options.latch ? _minStartIndex : __startIndex;
              $scope.vsRepeat.endIndex = options.latch ? _maxEndIndex : __endIndex;

              // Move to the end of the collection if we are now past it
              if (_maxEndIndex < $scope.vsRepeat.startIndex) $scope.vsRepeat.startIndex = _maxEndIndex;
              var digestRequired = false;
              if (_prevStartIndex == null) {
                digestRequired = true;
              } else if (_prevEndIndex == null) {
                digestRequired = true;
              }
              if (!digestRequired) {
                if (options.hunked) {
                  if (Math.abs($scope.vsRepeat.startIndex - _prevStartIndex) >= options.hunkSize || $scope.vsRepeat.startIndex === 0 && _prevStartIndex !== 0) {
                    digestRequired = true;
                  } else if (Math.abs($scope.vsRepeat.endIndex - _prevEndIndex) >= options.hunkSize || $scope.vsRepeat.endIndex === originalLength && _prevEndIndex !== originalLength) {
                    digestRequired = true;
                  }
                } else {
                  digestRequired = $scope.vsRepeat.startIndex !== _prevStartIndex || $scope.vsRepeat.endIndex !== _prevEndIndex;
                }
              }
              if (digestRequired) {
                $scope[collectionName] = originalCollection.slice($scope.vsRepeat.startIndex, $scope.vsRepeat.endIndex);

                // Emit the event
                $scope.$emit('vsRepeatInnerCollectionUpdated', $scope.vsRepeat.startIndex, $scope.vsRepeat.endIndex, _prevStartIndex, _prevEndIndex);
                var triggerIndex;
                if (options.scrolledToEnd) {
                  triggerIndex = originalCollection.length - options.scrolledToEndOffset;
                  if ($scope.vsRepeat.endIndex >= triggerIndex && _prevEndIndex < triggerIndex || originalCollection.length && $scope.vsRepeat.endIndex === originalCollection.length) {
                    $scope.$eval(options.scrolledToEnd);
                  }
                }
                if (options.scrolledToBeginning) {
                  triggerIndex = options.scrolledToBeginningOffset;
                  if ($scope.vsRepeat.startIndex <= triggerIndex && _prevStartIndex > $scope.vsRepeat.startIndex) {
                    $scope.$eval(options.scrolledToBeginning);
                  }
                }
                _prevStartIndex = $scope.vsRepeat.startIndex;
                _prevEndIndex = $scope.vsRepeat.endIndex;
                var o1 = $scope.vsRepeat.sizesCumulative[$scope.vsRepeat.startIndex] + options.offsetBefore;
                var o2 = $scope.vsRepeat.sizesCumulative[$scope.vsRepeat.startIndex + $scope[collectionName].length] + options.offsetBefore;
                var total = $scope.vsRepeat.totalSize;
                $beforeContent.css(getLayoutProps(o1 + 'px'));
                $afterContent.css(getLayoutProps(total - o2 + 'px'));
              }
              return digestRequired;
            }
            function _warnMismatch() {
              $scope.$$postDigest(function () {
                window.requestAnimationFrame(function () {
                  var expectedSize = $scope.vsRepeat.sizesCumulative[originalLength];
                  var compStyle = window.getComputedStyle(repeatContainer[0]);
                  var paddings = options.horizontal ? ['paddingLeft', 'paddingRight'] : ['paddingTop', 'paddingBottom'];
                  var containerSize = repeatContainer[0][scrollSize] - paddings.reduce(function (acc, prop) {
                    return acc + Number(compStyle[prop].slice(0, -2));
                  }, 0);
                  if (repeatContainer[0][scrollSize] && expectedSize !== containerSize) {
                    console.warn('vsRepeat: size mismatch. Expected size ' + expectedSize + 'px whereas actual size is ' + containerSize + 'px. Fix vsSize on element:', $element[0]);
                  }
                });
              });
            }
          }
        };
      }
    };
  }]);
  angular.element(document.head).append("<style id=\"angular-vs-repeat-style\">\n\t  \t.vs-repeat-debug-element {\n        top: 50%;\n        left: 0;\n        right: 0;\n        height: 1px;\n        background: red;\n        z-index: 99999999;\n        box-shadow: 0 0 20px red;\n      }\n\n      .vs-repeat-debug-element + .vs-repeat-debug-element {\n        display: none;\n      }\n\n      .vs-repeat-before-content,\n      .vs-repeat-after-content {\n        border: none !important;\n        padding: 0 !important;\n      }\n    </style>");
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = vsRepeatModule.name;
  }
})(window, window.angular);
