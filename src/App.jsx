import React from "react";

const App = () => {
  return (
    <div className="app">
      <div className="app__header"></div>
      <div className="app__header--mobile"></div>
      <h1 className="app__heading--h1">Hello world</h1>
      <div className="view-card">
        <div className="view-cart__image"></div>
        <div className="view-cart__body">
          <h3 className="view-cart__title"></h3>
          <span className="view-cart__sub-title"></span>
        </div>
      </div>
    </div>
  );
};

export default App;
