import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import './index.css';
import App from './App';
import StackIt from './games/stack_it'
import GenerateNFT from './pages/createNFT/index';
import Purchase from './pages/purchase/index'
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Switch>
        <Route exact path="/">
          <App />
        </Route>
        <Route exact path="/stack">
          <StackIt />
        </Route>
        <Route exact path="/purchase/stack">
          <Purchase />
        </Route>
        <Route path="/createNFT/:score/:timeSpent">
          <GenerateNFT />
        </Route>
      </Switch>

    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
reportWebVitals();
