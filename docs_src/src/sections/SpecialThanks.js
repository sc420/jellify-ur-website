import { useTranslation } from "react-i18next";

function SpecialThanksEN() {
  return (
    <>
      <h2>Special Thanks</h2>
      <p>
        Thanks my SO for coming up the idea to arrange the gummy bears and the
        Photoshop image editing.
      </p>
    </>
  );
}

function SpecialThanksTW() {
  return (
    <>
      <h2>特別感謝</h2>
      <p>謝謝女友提供小熊軟糖的 idea 還有專業的 Photoshop 編輯</p>
    </>
  );
}

function SpecialThanks() {
  const { i18n } = useTranslation();

  if (i18n.language === "en") return SpecialThanksEN();
  else if (i18n.language === "zh-TW") return SpecialThanksTW();
  else throw new Error("Unknown i18n language");
}

export default SpecialThanks;
