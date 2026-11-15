'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getRedirectDestination = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get('next') || '/dashboard/telemetry'
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError

        if (data.session) {
          window.location.href = getRedirectDestination()
          return
        }

        setMessage(
          'Account created! Check your email to confirm, or disable "Confirm email" in Supabase Auth settings for instant local login.'
        )
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError

        window.location.href = getRedirectDestination()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-neutral-800 bg-neutral-950 p-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            PULL UP Access
          </span>
          <h1 className="mt-1 text-2xl font-black tracking-tight">
            {isSignUp ? 'Create Host Account' : 'Sign In to Dashboard'}
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Authenticate to book talent, fund escrow, and manage live telemetry.
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Email
            </label>
            <input
              type="email"
              required
              placeholder="host@pullup.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-rose-900 bg-rose-950/50 p-3 text-xs text-rose-400">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-xl border border-emerald-900 bg-emerald-950/50 p-3 text-xs text-emerald-400">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-black transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Shield className="h-4 w-4" />
                <span>{isSignUp ? 'Create Account & Continue' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setMessage(null)
            }}
            className="text-xs text-neutral-400 hover:text-white"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have a test account? Sign up"}
          </button>
        </div>
      </div>
    </main>
  )
}