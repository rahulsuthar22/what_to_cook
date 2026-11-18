'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useCurrentUserRole } from '@/hooks/useAdminAuth';
import { AdminSpinner, startAdminNav } from '@/components/admin/AdminLoader';
import {
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Info,
  ExternalLink
} from 'lucide-react';

export default function AdminLoginPage() {
  const { hasAdminAccess, isAuthenticated, isLoading } = useCurrentUserRole();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // If already logged in with admin credentials, redirect directly to /admin
  useEffect(() => {
    if (!isLoading && isAuthenticated && hasAdminAccess) {
      router.push('/admin');
    }
  }, [isLoading, isAuthenticated, hasAdminAccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Please enter your administrator email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setIsSubmitting(false);
        setErrorMsg(result?.error || 'Invalid administrator email or password.');
        return;
      }

      // Start route progress and redirect to admin dashboard
      startAdminNav();
      router.push('/admin');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || 'An error occurred during authentication.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#07080d',
      backgroundImage: `
        radial-gradient(circle at 15% 20%, rgba(255, 90, 54, 0.08) 0%, transparent 45%),
        radial-gradient(circle at 85% 80%, rgba(0, 180, 216, 0.08) 0%, transparent 45%)
      `,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: 'var(--font-body)',
      color: '#fff',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#12141f',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '2.5rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
      }}>
        {/* Top Header Badge */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '2rem',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #ff5a36 0%, #d9381e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(255, 90, 54, 0.35)',
            marginBottom: '1rem',
          }}>
            <ShieldCheck size={30} />
          </div>



          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            margin: '0 0 0.4rem 0',
            color: '#fff',
          }}>
            Administrator Login
          </h1>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            margin: 0,
            maxWidth: '320px',
          }}>
            Authenticate with your SuperAdmin or Staff Administrator credentials.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(239, 71, 111, 0.12)',
            border: '1px solid rgba(239, 71, 111, 0.3)',
            color: '#ff85a1',
            fontSize: '0.82rem',
            marginBottom: '1.25rem',
            textAlign: 'center',
          }}>
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '0.4rem',
            }}>
              Administrator Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }} />
              <input
                type="email"
                placeholder="admin@whattocook.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.6rem',
                  borderRadius: '10px',
                  backgroundColor: '#0a0b12',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '0.4rem',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 2.6rem 0.75rem 2.6rem',
                  borderRadius: '10px',
                  backgroundColor: '#0a0b12',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              padding: '0.85rem',
              borderRadius: '10px',
              backgroundColor: '#ff5a36',
              border: 'none',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.8 : 1,
              marginTop: '0.5rem',
              boxShadow: isSubmitting
                ? '0 2px 8px rgba(255, 90, 54, 0.2)'
                : '0 4px 14px rgba(255, 90, 54, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            {isSubmitting ? (
              <>
                <AdminSpinner size={18} color="#ffffff" />
                <span>Authenticating Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Control Center</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Back to Public App */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
        }}>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
          >
            <span>Not an administrator? Switch to consumer login</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
