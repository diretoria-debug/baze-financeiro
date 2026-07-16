import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import GastosLive from './GastosLive.jsx'

const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {path === '/live' ? <GastosLive /> : <App />}
  </React.StrictMode>
)
