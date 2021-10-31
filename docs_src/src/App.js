import React, { Component, Suspense } from "react";

import { ArrowUpCircleFill, ChevronDoubleDown } from "react-bootstrap-icons";
import { withTranslation } from "react-i18next";
import ScrollTop from "react-scrolltop-button";
import TextTransition, { presets } from "react-text-transition";

import AboutThisBookmarklet from "./sections/AboutThisBookmarklet";
import AppLoader from "./AppLoader";
import AppNavbar from "./AppNavbar";
import BehindTheScene from "./sections/BehindTheScene";
import BookmarkletLink from "./BookmarkletLink";
import Footer from "./Footer";
import GummyBearSection from "./GummyBearSection";
import Limitations from "./sections/Limitations";
import OtherSoftness from "./sections/OtherSoftness";
import SpecialThanks from "./sections/SpecialThanks";
import SupportedBrowsers from "./sections/SupportedBrowsers";
import WhyYouShouldUseIt from "./sections/WhyYouShouldUseIt";

import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      jellified: false,
    };
  }

  getTextAboveJellifyButton() {
    const { t } = this.props;
    if (this.state.jellified) {
      return t("jellifyButtonText.jellified");
    } else {
      return t("jellifyButtonText.notJellified");
    }
  }

  getJellifyButtonClassName() {
    return this.state.jellified ? "btn btn-secondary" : "btn btn-primary";
  }

  setJellified() {
    this.setState({
      jellified: true,
    });
  }

  render() {
    const { t, i18n } = this.props;
    return (
      <div className="App" lng={i18n.language}>
        <AppNavbar />

        <main className="container mt-5">
          <div className="p-3 bg-light rounded-3">
            <div className="container p-3">
              <h1 className="display-3 fw-bold text-center">
                <div
                  id="title-container"
                  className="d-flex align-items-center justify-content-center"
                >
                  <div className="p-3">
                    <img
                      className="img-fluid"
                      src={`${process.env.PUBLIC_URL}/img/gummy-bear-yellow.png`}
                      alt="gummy-bear"
                    />
                  </div>
                  <div className="p-3">{t("title")}</div>
                  <div className="p-3">
                    <img
                      className="img-fluid"
                      src={`${process.env.PUBLIC_URL}/img/gummy-bear-yellow.png`}
                      alt="gummy-bear"
                    />
                  </div>
                </div>
              </h1>
              <div className="fs-4 text-center mt-3">
                <div>
                  <TextTransition
                    inline={true}
                    text={this.getTextAboveJellifyButton()}
                    springConfig={presets.wobbly}
                    direction="up"
                  />
                </div>
                <ChevronDoubleDown />
              </div>
              <BookmarkletLink
                buttonClassName={this.getJellifyButtonClassName()}
                buttonSize="lg"
                className="text-center"
                text={t("jellifyButton")}
                type="default"
                whenClick={this.setJellified.bind(this)}
                wrapClassName="d-grid gap-2 col-3 mx-auto mt-1"
              />
              <div className="fs-5 mt-2 text-center text-muted">
                {t("jellifyButtonHint")}
              </div>
            </div>
          </div>

          <GummyBearSection rotation="0" max="6" offset="0" />
          <GummyBearSection rotation="1" max="5" offset="1" />
          <GummyBearSection rotation="1" max="6" offset="0" />
          <GummyBearSection rotation="2" max="5" offset="1" />
          <GummyBearSection rotation="2" max="6" offset="0" />
          <GummyBearSection rotation="3" max="5" offset="1" />

          <section className="my-5">
            <AboutThisBookmarklet />
            <SupportedBrowsers />
            <OtherSoftness
              jellifyButtonClassName={this.getJellifyButtonClassName()}
              setJellified={this.setJellified.bind(this)}
            />
            <BehindTheScene
              jellifyButtonClassName={this.getJellifyButtonClassName()}
              setJellified={this.setJellified.bind(this)}
            />
            <Limitations />
            <WhyYouShouldUseIt />
            <SpecialThanks />
          </section>
        </main>

        <Footer />

        <ScrollTop
          breakpoint={Infinity}
          className="scroll-top-button"
          icon={
            <div>
              <ArrowUpCircleFill className="fs-1" />
            </div>
          }
          speed={100}
        />
      </div>
    );
  }
}

// Reference: https://github.com/i18next/react-i18next/blob/master/example/react/src/App.js
const AppWithTranslation = withTranslation("App")(App);

// Reference: https://github.com/i18next/react-i18next/blob/master/example/react/src/App.js
function AppWithSuspense() {
  return (
    <Suspense fallback={<AppLoader />}>
      <AppWithTranslation />
    </Suspense>
  );
}

export default AppWithSuspense;
