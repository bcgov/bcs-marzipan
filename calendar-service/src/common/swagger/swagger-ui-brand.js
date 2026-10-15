(function () {
  'use strict';

  var LOGO_DARK = '/api/assets/bc-logo-dark.svg';
  var LOGO_LIGHT = '/api/swagger-assets/logo/bc-logo.svg';

  function isDarkMode() {
    return document.documentElement.classList.contains('dark-mode');
  }

  function wordmarkSrc() {
    return isDarkMode() ? LOGO_DARK : LOGO_LIGHT;
  }

  function syncHeaderLogo() {
    var img = document.querySelector('.corpcal-swagger-header__logo');
    if (img) {
      img.src = wordmarkSrc();
    }
  }

  function syncDarkModeFromSystem() {
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark-mode', prefersDark);
    syncHeaderLogo();
  }

  syncDarkModeFromSystem();
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', syncDarkModeFromSystem);

  function injectHeader() {
    if (document.querySelector('.corpcal-swagger-header')) {
      return;
    }

    var header = document.createElement('header');
    header.className = 'corpcal-swagger-header';
    header.innerHTML =
      '<img class="corpcal-swagger-header__logo" src="' +
      wordmarkSrc() +
      '" alt="BC Government" />';

    document.body.insertBefore(header, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
  } else {
    injectHeader();
  }
})();
