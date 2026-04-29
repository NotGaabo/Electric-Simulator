'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPasswordRecoveryRedirectUrl } from '@/lib/supabase/password-recovery'

const recoveryRedirectUrl = getPasswordRecoveryRedirectUrl()

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (!recoveryRedirectUrl) {
      setError('Recovery URL not configured.')
      return
    }
    setIsLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: recoveryRedirectUrl,
    })
    if (resetError) { setError(resetError.message); setIsLoading(false); return }
    setSuccess(true)
    setIsLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --white: #ffffff; --off-white: #f2fbf5;
          --g50: #f0fdf4; --g100: #dcfce7; --g200: #bbf7d0;
          --g400: #4ade80; --g500: #22c55e; --g600: #16a34a; --g700: #15803d;
          --gray-400: #94a3b8; --gray-500: #64748b; --gray-700: #334155; --gray-900: #0f172a;
        }
        .fp-root {
          font-family: 'DM Sans', sans-serif;
          position: fixed; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--white); color: var(--gray-900); overflow: hidden;
          padding: 40px 20px;
        }
        .grid-bg {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(34,197,94,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,197,94,0.07) 1px, transparent 1px);
          background-size: 48px 48px; pointer-events: none; z-index: 0;
        }
        .orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none; z-index: 0;
          animation: float 8s ease-in-out infinite;
        }
        .orb-1 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(74,222,128,0.18) 0%, transparent 70%); top: -80px; left: -80px; }
        .orb-2 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%); bottom: 60px; right: -60px; animation-delay: -4s; }
        @keyframes float { 0%,100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-24px) scale(1.04); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .form-wrap { position: relative; z-index: 1; width: 100%; max-width: 360px; animation: fadeUp 0.6s ease both; }
        .logo { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 36px; text-decoration: none; }
        .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, var(--g500), var(--g700)); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(34,197,94,0.35); }
        .logo-text { font-family: 'Space Mono', monospace; font-size: 15px; font-weight: 700; color: var(--gray-900); letter-spacing: -0.3px; }
        .logo-text span { color: var(--g500); }
        .form-title { font-size: 28px; font-weight: 300; letter-spacing: -1px; color: var(--gray-900); text-align: center; margin-bottom: 6px; }
        .form-title strong { font-weight: 500; color: var(--g600); }
        .form-sub { font-size: 14px; font-weight: 300; color: var(--gray-400); text-align: center; margin-bottom: 32px; line-height: 1.6; }
        .field { margin-bottom: 22px; }
        .field input { width: 100%; border: 1.5px solid var(--g200); border-radius: 10px; padding: 11px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: var(--gray-900); background: var(--off-white); outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }
        .field input::placeholder { color: var(--gray-400); }
        .field input:focus { border-color: var(--g500); background: var(--white); box-shadow: 0 0 0 3px rgba(34,197,94,0.12); }
        .error-box { margin-bottom: 16px; padding: 12px 14px; background: rgba(254,242,242,0.95); border: 1px solid #fecaca; border-radius: 10px; color: #b91c1c; font-size: 13px; font-family: 'Space Mono', monospace; }
        .btn-primary { width: 100%; padding: 13px; background: linear-gradient(135deg, var(--g500), var(--g700)); color: white; border: none; border-radius: 100px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.25s ease; box-shadow: 0 6px 20px rgba(22,163,74,0.35); margin-bottom: 20px; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(22,163,74,0.45); }
        .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
        .back-link { display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; color: var(--g600); text-decoration: none; font-family: 'Space Mono', monospace; transition: color 0.2s; }
        .back-link:hover { color: var(--g700); }
        .check-circle { width: 44px; height: 44px; background: linear-gradient(135deg, var(--g500), var(--g700)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 4px 14px rgba(34,197,94,0.3); }
      `}</style>

      <div className="fp-root">
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

          {!success ? (
            <>
              <h1 className="form-title">Forgot your <strong>password?</strong></h1>
              <p className="form-sub">No worries. Enter your email and we&apos;ll send you a recovery link.</p>

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && <div className="error-box">// {error}</div>}

                <button type="submit" disabled={isLoading} className="btn-primary">
                  {isLoading ? 'Sending link…' : 'Send recovery link'}
                </button>
              </form>

              <Link href="/login" className="back-link">← back_to_login</Link>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div className="check-circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h1 className="form-title">Check your <strong>inbox</strong></h1>
              <p className="form-sub" style={{ marginBottom: '24px' }}>
                We sent a recovery link to<br />
                <strong style={{ color: 'var(--g600)', fontFamily: "'Space Mono', monospace", fontSize: '13px' }}>{email}</strong>
              </p>
              <Link href="/login" className="back-link">← back_to_login</Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}