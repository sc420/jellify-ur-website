import { useTranslation } from "react-i18next";

function SupportedBrowsersEN() {
  return (
    <>
      <h2>Supported Browsers</h2>
      <ul>
        <li>Chrome</li>
        <li>Firefox</li>
        <li>Edge</li>
      </ul>

      <p>
        Since I wrote the code in ES6, you may need to update your browser to
        the latest version if it doesn't work.
      </p>
    </>
  );
}

function SupportedBrowsersTW() {
  return (
    <>
      <h2>支援的瀏覽器</h2>
      <ul>
        <li>Chrome</li>
        <li>Firefox</li>
        <li>Edge</li>
      </ul>

      <p>
        因為程式碼幾乎都是用 ES6 寫的，所以如果用不了可能要更新瀏覽器
      </p>
    </>
  );
}

function SupportedBrowsers() {
  const { i18n } = useTranslation();

  if (i18n.language === "en") return SupportedBrowsersEN();
  else if (i18n.language === "zh-TW") return SupportedBrowsersTW();
  else throw new Error("Unknown i18n language");
}

export default SupportedBrowsers;
