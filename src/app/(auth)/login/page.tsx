'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    router.push('/mis-clases')
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/mis-clases` },
    })
    if (error) alert(error.message)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --white: #ffffff;
          --off-white: #f2fbf5;
          --g50:  #f0fdf4;
          --g100: #dcfce7;
          --g200: #bbf7d0;
          --g300: #86efac;
          --g400: #4ade80;
          --g500: #22c55e;
          --g600: #16a34a;
          --g700: #15803d;
          --gray-300: #cbd5e1;
          --gray-400: #94a3b8;
          --gray-500: #64748b;
          --gray-700: #334155;
          --gray-900: #0f172a;
        }
        .login-root {
          font-family: 'DM Sans', sans-serif;
          position: fixed;
          inset: 0;
          display: flex;
          width: 100vw;
          min-height: 100vh;
          background: var(--white);
          color: var(--gray-900);
          overflow: hidden;
        }

        /* ── GRID & ORBS (same as homepage) ── */
        .grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(34,197,94,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,197,94,0.07) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
          animation: float 8s ease-in-out infinite;
        }
        .orb-1 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(74,222,128,0.18) 0%, transparent 70%);
          top: -80px; left: -80px;
        }
        .orb-2 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%);
          bottom: 60px; left: 30%;
          animation-delay: -4s;
        }
        @keyframes float {
          0%,100% { transform: translateY(0px) scale(1); }
          50%      { transform: translateY(-24px) scale(1.04); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* ── LEFT PANEL ── */
        .left-panel {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          background: rgba(255,255,255,0.90);
          backdrop-filter: blur(12px);
          overflow-y: auto;
          z-index: 1;
        }
        .form-wrap {
          width: 100%;
          max-width: 360px;
          animation: fadeUp 0.6s ease both;
        }

        /* Logo */
        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 36px;
          text-decoration: none;
        }
        .logo-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, var(--g500), var(--g700));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(34,197,94,0.35);
        }
        .logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 15px;
          font-weight: 700;
          color: var(--gray-900);
          letter-spacing: -0.3px;
        }
        .logo-text span { color: var(--g500); }

        /* Headings */
        .form-title {
          font-size: 28px;
          font-weight: 300;
          letter-spacing: -1px;
          color: var(--gray-900);
          text-align: center;
          margin-bottom: 6px;
        }
        .form-title strong { font-weight: 500; color: var(--g600); }
        .form-sub {
          font-size: 14px;
          font-weight: 300;
          color: var(--gray-400);
          text-align: center;
          margin-bottom: 32px;
        }

        /* Fields */
        .field { margin-bottom: 18px; }
        .field label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--gray-700);
          margin-bottom: 6px;
          font-family: 'Space Mono', monospace;
          letter-spacing: 0.3px;
        }
        .field input {
          width: 100%;
          border: 1.5px solid var(--g200);
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: var(--gray-900);
          background: var(--off-white);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .field input::placeholder { color: var(--gray-400); }
        .field input:focus {
          border-color: var(--g500);
          background: var(--white);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.12);
        }

        /* Row */
        .row-between {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          margin-bottom: 22px;
        }
        .forgot-link {
          font-size: 13px;
          font-weight: 500;
          color: var(--g600);
          text-decoration: none;
          font-family: 'Space Mono', monospace;
          transition: color 0.2s;
        }
        .forgot-link:hover { color: var(--g700); }

        /* Primary button */
        .btn-primary {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, var(--g500), var(--g700));
          color: white;
          border: none;
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 6px 20px rgba(22,163,74,0.35);
          margin-bottom: 12px;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(22,163,74,0.45);
        }
        .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

        /* Google button */
        .btn-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: var(--white);
          border: 1.5px solid var(--g200);
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-700);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-google:hover {
          background: var(--g50);
          border-color: var(--g400);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34,197,94,0.15);
        }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 16px 0;
        }
        .divider-line { flex: 1; height: 1px; background: var(--g100); }
        .divider-text {
          font-size: 11px;
          color: var(--gray-400);
          font-family: 'Space Mono', monospace;
          letter-spacing: 1px;
        }

        /* Footer note */
        .signup-note {
          margin-top: 24px;
          text-align: center;
          font-size: 13px;
          color: var(--gray-500);
          font-weight: 300;
        }
        .signup-note a {
          font-weight: 500;
          color: var(--g600);
          text-decoration: none;
          font-family: 'Space Mono', monospace;
        }
        .signup-note a:hover { color: var(--g700); }

        /* ── RIGHT PANEL ── */
        .right-panel {
          display: none;
          flex: 1;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        @media (min-width: 1024px) {
          .right-panel { display: flex; }
        }
        .right-panel img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top;
        }
        /* Green tinted overlay instead of black */
        .right-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(21,128,61,0.85) 0%,
            rgba(21,128,61,0.30) 40%,
            rgba(34,197,94,0.08) 100%
          );
        }
        /* Grid texture on top of image */
        .right-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .right-content {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding: 48px;
          color: white;
        }
        /* Badge on right */
        .right-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 11px;
          font-family: 'Space Mono', monospace;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 20px;
          backdrop-filter: blur(8px);
        }
        .right-badge-dot {
          width: 6px; height: 6px;
          background: var(--g400);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(0.8); }
        }
        .right-quote {
          font-size: 22px;
          font-weight: 300;
          line-height: 1.5;
          letter-spacing: -0.5px;
          margin-bottom: 28px;
          max-width: 480px;
        }
        .right-quote strong { font-weight: 500; }
        .right-footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }
        .right-author-name {
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .right-author-role {
          font-size: 13px;
          color: rgba(255,255,255,0.65);
          font-weight: 300;
        }
        .stars { display: flex; gap: 4px; margin-bottom: 12px; }
        .nav-btns { display: flex; gap: 8px; }
        .nav-btn {
          width: 40px; height: 40px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          color: white;
        }
        .nav-btn:hover {
          background: rgba(255,255,255,0.18);
          border-color: rgba(255,255,255,0.5);
        }
      `}</style>

      <div className="login-root">
        <div className="grid-bg" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />

        {/* ── LEFT PANEL ── */}
        <div className="left-panel">
          <div className="form-wrap">

            {/* Logo */}
            <a className="logo">
              <div className="logo-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <span className="logo-text">Voltify<span>.</span></span>
            </a>

            <h1 className="form-title">Welcome <strong>back</strong></h1>
            <p className="form-sub">Please enter your details to continue.</p>

            <form onSubmit={handleLogin}>
              <div className="field">
                <label>// email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>// password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="row-between">
                <Link href="/forgot-password" className="forgot-link">
                  forgot_password →
                </Link>
              </div>

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Signing in…' : 'Sign in'}
              </button>

              <div className="divider">
                <div className="divider-line" />
                <span className="divider-text">OR</span>
                <div className="divider-line" />
              </div>

              <button type="button" onClick={handleGoogleLogin} className="btn-google">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2045c0-.638-.0573-1.252-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.716v2.2581h2.9086c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1814l-2.9086-2.2581c-.8059.54-1.8368.859-3.0477.859-2.3441 0-4.3282-1.5832-5.036-3.7105H.957v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1027-1.17.2827-1.71V4.9582H.957A8.9965 8.9965 0 000 9c0 1.452.3477 2.8268.957 4.0418L3.964 10.71z" fill="#FBBC05"/>
                  <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4627.8918 11.4255 0 9 0 5.4818 0 2.4382 2.0168.957 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            </form>

            <p className="signup-note">
              Don&apos;t have an account?{' '}
              <Link href="/register">sign_up</Link>
            </p>

          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          <img
            src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200&q=80"
            alt="Background"
          />
          <div className="right-overlay" />
          <div className="right-grid" />

          <div className="right-content">
            <div className="right-badge">
              <span className="right-badge-dot" />
              verified user · 5-star rated
            </div>

            <blockquote className="right-quote">
              "Voltify has saved us thousands of hours. We spin up circuit prototypes faster and ship better products."
            </blockquote>

            <div className="right-footer">
              <div>
                <p className="right-author-name">Lulu Meyers</p>
                <p className="right-author-role">Product Manager, Hourglass</p>
                <p className="right-author-role">Web Design Agency</p>
              </div>

              <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'12px'}}>
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="18" height="18" viewBox="0 0 20 20" fill="rgba(255,255,255,0.9)">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <div className="nav-btns">
                  <button className="nav-btn">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <button className="nav-btn">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}