import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { PlayerProvider } from '@/state/PlayerContext'
import { SocialProvider } from '@/state/SocialContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SocialProvider>
        <PlayerProvider>
          <App />
        </PlayerProvider>
      </SocialProvider>
    </BrowserRouter>
  </StrictMode>,
)
