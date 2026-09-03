(() => {
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${src}`));
      document.head.appendChild(script);
    });
  }

  loadScript('/engagement-core.js')
    .then(() => loadScript('/latest-art-fix.js'))
    .then(() => loadScript('/like-sync.js'))
    .then(() => loadScript('/artwork-crm-gallery.js?v=20260903-1223'))
    .then(() => loadScript('/gallery-ready.js?v=20260903-1223'))
    .catch(error => {
      console.error('Lucy gallery enhancement failed to load:', error);
      document.querySelector('#artGrid')?.classList.add('gallery-is-ready');
    });
})();