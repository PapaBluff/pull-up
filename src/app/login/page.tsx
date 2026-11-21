'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/dashboard/telemetry')
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      {/* Top Bar */}
      <header className="w-full max-w-2xl px-6 py-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          PULL UP
        </Link>
        <Link
          href="/signup"
          className="text-xs font-semibold tracking-wider uppercase text-neutral-300 hover:text-white transition"
        >
          JOIN
        </Link>
      </header>

      {/* Main Form Container */}
      <main className="w-full max-w-md px-6 pt-12 pb-20 flex flex-col">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase mb-2">
            WELCOME BACK
          </h1>
          <p className="text-xs text-neutral-400">
            Log in to book talent or manage your pull ups.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-white px-6 py-4 text-xs font-bold tracking-wider uppercase text-black hover:bg-neutral-200 transition disabled:opacity-50"
          >
            {loading ? 'LOGGING IN...' : 'LOG IN'}
          </button>
        </form>

        <hr className="border-neutral-800 my-8" />

        <div className="text-center">
          <p className="text-xs text-neutral-400 mb-3">NEW TO PULL UP?</p>
          <Link
            href="/signup"
            className="block w-full rounded-xl border border-neutral-800 bg-neutral-950 px-6 py-3.5 text-xs font-bold tracking-wider uppercase text-white hover:border-neutral-600 transition"
          >
            CREATE AN ACCOUNT
          </Link>
        </div>
      </main>
    </div>
  )
}