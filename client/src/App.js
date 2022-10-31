



// client/src/App.js

import React from "react";
import logo from "./icons/logo.svg";
import stats from "./icons/stats.svg";
import "./App.css";


function App() {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => setData(data.message));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div id="App-header-logo-container">
          <img src={logo} className="App-logo" alt="logo" />
          <p>EASY 311</p>
        </div>
        <div id="App-header-settings-container">
          <p>EN</p>
        <img src={stats} className="App-logo" alt="logo" />
        </div>
      </header>
      <div>
      </div>
    </div>
  );
}

export default App;
