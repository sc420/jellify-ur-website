// Original code of the minified bookmarklet (soft jelly version)
//
// How to create the bookmarklet:
// 1. Go to https://www.toptal.com/developers/javascript-minifier/
// 2. Paste the code and minify
// 3. Add "javascript:" in front of the minified code to create a bookmarklet

(() => {
  window.JELLIFY_OPTIONS = {
    physics: {
      constraint: {
        minStiffness: 0.001,
      },
    },
  };
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
