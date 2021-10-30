import { useTranslation } from "react-i18next";

import BookmarkletLink from "../BookmarkletLink";

function BehindTheSceneEN(props) {
  return (
    <>
      <h2>Behind the Scene</h2>
      <p>I use 2 libraries:</p>
      <ul>
        <li>
          <a href="https://jquery.com/">jQuery</a>
        </li>
        <li>
          <a href="https://brm.io/matter-js/">Matter.js</a>
        </li>
      </ul>

      <p>
        The steps of turning a website into a chaos basically follows these
        steps:
      </p>

      <ol>
        <li>Use jQuery to find elements and build a hierarchical tree</li>
        <li>
          Build a visual tree with larger rectangle as parent and containing
          rectangles as its children on the hierarchical tree with the help of{" "}
          <code>getBoundingClientRect</code>
        </li>
        <li>
          Build objects and constraints in Matter.js world (by finding nearest
          corner points and connecting them together)
        </li>
        <li>Measure the acceleration of the scroll bar values</li>
        <li>
          Apply force on each outermost rectangles (I break down the visual tree
          into smaller sub-tress, each of the outermost rectangle is the root
          node of the sub-tree)
        </li>
        <li>
          Use CSS <code>transform</code> to sync the position and rotation from
          Matter.js world to the elements
        </li>
      </ol>

      <p>
        Wanna see what I was talking about with your own eye? Refresh this page
        and click this button to turn on the debug mode:
      </p>

      <BookmarkletLink
        buttonClassName={props.jellifyButtonClassName}
        wrapClassName="my-3"
        type="debug"
        text="Jellify (Debug Mode)"
        whenClick={props.setJellified}
      />

      <p>
        You will see borders around the elements as well as the Matter.js canvas
        shown at the end of this page. Red solid border elements represent the
        root nodes of the visual sub-tree. Blue dotted border elements are
        non-root nodes in the visual sub-tree. You can also drag-and-drop the
        rectangles in the Matter.js canvas, the elements should reflect the
        movement and rotation immediately.
      </p>
    </>
  );
}

function BehindTheSceneTW(props) {
  return (
    <>
      <h2>程式運作原理</h2>
      <p>我用了 2 個 libraries:</p>
      <ul>
        <li>
          <a href="https://jquery.com/">jQuery</a>
        </li>
        <li>
          <a href="https://brm.io/matter-js/">Matter.js</a>
        </li>
      </ul>

      <p>只要靠幾個步驟就可以把網頁變成一團亂:</p>

      <ol>
        <li>用 jQuery 找 elements 並建一個 tree</li>
        <li>
          用剛剛的 tree 建第二個 visual tree，用{" "}
          <code>getBoundingClientRect</code> 去抓每個
          element的框。之後看大的方框能不能包含小的方框，而且大小框在 這個
          visual tree 上是 parent child 的關係
        </li>
        <li>
          開始在 Matter.js 建立物體 (body) 和彈簧
          (constraint)，每個方框的角落去找最近的其他方框的角落，然後把他們連在一起
        </li>
        <li>測量使用者在網頁上捲動造成的加速度</li>
        <li>
          把加速度換成力 (force) 套用到每個 visual tree 的最上層的 element
          (只有一個 visual tree 太吃效能，所以我必須用某些方式把它打散成比較小的
          visual sub-trees)
        </li>
        <li>
          把 Matter.js 世界的物體位置和旋轉量用 CSS 的 <code>transform</code>{" "}
          套用到 element 身上
        </li>
      </ol>

      <p>
        還是聽不懂我在說什麼? 試著重新整理這個網頁然後點這個按鈕來開啟 debug
        模式看看:
      </p>

      <BookmarkletLink
        buttonClassName={props.jellifyButtonClassName}
        wrapClassName="my-3"
        type="debug"
        text="果凍化 (Debug 模式)"
        whenClick={props.setJellified}
      />

      <p>
        你會看到 elements 外面被畫了紅藍色的線、還有捲到網頁最下面可以看到
        Matter.js 畫出來的 canvas。
        紅框的 element 代表 visual sub-tree 的 root node；
        藍框的 element 代表 visual sub-tree 底下的 nodes。
        你甚至還可以拖曳看看 Matter.js canvas 裡面的長方形，上面對應到的 elements
        也會跟著動。
      </p>
    </>
  );
}

function BehindTheScene(props) {
  const { i18n } = useTranslation();

  if (i18n.language === "en") return BehindTheSceneEN(props);
  else if (i18n.language === "zh-TW") return BehindTheSceneTW(props);
  else throw new Error("Unknown i18n language");
}

export default BehindTheScene;
