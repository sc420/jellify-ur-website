# Jellify Your Website

A bookmarklet that turns any website into a big yummy wobbly jelly.

Inspired by [r/badUIbattles](https://www.reddit.com/r/baduibattles).

## Local Development Bookmarklet

1. Install [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in VSCode
2. Start the Live Server at [http://127.0.0.1:5500](http://127.0.0.1:5500)
3. Add a new bookmark to your browser with the following code:

    ```javascript
    javascript:["https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js","https://cdn.jsdelivr.net/npm/matter-js@0.17.1/build/matter.min.js","http://localhost:5500/src/jellify.js"].forEach(t=>{const e=document.getElementsByTagName("head")[0],a=document.createElement("script");a.src=t,e.appendChild(a)});
    ```

### See Which DOM Elements Are Chosen

## Problems I Encountered

- https://github.com/liabru/matter-js/issues/139
