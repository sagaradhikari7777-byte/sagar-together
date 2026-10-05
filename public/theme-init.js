// Apply the saved appearance before styles and the main app load.
// Theme startup must also work when browser storage is unavailable.
(() => {
  let theme = 'light';
  try {
    if (localStorage.getItem('together-theme') === 'dark') theme = 'dark';
  } catch {}
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0d1421' : '#f4f7fc');
})();
