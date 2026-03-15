'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Step = 'initial' | 'details';

export default function SignUpPage() {
  const [step, setStep] = useState<Step>('initial');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  const testimonials = [
    {
      quote: "Untitled has saved us thousands of hours of work. We're able to spin up projects faster and take on more clients.",
      author: "Henley Shepherd",
      role: "Product Manager, Hourglass",
      company: "Web Design Agency",
    }
  ];

  // Step 1 → Step 2: just validate email format and advance
  const handleEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setStep('details');
  };

  // Step 2: final signup
  const handleFinalSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/dashboard`,
          data: { full_name: fullName },
        },
      });
      if (signUpError) throw signUpError;
      if (data.user) {
        if (data.user.identities && data.user.identities.length === 0) {
          setError('This email is already registered. Please log in instead.');
          return;
        }
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleFacebookSignup = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo: `${location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleAppleSignup = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: `${location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        html, body { margin: 0 !important; padding: 0 !important; }
        .signup-right { display: none; }
        @media (min-width: 1024px) { .signup-right { display: flex; } }
        .step-fade { animation: fadeIn 0.25s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        .social-btn:hover { background-color: #f9fafb !important; }
        .primary-btn:hover:not(:disabled) { background-color: #b91c1c !important; }
        .back-btn:hover { color: #111827 !important; }
      `}</style>

      <div style={{
        display: 'flex',
        width: '100vw',
        minHeight: '100vh',
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
      }}>

        {/* ── LEFT ── */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#ffffff', padding: '2rem', overflowY: 'auto',
        }}>
          <div style={{ width: '100%', maxWidth: '360px' }}>

            {/* Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #f87171, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#fff' }} />
              </div>
            </div>

            {/* ── STEP 1: initial ── */}
            {step === 'initial' && (
              <div className="step-fade">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h1 style={{ fontSize: '1.875rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem' }}>
                    Create an account
                  </h1>
                  <p style={{ color: '#6b7280', margin: 0 }}>Start your 30-day free trial.</p>
                </div>

                {error && <ErrorBox message={error} />}

                {/* Social Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <button onClick={handleGoogleSignup} disabled={isLoading} style={socialBtnStyle} className="social-btn">
                    <svg style={{ width: 20, height: 20, flexShrink: 0 }} viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span style={{ color: '#374151', fontWeight: 500 }}>Sign up with Google</span>
                  </button>

                  <button onClick={handleFacebookSignup} disabled={isLoading} style={socialBtnStyle} className="social-btn">
                    <svg style={{ width: 20, height: 20, flexShrink: 0 }} fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span style={{ color: '#374151', fontWeight: 500 }}>Sign up with Facebook</span>
                  </button>

                  <button onClick={handleAppleSignup} disabled={isLoading} style={socialBtnStyle} className="social-btn">
                    <svg style={{ width: 20, height: 20, flexShrink: 0 }} fill="#000" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    <span style={{ color: '#374151', fontWeight: 500 }}>Sign up with Apple</span>
                  </button>
                </div>

                {/* Divider */}
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '100%', borderTop: '1px solid #d1d5db' }} />
                  </div>
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: '0.875rem' }}>
                    <span style={{ padding: '0 0.5rem', backgroundColor: '#fff', color: '#6b7280' }}>OR</span>
                  </div>
                </div>

                {/* Email Field */}
                <form onSubmit={handleEmailNext} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    style={inputStyle}
                  />
                  <button type="submit" style={primaryBtnStyle} className="primary-btn">
                    Get started
                  </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                  Already have an account?{' '}
                  <a href="/login" style={{ color: '#dc2626', fontWeight: 500, textDecoration: 'none' }}>Log in</a>
                </p>
              </div>
            )}

            {/* ── STEP 2: details ── */}
            {step === 'details' && (
              <div className="step-fade">
                {/* Back button */}
                <button
                  onClick={() => { setStep('initial'); setError(''); }}
                  className="back-btn"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#6b7280', fontSize: '0.875rem', padding: 0,
                    marginBottom: '1.5rem', transition: 'color 0.15s',
                  }}
                >
                  <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                <div style={{ marginBottom: '2rem' }}>
                  <h1 style={{ fontSize: '1.875rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem' }}>
                    Almost there
                  </h1>
                  <p style={{ color: '#6b7280', margin: 0 }}>
                    Creating account for{' '}
                    <span style={{ color: '#111827', fontWeight: 500 }}>{email}</span>
                  </p>
                </div>

                {error && <ErrorBox message={error} />}

                <form onSubmit={handleFinalSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Full Name */}
                  <div>
                    <label style={labelStyle}>Full name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Smith"
                      required
                      disabled={isLoading}
                      style={inputStyle}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={labelStyle}>Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      disabled={isLoading}
                      style={inputStyle}
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={labelStyle}>Confirm password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      required
                      disabled={isLoading}
                      style={inputStyle}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{ ...primaryBtnStyle, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                    className="primary-btn"
                  >
                    {isLoading ? 'Creating account…' : 'Create account'}
                  </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>
                  By creating an account you agree to our{' '}
                  <a href="/terms" style={{ color: '#6b7280', textDecoration: 'underline' }}>Terms</a>
                  {' '}and{' '}
                  <a href="/privacy" style={{ color: '#6b7280', textDecoration: 'underline' }}>Privacy Policy</a>.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* ── RIGHT: Testimonial ── */}
        <div className="signup-right" style={{ flex: 1, position: 'relative', flexDirection: 'column' }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/testimonial-image.jpg')`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end', padding: '3rem', color: '#fff',
          }}>
            <div style={{ maxWidth: '32rem' }}>
              <blockquote style={{ fontSize: '1.5rem', fontWeight: 500, lineHeight: 1.5, margin: '0 0 1.5rem' }}>
                "{testimonials[currentTestimonial].quote}"
              </blockquote>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontWeight: 600, fontSize: '1.125rem', margin: '0 0 0.25rem' }}>
                  {testimonials[currentTestimonial].author}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#e5e7eb', margin: '0 0 0.125rem' }}>
                  {testimonials[currentTestimonial].role}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#d1d5db', margin: 0 }}>
                  {testimonials[currentTestimonial].company}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem' }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} style={{ width: 20, height: 20, fill: '#fff' }} viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setCurrentTestimonial(Math.max(0, currentTestimonial - 1))}
                  disabled={currentTestimonial === 0}
                  style={navBtnStyle}
                >
                  <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentTestimonial(Math.min(testimonials.length - 1, currentTestimonial + 1))}
                  disabled={currentTestimonial === testimonials.length - 1}
                  style={navBtnStyle}
                >
                  <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

// ── Small helper ──
function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{
      marginBottom: '1rem', padding: '0.75rem',
      backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem',
    }}>
      <p style={{ fontSize: '0.875rem', color: '#dc2626', margin: 0 }}>{message}</p>
    </div>
  );
}

// ── Shared styles ──
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem', boxSizing: 'border-box',
  border: '1px solid #d1d5db', borderRadius: '0.5rem',
  fontSize: '1rem', outline: 'none', color: '#111827',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  backgroundColor: '#fff',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.875rem', fontWeight: 500,
  color: '#374151', marginBottom: '0.375rem',
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem',
  backgroundColor: '#dc2626', color: '#fff',
  border: 'none', borderRadius: '0.5rem',
  fontSize: '1rem', fontWeight: 500, cursor: 'pointer',
  transition: 'background-color 0.15s',
};

const socialBtnStyle: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: '0.75rem', padding: '0.75rem 1rem',
  border: '1px solid #d1d5db', borderRadius: '0.5rem',
  backgroundColor: '#fff', cursor: 'pointer', transition: 'background-color 0.15s',
};

const navBtnStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: '50%',
  backgroundColor: 'rgba(255,255,255,0.2)',
  border: 'none', cursor: 'pointer', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(4px)',
};