import { useTranslation } from "react-i18next";

function AboutThisBookmarkletEN() {
  return (
    <>
      <h2>About This Bookmarklet</h2>

      <p>
        It was a side project I made just for fun! I was inspired by the reddit{" "}
        <a href="https://www.reddit.com/r/badUIbattles/">r/badUIbattles</a> and
        the cool demo of <a href="https://brm.io/matter-js/">Matter.js</a>.
      </p>

      <p>
        I think embedding physics simulator in a webpage is cool, but it gets
        boring very soon. How can I enjoy both surfing the website and playing
        the physics engine? Why not combine both? So I created this bookmarklet
        to turn every website element into a physics object, tie them with some
        invisible springs and see what would happen.
      </p>

      <p>
        Visit <a href="https://github.com/sc420/jellify-ur-website">GitHub</a>{" "}
        to see the code.
      </p>
    </>
  );
}

function AboutThisBookmarkletTW() {
  return (
    <>
      <h2>關於這個書籤</h2>

      <p>
        這是我做的一個 Side Project，單純為了好玩。我是逛了 reddit 看板{" "}
        <a href="https://www.reddit.com/r/badUIbattles/">r/badUIbattles</a>{" "}
        (應該可以翻譯成 "爛 UI 挑戰") 還有一個網頁版的物理實驗引擎的 demo{" "}
        <a href="https://brm.io/matter-js/">Matter.js</a>
      </p>

      <p>
        看了看網頁版物理引擎的
        demo，好玩是好玩，可是看了一下就膩了。我就在想，要如何同時滑網頁，
        又可以觀看物理引擎? 於是我就想說把兩者結合在一起看看會發生什麼事。
        這個書籤的目標是讓每個網頁都可以搖身一變成為物理引擎的模擬對象
      </p>

      <p>
        程式碼可以到 <a href="https://github.com/sc420/jellify-ur-website">GitHub</a>{" "}
        上看
      </p>
    </>
  );
}

function AboutThisBookmarklet() {
  const { i18n } = useTranslation();

  if (i18n.language === "en") return AboutThisBookmarkletEN();
  else if (i18n.language === "zh-TW") return AboutThisBookmarkletTW();
  else throw new Error("Unknown i18n language");
}

export default AboutThisBookmarklet;
