# Jellify Your Website

A bookmarklet that turns any website into a big yummy wobbly jelly.

Inspired by [r/badUIbattles](https://www.reddit.com/r/baduibattles).

## Libraries Used

- [jQuery](https://jquery.com/)
- [Matter.js](https://brm.io/matter-js/)

## Development

### Overriding Options

You can set `window.JELLIFY_OPTIONS` before loading the bookmarklet to override
the default options. See `this.defaultOptions` in `class Apps` for the list of
available options.

### Debug Mode

Set `window.JELLIFY_DEBUG` to `1` before loading the bookmarklet to render the
tree nodes and see the Matter.js canvas.

### Local Development Bookmarklet

1. Install [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
   extension in VSCode
2. Start the Live Server at [http://127.0.0.1:5500](http://127.0.0.1:5500)
3. Add a new bookmark to your browser with the following code:

    ```javascript
    javascript:["https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js","https://cdn.jsdelivr.net/npm/matter-js@0.17.1/build/matter.min.js","http://localhost:5500/src/jellify.js"].forEach(t=>{const e=document.getElementsByTagName("head")[0],a=document.createElement("script");a.src=t,e.appendChild(a)});
    ```

### Problems I Encountered

- https://github.com/liabru/matter-js/issues/139
