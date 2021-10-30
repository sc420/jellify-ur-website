import { useTranslation } from "react-i18next";

import BookmarkletLink from "../BookmarkletLink";

function OtherSoftnessEN(props) {
  return (
    <>
      <h2>Other Softness</h2>
      <p>
        The bookmarklet detects the global variable <code>JELLIFY_OPTIONS</code>{" "}
        to allow customization (See the{" "}
        <a href="https://github.com/sc420/jellify-ur-website/blob/main/src/jellify.js">
          code
        </a>{" "}
        for the full list of options). For example, we can adjust{" "}
        <code>physics.constraint.minStiffness</code> to adjust the softness of
        the jelly (Please refresh this page first if you have clicked other
        Jellify links):
      </p>

      <BookmarkletLink
        text="Jellify (Soft)"
        type="soft"
        whenClick={props.setJellified}
        wrapClassName="my-3"
        buttonClassName={props.jellifyButtonClassName}
      />

      <BookmarkletLink
        buttonClassName={props.jellifyButtonClassName}
        text="Jellify (Hard)"
        type="hard"
        whenClick={props.setJellified}
        wrapClassName="my-3"
      />
    </>
  );
}

function OtherSoftnessTW(props) {
  return (
    <>
      <h2>其他柔軟度</h2>
      <p>
        你可以用一個全域的變數 <code>JELLIFY_OPTIONS</code>{" "}
        來客製化物理引擎等等的相關的行為 (詳細的選項可以看{" "}
        <a href="https://github.com/sc420/jellify-ur-website/blob/main/src/jellify.js">
          程式碼
        </a>{" "}
        ). 例: 可以設定 <code>physics.constraint.minStiffness</code>{" "}
        來調整果凍的 Q 度
        (如果你已經點過其他果凍化書籤請先重新整理這個網頁再點一次):
      </p>

      <BookmarkletLink
        text="果凍化 (更軟)"
        type="soft"
        whenClick={props.setJellified}
        wrapClassName="my-3"
        buttonClassName={props.jellifyButtonClassName}
      />

      <BookmarkletLink
        buttonClassName={props.jellifyButtonClassName}
        text="果凍化 (更硬)"
        type="hard"
        whenClick={props.setJellified}
        wrapClassName="my-3"
      />
    </>
  );
}

function OtherSoftness(props) {
  const { i18n } = useTranslation();

  const lng = i18n.language || "en";

  if (lng === "en") return OtherSoftnessEN(props);
  else if (lng === "zh-TW") return OtherSoftnessTW(props);
  else throw new Error(`Unknown i18n language "${lng}"`);
}

export default OtherSoftness;
