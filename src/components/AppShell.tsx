import { NavLink, Outlet } from 'react-router-dom'
import { CalendarDays, Compass, Disc3, MessageCircle, Newspaper, Sparkles, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { MiniPlayer } from './MiniPlayer'
import { MatchCelebration } from './MatchCelebration'
import { useSocial } from '@/state/SocialContext'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

/** Five primary destinations — the most a bottom bar can hold at 375px. */
const NAV: NavItem[] = [
  { to: '/kesfet', label: 'Keşfet', icon: Compass },
  { to: '/sosyal', label: 'Sosyal', icon: Newspaper },
  { to: '/muzik', label: 'Müzik', icon: Disc3 },
  { to: '/sohbetler', label: 'Sohbetler', icon: MessageCircle },
  { to: '/profil', label: 'Profil', icon: User },
]

/** Reachable from the Profil page on mobile; shown outright on the sidebar. */
const SECONDARY_NAV: NavItem[] = [
  { to: '/etkinlikler', label: 'Etkinlikler', icon: CalendarDays },
  { to: '/platinum', label: 'Platinum', icon: Sparkles },
]

export function AppShell() {
  const { matchedIds, conversations } = useSocial()

  const unreadCount = matchedIds.filter((id) => {
    const messages = conversations[id]?.messages ?? []
    return messages.length > 0 && messages[messages.length - 1].from === 'them'
  }).length

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-card/40 p-5 md:flex">
        <Wordmark />
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => (
            <SidebarLink key={item.to} item={item} badge={item.to === '/sohbetler' ? unreadCount : 0} />
          ))}
        </nav>
        <div className="mt-6 border-t border-border pt-4">
          <nav className="flex flex-col gap-1">
            {SECONDARY_NAV.map((item) => (
              <SidebarLink key={item.to} item={item} badge={0} />
            ))}
          </nav>
        </div>

        <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
          Müzik zevkine göre insanlarla tanış.
        </p>
      </aside>

      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-3xl px-4 pt-5 pb-40 md:px-8 md:pb-32">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {NAV.map((item) => (
            <li key={item.to}>
              <TabLink item={item} badge={item.to === '/sohbetler' ? unreadCount : 0} />
            </li>
          ))}
        </ul>
      </nav>

      <MiniPlayer />
      <MatchCelebration />
    </div>
  )
}

export function Wordmark() {
  return (
    <span className="font-display text-xl tracking-wide">
      makro<span className="text-accent text-glow">music</span>
    </span>
  )
}

function SidebarLink({ item, badge }: { item: NavItem; badge: number }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
          isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        }`
      }
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className="truncate">{item.label}</span>
      {badge > 0 && <Badge count={badge} />}
    </NavLink>
  )
}

function TabLink({ item, badge }: { item: NavItem; badge: number }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 py-2.5 text-xs transition-colors duration-200 ${
          isActive ? 'text-accent' : 'text-muted-foreground'
        }`
      }
    >
      <span className="relative">
        <Icon className="size-5" aria-hidden="true" />
        {badge > 0 && (
          <span className="absolute -top-1 -right-2">
            <Badge count={badge} />
          </span>
        )}
      </span>
      <span className="max-w-full truncate px-1">{item.label}</span>
    </NavLink>
  )
}

function Badge({ count }: { count: number }) {
  return (
    <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-accent px-1.5 py-0.5 text-xs font-semibold text-on-accent tabular-nums">
      {count > 9 ? '9+' : count}
      <span className="sr-only">okunmamış</span>
    </span>
  )
}
