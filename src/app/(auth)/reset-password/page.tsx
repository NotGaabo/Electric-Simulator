'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [supabase] = useState(() => createClient())
  const router = useRouter()
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')
  const authErrorDescription = searchParams.get('error_description')
  const isRedirecting = Boolean(authError || authErrorDescription)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [strength, setStrength] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [canReset, setCanReset] = useState(false)

  useEffect(() => {
    let isMounted = true
    if (authError || authErrorDescription) {
      router.replace(`/forgot-password?error=${encodeURIComponent('El enlace no es válido o ya venció. Pide uno nuevo.')}`)
      return () => { isMounted = false }
    }
    const markReady = (has: boolean) => {
      if (!isMounted) return
      setCanReset(has)
      setIsCheckingSession(false)
    }
    supabase.auth.getSession().then(({ data: { session } }) => markReady(Boolean(session)))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') markReady(Boolean(session))
    })
    return () => { isMounted = false; subscription.unsubscribe() }
  }, [authError, authErrorDescription, router, supabase])

  const getStrength = (pw: string) => {
    let s = 0
    if (pw.length >= 8) s++
    if (pw.length >= 12) s++
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s
  }

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength] ?? 'Strong'
  const strengthClass = strength <= 1 ? 'active-weak' : strength <= 2 ? 'active-mid' : 'active-strong'

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Min 8 characters required.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setIsLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) { setError(updateError.message); setIsLoading(false); return }
    setSuccess(true)
    setIsLoading(false)
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --white: #ffffff; --off-white: #f2fbf5;
          --g50: #f0fdf4; --g100: #dcfce7; --g200: #bbf7d0;
          --g500: #22c55e; --g600: #16a34a; --g700: #15803d;
          --gray-400: #94a3b8; --gray-700: #334155; --gray-900: #0f172a;
        }
        .rp-root { font-family: 'DM Sans', sans-serif; position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: var(--white); color: var(--gray-900); overflow: hidden; padding: 40px 20px; }
        .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(34,197,94,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.07) 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; z-index: 0; }
        .orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; animation: float 8s ease-in-out infinite; }
        .orb-1 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(74,222,128,0.18) 0%, transparent 70%); top: -80px; left: -80px; }
        .orb-2 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%); bottom: 60px; right: -60px; animation-delay: -4s; }
        @keyframes float { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-24px) scale(1.04)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .form-wrap { position: relative; z-index: 1; width: 100%; max-width: 360px; animation: fadeUp 0.6s ease both; }
        .logo { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 36px; text-decoration: none; }
        .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, var(--g500), var(--g700)); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(34,197,94,0.35); }
        .logo-text { font-family: 'Space Mono', monospace; font-size: 15px; font-weight: 700; color: var(--gray-900); letter-spacing: -0.3px; }
        .logo-text span { color: var(--g500); }
        .form-title { font-size: 28px; font-weight: 300; letter-spacing: -1px; text-align: center; margin-bottom: 6px; }
        .form-title strong { font-weight: 500; color: var(--g600); }
        .form-sub { font-size: 14px; font-weight: 300; color: var(--gray-400); text-align: center; margin-bottom: 32px; line-height: 1.6; }
        .field { margin-bottom: 18px; }
        .field input { width: 100%; border: 1.5px solid var(--g200); border-radius: 10px; padding: 11px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: var(--gray-900); background: var(--off-white); outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }
        .field input::placeholder { color: var(--gray-400); }
        .field input:focus { border-color: var(--g500); background: var(--white); box-shadow: 0 0 0 3px rgba(34,197,94,0.12); }
        .field input:disabled { opacity: 0.5; cursor: not-allowed; }
        .strength-bar { display: flex; gap: 4px; margin-top: 8px; }
        .strength-bar span { flex: 1; height: 3px; border-radius: 2px; background: var(--g100); transition: background 0.3s; }
        .active-weak { background: #f87171 !important; }
        .active-mid { background: #fb923c !important; }
        .active-strong { background: var(--g500) !important; }
        .strength-label { font-size: 11px; font-family: 'Space Mono', monospace; color: var(--gray-400); margin-top: 5px; }
        .error-box { margin-bottom: 16px; padding: 12px 14px; background: rgba(254,242,242,0.95); border: 1px solid #fecaca; border-radius: 10px; color: #b91c1c; font-size: 13px; font-family: 'Space Mono', monospace; }
        .info-box { margin-bottom: 20px; padding: 12px 14px; background: var(--g50); border: 1.5px solid var(--g200); border-radius: 10px; color: var(--g700); font-size: 13px; font-family: 'Space Mono', monospace; display: flex; align-items: center; gap: 8px; }
        .warning-box { margin-bottom: 20px; padding: 12px 14px; background: rgba(255,251,235,0.95); border: 1px solid #fde68a; border-radius: 10px; color: #92400e; font-size: 13px; font-family: 'Space Mono', monospace; }
        .spinner { width: 14px; height: 14px; border: 2px solid var(--g200); border-top-color: var(--g600); border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-primary { width: 100%; padding: 13px; background: linear-gradient(135deg, var(--g500), var(--g700)); color: white; border: none; border-radius: 100px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.25s ease; box-shadow: 0 6px 20px rgba(22,163,74,0.35); margin-bottom: 20px; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(22,163,74,0.45); }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .back-link { display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; color: var(--g600); text-decoration: none; font-family: 'Space Mono', monospace; transition: color 0.2s; }
        .back-link:hover { color: var(--g700); }
        .check-circle { width: 44px; height: 44px; background: linear-gradient(135deg, var(--g500), var(--g700)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 4px 14px rgba(34,197,94,0.3); }
      `}</style>

      <div className="rp-root">
        <div className="grid-bg" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />

        <div className="form-wrap">
          <Link href="/" className="logo">
            <div className="logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <span className="logo-text">Voltify<span>.</span></span>
          </Link>

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div className="check-circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h1 className="form-title">Password <strong>updated!</strong></h1>
              <p className="form-sub" style={{ marginBottom: '24px' }}>Your password has been changed successfully. You can now sign in.</p>
              <Link href="/login" className="back-link">← go_to_login</Link>
            </div>
          ) : (
            <>
              <h1 className="form-title">Set new <strong>password</strong></h1>
              <p className="form-sub">Choose a strong password of at least 8 characters.</p>

              {isCheckingSession && (
                <div className="info-box">
                  <div className="spinner" />
                  Validating recovery link…
                </div>
              )}

              {!isCheckingSession && !canReset && (
                <div className="warning-box">
                  // link_expired — request a new one below
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <input
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setStrength(getStrength(e.target.value)) }}
                    disabled={!canReset || isLoading || isRedirecting}
                    required
                  />
                  <div className="strength-bar">
                    {[...Array(4)].map((_, i) => (
                      <span key={i} className={i < strength ? strengthClass : ''} />
                    ))}
                  </div>
                  {password.length > 0 && <p className="strength-label">{strengthLabel}</p>}
                </div>

                <div className="field">
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={!canReset || isLoading || isRedirecting}
                    required
                  />
                </div>

                {error && <div className="error-box">// {error}</div>}

                <button type="submit" disabled={!canReset || isLoading || isRedirecting} className="btn-primary">
                  {isLoading ? 'Saving…' : 'Save new password'}
                </button>
              </form>

              <Link href="/forgot-password" className="back-link">← request_new_link</Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}