# Jellify Your Website

## Terms

- Node: A rectangular area which is either a primitive or container
- Valid node: A visible node that has non-zero rectangular area
- Primitive node: The leaf DOM element, represented by `Matter.Body`
- Container node: Contains more than 1 nodes, represented by 4 corner points as `Matter.Body`
- Function `outer(x)`:
  - If the parent node `parent(x)` contains only 1 valid child which is `x`, return `outer(parent(x))`
  - If not, return `x`
- Pattern: A specific way to connect the corner points of a container and its children nodes
  - We use `Matter.Constraint` to connect from a corner point to another one
  - For each corner point, we simply find the closest corner point of another node

## Algorithm

1. Find all valid primitive DOM elements `p`
2. For each primitive element `p`, find `p' = outer(p)`
3. Create a `Matter.Body` to represent `p'`
4. For each `p'`, the parent node of `p'` now have more than 1 nodes, we need to connect them together using the pattern to form a new container node `c`
5. Keep repeating the previous step until we have the biggest `c` that represents the `<body>` DOM element

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
