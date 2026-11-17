import { createElement, StrictMode as strictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import app from './app'

const reactComponents = { strictMode }

createRoot(document.getElementById('root')!).render(
  createElement(reactComponents.strictMode, null, createElement(app)),
)
