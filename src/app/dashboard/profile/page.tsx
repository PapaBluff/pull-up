'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type ProfileLink = {
  label: string
  url: string
}

function normalizeAndValidateUrl(rawInput: string): string | null {
  const trimmed = rawInput.trim()
  if (!trimmed) return null

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const parsed = new URL(withProtocol)
    // Must be http/https and contain a valid domain with a dot (e.g., instagram.com)
    if (
      (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
      !parsed.hostname.includes('.') ||
      parsed.hostname.endsWith('.')
    ) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

export default function ProfileEditorPage() {
  const router = useRouter()

  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const contentInputRef = useRef<HTMLInputElement | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<'host' | 'creator'>('host')
  const [editingIdentity, setEditingIdentity] = useState(false)

  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null)

  const [links, setLinks] = useState<ProfileLink[]>([])
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)

  const [mediaUrls, setMediaUrls] = useState<string[]>([])

  const [loading, setLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Required media count based on account role: 5 for talent/host-creator, 3 for bookers
  const requiredMediaCount = role === 'creator' ? 5 : 3
  const hasAvatar = Boolean(avatarUrl.trim())
  const hasEnoughMedia = mediaUrls.length >= requiredMediaCount

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const meta = user.user_metadata || {}

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(
          'username, full_name, avatar_url, bio, links, media_urls, role, hourly_rate, stripe_account_id, phone_number'
        )
        .eq('id', user.id)
        .maybeSingle()

      if (!isMounted) return

      if (error) {
        setMessage({ type: 'error', text: `Failed to load profile: ${error.message}` })
      }

      setUserId(user.id)
      setEmail(user.email || '')
      setFullName(profile?.full_name ?? meta.full_name ?? '')
      setUsername(profile?.username ?? meta.username ?? '')

      const resolvedRole = profile?.role || meta.role
      setRole(resolvedRole === 'creator' ? 'creator' : 'host')

      setAvatarUrl(profile?.avatar_url ?? '')
      setBio(profile?.bio ?? '')
      setPhoneNumber(profile?.phone_number ?? '')
      setHourlyRate(
        profile?.hourly_rate !== null && profile?.hourly_rate !== undefined
          ? String(profile.hourly_rate)
          : ''
      )
      setStripeAccountId(profile?.stripe_account_id ?? null)
      setLinks(Array.isArray(profile?.links) ? profile.links : [])
      setMediaUrls(Array.isArray(profile?.media_urls) ? profile.media_urls : [])

      setLoading(false)
    }

    loadProfile()
    return () => {
      isMounted = false
    }
  }, [router])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    const supabase = createClient()
    setUploadingAvatar(true)
    setMessage(null)

    const ext = file.name.split('.').pop() || 'jpg'
    const filePath = `${userId}/avatar-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('profile-media')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setMessage({ type: 'error', text: `Photo upload failed: ${uploadError.message}` })
      setUploadingAvatar(false)
      return
    }

    const { data: publicData } = supabase.storage
      .from('profile-media')
      .getPublicUrl(filePath)

    setAvatarUrl(publicData.publicUrl)
    setUploadingAvatar(false)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  async function handleContentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !userId) return

    const supabase = createClient()
    setUploadingMedia(true)
    setMessage(null)

    const uploaded: string[] = []

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `${userId}/content-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('profile-media')
        .upload(filePath, file)

      if (!uploadError) {
        const { data: publicData } = supabase.storage
          .from('profile-media')
          .getPublicUrl(filePath)
        uploaded.push(publicData.publicUrl)
      }
    }

    if (uploaded.length > 0) {
      setMediaUrls((prev) => [...prev, ...uploaded])
    } else {
      setMessage({ type: 'error', text: 'Could not upload file. Make sure it is under 50MB.' })
    }

    setUploadingMedia(false)
    if (contentInputRef.current) contentInputRef.current.value = ''
  }

  function handleAddLink() {
    setLinkError(null)
    const label = newLinkLabel.trim()
    const validUrl = normalizeAndValidateUrl(newLinkUrl)

    if (!validUrl) {
      setLinkError('Enter a valid website or social URL (e.g., https://instagram.com/yourhandle).')
      return
    }

    const parsedHost = new URL(validUrl).hostname.replace(/^www\./, '')

    setLinks((prev) => [
      ...prev,
      { label: label || parsedHost, url: validUrl },
    ])
    setNewLinkLabel('')
    setNewLinkUrl('')
  }

  function handleRemoveLink(index: number) {
    setLinks((prev) => prev.filter((_, idx) => idx !== index))
  }

  function handleRemoveMedia(urlToRemove: string) {
    setMediaUrls((prev) => prev.filter((u) => u !== urlToRemove))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    setMessage(null)

    // 1. Enforce profile photo requirement
    if (!hasAvatar) {
      setMessage({
        type: 'error',
        text: 'Please upload a profile picture before saving your profile.',
      })
      return
    }

    // 2. Enforce minimum media count (5 for talent/creators, 3 for bookers)
    if (!hasEnoughMedia) {
      const remaining = requiredMediaCount - mediaUrls.length
      setMessage({
        type: 'error',
        text: `${
          role === 'creator' ? 'Talent profiles' : 'Booking profiles'
        } require at least ${requiredMediaCount} uploaded photos/media items (${mediaUrls.length}/${requiredMediaCount} uploaded — add ${remaining} more).`,
      })
      return
    }

    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/^@+/, '')
      .replace(/[^a-z0-9_]/g, '')

    const cleanName = fullName.trim()

    if (cleanUsername.length < 3) {
      setMessage({ type: 'error', text: 'Username must be at least 3 characters.' })
      return
    }

    // 3. Validate all saved links before writing
    const validatedLinks: ProfileLink[] = []
    for (const item of links) {
      const valid = normalizeAndValidateUrl(item.url)
      if (!valid) {
        setMessage({
          type: 'error',
          text: `Invalid URL found in links: "${item.url}". Please fix or remove it.`,
        })
        return
      }
      validatedLinks.push({ label: item.label.trim() || valid, url: valid })
    }

    setSaving(true)
    const supabase = createClient()

    // 4. Enforce strict 1-of-1 unique username check
    const { data: handleConflict } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', cleanUsername)
      .neq('id', userId)
      .maybeSingle()

    if (handleConflict) {
      setMessage({
        type: 'error',
        text: `@${cleanUsername} is already taken. Usernames must be 1-of-1 unique.`,
      })
      setSaving(false)
      return
    }

    if (cleanName) {
      const { data: nameConflict } = await supabase
        .from('profiles')
        .select('id')
        .ilike('full_name', cleanName)
        .neq('id', userId)
        .maybeSingle()

      if (nameConflict) {
        setMessage({
          type: 'error',
          text: `"${cleanName}" is already taken. Choose a unique display name.`,
        })
        setSaving(false)
        return
      }
    }

    const parsedRate =
      role === 'creator' && hourlyRate.trim() !== ''
        ? Math.max(0, Number(hourlyRate))
        : null

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: cleanName || null,
      username: cleanUsername,
      avatar_url: avatarUrl,
      bio: bio.trim() || null,
      links: validatedLinks,
      media_urls: mediaUrls,
      phone_number: phoneNumber.trim() || null,
      role,
      hourly_rate: parsedRate,
    })

    if (error) {
      if (error.code === '23505') {
        setMessage({
          type: 'error',
          text: 'That username or display name is already claimed by another user.',
        })
      } else {
        setMessage({ type: 'error', text: error.message })
      }
    } else {
      setUsername(cleanUsername)
      setLinks(validatedLinks)
      setEditingIdentity(false)
      setMessage({ type: 'success', text: 'Profile saved.' })
      router.refresh()
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-xs uppercase tracking-widest text-neutral-500">
        LOADING PROFILE...
      </div>
    )
  }

  const displayInitial = (fullName || username || 'U').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      {/* Top Bar */}
      <header className="w-full max-w-2xl px-6 py-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          PULL UP
        </Link>

        <div className="flex items-center gap-4">
          {username && (
            <Link
              href={`/u/${username}`}
              className="text-xs font-semibold tracking-wider uppercase text-neutral-300 hover:text-white transition"
            >
              VIEW PROFILE
            </Link>
          )}
          <Link
            href="/"
            className="text-xs font-semibold tracking-wider uppercase text-neutral-400 hover:text-white transition"
          >
            HOME
          </Link>
        </div>
      </header>

      <main className="w-full max-w-xl px-6 pb-20 flex flex-col">
        {/* Identity & Required Avatar Header */}
        <section className="pt-4 pb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className={`relative group h-16 w-16 rounded-full overflow-hidden border ${
                hasAvatar ? 'border-neutral-700' : 'border-amber-500'
              } bg-neutral-900 flex items-center justify-center shrink-0`}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-extrabold text-white">{displayInitial}</span>
              )}
              <span className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider transition">
                {uploadingAvatar ? '...' : 'UPLOAD'}
              </span>
            </button>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight">
                {fullName || 'Your Name'}
              </h1>
              <p className="text-xs text-neutral-400">
                @{username || 'handle'} · {role === 'creator' ? 'TALENT' : 'BOOKING ACCOUNT'}
              </p>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-white underline"
              >
                {uploadingAvatar
                  ? 'UPLOADING PHOTO...'
                  : hasAvatar
                  ? 'CHANGE PROFILE PHOTO'
                  : 'UPLOAD PROFILE PHOTO (REQUIRED)'}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditingIdentity((v) => !v)}
            className="rounded-lg border border-neutral-800 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-300 hover:border-neutral-600 hover:text-white transition"
          >
            {editingIdentity ? 'DONE' : 'EDIT ACCOUNT'}
          </button>
        </section>

        <hr className="border-neutral-800" />

        <form onSubmit={handleSave} className="py-6 space-y-6">
          {/* Collapsible Identity & Role Settings */}
          {editingIdentity && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-4">
              <div className="text-xs font-bold tracking-widest uppercase text-neutral-400">
                ACCOUNT DETAILS ({email})
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('host')}
                  className={`rounded-xl py-3 text-xs font-bold tracking-wider uppercase border transition ${
                    role === 'host'
                      ? 'bg-white text-black border-white'
                      : 'bg-black text-neutral-300 border-neutral-800'
                  }`}
                >
                  BOOK PEOPLE (3+ PICS)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('creator')}
                  className={`rounded-xl py-3 text-xs font-bold tracking-wider uppercase border transition ${
                    role === 'creator'
                      ? 'bg-white text-black border-white'
                      : 'bg-black text-neutral-300 border-neutral-800'
                  }`}
                >
                  PULL UP AS TALENT (5+ PICS)
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-widest uppercase text-neutral-400 mb-1.5">
                  DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-widest uppercase text-neutral-400 mb-1.5">
                  UNIQUE USERNAME (1 OF 1)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value
                          .toLowerCase()
                          .replace(/^@+/, '')
                          .replace(/[^a-z0-9_]/g, '')
                      )
                    }
                    className="w-full rounded-xl bg-neutral-900 border border-neutral-800 pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400 mb-2">
              BIO
            </label>
            <textarea
              rows={3}
              maxLength={280}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people who you are, what you do, and what pulling up with you looks like..."
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition resize-none"
            />
            <div className="text-right text-[11px] text-neutral-500 mt-1">
              {bio.length}/280
            </div>
          </div>

          {/* Verifiable & Clickable URLs / Social Links Section */}
          <div className="space-y-3">
            <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400">
              VERIFIABLE LINKS & SOCIALS
            </label>

            {links.length > 0 && (
              <div className="space-y-2">
                {links.map((item, idx) => (
                  <div
                    key={`${item.url}-${idx}`}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 group"
                    >
                      <div className="text-xs font-bold text-white group-hover:underline truncate">
                        {item.label} ↗
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        {item.url}
                      </div>
                    </a>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-neutral-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-200 hover:border-white hover:text-white transition"
                      >
                        VERIFY ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        className="text-xs text-neutral-500 hover:text-red-400 transition px-1.5"
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                value={newLinkLabel}
                onChange={(e) => setNewLinkLabel(e.target.value)}
                placeholder="Label (e.g. Instagram)"
                className="sm:col-span-2 rounded-xl bg-neutral-900 border border-neutral-800 px-3.5 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
              />
              <input
                type="url"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="https://instagram.com/you"
                className="sm:col-span-2 rounded-xl bg-neutral-900 border border-neutral-800 px-3.5 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
              />
              <button
                type="button"
                onClick={handleAddLink}
                className="sm:col-span-1 rounded-xl border border-neutral-700 bg-neutral-950 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition"
              >
                ADD
              </button>
            </div>

            {linkError && (
              <p className="text-xs text-red-400">{linkError}</p>
            )}
          </div>

          {/* Required Photos & Content Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400">
                  PHOTOS & CONTENT (MIN {requiredMediaCount} REQUIRED)
                </label>
                <span
                  className={`text-[11px] font-semibold ${
                    hasEnoughMedia ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {mediaUrls.length}/{requiredMediaCount} uploaded
                </span>
              </div>

              <button
                type="button"
                onClick={() => contentInputRef.current?.click()}
                disabled={uploadingMedia}
                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition"
              >
                {uploadingMedia ? 'UPLOADING...' : '+ UPLOAD MEDIA'}
              </button>
              <input
                ref={contentInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleContentUpload}
                className="hidden"
              />
            </div>

            {mediaUrls.length === 0 ? (
              <button
                type="button"
                onClick={() => contentInputRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-neutral-800 bg-neutral-950 p-6 text-center hover:border-neutral-600 transition"
              >
                <p className="text-xs font-semibold text-white">
                  Upload at least {requiredMediaCount} photos or clips to verify your profile
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  JPG, PNG, WEBP, or MP4
                </p>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {mediaUrls.map((url) => {
                  const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(url)
                  return (
                    <div
                      key={url}
                      className="relative aspect-square rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 group"
                    >
                      {isVideo ? (
                        <video
                          src={url}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={url}
                          alt="Uploaded content"
                          className="h-full w-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(url)}
                        className="absolute top-1.5 right-1.5 rounded-md bg-black/80 px-2 py-1 text-[10px] font-bold uppercase text-white opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400 mb-2">
              PHONE NUMBER (FOR DISPATCH UPDATES)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
            />
          </div>

          {/* Creator Rate & Payouts */}
          {role === 'creator' && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-5">
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400 mb-2">
                  HOURLY RATE (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="150"
                    className="w-full rounded-xl bg-neutral-900 border border-neutral-800 pl-8 pr-14 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                    / HR
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-white">
                    STRIPE PAYOUTS
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {stripeAccountId
                      ? 'Connected & verified to receive payouts'
                      : 'Connect Stripe to receive escrow payouts'}
                  </div>
                </div>

                {stripeAccountId ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 border border-emerald-800 px-3 py-1 text-[11px] font-bold uppercase text-emerald-300 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    VERIFIED
                  </span>
                ) : (
                  <Link
                    href="/dashboard/telemetry"
                    className="shrink-0 rounded-lg border border-white px-3.5 py-2 text-[11px] font-bold tracking-wider uppercase text-white hover:bg-white hover:text-black transition"
                  >
                    CONNECT
                  </Link>
                )}
              </div>
            </div>
          )}

          {message && (
            <div
              className={`rounded-xl border px-4 py-3 text-xs font-medium ${
                message.type === 'success'
                  ? 'border-emerald-800 bg-emerald-950/60 text-emerald-300'
                  : 'border-red-800 bg-red-950/60 text-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || uploadingAvatar || uploadingMedia}
            className="w-full rounded-xl bg-white py-4 text-xs font-bold tracking-wider uppercase text-black hover:bg-neutral-200 disabled:opacity-50 transition"
          >
            {saving ? 'SAVING...' : 'SAVE PROFILE'}
          </button>
        </form>
      </main>
    </div>
  )
}