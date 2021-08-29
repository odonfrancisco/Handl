import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';
import App from './App';
import { Web3Provider } from "./components/Web3Context";
import { BrowserRouter as Router } from 'react-router-dom';

ReactDOM.render(
  <React.StrictMode>
    <Web3Provider>
      <Router>
        <App />
      </Router>
    </Web3Provider>
  </React.StrictMode>,
  document.getElementById('root')
);