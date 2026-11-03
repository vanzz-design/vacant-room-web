import { Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './routes/ProtectedRoute'
import Dashboard from './pages/public/Dashboard'
import Login from './pages/public/Login'
import Book from './pages/user/Book'
import MyBookings from './pages/user/MyBookings'
import Analytics from './pages/admin/Analytics'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* Public */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />

        {/* Any signed-in user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/book" element={<Book />} />
          <Route path="/my-bookings" element={<MyBookings />} />
        </Route>

        {/* Admin only */}
        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin" element={<Analytics />} />
        </Route>
      </Route>
    </Routes>
  )
}