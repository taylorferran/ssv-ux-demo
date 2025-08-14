import React from 'react'
import ReactDOM from 'react-dom/client'
import { Buffer } from 'buffer'
import App from './App.jsx'

// Polyfill Buffer for browser compatibility
if (typeof window !== 'undefined') {
  window.Buffer = Buffer
  window.global = window.global || window
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
