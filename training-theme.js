(function () {
  'use strict';

  const key = 'fitness-theme-v1';
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  let dark = false;
  try {
    dark = localStorage.getItem(key) === 'dark';
  } catch {}

  function applyTheme() {
    root.dataset.theme = dark ? 'dark' : 'light';
    themeColor.content = dark ? '#000000' : '#FFFFFF';
  }

  applyTheme();
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#themeToggle');

    function updateButton() {
      button.setAttribute('aria-pressed', String(dark));
    }

    updateButton();
    button.addEventListener('click', () => {
      dark = !dark;
      applyTheme();
      updateButton();
      try {
        localStorage.setItem(key, root.dataset.theme);
      } catch {}
    });
  });
})();
