'use strict';

goog.module('grrUi.appController');
goog.module.declareLegacyNamespace();


/**
 * If GRR is running with AdminUI.use_precompiled_js = True, then
 * grrUi.templates is a special autogenerated module containing all the
 * directives templates. If GRR is running with
 * AdminUI.use_precompiled_js = False, then this module is empty.
 */
const templatesModule = goog.require('grrUi.templates.templates.templatesModule');
const {aclModule} = goog.require('grrUi.acl.acl');
const {artifactModule} = goog.require('grrUi.artifact.artifact');
const {clientModule} = goog.require('grrUi.client.client');
const {configModule} = goog.require('grrUi.config.config');
const {coreModule} = goog.require('grrUi.core.core');
const {flowModule} = goog.require('grrUi.flow.flow');
const {formsModule} = goog.require('grrUi.forms.forms');
const {huntModule} = goog.require('grrUi.hunt.hunt');
/**
 * localModule is empty by default and can be used for deployment-specific
 * plugins implementation.
 */
const {localModule} = goog.require('grrUi.local.local');
const {routingModule} = goog.require('grrUi.routing.routing');
const {semanticModule} = goog.require('grrUi.semantic.semantic');
const {sidebarModule} = goog.require('grrUi.sidebar.sidebar');
const {userModule} = goog.require('grrUi.user.user');


/**
 * Main GRR UI application module.
 */
exports.appControllerModule = angular.module('grrUi.appController', [
  aclModule.name,
  artifactModule.name,
  clientModule.name,
  configModule.name,
  coreModule.name,
  flowModule.name,
  formsModule.name,
  huntModule.name,
  localModule.name,
  routingModule.name,
  semanticModule.name,
  sidebarModule.name,
  templatesModule.name,
  userModule.name,
]);

/**
 * Global list of intercepted errors. Filled by $exceptionHandler.
 * @private
 */
window.grrInterceptedErrors_ = [];

exports.appControllerModule.config(function(
    $httpProvider, $interpolateProvider, $qProvider, $locationProvider,
    $rootScopeProvider, $provide) {
  // Set templating braces to be '{$' and '$}' to avoid conflicts with Django
  // templates.
  $interpolateProvider.startSymbol('{$');
  $interpolateProvider.endSymbol('$}');

  // Ensuring that Django plays nicely with Angular-initiated requests
  // (see http://www.daveoncode.com/2013/10/17/how-to-
  // make-angularjs-and-django-play-nice-together/).
  $httpProvider.defaults.headers.post[
    'Content-Type'] = 'application/x-www-form-urlencoded';

  // Erroring on unhandled rejection is a behavior added in Angular 1.6, our
  // code is written without this check in mind.
  $qProvider.errorOnUnhandledRejections(false);

  // Setting this explicitly due to Angular's behavior change between
  // versions 1.5 and 1.6.
  $locationProvider.hashPrefix('');

  // We use recursive data model generation when rendering forms. Therefore
  // have to increase the digestTtl limit to 50.
  $rootScopeProvider.digestTtl(50);

  // We decorate $exceptionHandler to collect information about errors
  // in a global list (window._grrInterceptedErrors). This is then used
  // by Selenium testing code to check for JS errors.
  $provide.decorator("$exceptionHandler", function($delegate) {
    return function(exception, cause) {
      window.grrInterceptedErrors_.push(exception.stack || exception.toString());
      $delegate(exception, cause);
    };
  });
});

exports.appControllerModule.run(function(
    $injector, $http, $cookies, grrFirebaseService, grrReflectionService) {

    // Ensure CSRF token is in place for Angular-initiated HTTP requests.
  $http.defaults.headers.post['X-CSRFToken'] = $cookies.get('csrftoken');
  $http.defaults.headers.delete = $http.defaults.headers.patch = {
    'X-CSRFToken': $cookies.get('csrftoken')
  };

  grrFirebaseService.setupIfNeeded();

  // Call reflection service as soon as possible in the app lifetime to cache
  // the values. "ACLToken" is picked up here as an arbitrary name.
  // grrReflectionService loads all RDFValues definitions on first request
  // and then caches them.
  grrReflectionService.getRDFValueDescriptor('ACLToken');

  // Propagate the globals to the root scope. This makes them
  // available in templates.
  $injector.get("$rootScope").globals = window.globals;
});


/**
 * Hardcoding jsTree themes folder so that it works correctly when used
 * from a JS bundle file.
 */
$['jstree']['_themes'] = '/static/third-party/jstree/themes/';


/**
 * TODO(user): Remove when dependency on jQuery-migrate is removed.
 */
jQuery['migrateMute'] = true;


exports.appControllerModule.controller('GrrUiAppController', function() {});
