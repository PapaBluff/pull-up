'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [role, setRole] = useState<'host' | 'creator'>('host')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)

  // Password rule checks
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial

  function sanitizeHandle(raw: string) {
    return raw
      .trim()
      .toLowerCase()
      .replace(/^@+/, '')
      .replace(/[^a-z0-9_]/g, '')
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setAlreadyRegistered(false)

    const cleanName = fullName.trim()
    const cleanHandle = sanitizeHandle(username)

    if (!cleanName) {
      setErrorMsg('Please enter your name.')
      return
    }

    if (cleanHandle.length < 3) {
      setErrorMsg('Your @handle must be at least 3 characters (letters, numbers, underscores).')
      return
    }

    if (!isPasswordValid) {
      setErrorMsg('Please meet all password requirements before continuing.')
      return
    }

    setLoading(true)

    // 1. Check if handle or full name is already taken
    const { data: existingHandle } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', cleanHandle)
      .maybeSingle()

    if (existingHandle) {
      setErrorMsg(`@${cleanHandle} is already taken. Please choose another handle.`)
      setLoading(false)
      return
    }

    const { data: existingName } = await supabase
      .from('profiles')
      .select('id')
      .ilike('full_name', cleanName)
      .maybeSingle()

    if (existingName) {
      setErrorMsg(`"${cleanName}" is already registered. Please use a unique display name.`)
      setLoading(false)
      return
    }

    // 2. Create auth user
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: cleanName,
          username: cleanHandle,
          role,
        },
      },
    })

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        setAlreadyRegistered(true)
        setErrorMsg('An account with this email already exists.')
      } else {
        setErrorMsg(error.message)
      }
      setLoading(false)
      return
    }

    // 3. Upsert profile row immediately if session is active
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: cleanName,
        username: cleanHandle,
        role,
      })
    }

    router.push('/dashboard/profile')
    router.refresh()
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

      <main className="w-full max-w-md px-6 pb-20 flex flex-col">
        <section className="pt-6 pb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase">
            JOIN PULL UP
          </h1>
          <p className="text-xs text-neutral-400 mt-2">
            How do you want to use PULL UP?
          </p>
        </section>

        <form onSubmit={handleSignup} className="space-y-5">
          {/* Role Toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('host')}
              className={`rounded-xl py-3.5 px-4 text-xs font-bold tracking-wider uppercase border transition ${
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
              className={`rounded-xl py-3.5 px-4 text-xs font-bold tracking-wider uppercase border transition ${
                role === 'creator'
                  ? 'bg-white text-black border-white'
                  : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-600'
              }`}
            >
              PULL UP AS TALENT
            </button>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400 mb-2">
              NAME
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your unique name or stage name"
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
            />
          </div>

          {/* Unique Handle */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400 mb-2">
              HANDLE
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
                @
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(sanitizeHandle(e.target.value))}
                placeholder="yourhandle"
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 pl-8 pr-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
              />
            </div>
          </div>

          {/* Email */}
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

          {/* Password with Limitations */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400 mb-2">
              PASSWORD
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, uppercase, number & symbol"
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
            />

            {/* Live Password Rules Checklist */}
            <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
              <span className={hasMinLength ? 'text-emerald-400' : 'text-neutral-500'}>
                {hasMinLength ? '✓' : '•'} 8+ characters
              </span>
              <span className={hasUppercase ? 'text-emerald-400' : 'text-neutral-500'}>
                {hasUppercase ? '✓' : '•'} 1 uppercase letter
              </span>
              <span className={hasLowercase ? 'text-emerald-400' : 'text-neutral-500'}>
                {hasLowercase ? '✓' : '•'} 1 lowercase letter
              </span>
              <span className={hasNumber ? 'text-emerald-400' : 'text-neutral-500'}>
                {hasNumber ? '✓' : '•'} 1 number
              </span>
              <span className={hasSpecial ? 'text-emerald-400' : 'text-neutral-500'}>
                {hasSpecial ? '✓' : '•'} 1 special character (!@#$)
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-red-800 bg-red-950/60 px-4 py-3 text-xs text-red-300 space-y-2">
              <p>{errorMsg}</p>
              {alreadyRegistered && (
                <Link
                  href="/login"
                  className="inline-block font-bold uppercase underline text-white"
                >
                  LOG IN TO YOUR EXISTING ACCOUNT →
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white py-4 text-xs font-bold tracking-wider uppercase text-black hover:bg-neutral-200 disabled:opacity-50 transition"
          >
            {loading ? 'CREATING ACCOUNT...' : 'CONTINUE'}
          </button>
        </form>

        <hr className="border-neutral-800 my-8" />

        <div className="text-center space-y-3">
          <p className="text-xs text-neutral-400">ALREADY HAVE AN ACCOUNT?</p>
          <Link
            href="/login"
            className="block w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3.5 text-xs font-bold tracking-wider uppercase text-white hover:border-neutral-600 transition"
          >
            LOG IN
          </Link>
        </div>
      </main>
    </div>
  )
}