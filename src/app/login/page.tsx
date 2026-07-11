'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { signIn } from 'next-auth/react';
import { UtensilsCrossed, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email) {
      setErrorMsg('Please enter your email address');
      return;
    }
    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setErrorMsg(res.error || 'Failed to log in. Please check your credentials or DB connectivity.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(255, 90, 54, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(0, 180, 216, 0.08) 0%, transparent 40%), var(--bg-base)',
      padding: '1.5rem'
    }}>
      <div className="card card-glass animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #ff7a45 100%)',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px var(--primary-glow)',
            marginBottom: '0.5rem'
          }}>
            <UtensilsCrossed size={24} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>
            Smart "What to Cook" Recommendation System
          </p>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(239, 71, 111, 0.1)',
            border: '1px solid var(--error)',
            color: 'var(--error)',
            padding: '0.8rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="you@example.com"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.8rem', width: '100%' }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.8rem', paddingRight: '2.8rem', width: '100%' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem', marginTop: '0.5rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '1rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>

        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>Sign In with Google</span>
        </button>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'hover' }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
