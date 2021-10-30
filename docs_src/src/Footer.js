import { useTranslation } from "react-i18next";

import "./Footer.css";

function FooterEN() {
  return (
    <footer className="text-muted py-4">
      <div className="container">
        <p className="my-1">
          This website is built by <a href="https://reactjs.org/">React</a> +{" "}
          <a href="https://code.visualstudio.com/">VS Code</a>.
        </p>
        <p className="my-1">
          You can find the website source code on{" "}
          <a href="https://github.com/sc420/jellify-ur-website/tree/main/docs_src">
            GitHub
          </a>
          .
        </p>
      </div>
    </footer>
  );
}

function FooterTW() {
  return (
    <footer className="text-muted py-4">
      <div className="container">
        <p className="my-1">
          本網頁運用 <a href="https://reactjs.org/">React</a> +{" "}
          <a href="https://code.visualstudio.com/">VS Code</a> 來實作
        </p>
        <p className="my-1">
          網頁的程式碼可以在{" "}
          <a href="https://github.com/sc420/jellify-ur-website/tree/main/docs_src">
            GitHub
          </a>{" "}
          上看
        </p>
      </div>
    </footer>
  );
}
function Footer() {
  const { i18n } = useTranslation();

  if (i18n.language === "en") return FooterEN();
  else if (i18n.language === "zh-TW") return FooterTW();
  else throw new Error(`Unknown i18n language "${i18n.language}"`);
}

export default Footer;
