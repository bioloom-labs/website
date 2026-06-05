import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Take scroll control away from the browser. Otherwise on a full refresh the
// browser restores the previous scroll position, and on pages that fetch their
// content asynchronously (e.g. People) the document is short at restore time so
// it lands near the bottom once the data loads. The app scrolls to top itself.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>
)
