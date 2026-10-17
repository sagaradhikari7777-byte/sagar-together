// Apply the appearance before styles and the app load. "auto" (or nothing
// saved) follows the device. Startup must work when storage is unavailable.
(() => {
  let theme = 'auto';
  try { theme = localStorage.getItem('together-theme') || 'auto'; } catch {}
  const dark = theme === 'dark' || (theme !== 'light' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b0b0f' : '#f3f2ef');
})();
