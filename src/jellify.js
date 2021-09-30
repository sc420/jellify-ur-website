/* global $, Matter */
/* eslint arrow-body-style: "off" */
/* eslint max-classes-per-file: "off" */
/* eslint no-console: ["error", { allow: ["info"] }] */

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
          return `${XPathUtil.getPathTo(element.parentNode)}/${
            element.tagName
          }[${ix + 1}]`;
        }
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix += 1;
      }
      return '';
    }
  }

  class TreeNode {
    constructor($el) {
      this.$el = $el;

      this.parent = null;
      this.children = [];

      this.cachedBoundingRect = null;
    }

    isVisible() {
      if (!this.$el.is(':visible')) return false;
      const rect = this.getBoundingBox();
      if (rect.width <= 0 || rect.height <= 0) return false;
      return true;
    }

    isRoot() {
      return this.parent === null;
    }

    isLeaf() {
      return this.children.length === 0;
    }

    setParent(parentNode) {
      this.parent = parentNode;
      if (parentNode) {
        parentNode.children.push(this);
      }
    }

    removeChild(childNode) {
      const index = this.children.indexOf(childNode);
      if (index >= 0) {
        this.children.splice(index, 1);
        childNode.setParent(null);
      }
    }

    render() {
      const borderStyle = this.isLeaf() ? 'solid' : 'dotted';
      const borderColor = this.isLeaf() ? 'red' : 'blue';
      // Reference: https://stackoverflow.com/a/26206753
      this.$el.css('outline', `1px ${borderStyle} ${borderColor}`);
      this.$el.css('outline-offset', '-1px');
    }

    getBoundingBox() {
      if (!this.cachedBoundingRect) {
        const rect = this.$el.get(0).getBoundingClientRect();
        const sx = window.scrollX;
        const sy = window.scrollY;
        this.cachedBoundingRect = new DOMRect(
          sx + rect.x,
          sy + rect.y,
          rect.width,
          rect.height,
        );
      }

      return this.cachedBoundingRect;
    }
  }

  class TreeManager {
    constructor() {
      this.rootNode = null;
    }

    buildTreeNodes() {
      const $body = $('body');
      this.rootNode = TreeManager.buildTreeNode($body);
      TreeManager.removeInvisibleLeafNodes(this.rootNode);
      TreeManager.removeIntermediateInvisibleNodes(this.rootNode);
    }

    static buildTreeNode($el) {
      const node = new TreeNode($el);
      const children = $el
        .children()
        .toArray()
        .map((el) => {
          return $(el);
        });
      const childrenNodes = children.map(($c) => {
        return TreeManager.buildTreeNode($c);
      });
      childrenNodes.forEach((child) => {
        child.setParent(node);
      });
      return node;
    }

    static treeToArray(node) {
      const list = [];
      TreeManager.treeToArrayVisit(node, list);
      return list;
    }

    static treeToArrayVisit(node, list) {
      list.push(node);
      node.children.forEach((c) => {
        return TreeManager.treeToArrayVisit(c, list);
      });
    }

    static removeInvisibleLeafNodes(rootNode) {
      const nodes = TreeManager.treeToArray(rootNode);
      let hasChange = true;
      const notifyChange = () => {
        hasChange = true;
      };
      while (hasChange) {
        hasChange = false;
        nodes.forEach((node) => {
          if (node.isRoot() || !node.isLeaf()) return;

          if (!node.isVisible()) {
            node.parent.removeChild(node);
            notifyChange();
          }
        });
      }
    }

    static removeIntermediateInvisibleNodes(rootNode) {
      const nodes = TreeManager.treeToArray(rootNode);
      nodes.forEach((node) => {
        if (node.isRoot() || !node.isLeaf()) return;

        const boundingBox = node.getBoundingBox();
        let prevAncestor = null;
        let curAncestor = node.parent;
        while (curAncestor !== null) {
          if (prevAncestor) {
            // Reattach the node to the current ancestor
            prevAncestor.removeChild(node);
            node.setParent(curAncestor);
          }
          const ancestorBoundingBox = curAncestor.getBoundingBox();
          if (RectUtil.contains(ancestorBoundingBox, boundingBox)) break;

          prevAncestor = curAncestor;
          curAncestor = curAncestor.parent;
        }
      });
    }

    render() {
      TreeManager.renderTreeNode(this.rootNode);
    }

    static renderTreeNode(node) {
      node.render();
      node.children.forEach((child) => {
        return TreeManager.renderTreeNode(child);
      });
    }
  }

  class PhysicsManager {
    constructor() {
      this.nodeToMatterRect = new Map();
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
          width: 1000,
          height: 1000,
          wireframes: true,
        },
      });

      this.mouse = Matter.Mouse.create(this.render.canvas);

      this.matterObjects = this.createMatterObjects(rootNode);
      this.mouseConstraint = this.createMouseConstraint();

      Matter.Composite.add(this.engine.world, this.matterObjects);
      Matter.Composite.add(this.engine.world, this.mouseConstraint);

      Matter.Render.run(this.render);

      Matter.Runner.run(this.runner, this.engine);
    }

    createMatterObjects(rootNode) {
      // Reset the mapping
      this.nodeToMatterRect.clear();

      const rects = this.createMatterRects(rootNode);

      const constraints = this.createMatterConstraints(rootNode);

      return [...rects, ...constraints];
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

    createMatterRects(node) {
      let rects = [];

      const rect = PhysicsManager.createMatterRect(node);
      rects.push(rect);
      this.nodeToMatterRect.set(node, rect);

      node.children.forEach((childNode) => {
        const childRects = this.createMatterRects(childNode);
        rects = [...rects, ...childRects];
      });

      return rects;
    }

    createMatterConstraints(node) {
      let allConstraints = [];

      // Connect the 4 corners of the node to the corners of the children nodes
      const result = this.createAllDiagonalMatterConstraints(node);
      const { constraints, excludedCorners } = result;
      allConstraints = [...allConstraints, ...constraints];

      // Connect the corner points of the children nodes
      const innerConstraints = this.createInnerMatterConstraints(
        node.children,
        excludedCorners,
      );
      allConstraints = [...allConstraints, ...innerConstraints];

      // Keep creating the constraints inside each child node
      node.children.forEach((childNode) => {
        const childConstraints = this.createMatterConstraints(childNode);
        allConstraints = [...allConstraints, ...childConstraints];
      });

      return allConstraints;
    }

    createAllDiagonalMatterConstraints(node) {
      if (node.children.length === 0) {
        return {
          constraints: [],
          excludedCorners: [],
        };
      }

      const boundingRect = node.getBoundingBox();
      const corners = PhysicsManager.getRectCornerPoints(boundingRect);

      let constraints = [];
      const excludedCorners = [];
      corners.forEach((corner) => {
        // eslint-disable-next-line
        const { nearestNode, nearestCorner } = PhysicsManager.findNearestCorner(
          corner,
          node.children,
        );

        // There may be more than 1 corner points with the same coordinates
        const diagonalConstraints = this.createDiagonalMatterConstraints(
          node,
          corner,
        );
        constraints = [...constraints, ...diagonalConstraints];

        excludedCorners.push(nearestCorner);
      });
      return { constraints, excludedCorners };
    }

    createDiagonalMatterConstraints(node, corner) {
      const rect = this.nodeToMatterRect.get(node);
      const constraints = [];
      node.children.forEach((childNode) => {
        const cBoundingRect = childNode.getBoundingBox();
        const cCorners = PhysicsManager.getRectCornerPoints(cBoundingRect);
        cCorners.forEach((childCorner) => {
          if (PhysicsManager.isPointAlmostEqual(corner, childCorner)) {
            const childRect = this.nodeToMatterRect.get(childNode);
            const constraint = PhysicsManager.createMatterConstraint(
              node,
              childNode,
              rect,
              childRect,
              corner,
              childCorner,
            );
            constraints.push(constraint);
          }
        });
      });
      return constraints;
    }

    createInnerMatterConstraints(nodes, excludedCorners) {
      if (nodes.length <= 1) return [];

      const constraints = [];
      nodes.forEach((node) => {
        const rect = this.nodeToMatterRect.get(node);
        const otherNodes = [...nodes];
        otherNodes.splice(nodes.indexOf(node), 1);

        const boundingRect = node.getBoundingBox();
        const corners = PhysicsManager.getRectCornerPoints(boundingRect);

        corners.forEach((corner) => {
          if (PhysicsManager.isPointExcluded(corner, excludedCorners)) return;

          const result = PhysicsManager.findNearestCorner(corner, otherNodes);
          const { nearestNode, nearestCorner } = result;

          const nearestRect = this.nodeToMatterRect.get(nearestNode);
          const constraint = PhysicsManager.createMatterConstraint(
            node,
            nearestNode,
            rect,
            nearestRect,
            corner,
            nearestCorner,
          );
          constraints.push(constraint);
        });
      });
      return constraints;
    }

    static findNearestCorner(corner, otherNodes) {
      if (otherNodes.length === 0) {
        throw new Error('Should have at least 1 node');
      }
      let minDistance = Infinity;
      let minDistanceNode = null;
      let minDistanceCorner = null;
      otherNodes.forEach((otherNode) => {
        const rect = otherNode.getBoundingBox();
        const otherCorners = PhysicsManager.getRectCornerPoints(rect);
        otherCorners.forEach((otherCorner) => {
          const dist = PhysicsManager.distance(corner, otherCorner);
          if (dist < minDistance) {
            minDistance = dist;
            minDistanceNode = otherNode;
            minDistanceCorner = otherCorner;
          }
        });
      });
      return {
        nearestNode: minDistanceNode,
        nearestCorner: minDistanceCorner,
      };
    }

    static createMatterRect(node) {
      const options = PhysicsManager.getMatterRectOptions(node);
      const boundingRect = node.getBoundingBox();
      const rect = PhysicsManager.boundingToCenterRect(boundingRect);
      return Matter.Bodies.rectangle(
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        options,
      );
    }

    static createMatterConstraint(
      nodeA,
      nodeB,
      rectA,
      rectB,
      cornerA,
      cornerB,
    ) {
      const boundingRectA = nodeA.getBoundingBox();
      const boundingRectB = nodeB.getBoundingBox();
      const pointA = PhysicsManager.absToRelativeToCenterPos(
        cornerA,
        boundingRectA,
      );
      const pointB = PhysicsManager.absToRelativeToCenterPos(
        cornerB,
        boundingRectB,
      );
      const options = { stiffness: 0.1 };
      return Matter.Constraint.create({
        bodyA: rectA,
        pointA,
        bodyB: rectB,
        pointB,
        ...options,
      });
    }

    static getMatterRectOptions(node) {
      return {
        // Disable collision
        // Reference: https://stackoverflow.com/a/61314389
        collisionFilter: {
          group: -1,
        },
        isStatic: node.isRoot(),
        label: XPathUtil.getPathTo(node.$el.get(0)),
        mass: 1,
      };
    }

    static getRectCornerPoints(boundingRect) {
      const xRight = boundingRect.x + boundingRect.width;
      const yBottom = boundingRect.y + boundingRect.height;
      return [
        { x: boundingRect.x, y: boundingRect.y }, // Top-left
        { x: xRight, y: boundingRect.y }, // Top-right
        { x: boundingRect.x, y: yBottom }, // Bottom-left
        { x: xRight, y: yBottom }, // Bottom-right
      ];
    }

    static boundingToCenterRect(boundingRect) {
      const centerX = boundingRect.x + boundingRect.width / 2;
      const centerY = boundingRect.y + boundingRect.height / 2;
      return new DOMRect(
        centerX,
        centerY,
        boundingRect.width,
        boundingRect.height,
      );
    }

    static absToRelativeToCenterPos(absPoint, boundingRect) {
      const centerX = boundingRect.x + boundingRect.width / 2;
      const centerY = boundingRect.y + boundingRect.height / 2;
      return { x: absPoint.x - centerX, y: absPoint.y - centerY };
    }

    static distance(pos1, pos2) {
      const xDist = pos1.x - pos2.x;
      const yDist = pos1.y - pos2.y;
      return Math.sqrt(xDist * xDist + yDist * yDist);
    }

    static isPointExcluded(point, excludedPoints) {
      return excludedPoints.some((excludedPoint) => {
        return PhysicsManager.isPointAlmostEqual(point, excludedPoint);
      });
    }

    static isPointAlmostEqual(pointA, pointB) {
      return (
        PhysicsManager.isFloatAlmostEqual(pointA.x, pointB.x)
        && PhysicsManager.isFloatAlmostEqual(pointA.y, pointB.y)
      );
    }

    static isFloatAlmostEqual(num1, num2) {
      return Math.abs(num1 - num2) < Number.EPSILON;
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

        this.treeManager.buildTreeNodes();

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
