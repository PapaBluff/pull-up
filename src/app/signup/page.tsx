'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const router = useRouter()
  const supabase = createClient()

  const [role, setRole] = useState<'host' | 'creator'>('host')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role,
        },
        emailRedirectTo: `${window.location.origin}/dashboard/telemetry`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // If email confirmation is disabled in Supabase, session is active immediately
    if (data.session) {
      router.refresh()
      router.push('/dashboard/profile')
    } else {
      setMessage('Check your email for a confirmation link to activate your account.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      {/* Top Bar */}
      <header className="w-full max-w-2xl px-6 py-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          PULL UP
        </Link>
        <Link
          href="/login"
          className="text-xs font-semibold tracking-wider uppercase text-neutral-300 hover:text-white transition"
        >
          LOG IN
        </Link>
      </header>

      {/* Main Form Container */}
      <main className="w-full max-w-md px-6 pt-8 pb-20 flex flex-col">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase mb-2">
            JOIN PULL UP
          </h1>
          <p className="text-xs text-neutral-400">
            How do you want to use PULL UP?
          </p>
        </div>

        {/* Role Selector matching the NOW / SCHEDULE toggle */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole('host')}
            className={`rounded-xl py-3.5 px-3 text-xs font-bold tracking-wider uppercase border transition ${
              role === 'host'
                ? 'bg-white text-black border-white'
                : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-600'
            }`}
          >
            BOOK PEOPLE
          </button>
          <button
            type="button"
            onClick={() => setRole('creator')}
            className={`rounded-xl py-3.5 px-3 text-xs font-bold tracking-wider uppercase border transition ${
              role === 'creator'
                ? 'bg-white text-black border-white'
                : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-600'
            }`}
          >
            PULL UP AS TALENT
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-emerald-900/60 bg-emerald-950/40 px-4 py-3 text-xs text-emerald-300">
            {message}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400 mb-2">
              NAME
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name or handle"
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400 mb-2">
              EMAIL
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400 mb-2">
              PASSWORD
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-white px-6 py-4 text-xs font-bold tracking-wider uppercase text-black hover:bg-neutral-200 transition disabled:opacity-50"
          >
            {loading ? 'CREATING ACCOUNT...' : 'CONTINUE'}
          </button>
        </form>

        <hr className="border-neutral-800 my-8" />

        <div className="text-center">
          <p className="text-xs text-neutral-400 mb-3">ALREADY HAVE AN ACCOUNT?</p>
          <Link
            href="/login"
            className="block w-full rounded-xl border border-neutral-800 bg-neutral-950 px-6 py-3.5 text-xs font-bold tracking-wider uppercase text-white hover:border-neutral-600 transition"
          >
            LOG IN
          </Link>
        </div>
      </main>
    </div>
  )
}