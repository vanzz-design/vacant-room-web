import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { goldButton } from '../ui/styles'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `relative rounded-lg px-3 py-2 text-sm font-medium transition-colors
   after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:origin-left after:rounded-full
   after:bg-gold-400 after:transition-transform after:duration-300
   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300
   ${
     isActive
       ? 'text-gold-300 after:scale-x-100'
       : 'text-forest-100/80 hover:text-white after:scale-x-0 hover:after:scale-x-50'
   }`

export default function AppShell() {
  const { session, profile, signOut } = useAuth()
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className="min-h-screen bg-campus font-sans text-white">
      {/* Sticky glass navigation */}
      <header
        className="sticky top-0 z-40 border-b border-white/10 bg-forest-950/55
          backdrop-blur-xl backdrop-saturate-150
          shadow-[0_1px_0_0_rgba(227,182,42,0.25),0_12px_32px_-20px_rgba(0,0,0,0.8)]"
      >
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 sm:px-6"
        >
          <Link
            to="/"
            className="group flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300"
          >
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-gold-300 to-gold-600
                text-forest-950 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_6px_16px_-6px_rgba(227,182,42,0.7)]
                transition-transform duration-300 group-hover:-rotate-6"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17" />
                <path d="M3 21h18" />
                <circle cx="12.5" cy="12.5" r="0.6" fill="currentColor" />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-semibold tracking-tight text-white">
                Vacant Room Checker
              </span>
              <span className="hidden text-xs text-forest-200 sm:block">
                ISU Santiago City Extension Campus
              </span>
            </span>
          </Link>

          <div className="order-last -mx-1 flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto">
            <NavLink to="/" end className={linkClass}>Live rooms</NavLink>
            {session && <NavLink to="/book" className={linkClass}>Book a room</NavLink>}
            {session && <NavLink to="/my-bookings" className={linkClass}>My bookings</NavLink>}
            {profile?.role === 'admin' && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
          </div>

          <div className="ml-auto">
            {session ? (
              <button onClick={signOut} className={goldButton}>
                Sign out
              </button>
            ) : (
              <Link to="/login" className={goldButton}>
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {isHome ? (
          <Outlet />
        ) : (
          // Pages that have not been restyled yet sit on a light sheet
          // so their existing colours stay readable.
          <div className="rounded-3xl bg-ivory p-5 text-forest-900 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] ring-1 ring-white/20 sm:p-8">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  )
}