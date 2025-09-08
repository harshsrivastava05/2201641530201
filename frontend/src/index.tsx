import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Log } from './utils/logger';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

Log('frontend', 'info', 'component', 'React application starting up');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals((metric) => {
  Log('frontend', 'info', 'utils', `Web Vitals - ${metric.name}: ${metric.value}`);
});