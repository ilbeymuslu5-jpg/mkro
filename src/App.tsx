import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { Welcome } from '@/pages/Welcome'
import { Discover } from '@/pages/Discover'
import { Music } from '@/pages/Music'
import { Feed } from '@/pages/Feed'
import { Login } from '@/pages/Login'
import { Platinum } from '@/pages/Platinum'
import { LiveBoard } from '@/pages/LiveBoard'
import { RequireAuth } from '@/components/RequireAuth'
import { Chats } from '@/pages/Chats'
import { ChatDetail } from '@/pages/ChatDetail'
import { Events } from '@/pages/Events'
import { Profile } from '@/pages/Profile'
import { PersonProfile } from '@/pages/PersonProfile'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/giris" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/kesfet" element={<Discover />} />
          <Route path="/anlik" element={<LiveBoard />} />
          <Route path="/sosyal" element={<Feed />} />
          <Route path="/muzik" element={<Music />} />
          <Route path="/sohbetler" element={<Chats />} />
          <Route path="/sohbetler/:personId" element={<ChatDetail />} />
          <Route path="/etkinlikler" element={<Events />} />
          <Route path="/platinum" element={<Platinum />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/kisi/:personId" element={<PersonProfile />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
