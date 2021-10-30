import { Spinner } from "react-bootstrap";

function Loader() {
  return (
    <div className="App">
      <main className="container">
        <div className="d-flex justify-content-center mt-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </main>
    </div>
  );
}

export default Loader;
