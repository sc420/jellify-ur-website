import React from "react";

import TextTransition, { presets } from "react-text-transition";

import BookmarkletLink from "./BookmarkletLink";
import GummyBearSection from "./GummyBearSection";
import Navbar from "./Navbar";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      jellified: false,
    };
  }

  getTextAboveJellifyButton() {
    if (this.state.jellified) {
      return "Jellified! Try Scrolling Down";
    } else {
      return "Click the Button to Jellify This Page";
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
    return (
      <div>
        <Navbar />

        <main className="container">
          <div className="p-3 bg-light rounded-3">
            <div className="container p-3">
              <h1 className="display-3 fw-bold text-center">
                <div className="d-flex align-items-center justify-content-center">
                  <div className="p-3">
                    <img
                      src={`${process.env.PUBLIC_URL}/img/gummy-bear-yellow.png`}
                      alt="gummy-bear"
                      height="200px"
                    />
                  </div>
                  <div className="p-3">Jellify</div>
                  <div className="p-3">
                    <img
                      src={`${process.env.PUBLIC_URL}/img/gummy-bear-yellow.png`}
                      alt="gummy-bear"
                      height="200px"
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
                <i className="bi bi-chevron-double-down"></i>
              </div>
              <BookmarkletLink
                buttonClassName={this.getJellifyButtonClassName()}
                buttonSize="lg"
                className="text-center"
                type="default"
                whenClick={this.setJellified.bind(this)}
                wrapClassName="d-grid gap-2 col-3 mx-auto mt-1"
              />
              <div className="fs-5 mt-2 text-center text-muted">
                Drag this button to your bookmarks bar to jellify other pages
                too!
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
            <h2>About This Bookmarklet</h2>
            <p>
              It was a side project I made just for fun! I was inspired by the
              reddit{" "}
              <a href="https://www.reddit.com/r/badUIbattles/">
                r/badUIbattles
              </a>{" "}
              and the cool demo of{" "}
              <a href="https://brm.io/matter-js/">Matter.js</a>.
            </p>

            <p>
              I think embedding physics simulator in a webpage is cool, but it
              gets boring very soon. How can I enjoy both surfing the website
              and playing the physics engine? Why not combine both? So I created
              this bookmarklet to turn every website element into a physics
              object, tie them with some invisible springs and see what would
              happen.
            </p>

            <p>
              Visit{" "}
              <a href="https://github.com/sc420/jellify-ur-website">GitHub</a>{" "}
              to see the code.
            </p>

            <h2>Supported Browsers</h2>
            <ul>
              <li>Chrome</li>
              <li>Firefox</li>
              <li>Edge</li>
            </ul>

            <h2>Other Softness</h2>
            <p>
              The bookmarklet detects the global variable{" "}
              <code>JELLIFY_OPTIONS</code> to allow customization (See the{" "}
              <a href="https://github.com/sc420/jellify-ur-website/blob/main/src/jellify.js">
                code
              </a>{" "}
              for the full list of options). For example, we can adjust{" "}
              <code>physics.constraint.minStiffness</code> to adjust the
              softness of the jelly (Please refresh this page first if you have
              clicked other Jellify links):
            </p>

            <BookmarkletLink
              text="Jellify (Soft)"
              type="soft"
              whenClick={this.setJellified.bind(this)}
              wrapClassName="my-3"
              buttonClassName={this.getJellifyButtonClassName()}
            />

            <BookmarkletLink
              buttonClassName={this.getJellifyButtonClassName()}
              text="Jellify (Hard)"
              type="hard"
              whenClick={this.setJellified.bind(this)}
              wrapClassName="my-3"
            />

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
              The steps of turning a website into a chaos basically follows
              these steps:
            </p>

            <ol>
              <li>Use jQuery to find elements and build a hierarchical tree</li>
              <li>
                Build a visual tree with larger rectangle as parent and
                containing rectangles as its children on the hierarchical tree
                with <code>getBoundingClientRect</code>
              </li>
              <li>Build objects and constraints in Matter.js world</li>
              <li>Measure the acceleration of the scroll bar values</li>
              <li>
                Apply force on each outermost rectangles (I break down the
                visual tree into smaller sub-tress, each of them is the root
                node of the sub-tree)
              </li>
              <li>
                Use CSS <code>transform</code> to sync the position and rotation
                from Matter.js to the elements
              </li>
            </ol>

            <p>
              Wanna see what I was talking about with your own eye? Refresh this
              page and click this button to turn on the debug mode:
            </p>

            <BookmarkletLink
              buttonClassName={this.getJellifyButtonClassName()}
              wrapClassName="my-3"
              type="debug"
              text="Jellify (Debug Mode)"
              whenClick={this.setJellified.bind(this)}
            />

            <p>
              You will see borders around the elements as well as the Matter.js
              canvas shown at the end of this page. Red solid border elements
              represent the root nodes of the visual sub-tree. Blue dotted
              border elements are non-root nodes in the visual sub-tree. You can
              also drag-and-drop the rectangles in the Matter.js canvas, the
              elements should reflect the movement and rotation immediately.
            </p>

            <h2>Limitations</h2>
            <p>
              Since we hide a physics engine and use CSS <code>transform</code>,
              there are some limitations:
            </p>
            <ul>
              <li>
                The website must have scrollbars! Vertical or horizontal.
                Otherwise the acceleration will always be 0
              </li>
              <li>
                It only works well with static website since we only find the
                elements once
              </li>
              <li>
                The number of elements in the website should neither be too low
                nor too high, otherwise it would appear as no effect or lag as
                crazy as you can imagine
              </li>
              <li>
                It seems CSS <code>transform</code> doesn't work well on{" "}
                <code>position: absolute</code> and <code>position: fixed</code>{" "}
                elements
              </li>
            </ul>

            <h2>Why You Should Apply It to Your Website</h2>
            <p>
              The study finds this kind of bookmarklet provides some proven
              benefits:
            </p>

            <ul>
              <li>
                Make visitors harder to find the information they want for any
                clickbait website. Stay longer = More ads = Profit!
              </li>
              <li>
                Annoy Internet addicted people to prevent them from browsing a
                website for too long
              </li>
              <li>Encourage slow living, be more patient</li>
            </ul>

            <p>
              The code behind the bookmarklet is very simple. Just paste the
              following code into <code>&lt;head&gt;</code> and you are good to
              go!
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

            <p className="fw-bold">Just kidding.</p>

            <h2>Special Thanks</h2>
            <p>
              Thanks for my SO for coming up the idea to arrange the gummy bears
              and the image editing. I'm not very familiar with PhotoShop.
            </p>
          </section>
        </main>
      </div>
    );
  }
}

export default App;
