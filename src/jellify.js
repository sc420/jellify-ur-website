/* global $, Matter */
/* eslint arrow-body-style: "off" */
/* eslint max-classes-per-file: "off" */
/* eslint no-console: ["error", { allow: ["info", "debug"] }] */

(() => {
  class RectUtil {
    static contains(rect1, rect2) {
      return (
        rect2.x + rect2.width < rect1.x + rect1.width
        && rect2.x > rect1.x
        && rect2.y > rect1.y
        && rect2.y + rect2.height < rect1.y + rect1.height
      );
    }
  }

  class XPathUtil {
    // Reference: https://stackoverflow.com/a/2631931
    static getPathTo(element) {
      if (element.id !== '') return `id("${element.id}")`;
      if (element === document.body) return element.tagName;

      let ix = 0;
      const siblings = element.parentNode.childNodes;
      for (let i = 0; i < siblings.length; i += 1) {
        const sibling = siblings[i];
        if (sibling === element) {
          const basePath = XPathUtil.getPathTo(element.parentNode);
          return `${basePath}/${element.tagName}[${ix + 1}]`;
        }
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
          ix += 1;
        }
      }
      return '';
    }
  }

  class TreeNode {
    constructor($el) {
      this.$el = $el;

      this.parent = null;
      this.children = [];

      // Visual parent node should contain the visual children nodes, they are
      // not necessarily one depth difference but must be ancestor-descendant
      // relationship
      this.visualParent = null;
      this.visualChildren = [];

      // Will be calculated after the visual tree is built
      this.numVisualDescendants = NaN;
      this.visualHeight = NaN;
      this.canBeStartingNode = true;

      this.cachedID = null;
      this.cachedBoundingBox = null;
    }

    isVisible() {
      if (!this.$el) return false;
      if (!this.$el.is(':visible')) return false;
      const box = this.getBoundingBox();
      if (box.width <= 0 || box.height <= 0) return false;
      return true;
    }

    isRoot() {
      return !this.parent;
    }

    isVisualRoot() {
      return !this.visualParent;
    }

    setParent(parentNode) {
      this.parent = parentNode;
    }

    addChild(childNode) {
      this.children.push(childNode);
    }

    setVisualParent(parentNode) {
      this.visualParent = parentNode;
    }

    addVisualChild(childNode) {
      this.visualChildren.push(childNode);
    }

    setNumVisualDescendants(num) {
      this.numVisualDescendants = num;
    }

    setVisualHeight(height) {
      this.visualHeight = height;
    }

    disallowStartingNode() {
      this.canBeStartingNode = false;
    }

    render(borderStyle = 'solid', borderColor = 'red') {
      if (!this.isVisible()) return;

      // Reference: https://stackoverflow.com/a/26206753
      this.$el.css('outline', `1px ${borderStyle} ${borderColor}`);
      this.$el.css('outline-offset', '-1px');
    }

    getID() {
      if (!this.$el) return '';
      if (!this.cachedID) {
        this.cachedID = XPathUtil.getPathTo(this.$el.get(0));
      }
      return this.cachedID;
    }

    getBoundingBox() {
      if (!this.$el) return new DOMRect();
      if (!this.cachedBoundingBox) {
        const rect = this.$el.get(0).getBoundingClientRect();
        const sx = window.scrollX;
        const sy = window.scrollY;
        this.cachedBoundingBox = new DOMRect(
          sx + rect.x,
          sy + rect.y,
          rect.width,
          rect.height,
        );
      }

      return this.cachedBoundingBox;
    }
  }

  class TreeVisitor {
    constructor(rootNode) {
      this.rootNode = rootNode;
    }

    * getChildrenIterator() {
      let queue = [this.rootNode];
      while (queue.length > 0) {
        const node = queue.shift();
        // DFS
        queue = [...queue, ...node.children];

        yield node;
      }
    }

    * getVisualChildrenIterator() {
      let queue = [this.rootNode];
      while (queue.length > 0) {
        const node = queue.shift();
        // DFS
        queue = [...queue, ...node.visualChildren];

        yield node;
      }
    }
  }

  class TreeManager {
    constructor() {
      this.minVisualDescendants = 1;
      // We limit the number of visual descendants to boost the performance. If
      // a node has too many visual descendants we won't consider it as the
      // starting node
      this.maxVisualDescendants = 50;
      // We limit the height in the visual tree to avoid long stacked rectangles
      this.maxVisualHeight = 8;

      // The root node is built from "body" tag, we assume the body tag should
      // visually contain everything else
      this.rootNode = null;

      // Each visual root node represents a visual tree
      this.visualRootNodes = [];
      // The root nodes in visual subtrees that we starting animating from
      this.visualStartingNodes = [];

      // These information are saved just for debugging
      this.treeNodeCount = 0;
      this.visibleTreeNodeCount = 0;
      this.visualTreeEdgeCount = 0;
    }

    init() {
      const $body = $('body');
      this.rootNode = this.buildTreeNodes($body);
      console.debug(`Created ${this.treeNodeCount} tree nodes`);
      console.debug(`${this.visibleTreeNodeCount} of tree nodes are visible`);

      TreeManager.iterateChildren(
        this.rootNode,
        this.buildVisualTree.bind(this),
      );
      console.debug(`Built ${this.visualTreeEdgeCount} visual tree edges`);

      TreeManager.iterateChildren(
        this.rootNode,
        this.findVisualRootNodes.bind(this),
      );
      console.debug(`Found ${this.visualRootNodes.length} visual root nodes`);

      this.visualRootNodes.forEach((visualRootNode) => {
        TreeManager.iterateVisualChildren(
          visualRootNode,
          this.countVisualDescendants.bind(this),
        );

        TreeManager.iterateVisualChildren(
          visualRootNode,
          this.calcVisualHeight.bind(this),
        );

        TreeManager.iterateVisualChildren(
          visualRootNode,
          this.findVisualStartingNodes.bind(this),
        );
      });

      console.debug(`Found ${this.visualStartingNodes.length} starting nodes`);
    }

    buildTreeNodes($el) {
      const node = new TreeNode($el);
      const childrenElements = $el
        .children()
        .toArray()
        .map((el) => {
          return $(el);
        });

      // Recursive building
      const childrenNodes = childrenElements.map(($childEl) => {
        return this.buildTreeNodes($childEl);
      });

      // Bind relationship
      childrenNodes.forEach((childNode) => {
        node.addChild(childNode);
        childNode.setParent(node);
      });

      // Accumulate the counters
      this.treeNodeCount += 1;
      if (node.isVisible()) {
        this.visibleTreeNodeCount += 1;
      }

      return node;
    }

    buildVisualTree(node) {
      if (!node.isVisible()) return;

      const boundingBox = node.getBoundingBox();
      let curAncestorNode = node.parent;
      while (curAncestorNode) {
        if (curAncestorNode.isVisible()) {
          const ancestorBoundingBox = curAncestorNode.getBoundingBox();
          if (RectUtil.contains(ancestorBoundingBox, boundingBox)) {
            node.setVisualParent(curAncestorNode);
            curAncestorNode.addVisualChild(node);
            this.visualTreeEdgeCount += 1;
            break;
          }
        }

        curAncestorNode = curAncestorNode.parent;
      }
    }

    findVisualRootNodes(node) {
      if (!node.isVisualRoot) return;
      this.visualRootNodes.push(node);
    }

    countVisualDescendants(node) {
      // Return the count if this node has been computed
      if (Number.isFinite(node.numVisualDescendants)) {
        return node.numVisualDescendants;
      }

      const count = node.visualChildren.reduce((prevValue, curNode) => {
        const curValue = this.countVisualDescendants(curNode);
        return prevValue + curValue;
      }, 0 /* initialValue */);

      this.countVisualDescendantsTimes += 1;

      // Save the count
      node.setNumVisualDescendants(count);

      return count + 1;
    }

    calcVisualHeight(node) {
      // Return the height if this node has been computed
      if (Number.isFinite(node.visualHeight)) return node.visualHeight;

      const height = node.visualChildren.reduce((prevValue, curNode) => {
        const curValue = this.calcVisualHeight(curNode);
        return Math.max(prevValue, curValue);
      }, 0 /* initialValue */);

      this.calcVisualHeightTimes += 1;

      // Save the height
      node.setVisualHeight(height);

      return height + 1;
    }

    findVisualStartingNodes(node) {
      if (
        !node.canBeStartingNode
        || node.numVisualDescendants < this.minVisualDescendants
        || node.numVisualDescendants > this.maxVisualDescendants
        || node.visualHeight > this.maxVisualHeight
      ) {
        return;
      }

      this.visualStartingNodes.push(node);

      // Prevent all children nodes to be visited later on
      node.visualChildren.forEach((childNode) => {
        TreeManager.iterateVisualChildren(childNode, (curNode) => {
          curNode.disallowStartingNode();
        });
      });
    }

    render() {
      this.visualStartingNodes.forEach((visualStartingNode) => {
        TreeManager.renderVisualChildren(visualStartingNode);
      });
    }

    static iterateChildren(rootNode, fnCallback) {
      const visitor = new TreeVisitor(rootNode);
      const iterator = visitor.getChildrenIterator();
      let curItem = iterator.next();
      while (!curItem.done) {
        const curNode = curItem.value;
        fnCallback(curNode);

        curItem = iterator.next();
      }
    }

    static iterateVisualChildren(rootNode, fnCallback) {
      const visitor = new TreeVisitor(rootNode);
      const iterator = visitor.getVisualChildrenIterator();
      let curItem = iterator.next();
      while (!curItem.done) {
        const curNode = curItem.value;
        fnCallback(curNode);

        curItem = iterator.next();
      }
    }

    static renderVisualChildren(startingNode) {
      const visitor = new TreeVisitor(startingNode);
      const iterator = visitor.getVisualChildrenIterator();
      let curItem = iterator.next();
      while (!curItem.done) {
        const curNode = curItem.value;

        if (curNode.getID() === startingNode.getID()) {
          curNode.render('solid', 'red');
        } else {
          curNode.render('dotted', 'blue');
        }

        curItem = iterator.next();
      }
    }
  }

  class PhysicsManager {
    constructor() {
      this.engine = null;
      this.runner = null;
      this.render = null;
      this.mouse = null;
    }

    init(rootNode) {
      this.engine = Matter.Engine.create({
        gravity: {
          y: 0,
        },
      });

      this.runner = Matter.Runner.create();

      this.render = Matter.Render.create({
        element: document.body,
        engine: this.engine,
        options: {
          width: rootNode.getBoundingBox().width,
          height: rootNode.getBoundingBox().height,
          wireframes: true,
        },
      });

      this.mouse = Matter.Mouse.create(this.render.canvas);

      Matter.Runner.run(this.runner, this.engine);
      Matter.Render.run(this.render);
    }

    buildMouseConstraint() {
      return Matter.MouseConstraint.create(this.engine, {
        mouse: this.mouse,
        constraint: {
          stiffness: 1.0,
          render: {
            visible: false,
          },
        },
      });
    }

    addObjects(objects) {
      Matter.Composite.add(this.engine.world, objects);
    }

    static findNearestCorner(parentCorner, otherNodes) {
      let minDist = Infinity;
      let nearestNode = null;
      let nearestCorner = null;
      let nearestCornerIndex = null;
      otherNodes.forEach((otherNode) => {
        const boundingBox = otherNode.getBoundingBox();
        const otherCorners = PhysicsManager.getCornerPoints(boundingBox);
        otherCorners.forEach((otherCorner, otherCornerIndex) => {
          const dist = PhysicsManager.distance(parentCorner, otherCorner);
          if (dist < minDist) {
            minDist = dist;
            nearestNode = otherNode;
            nearestCorner = otherCorner;
            nearestCornerIndex = otherCornerIndex;
          }
        });
      });
      return {
        nearestNode,
        nearestCorner,
        nearestCornerIndex,
      };
    }

    static isCornerExcluded(node, cornerIndex, excludedCorners) {
      return excludedCorners.some((nodeAndCornerIndex) => {
        return (
          node.getID() === nodeAndCornerIndex.node.getID()
          && cornerIndex === nodeAndCornerIndex.cornerIndex
        );
      });
    }

    static createRectangle(node) {
      const options = PhysicsManager.getRectOptions(node);
      const boundingBox = node.getBoundingBox();
      const centerBox = PhysicsManager.boundingBoxToCenterBox(boundingBox);
      return Matter.Bodies.rectangle(
        centerBox.x,
        centerBox.y,
        centerBox.width,
        centerBox.height,
        options,
      );
    }

    static createConstraint(nodeA, nodeB, rectA, rectB, cornerA, cornerB) {
      const boundingBoxA = nodeA.getBoundingBox();
      const boundingBoxB = nodeB.getBoundingBox();
      const pointA = PhysicsManager.absToRelPos(cornerA, boundingBoxA);
      const pointB = PhysicsManager.absToRelPos(cornerB, boundingBoxB);
      const options = { stiffness: 0.01 };
      return Matter.Constraint.create({
        bodyA: rectA,
        pointA,
        bodyB: rectB,
        pointB,
        ...options,
      });
    }

    static getRectOptions(node) {
      return {
        // Disable collision
        // Reference: https://stackoverflow.com/a/61314389
        collisionFilter: {
          group: -1,
        },
        isStatic: node.isVisualRoot(),
        label: node.getID(),
        mass: 1,
      };
    }

    static getCornerPoints(boundingBox) {
      const xRight = boundingBox.x + boundingBox.width;
      const yBottom = boundingBox.y + boundingBox.height;
      return [
        { x: boundingBox.x, y: boundingBox.y }, // Top-left
        { x: xRight, y: boundingBox.y }, // Top-right
        { x: boundingBox.x, y: yBottom }, // Bottom-left
        { x: xRight, y: yBottom }, // Bottom-right
      ];
    }

    static boundingBoxToCenterBox(boundingBox) {
      const centerX = boundingBox.x + boundingBox.width / 2;
      const centerY = boundingBox.y + boundingBox.height / 2;
      return new DOMRect(
        centerX,
        centerY,
        boundingBox.width,
        boundingBox.height,
      );
    }

    static absToRelPos(absPos, boundingBox) {
      const centerX = boundingBox.x + boundingBox.width / 2;
      const centerY = boundingBox.y + boundingBox.height / 2;
      return { x: absPos.x - centerX, y: absPos.y - centerY };
    }

    static distance(pos1, pos2) {
      const xDist = pos1.x - pos2.x;
      const yDist = pos1.y - pos2.y;
      return Math.sqrt(xDist * xDist + yDist * yDist);
    }
  }

  class JellifyEngine {
    constructor(treeManager, physicsManager) {
      this.treeManager = treeManager;
      this.physicsManager = physicsManager;
    }

    init() {
      const { rectangles, nodeIDToRectangle } = this.buildAllRectangles();
      console.debug(`Built ${rectangles.length} rectangles`);

      const constraints = this.buildAllConstraints(nodeIDToRectangle);
      console.debug(`Built ${constraints.length} constraints`);

      const mouseConstraint = this.physicsManager.buildMouseConstraint();

      this.physicsManager.addObjects(rectangles);
      this.physicsManager.addObjects(constraints);
      this.physicsManager.addObjects(mouseConstraint);
    }

    buildAllRectangles() {
      let allRectangles = [];
      let allNodeIDToRectangle = {};
      this.treeManager.visualStartingNodes.forEach((startingNode) => {
        const result = JellifyEngine.buildRectangles(startingNode);
        const { rectangles, nodeIDToRectangle } = result;

        allRectangles = [...allRectangles, ...rectangles];
        allNodeIDToRectangle = {
          ...allNodeIDToRectangle,
          ...nodeIDToRectangle,
        };
      });
      return {
        rectangles: allRectangles,
        nodeIDToRectangle: allNodeIDToRectangle,
      };
    }

    buildAllConstraints(nodeIDToRectangle) {
      let allConstraints = [];
      this.treeManager.visualStartingNodes.forEach((startingNode) => {
        const constraints = JellifyEngine.buildConstraints(
          startingNode,
          nodeIDToRectangle,
        );

        allConstraints = [...allConstraints, ...constraints];
      });
      return allConstraints;
    }

    static buildRectangles(startingNode) {
      const visitor = new TreeVisitor(startingNode);
      const iterator = visitor.getVisualChildrenIterator();
      let curItem = iterator.next();
      const rectangles = [];
      const nodeIDToRectangle = {};
      while (!curItem.done) {
        const curNode = curItem.value;
        const rectangle = PhysicsManager.createRectangle(curNode);
        rectangles.push(rectangle);
        nodeIDToRectangle[curNode.getID()] = rectangle;

        curItem = iterator.next();
      }
      return { rectangles, nodeIDToRectangle };
    }

    static buildConstraints(startingNode, nodeIDToRectangle) {
      const visitor = new TreeVisitor(startingNode);
      const iterator = visitor.getVisualChildrenIterator();
      let curItem = iterator.next();
      let constraints = [];
      while (!curItem.done) {
        const curNode = curItem.value;
        // Build diagonal constraints
        const result = JellifyEngine.buildDiagonalConstraints(
          curNode,
          nodeIDToRectangle,
        );
        const { diagonalConstraints, excludedCorners } = result;

        // Build inner constraints
        const innerConstraints = JellifyEngine.buildInnerConstraints(
          curNode,
          excludedCorners,
          nodeIDToRectangle,
        );

        constraints = [
          ...constraints,
          ...diagonalConstraints,
          ...innerConstraints,
        ];

        curItem = iterator.next();
      }
      return constraints;
    }

    static buildDiagonalConstraints(parentNode, nodeIDToRectangle) {
      const parentRectangle = nodeIDToRectangle[parentNode.getID()];
      const parentBoundingBox = parentNode.getBoundingBox();
      const corners = PhysicsManager.getCornerPoints(parentBoundingBox);

      const diagonalConstraints = [];
      const excludedCorners = [];
      corners.forEach((corner) => {
        const result = PhysicsManager.findNearestCorner(
          corner,
          parentNode.visualChildren,
        );
        const { nearestNode, nearestCorner, nearestCornerIndex } = result;
        if (!nearestNode) return;

        const nearestRectangle = nodeIDToRectangle[nearestNode.getID()];
        const constraint = PhysicsManager.createConstraint(
          parentNode,
          nearestNode,
          parentRectangle,
          nearestRectangle,
          corner,
          nearestCorner,
        );

        diagonalConstraints.push(constraint);

        excludedCorners.push({
          node: nearestNode,
          cornerIndex: nearestCornerIndex,
        });
      });
      return { diagonalConstraints, excludedCorners };
    }

    static buildInnerConstraints(
      parentNode,
      excludedCorners,
      nodeIDToRectangle,
    ) {
      const innerConstraints = [];
      parentNode.visualChildren.forEach((node, nodeIndex) => {
        const rectangle = nodeIDToRectangle[node.getID()];

        const otherNodes = [...parentNode.visualChildren];
        otherNodes.splice(nodeIndex, 1);

        const boundingBox = node.getBoundingBox();
        const corners = PhysicsManager.getCornerPoints(boundingBox);

        corners.forEach((corner, cornerIndex) => {
          if (
            PhysicsManager.isCornerExcluded(node, cornerIndex, excludedCorners)
          ) {
            return;
          }

          const result = PhysicsManager.findNearestCorner(corner, otherNodes);
          const { nearestNode, nearestCorner } = result;
          if (!nearestNode) return;

          const nearestRectangle = nodeIDToRectangle[nearestNode.getID()];
          const constraint = PhysicsManager.createConstraint(
            node,
            nearestNode,
            rectangle,
            nearestRectangle,
            corner,
            nearestCorner,
          );

          innerConstraints.push(constraint);
        });
      });
      return innerConstraints;
    }
  }

  class App {
    constructor() {
      this.globalBookmarkletName = 'JELLIFY_BOOKMARKLET';
      this.globalDebugName = 'JELLIFY_DEBUG';
      this.treeManager = new TreeManager();
      this.physicsManager = new PhysicsManager();
      this.jellifyEngine = new JellifyEngine(
        this.treeManager,
        this.physicsManager,
      );
    }

    init() {
      if (this.isLoaded()) {
        console.info('Jellify is already loaded, not doing anything new');
        return;
      }

      App.waitLibraries(() => {
        this.waitPageToBeReady();
      });
    }

    waitPageToBeReady() {
      $(document).ready(() => {
        this.setLoaded();

        this.treeManager.init();

        if (this.isDebugMode() || true) {
          this.treeManager.render();
        }

        this.physicsManager.init(this.treeManager.rootNode);

        this.jellifyEngine.init();
      });
    }

    isLoaded() {
      return typeof window[this.globalBookmarkletName] !== 'undefined';
    }

    isDebugMode() {
      return typeof window[this.globalDebugName] !== 'undefined';
    }

    setLoaded() {
      window[this.globalBookmarkletName] = true;
      console.info('Jellify is loaded');
    }

    static waitLibraries(onFinish) {
      const timerId = setInterval(() => {
        if (window.jQuery && window.Matter) {
          onFinish();
          clearInterval(timerId);
        }
      }, 100);
    }
  }

  const app = new App();
  app.init();
})();

// # sourceURL=jellify.js
