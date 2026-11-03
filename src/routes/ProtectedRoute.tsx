import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ role }: { role?: 'admin' }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="p-10 text-center">Loading…</div>
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  if (role === 'admin' && profile?.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}