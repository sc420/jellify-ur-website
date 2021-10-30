import { Nav } from "react-bootstrap";
import { useTranslation } from 'react-i18next';

function Navbar() {
  const { t, i18n } = useTranslation('Navbar');

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light sticky-top">
      <div className="container">
        <a className="navbar-brand" href="#/">{t('title')}</a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarCollapse"
          aria-controls="navbarCollapse"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarCollapse">
          <ul className="navbar-nav me-auto my-2 my-lg-0">
            <li className="nav-item">
              <a
                className="nav-link"
                href="https://github.com/sc420/jellify-ur-website"
              >
                GitHub
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="https://shawnchang420.blogspot.com/">
                Blog
              </a>
            </li>
          </ul>

          <Nav
            className="ms-auto my-2 my-lg-0"
            defaultActiveKey={i18n.language}
            onSelect={changeLanguage}
            variant="pills"
          >
            <Nav.Item>
              <Nav.Link eventKey="en">English</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="zh-TW">繁體中文</Nav.Link>
            </Nav.Item>
          </Nav>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
