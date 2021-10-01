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
      // Children nodes that are visually contained by this node
      this.visualChildren = [];

      this.cachedID = null;
      this.cachedBoundingBox = null;
    }

    isVisible() {
      if (!this.$el.is(':visible')) return false;
      const box = this.getBoundingBox();
      if (box.width <= 0 || box.height <= 0) return false;
      return true;
    }

    isRoot() {
      return !this.parent;
    }

    isLeaf() {
      return this.children.length === 0;
    }

    setParent(node) {
      this.parent = node;
    }

    addChild(node) {
      this.children.push(node);
    }

    addVisualChild(node) {
      this.visualChildren.push(node);
    }

    render() {
      if (!this.isVisible()) return;

      const borderStyle = this.isLeaf() ? 'solid' : 'dotted';
      const borderColor = this.isLeaf() ? 'red' : 'blue';
      // Reference: https://stackoverflow.com/a/26206753
      this.$el.css('outline', `1px ${borderStyle} ${borderColor}`);
      this.$el.css('outline-offset', '-1px');
    }

    getID() {
      if (!this.cachedID) {
        this.cachedID = XPathUtil.getPathTo(this.$el.get(0));
      }
      return this.cachedID;
    }

    getBoundingBox() {
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

  class TreeManager {
    constructor() {
      this.rootNode = null;

      this.treeNodeCount = 0;
      this.visibleTreeNodeCount = 0;
    }

    init() {
      const $body = $('body');
      this.rootNode = this.buildTreeNode($body);
      console.debug(`Created ${this.treeNodeCount} tree nodes`);
      console.debug(`${this.visibleTreeNodeCount} of tree nodes are visible`);

      TreeManager.buildVisualChildByFindingVisualParent(this.rootNode);
    }

    buildTreeNode($el) {
      const node = new TreeNode($el);
      const childrenElements = $el
        .children()
        .toArray()
        .map((el) => {
          return $(el);
        });

      // Recursive building
      const childrenNodes = childrenElements.map(($childEl) => {
        return this.buildTreeNode($childEl);
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

    static buildVisualChildByFindingVisualParent(node) {
      const boundingBox = node.getBoundingBox();
      let curAncestorNode = node.parent;
      while (curAncestorNode) {
        const ancestorBoundingBox = curAncestorNode.getBoundingBox();
        if (RectUtil.contains(ancestorBoundingBox, boundingBox)) {
          curAncestorNode.addVisualChild(node);
          break;
        }

        curAncestorNode = curAncestorNode.parent;
      }

      // Recursive building
      node.children.forEach((childNode) => {
        TreeManager.buildVisualChildByFindingVisualParent(childNode);
      });
    }

    render() {
      TreeManager.renderVisualChildren(this.rootNode);
    }

    static renderVisualChildren(node) {
      node.render();
      node.visualChildren.forEach((childNode) => {
        childNode.render();
      });

      // Recursive rendering
      node.children.forEach((childNode) => {
        TreeManager.renderVisualChildren(childNode);
      });
    }
  }

  class PhysicsManager {
    constructor() {
      this.rects = [];
      this.diagonalConstraints = [];
      this.innerConstraints = [];
      this.nodeIDToRect = {};
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

      this.matterObjects = this.createObjects(rootNode);
      this.mouseConstraint = this.createMouseConstraint();

      Matter.Composite.add(this.engine.world, this.matterObjects);
      Matter.Composite.add(this.engine.world, this.mouseConstraint);

      Matter.Render.run(this.render);

      Matter.Runner.run(this.runner, this.engine);
    }

    createObjects(rootNode) {
      this.rects = [];
      this.constraints = [];
      this.nodeIDToRect = {};

      this.buildRect(rootNode);
      console.debug(`Created ${this.rects.length} rectangles`);

      this.buildConstraints(rootNode);
      console.debug(`Created ${this.constraints.length} constraints`);

      return [...this.rects, ...this.constraints];
    }

    createMouseConstraint() {
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

    buildRect(node) {
      if (node.isVisible()) {
        const rect = PhysicsManager.createRect(node);
        this.rects.push(rect);
        this.nodeIDToRect[node.getID()] = rect;
      }

      // Recursive building
      node.children.forEach((childNode) => {
        this.buildRect(childNode);
      });
    }

    buildConstraints(node) {
      if (node.isVisible()) {
        const excludedCorners = this.buildDiagonalConstraints(node);

        this.buildInnerConstraints(node, excludedCorners);
      }

      // Recursive building
      node.children.forEach((childNode) => {
        this.buildConstraints(childNode);
      });
    }

    buildDiagonalConstraints(parentNode) {
      const parentRect = this.nodeIDToRect[parentNode.getID()];
      const parentBoundingBox = parentNode.getBoundingBox();
      const corners = PhysicsManager.getCornerPoints(parentBoundingBox);

      const excludedCorners = [];
      corners.forEach((corner) => {
        const result = PhysicsManager.findNearestCorner(
          corner,
          parentNode.visualChildren,
        );
        const { nearestNode, nearestCorner, nearestCornerIndex } = result;
        if (!nearestNode) return;

        const nearestRect = this.nodeIDToRect[nearestNode.getID()];
        const constraint = PhysicsManager.createConstraint(
          parentNode,
          nearestNode,
          parentRect,
          nearestRect,
          corner,
          nearestCorner,
        );

        this.constraints.push(constraint);

        excludedCorners.push({
          node: nearestNode,
          cornerIndex: nearestCornerIndex,
        });
      });
      return excludedCorners;
    }

    buildInnerConstraints(parentNode, excludedCorners) {
      parentNode.visualChildren.forEach((node, nodeIndex) => {
        const rect = this.nodeIDToRect[node.getID()];

        const otherNodes = [...parentNode.visualChildren];
        otherNodes.splice(nodeIndex, 1);

        const boundingBox = node.getBoundingBox();
        const corners = PhysicsManager.getCornerPoints(boundingBox);

        corners.forEach((corner, cornerIndex) => {
          if (
            PhysicsManager.isCornerExcluded(node, cornerIndex, excludedCorners)
          ) return;

          const result = PhysicsManager.findNearestCorner(corner, otherNodes);
          const { nearestNode, nearestCorner } = result;
          if (!nearestNode) return;

          const nearestRect = this.nodeIDToRect[nearestNode.getID()];
          const constraint = PhysicsManager.createConstraint(
            node,
            nearestNode,
            rect,
            nearestRect,
            corner,
            nearestCorner,
          );

          this.constraints.push(constraint);
        });
      });
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

    static createRect(node) {
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
        isStatic: node.isRoot(),
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

  class App {
    constructor() {
      this.globalBookmarkletName = 'JELLIFY_BOOKMARKLET';
      this.globalDebugName = 'JELLIFY_DEBUG';
      this.treeManager = new TreeManager();
      this.physicsManager = new PhysicsManager();
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

    static waitLibraries(onFinish) {
      const timerId = setInterval(() => {
        if (window.jQuery && window.Matter) {
          onFinish();
          clearInterval(timerId);
        }
      }, 100);
    }

    waitPageToBeReady() {
      $(document).ready(() => {
        this.setLoaded();

        this.treeManager.init();

        if (this.isDebugMode() || true) {
          this.treeManager.render();
        }

        this.physicsManager.init(this.treeManager.rootNode);
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
  }

  const app = new App();
  app.init();
})();

// # sourceURL=jellify.js
