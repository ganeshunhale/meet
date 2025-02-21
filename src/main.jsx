import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import store from './Redux/store.js'
import { BrowserRouter } from 'react-router'
import { Provider } from 'react-redux'
import App from './App.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <Provider store={store}>
      <App/>
    </Provider>
  </BrowserRouter>
  </StrictMode>,
)
