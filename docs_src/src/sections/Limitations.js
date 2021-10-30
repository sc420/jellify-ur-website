import { useTranslation } from "react-i18next";

function LimitationsEN() {
  return (
    <>
      <h2>Limitations</h2>
      <p>
        Since we hide a physics engine and use CSS <code>transform</code>, there
        are some limitations:
      </p>
      <ul>
        <li>
          The website must have scrollbars! Vertical or horizontal. Otherwise
          the acceleration will always be 0
        </li>
        <li>
          It only works well with static website since we only find the elements
          once
        </li>
        <li>
          The number of elements in the website should neither be too low nor
          too high, otherwise it would appear as no effect or lag as crazy as
          you can imagine (although I did some optimization)
        </li>
      </ul>
    </>
  );
}

function LimitationsTW() {
  return (
    <>
      <h2>限制</h2>
      <p>
        既然我們後面藏了一個物理引擎，還用了 CSS <code>transform</code>
        ，勢必會有一些限制:
      </p>
      <ul>
        <li>
          網頁一定要可以捲動! 不管是垂直或水平的都好。不然加速度永遠都是 0
          就沒東西會動了
        </li>
        <li>
          這個書籤是設計給靜態網頁用的，因為我們只在第一次讀取的時候找
          elements，後面動態產生的就不管了
        </li>
        <li>
          網頁中的 elements 數量最好不要太低或太高，否則會看起來沒效果或是 lag
          到很可怕 (雖然後面有做優化)
        </li>
      </ul>
    </>
  );
}

function Limitations() {
  const { i18n } = useTranslation();

  if (i18n.language === "en") return LimitationsEN();
  else if (i18n.language === "zh-TW") return LimitationsTW();
  else throw new Error("Unknown i18n language");
}

export default Limitations;
