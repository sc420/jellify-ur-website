import { useTranslation } from "react-i18next";

function WhyYouShouldUseItEN() {
  return (
    <>
      <h2>Why You Should Use It</h2>
      <p>This bookmarklet can provide the following benefits:</p>

      <ul>
        <li>
          Make visitors harder to find the information they want for any
          clickbait website. Stay longer = More ads = Profit!
        </li>
        <li>
          Annoy Internet addicted people to prevent them from browsing a website
          for too long
        </li>
        <li>Encourage slow living, be more patient</li>
      </ul>

      <p>
        The code behind the bookmarklet is very simple. Just paste the following
        code into <code>&lt;head&gt;</code> and you are good to go!
      </p>

      <pre>
        <code>
          https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
        </code>
      </pre>
      <pre>
        <code>
          https://cdn.jsdelivr.net/npm/matter-js@0.17.1/build/matter.min.js
        </code>
      </pre>
      <pre>
        <code>https://sc420.github.io/jellify-ur-website/jellify.js</code>
      </pre>

      <p className="fw-bold">Just kidding lol</p>
    </>
  );
}

function WhyYouShouldUseItTW() {
  return (
    <>
      <h2>為什麼你應該使用此書籤</h2>
      <p>這個書籤提供了一些好處:</p>

      <ul>
        <li>
          讓逛網頁的人更難找到他想要的資訊，尤其是套用在 clickbait
          網頁可以讓人停留更久。時間越久 = 越多廣告收益
        </li>
        <li>讓網路成癮的人覺得很煩，可以防止他們看網頁太久</li>
        <li>促進慢活，培養耐心</li>
      </ul>

      <p>
        書籤對網頁做的事其實很簡單。你只要貼上下面這幾行 code 到你的網頁的{" "}
        <code>&lt;head&gt;</code> 就可以了:
      </p>

      <pre>
        <code>
          https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
        </code>
      </pre>
      <pre>
        <code>
          https://cdn.jsdelivr.net/npm/matter-js@0.17.1/build/matter.min.js
        </code>
      </pre>
      <pre>
        <code>https://sc420.github.io/jellify-ur-website/jellify.js</code>
      </pre>

      <p className="fw-bold">開玩笑的 XD</p>
    </>
  );
}

function WhyYouShouldUseIt() {
  const { i18n } = useTranslation();

  if (i18n.language === "en") return WhyYouShouldUseItEN();
  else if (i18n.language === "zh-TW") return WhyYouShouldUseItTW();
  else throw new Error(`Unknown i18n language "${i18n.language}"`);
}

export default WhyYouShouldUseIt;
