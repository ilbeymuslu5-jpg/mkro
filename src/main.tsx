import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { PlayerProvider } from '@/state/PlayerContext'
import { SocialProvider } from '@/state/SocialContext'

/*
  Path routing needs a server that rewrites unknown paths to index.html. The
  single-file build is opened straight from a static host or a sandboxed page,
  where no such rewrite exists, so it routes through the hash instead.
*/
const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <SocialProvider>
        <PlayerProvider>
          <App />
        </PlayerProvider>
      </SocialProvider>
    </Router>
  </StrictMode>,
)
