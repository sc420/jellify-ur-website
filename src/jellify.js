/* global $ */
/* eslint no-console: ["error", { allow: ["info"] }] */
/* eslint max-classes-per-file: "off" */

(() => {
  class RectUtil {
    static contains(rect1, rect2) {
      return ((rect2.x + rect2.width) < (rect1.x + rect1.width)
      && (rect2.x) > (rect1.x)
      && (rect2.y) > (rect1.y)
      && (rect2.y + rect2.height) < (rect1.y + rect1.height)
      );
    }
  }

  class TreeNode {
    constructor($el) {
      this.$el = $el;

      this.parent = null;
      this.children = [];
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
      const rect = this.$el.get(0).getBoundingClientRect();
      const sx = window.scrollX;
      const sy = window.scrollY;
      return new DOMRect(sx + rect.x, sy + rect.y, rect.width, rect.height);
    }
  }

  class TreeManager {
    constructor() {
      this.rootNode = null;
    }

    buildTreeNodes() {
      const $body = $('body');
      this.rootNode = TreeManager.buildTreeNode($body);
      TreeManager.correctTreeByBoundingBox(this.rootNode);
    }

    static buildTreeNode($el) {
      const node = new TreeNode($el);
      const children = $el.children().toArray().map((el) => $(el));
      const childrenNodes = children.map(($c) => TreeManager.buildTreeNode($c));
      childrenNodes.forEach((child) => { child.setParent(node); });
      return node;
    }

    static treeToArray(node) {
      const list = [];
      TreeManager.treeToArrayVisit(node, list);
      return list;
    }

    static treeToArrayVisit(node, list) {
      list.push(node);
      node.children.forEach((c) => TreeManager.treeToArrayVisit(c, list));
    }

    static correctTreeByBoundingBox(rootNode) {
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
      node.children.forEach((child) => TreeManager.renderTreeNode(child));
    }
  }

  class App {
    constructor() {
      this.globalBookmarkletName = 'JELLIFY_BOOKMARKLET';
      this.globalDebugName = 'JELLIFY_DEBUG';
      this.treeManager = new TreeManager();
    }

    init() {
      if (this.isLoaded()) {
        console.info('Jellify is already loaded, not doing anything new');
        return;
      }

      App.waitJqueryToBeReady(() => {
        this.waitPageToBeReady();
      });
    }

    static waitJqueryToBeReady(onFinish) {
      const timerId = setInterval(() => {
        if (window.jQuery) {
          onFinish();
          clearInterval(timerId);
        }
      }, 100);
    }

    waitPageToBeReady() {
      $(document).ready(() => {
        this.treeManager.buildTreeNodes();

        if (this.isDebugMode() || true) {
          this.treeManager.render();
        }

        this.setLoaded();
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
