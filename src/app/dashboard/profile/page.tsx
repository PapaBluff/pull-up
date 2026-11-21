'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type ProfileLink = {
  label: string
  url: string
}

export default function ProfileEditorPage() {
  const router = useRouter()
  const supabase = createClient()

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

  // Clickable links & uploaded content
  const [links, setLinks] = useState<ProfileLink[]>([])
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])

  const [loading, setLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)
      setEmail(user.email || '')

      const meta = user.user_metadata || {}

      const { data: profile } = await supabase
        .from('profiles')
        .select(
          'username, full_name, avatar_url, bio, links, media_urls, role, hourly_rate, stripe_account_id, phone_number'
        )
        .eq('id', user.id)
        .maybeSingle()

      setFullName(profile?.full_name || meta.full_name || '')
      setUsername(profile?.username || meta.username || '')
      setRole(
        (profile?.role || meta.role) === 'creator' ? 'creator' : 'host'
      )
      setAvatarUrl(profile?.avatar_url || '')
      setBio(profile?.bio || '')
      setPhoneNumber(profile?.phone_number || '')
      setHourlyRate(profile?.hourly_rate != null ? String(profile.hourly_rate) : '')
      setStripeAccountId(profile?.stripe_account_id || null)
      setLinks(Array.isArray(profile?.links) ? profile.links : [])
      setMediaUrls(Array.isArray(profile?.media_urls) ? profile.media_urls : [])

      setLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return

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
  }

  async function handleContentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !userId) return

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
    const label = newLinkLabel.trim()
    let url = newLinkUrl.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`
    }

    setLinks((prev) => [
      ...prev,
      { label: label || url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0], url },
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

    setSaving(true)
    setMessage(null)

    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/^@+/, '')
      .replace(/[^a-z0-9_]/g, '')

    const cleanName = fullName.trim()

    if (cleanUsername.length < 3) {
      setMessage({ type: 'error', text: 'Handle must be at least 3 characters.' })
      setSaving(false)
      return
    }

    // Check uniqueness against other users before saving
    const { data: handleConflict } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', cleanUsername)
      .neq('id', userId)
      .maybeSingle()

    if (handleConflict) {
      setMessage({ type: 'error', text: `@${cleanUsername} is already taken by another user.` })
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
        setMessage({ type: 'error', text: `"${cleanName}" is already taken. Choose a unique name.` })
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
      avatar_url: avatarUrl || null,
      bio: bio.trim() || null,
      links,
      media_urls: mediaUrls,
      phone_number: phoneNumber.trim() || null,
      role,
      hourly_rate: parsedRate,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setUsername(cleanUsername)
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
      {/* Clean Top Bar */}
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
        {/* Identity Summary Header (Already collected at signup, editable via toggle) */}
        <section className="pt-4 pb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="relative group h-16 w-16 rounded-full overflow-hidden border border-neutral-700 bg-neutral-900 flex items-center justify-center shrink-0"
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
                {uploadingAvatar ? 'UPLOADING PHOTO...' : 'UPLOAD PROFILE PHOTO'}
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
          {/* Collapsible Identity & Role Settings (Only shown if user clicks Edit Account) */}
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
                  BOOK PEOPLE
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
                  PULL UP AS TALENT
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
                  HANDLE
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

          {/* Clickable URLs / Links Section */}
          <div className="space-y-3">
            <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400">
              LINKS & SOCIALS
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
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="text-xs text-neutral-500 hover:text-red-400 transition px-2"
                    >
                      REMOVE
                    </button>
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
                type="text"
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
          </div>

          {/* Content & Media Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400">
                PHOTOS & CONTENT
              </label>
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
                  Upload photos or short clips to showcase your vibe
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
            disabled={saving}
            className="w-full rounded-xl bg-white py-4 text-xs font-bold tracking-wider uppercase text-black hover:bg-neutral-200 disabled:opacity-50 transition"
          >
            {saving ? 'SAVING...' : 'SAVE PROFILE'}
          </button>
        </form>
      </main>
    </div>
  )
}