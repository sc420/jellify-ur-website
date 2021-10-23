/* global $, Matter */
/* eslint arrow-body-style: "off" */
/* eslint max-classes-per-file: "off" */
/* eslint no-console: ["error", { allow: ["info", "debug"] }] */

(() => {
  class RandomUtil {
    static randValue(min, max) {
      return Math.random() * (max - min) + min;
    }
  }

  class GeometryUtil {
    static containsRect(rect1, rect2, margin = 0) {
      return (
        rect1.x + margin <= rect2.x
        && rect2.x + rect2.width + margin <= rect1.x + rect1.width
        && rect1.y + margin <= rect2.y
        && rect2.y + rect2.height + margin <= rect1.y + rect1.height
      );
    }

    static getCornerPoints(rect) {
      const xRight = rect.x + rect.width;
      const yBottom = rect.y + rect.height;
      return [
        Matter.Vector.create(xRight, rect.y), // Top-right
        Matter.Vector.create(rect.x, rect.y), // Top-left
        Matter.Vector.create(rect.x, yBottom), // Bottom-left
        Matter.Vector.create(xRight, yBottom), // Bottom-right
      ];
    }

    static boundingBoxToCenterBox(rect) {
      return {
        x: rect.x + rect.width / 2.0,
        y: rect.y + rect.height / 2.0,
        width: rect.width,
        height: rect.height,
      };
    }

    static diagonalLength(rect) {
      const diagonalVector = Matter.Vector.create(rect.width, rect.height);
      return Matter.Vector.magnitude(diagonalVector);
    }

    static absToRelPos(absPos, rect) {
      const centerBox = GeometryUtil.boundingBoxToCenterBox(rect);
      return Matter.Vector.sub(absPos, centerBox);
    }

    static distance(pos1, pos2) {
      const diff = Matter.Vector.sub(pos2, pos1);
      return Matter.Vector.magnitudeSquared(diff);
    }

    static angle(pos1, pos2) {
      const angleInRadian = Matter.Vector.angle(pos1, pos2);
      return GeometryUtil.radianToDegree(angleInRadian);
    }

    static radianToDegree(angleInRadian) {
      const degrees = (angleInRadian * 180.0) / Math.PI;
      return (360.0 + degrees) % 360.0;
    }

    static degreeToRadian(angleInDegree) {
      const radians = (angleInDegree * Math.PI) / 180.0;
      return (2 * Math.PI + radians) % (2 * Math.PI);
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

  class SmoothVector {
    constructor(maxSamples) {
      this.maxSamples = maxSamples;

      this.samples = [];
    }

    addSample(vector) {
      if (this.samples.length >= this.maxSamples) this.samples.shift();
      this.samples.push(vector);
    }

    getSmoothVector() {
      const initVector = Matter.Vector.create(0, 0);
      if (this.samples.length === 0) return initVector;
      const accumulatedVector = this.samples.reduce((prevVector, curSample) => {
        return Matter.Vector.add(prevVector, curSample);
      }, initVector);
      return Matter.Vector.div(accumulatedVector, this.samples.length);
    }
  }

  class TreeNode {
    constructor($el) {
      this.$el = $el;

      this.parent = null;
      this.children = [];

      // Visual parent node should "visually" contain the visual children nodes,
      // they are not necessarily one depth difference but must be
      // ancestor-descendant relationship
      this.visualParent = null;
      this.visualChildren = [];

      // Will be calculated after the visual tree is built
      this.numVisualDescendants = NaN;
      this.visualHeight = NaN;
      this.canBeStartingNode = true;
      this.isStartingNode = false;

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

    setStartingNode() {
      this.isStartingNode = true;
    }

    setTransform(translation, rotation) {
      const translateStr = `translate(${translation.x}px, ${translation.y}px)`;
      const rotationStr = `rotate(${rotation}rad)`;

      this.$el.css('transform', `${translateStr} ${rotationStr}`);
    }

    render(borderStyle = 'solid', borderColor = 'red') {
      if (!this.isVisible()) return;

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
        this.cachedBoundingBox = {
          x: sx + rect.x,
          y: sy + rect.y,
          width: rect.width,
          height: rect.height,
        };
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
        queue = [...queue, ...node.children]; // DFS

        yield node;
      }
    }

    * getVisualChildrenIterator() {
      let queue = [this.rootNode];
      while (queue.length > 0) {
        const node = queue.shift();
        queue = [...queue, ...node.visualChildren]; // DFS

        yield node;
      }
    }
  }

  class TreeIterator {
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
  }

  class TreeManager {
    constructor(options) {
      this.options = options;

      // The root node is built from "body" tag
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

      TreeIterator.iterateChildren(
        this.rootNode,
        this.buildVisualChildren.bind(this),
      );
      console.debug(`Built ${this.visualTreeEdgeCount} visual tree edges`);

      TreeIterator.iterateChildren(
        this.rootNode,
        this.findVisualRootNodes.bind(this),
      );
      console.debug(`Found ${this.visualRootNodes.length} visual root nodes`);

      this.visualRootNodes.forEach((visualRootNode) => {
        TreeIterator.iterateVisualChildren(
          visualRootNode,
          this.countVisualDescendants.bind(this),
        );

        TreeIterator.iterateVisualChildren(
          visualRootNode,
          this.calcVisualHeight.bind(this),
        );

        TreeIterator.iterateVisualChildren(
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

    buildVisualChildren(visualParentNode) {
      if (!visualParentNode.isVisible()) return;

      visualParentNode.children.forEach((childNode) => {
        this.findVisualChildren(visualParentNode, childNode);
      });
    }

    findVisualChildren(visualParentNode, curNode) {
      if (!curNode.isVisible()) return;
      if (curNode.visualParent) return;

      if (
        GeometryUtil.containsRect(
          visualParentNode.getBoundingBox(),
          curNode.getBoundingBox(),
          this.options.minMargin,
        )
      ) {
        visualParentNode.addVisualChild(curNode);
        curNode.setVisualParent(visualParentNode);
        this.visualTreeEdgeCount += 1;
        return;
      }

      // See if deeper nodes can be visual children
      curNode.children.forEach((childNode) => {
        this.findVisualChildren(visualParentNode, childNode);
      });
    }

    findVisualRootNodes(node) {
      if (!node.isVisible() || !node.isVisualRoot()) return;
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
        || node.numVisualDescendants < this.options.minVisualDescendants
        || node.numVisualDescendants > this.options.maxVisualDescendants
        || node.visualHeight > this.options.maxVisualHeight
      ) {
        return;
      }

      node.setStartingNode();
      this.visualStartingNodes.push(node);

      // Prevent all children nodes to be visited later on
      node.visualChildren.forEach((childNode) => {
        TreeIterator.iterateVisualChildren(childNode, (curNode) => {
          curNode.disallowStartingNode();
        });
      });
    }

    render() {
      this.visualStartingNodes.forEach((visualStartingNode) => {
        TreeIterator.renderVisualChildren(visualStartingNode);
      });
    }

    static renderVisualChildren(startingNode) {
      TreeIterator.iterateVisualChildren(startingNode, (curNode) => {
        if (curNode.getID() === startingNode.getID()) {
          curNode.render('solid', 'red');
        } else {
          curNode.render('dotted', 'blue');
        }
      });
    }
  }

  class PhysicsManager {
    constructor(isRender = false) {
      this.isRender = isRender;

      this.engine = null;
      this.render = null;
      this.mouse = null;
    }

    init(rootNode) {
      this.engine = Matter.Engine.create({
        // Disable the gravity
        gravity: {
          y: 0,
        },
      });

      if (this.isRender) {
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

        Matter.Render.run(this.render);
      }
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

    static correctForce(force) {
      // Reference: https://github.com/liabru/matter-js/issues/666#issuecomment-615939507
      return Matter.Vector.div(force, 1000000);
    }

    static createRectangle(node) {
      const rectangleOptions = PhysicsManager.getRectangleOptions(node);
      const boundingBox = node.getBoundingBox();
      const centerBox = GeometryUtil.boundingBoxToCenterBox(boundingBox);
      const rectangle = Matter.Bodies.rectangle(
        centerBox.x,
        centerBox.y,
        centerBox.width,
        centerBox.height,
        rectangleOptions,
      );
      return rectangle;
    }

    static createOutermostConstraint(
      startingNode,
      staticRect,
      startingRect,
      corner,
      options,
    ) {
      return PhysicsManager.createConstraint(
        startingNode,
        startingNode,
        staticRect,
        startingRect,
        corner,
        corner,
        options,
      );
    }

    static createConstraint(
      nodeA,
      nodeB,
      bodyA,
      bodyB,
      cornerA,
      cornerB,
      options,
    ) {
      const boundingBoxA = nodeA.getBoundingBox();
      const boundingBoxB = nodeB.getBoundingBox();
      const pointA = GeometryUtil.absToRelPos(cornerA, boundingBoxA);
      const pointB = GeometryUtil.absToRelPos(cornerB, boundingBoxB);
      const constraintOptions = PhysicsManager.getConstraintOptions(
        boundingBoxA,
        boundingBoxB,
        pointA,
        pointB,
        options,
      );
      return Matter.Constraint.create({
        bodyA,
        pointA,
        bodyB,
        pointB,
        ...constraintOptions,
      });
    }

    static getRectangleOptions(node) {
      return {
        // Disable collision
        // Reference: https://stackoverflow.com/a/61314389
        collisionFilter: {
          group: -1,
        },
        label: node.getID(),
      };
    }

    static getConstraintOptions(
      boundingBoxA,
      boundingBoxB,
      pointA,
      pointB,
      options,
    ) {
      const diagonalLengthA = GeometryUtil.diagonalLength(boundingBoxA);
      const diagonalLengthB = GeometryUtil.diagonalLength(boundingBoxB);
      const maxDiagonalLength = Math.max(diagonalLengthA, diagonalLengthB);

      const vecAtoB = Matter.Vector.sub(pointA, pointB);
      const distance = Matter.Vector.magnitude(vecAtoB);
      const distanceRatio = distance / maxDiagonalLength;
      const stiffness = this.calcStiffness(
        distanceRatio,
        options.minStiffness,
        options.maxStiffness,
        options.stiffnessCurveSoftness,
      );

      return { damping: options.damping, stiffness };
    }

    static calcStiffness(ratio, minStiffness, maxStiffness, softness) {
      const stiffnessRange = maxStiffness - minStiffness;
      const poweredRatio = ratio ** softness;
      return poweredRatio * stiffnessRange + minStiffness;
    }
  }

  class RenderHelper {
    constructor(minFPS = 0, maxFPS = Infinity) {
      this.minFPS = minFPS; // frames/second
      this.maxFPS = maxFPS; // frames/second

      this.minInterval = 1.0 / this.maxFPS; // seconds
      this.maxInterval = 1.0 / this.minFPS; // seconds
      this.elapsedTime = 0; // seconds
      this.prevTimestamp = null; // seconds
      this.prevElapsedTime = null; // seconds
    }

    step(fnRender) {
      // Reference:
      // - Matter.Runner.tick
      // - https://github.com/liabru/matter-js/issues/818
      const curTimestamp = Date.now() / 1000.0;
      if (this.prevTimestamp === null) {
        // First step
        this.prevTimestamp = curTimestamp;
        return;
      }

      this.elapsedTime = curTimestamp - this.prevTimestamp;
      // Limit the elapsed time
      this.elapsedTime = Math.min(this.elapsedTime, this.maxInterval);

      if (this.canRender()) {
        if (this.prevElapsedTime !== null) {
          fnRender(this.elapsedTime, this.prevElapsedTime);
        }

        this.prevElapsedTime = this.elapsedTime;

        this.elapsedTime = 0;
        this.prevTimestamp = curTimestamp;
      }
    }

    canRender() {
      return this.elapsedTime >= this.minInterval;
    }
  }

  class JellifyEngine {
    constructor(treeManager, physicsManager, options) {
      this.treeManager = treeManager;
      this.physicsManager = physicsManager;
      this.options = options;

      // Rendering helpers
      this.windowScrollRenderHelper = new RenderHelper();
      this.physicsRenderHelper = new RenderHelper(
        this.options.render.minFPS /* minFPS */,
        this.options.render.maxFPS, /* maxFPS */
      );

      // Physics objects
      this.staticRectangles = null;
      this.dynamicRectangles = null;
      this.nodeIDToRectangle = null;
      this.outermostConstraints = null;
      this.innerConstraints = null;
      this.mouseConstraint = null;

      // Physics positions
      this.initialPositions = null;

      // Window scroll acceleration
      this.prevScroll = null;
      this.smoothWindowAcceleration = new SmoothVector(
        this.options.physics.acceleration.smoothness,
      );
    }

    init() {
      this.buildAllRectangles();

      this.buildAllConstraints(this.options.physics.constraint);

      this.saveInitialRectanglePositions();

      this.physicsManager.addObjects(this.staticRectangles);
      this.physicsManager.addObjects(this.dynamicRectangles);
      this.physicsManager.addObjects(this.outermostConstraints);
      this.physicsManager.addObjects(this.innerConstraints);

      if (this.isRender) {
        this.mouseConstraint = this.physicsManager.buildMouseConstraint();
        this.physicsManager.addObjects(this.mouseConstraint);
      }
    }

    runAnimation() {
      window.requestAnimationFrame(this.stepAnimation.bind(this));
    }

    stepAnimation() {
      const curScroll = Matter.Vector.create(window.scrollX, window.scrollY);

      // Add window scroll sample to calculate window scroll acceleration
      this.windowScrollRenderHelper.step((elapsedTime) => {
        if (this.prevScroll != null) {
          const scrollDiff = Matter.Vector.sub(curScroll, this.prevScroll);
          const stepWindowAcceleration = Matter.Vector.div(
            scrollDiff,
            elapsedTime,
          );

          this.smoothWindowAcceleration.addSample(stepWindowAcceleration);
        }

        this.prevScroll = curScroll;
      });

      // Update physics
      this.physicsRenderHelper.step((elapsedTime, prevElapsedTime) => {
        this.applyForceToStartingRectangles();

        this.updateTransformOnVisualNodes();

        const delta = 1000 * elapsedTime;
        const correction = elapsedTime / prevElapsedTime;
        Matter.Engine.update(this.physicsManager.engine, delta, correction);
      });

      window.requestAnimationFrame(this.stepAnimation.bind(this));
    }

    applyForceToStartingRectangles() {
      const windowAcc = this.smoothWindowAcceleration.getSmoothVector();

      this.treeManager.visualStartingNodes.forEach((startingNode) => {
        const rectangle = this.nodeIDToRectangle[startingNode.getID()];

        const applyPosition = JellifyEngine.calcApplyForcePosition(
          startingNode,
          rectangle,
          this.options.physics.force,
        );
        const force = JellifyEngine.calcForceOnVisualRectangle(
          windowAcc,
          rectangle,
          this.options.physics.force,
        );

        Matter.Body.applyForce(rectangle, applyPosition, force);
      });
    }

    updateTransformOnVisualNodes() {
      this.treeManager.visualStartingNodes.forEach((startingNode) => {
        TreeIterator.iterateVisualChildren(startingNode, (node) => {
          const rectangle = this.nodeIDToRectangle[node.getID()];
          const curPosition = rectangle.position;
          const origPosition = this.initialPositions[node.getID()];
          const translation = Matter.Vector.sub(curPosition, origPosition);

          node.setTransform(translation, rectangle.angle);
        });
      });
    }

    buildAllRectangles() {
      this.staticRectangles = this.buildAllStaticRectangles();
      console.debug(`Built ${this.staticRectangles.length} static rectangles`);

      const dynamicRectResult = this.buildAllDynamicRectangles();
      this.dynamicRectangles = dynamicRectResult.rectangles;
      this.nodeIDToRectangle = dynamicRectResult.nodeIDToRectangle;
      console.debug(`Built ${this.dynamicRectangles.length} dynamic\
 rectangles`);
    }

    buildAllStaticRectangles() {
      return this.treeManager.visualStartingNodes.map((startingNode) => {
        return JellifyEngine.buildStaticRectangle(startingNode);
      });
    }

    buildAllDynamicRectangles() {
      let allRectangles = [];
      let allNodeIDToRectangle = {};
      this.treeManager.visualStartingNodes.forEach((startingNode) => {
        const result = JellifyEngine.buildDynamicRectangles(startingNode);
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

    buildAllConstraints(options) {
      this.outermostConstraints = this.buildAllOutermostConstraints(
        this.staticRectangles,
        this.nodeIDToRectangle,
        options,
      );
      console.debug(`Built ${this.outermostConstraints.length} outermost\
 constraints`);

      this.innerConstraints = this.buildAllInnerConstraints(
        this.nodeIDToRectangle,
        options,
      );
      console.debug(`Built ${this.innerConstraints.length} inner constraints`);
    }

    buildAllOutermostConstraints(staticRectangles, nodeIDToRectangle, options) {
      const allConstraints = [];
      this.treeManager.visualStartingNodes.forEach((startingNode, index) => {
        const staticRectangle = staticRectangles[index];
        const startingRectangle = nodeIDToRectangle[startingNode.getID()];

        const boundingBox = startingNode.getBoundingBox();
        const corners = GeometryUtil.getCornerPoints(boundingBox);

        corners.forEach((corner) => {
          // Build diagonal constraints between static rectangle and starting
          // node rectangle
          const constraint = PhysicsManager.createOutermostConstraint(
            startingNode,
            staticRectangle,
            startingRectangle,
            corner,
            options,
          );
          allConstraints.push(constraint);
        });
      });
      return allConstraints;
    }

    buildAllInnerConstraints(nodeIDToRectangle, options) {
      let allConstraints = [];
      this.treeManager.visualStartingNodes.forEach((startingNode) => {
        const constraints = JellifyEngine.buildInnerConstraints(
          startingNode,
          nodeIDToRectangle,
          options,
        );

        allConstraints = [...allConstraints, ...constraints];
      });
      return allConstraints;
    }

    saveInitialRectanglePositions() {
      this.initialPositions = {};

      this.treeManager.visualStartingNodes.forEach((startingNode) => {
        TreeIterator.iterateVisualChildren(startingNode, (node) => {
          const rectangle = this.nodeIDToRectangle[node.getID()];
          this.initialPositions[node.getID()] = Matter.Vector.clone(
            rectangle.position,
          );
        });
      });
    }

    static buildStaticRectangle(startingNode) {
      const staticRectangle = PhysicsManager.createRectangle(startingNode);
      Matter.Body.setStatic(staticRectangle, true);
      return staticRectangle;
    }

    static buildDynamicRectangles(startingNode) {
      const rectangles = [];
      const nodeIDToRectangle = {};
      TreeIterator.iterateVisualChildren(startingNode, (curNode) => {
        const rectangle = PhysicsManager.createRectangle(curNode);
        rectangles.push(rectangle);
        nodeIDToRectangle[curNode.getID()] = rectangle;
      });
      return { rectangles, nodeIDToRectangle };
    }

    static buildInnerConstraints(startingNode, nodeIDToRectangle, options) {
      let constraints = [];
      TreeIterator.iterateVisualChildren(startingNode, (curNode) => {
        let result = {};
        // Build diagonal constraints
        result = JellifyEngine.buildDiagonalConstraints(
          curNode,
          nodeIDToRectangle,
          options,
        );
        const { diagonalConstraints, excludedCorners } = result;

        // Build inter constraints
        result = JellifyEngine.buildInterConstraints(
          curNode,
          excludedCorners,
          nodeIDToRectangle,
          options,
        );
        const { interConstraints, unconnectedCorners } = result;

        // Fix the unconnected corners by connecting the nearest corner of the
        // current node and the unconnected corner
        const fixedConstraints = JellifyEngine.fixUnconnectedCorners(
          curNode,
          unconnectedCorners,
          nodeIDToRectangle,
          options,
        );

        constraints = [
          ...constraints,
          ...diagonalConstraints,
          ...interConstraints,
          ...fixedConstraints,
        ];
      });
      return constraints;
    }

    static buildDiagonalConstraints(parentNode, nodeIDToRectangle, options) {
      const parentRectangle = nodeIDToRectangle[parentNode.getID()];
      const parentBoundingBox = parentNode.getBoundingBox();
      const corners = GeometryUtil.getCornerPoints(parentBoundingBox);

      const diagonalConstraints = [];
      const excludedCorners = [];
      if (parentNode.visualChildren.length === 0) {
        return { diagonalConstraints, excludedCorners };
      }
      corners.forEach((corner) => {
        const results = JellifyEngine.findNearestCorners(
          corner,
          parentNode.visualChildren,
        );
        results.forEach((result) => {
          const { nearestNode, nearestCorner, nearestCornerIndex } = result;
          const nearestRectangle = nodeIDToRectangle[nearestNode.getID()];
          const constraint = PhysicsManager.createConstraint(
            parentNode,
            nearestNode,
            parentRectangle,
            nearestRectangle,
            corner,
            nearestCorner,
            options,
          );

          diagonalConstraints.push(constraint);

          excludedCorners.push({
            node: nearestNode,
            cornerIndex: nearestCornerIndex,
          });
        });
      });
      return { diagonalConstraints, excludedCorners };
    }

    static buildInterConstraints(
      parentNode,
      excludedCorners,
      nodeIDToRectangle,
      options,
    ) {
      const interConstraints = [];
      const unconnectedCorners = [];
      if (parentNode.visualChildren.length <= 1) {
        return {
          interConstraints,
          unconnectedCorners,
        };
      }

      parentNode.visualChildren.forEach((node, nodeIndex) => {
        const rectangle = nodeIDToRectangle[node.getID()];
        const otherNodes = [...parentNode.visualChildren];
        otherNodes.splice(nodeIndex, 1);

        const boundingBox = node.getBoundingBox();
        const corners = GeometryUtil.getCornerPoints(boundingBox);
        corners.forEach((corner, cornerIndex) => {
          if (
            JellifyEngine.isCornerExcluded(node, cornerIndex, excludedCorners)
          ) {
            return;
          }

          const angleRange = JellifyEngine.getCornerAngleRange(cornerIndex);
          const results = JellifyEngine.findNearestCorners(
            corner,
            otherNodes,
            angleRange.minAngle,
            angleRange.maxAngle,
          );
          results.forEach((result) => {
            const { nearestNode, nearestCorner } = result;
            const nearestRectangle = nodeIDToRectangle[nearestNode.getID()];
            const constraint = PhysicsManager.createConstraint(
              node,
              nearestNode,
              rectangle,
              nearestRectangle,
              corner,
              nearestCorner,
              options,
            );

            interConstraints.push(constraint);
          });

          // Unable to find another corner to connect, we'll deal with it later
          if (results.length === 0) {
            unconnectedCorners.push({
              node,
              corner,
            });
          }
        });
      });
      return { interConstraints, unconnectedCorners };
    }

    static fixUnconnectedCorners(
      parentNode,
      unconnectedCorners,
      nodeIDToRectangle,
      options,
    ) {
      const parentRectangle = nodeIDToRectangle[parentNode.getID()];

      const fixedConstraints = [];
      if (parentNode.visualChildren.length === 0) return fixedConstraints;
      unconnectedCorners.forEach((unconnectedCorner) => {
        const { node, corner } = unconnectedCorner;
        const rectangle = nodeIDToRectangle[node.getID()];
        const results = JellifyEngine.findNearestCorners(corner, [parentNode]);
        if (results.length <= 0) throw new Error('Expect at least 1 result');
        results.forEach((result) => {
          const { nearestCorner } = result;
          const constraint = PhysicsManager.createConstraint(
            parentNode,
            node,
            parentRectangle,
            rectangle,
            nearestCorner,
            corner,
            options,
          );

          fixedConstraints.push(constraint);
        });
      });
      return fixedConstraints;
    }

    static findNearestCorners(
      corner,
      otherNodes,
      minAngle = 0,
      maxAngle = 360,
    ) {
      let minDist = Infinity;
      let results = [];
      otherNodes.forEach((otherNode) => {
        const boundingBox = otherNode.getBoundingBox();
        const otherCorners = GeometryUtil.getCornerPoints(boundingBox);
        otherCorners.forEach((otherCorner, otherCornerIndex) => {
          const vectorAngle = GeometryUtil.angle(otherCorner, corner);
          if (!(vectorAngle >= minAngle && vectorAngle <= maxAngle)) return;

          const dist = GeometryUtil.distance(corner, otherCorner);
          if (dist <= minDist) {
            if (dist < minDist) {
              minDist = dist;
              results = [];
            }
            results.push({
              nearestNode: otherNode,
              nearestCorner: otherCorner,
              nearestCornerIndex: otherCornerIndex,
            });
          }
        });
      });
      return results;
    }

    static isCornerExcluded(node, cornerIndex, excludedCorners) {
      return excludedCorners.some((nodeAndCornerIndex) => {
        return (
          node.getID() === nodeAndCornerIndex.node.getID()
          && cornerIndex === nodeAndCornerIndex.cornerIndex
        );
      });
    }

    static getCornerAngleRange(cornerIndex) {
      // For example, we prefer quadrant 1 with cornerIndex=0, we prefer
      // quadrant 2 with cornerIndex=1, and so on
      return {
        minAngle: (cornerIndex + 0) * 90,
        maxAngle: (cornerIndex + 1) * 90,
      };
    }

    static calcApplyForcePosition(node, rectangle, options) {
      const randShiftRatioX = RandomUtil.randValue(
        options.minRandomShift,
        options.maxRandomShift,
      );
      const randShiftRatioY = RandomUtil.randValue(
        options.minRandomShift,
        options.maxRandomShift,
      );
      const boundingBox = node.getBoundingBox();
      const offset = Matter.Vector.create(
        boundingBox.width * randShiftRatioX,
        boundingBox.height * randShiftRatioY,
      );
      const center = rectangle.position;
      const offsetPosition = Matter.Vector.add(center, offset);
      return offsetPosition;
    }

    static calcForceOnVisualRectangle(windowAcc, rectangle, options) {
      const negAcc = Matter.Vector.neg(windowAcc);
      const force = Matter.Vector.mult(negAcc, rectangle.mass);
      const correctedForce = PhysicsManager.correctForce(force);

      // Randomly rotate the force
      const randAngleInDegree = RandomUtil.randValue(
        options.minRandomRotate,
        options.maxRandomRotate,
      );
      const randAngle = GeometryUtil.degreeToRadian(randAngleInDegree);
      const rotatedForce = Matter.Vector.rotate(correctedForce, randAngle);

      // Randomly scale the force
      const randScale = RandomUtil.randValue(
        options.minRandomScale,
        options.maxRandomScale,
      );
      const scaledForce = Matter.Vector.mult(rotatedForce, randScale);

      return scaledForce;
    }
  }

  class App {
    constructor() {
      // App constants
      this.globalBookmarkletName = 'JELLIFY_BOOKMARKLET';
      this.globalOptionsName = 'JELLIFY_OPTIONS';
      this.globalDebugName = 'JELLIFY_DEBUG';
      this.defaultOptions = {
        tree: {
          // How much margin between the parent and children visual nodes. Set
          // a non-zero value to avoid exactly overlapping bounding box of the
          // parent and child nodes
          minMargin: 5, // pixels
          // We limit the number of visual descendants to boost the performance.
          // If a node has too many visual descendants we won't consider it as
          // the starting node
          minVisualDescendants: 0,
          maxVisualDescendants: 10,
          // We limit the height in the visual tree to avoid long stacked
          // rectangles
          maxVisualHeight: 5,
        },
        render: {
          minFPS: 10,
          maxFPS: 120,
        },
        physics: {
          constraint: {
            damping: 0.01,
            // We apply higher stiffness to longer constraint, these values
            // correspond to the shortest constraint and longest constraint
            minStiffness: 0.01,
            maxStiffness: 1.0,
            // The exponent applied to stiffness calculation, higher value means
            // less stiffness in the middle range
            stiffnessCurveSoftness: 2.0,
          },
          acceleration: {
            // How many samples to get the average acceleration of the window
            // scroll
            smoothness: 3,
          },
          force: {
            // Apply the force to an offset position from the center (0-1).
            // 0 means no offset, 1 means shift to the edge
            minRandomShift: -0.01, // ratio
            maxRandomShift: 0.01, // ratio
            // Randomly rotate the force to make it chaotic
            minRandomRotate: -30, // degrees
            maxRandomRotate: 30, // degrees
            // Randomly scale the force to make it chaotic
            minRandomScale: 0.9,
            maxRandomScale: 1.1,
          },
        },
      };

      this.options = this.readOptions();

      this.treeManager = new TreeManager(this.options.tree);
      this.physicsManager = new PhysicsManager(this.isDebugMode());
      this.jellifyEngine = new JellifyEngine(
        this.treeManager,
        this.physicsManager,
        this.options,
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

        if (this.isDebugMode()) {
          this.treeManager.render();
        }

        this.physicsManager.init(this.treeManager.rootNode);

        this.jellifyEngine.init();

        this.jellifyEngine.runAnimation();
      });
    }

    readOptions() {
      if (typeof window[this.globalOptionsName] === 'undefined') {
        return this.defaultOptions;
      }
      return window[this.globalOptionsName];
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

      if (this.isDebugMode()) {
        console.info('Jellify debug mode is enabled');
      }
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
