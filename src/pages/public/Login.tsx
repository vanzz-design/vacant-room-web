import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: { pathname: string } } }

  const submit = async () => {
    setError('')
    const { error } = mode === 'in'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, student_id: studentId } },
        })
    if (error) return setError(error.message)
    navigate(location.state?.from?.pathname ?? '/', { replace: true })
  }

  const input = 'w-full rounded border border-brand-500/40 bg-white px-3 py-2'
  return (
    <div className="mx-auto mt-10 max-w-sm space-y-3 rounded-xl border-t-4 border-gold-500 bg-white p-6 shadow">
      <h1 className="text-xl font-bold text-brand-700">{mode === 'in' ? 'Sign in' : 'Create account'}</h1>
      {mode === 'up' && <>
        <input className={input} placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />
        <input className={input} placeholder="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} />
      </>}
      <input className={input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input className={input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      {error && <p className="text-sm text-occupied">{error}</p>}
      <button onClick={submit} className="w-full rounded bg-brand-700 py-2 font-semibold text-white hover:bg-brand-900">
        {mode === 'in' ? 'Sign in' : 'Sign up'}
      </button>
      <button onClick={() => setMode(mode === 'in' ? 'up' : 'in')} className="text-sm text-brand-700 underline">
        {mode === 'in' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
      </button>
    </div>
  )
}