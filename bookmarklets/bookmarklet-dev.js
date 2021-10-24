// Original code of the minified bookmarklet (for development)
//
// How to create the bookmarklet:
// 1. Go to https://www.toptal.com/developers/javascript-minifier/
// 2. Paste the code and minify
// 3. Add "javascript:" in front of the minified code to create a bookmarklet
//
// Note:
// Most websites disallow loading HTTP contents in HTTPS pages, just use any
// Google search result page to test because it doesn't block it. Otherwise,
// you would need a self-signed certificate for Live Server to use and it's not
// that easy to set up.

(() => {
  const urls = [
    // Dependencies should be loaded first
    'https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js',
    'https://cdn.jsdelivr.net/npm/matter-js@0.17.1/build/matter.min.js',
    // Main script is loaded last
    'http://localhost:5500/src/jellify.js',
  ];
  urls.forEach((url) => {
    const head = document.getElementsByTagName('head')[0];
    const script = document.createElement('script');
    script.src = url;
    head.appendChild(script);
  });
})();
