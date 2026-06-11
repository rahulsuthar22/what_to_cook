'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Phone, Mail, Award, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preference, setPreference] = useState('None');
  
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load initial context values
  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setPhone(user.mobile_number || '');
      setPreference(user.dietary_preference || 'None');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setMsg(null);

    const success = await updateProfile(name, phone, preference);
    setIsSaving(false);

    if (success) {
      setMsg({ type: 'success', text: 'Profile updated successfully in PostgreSQL database!' });
      setTimeout(() => setMsg(null), 4000);
    } else {
      setMsg({ type: 'error', text: 'Failed to update profile. Please try again.' });
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading user profile...
      </div>
    );
  }

  // Get user initials for avatar
  const initials = user.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Account Profile</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage your personal details, contact number, and dietary preferences.
        </p>
      </div>

      {msg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          backgroundColor: msg.type === 'success' ? 'rgba(6, 214, 160, 0.12)' : 'rgba(239, 71, 111, 0.12)',
          border: `1px solid ${msg.type === 'success' ? 'var(--success)' : 'var(--error)'}`,
          color: msg.type === 'success' ? 'var(--success)' : 'var(--error)',
          padding: '1rem',
          borderRadius: '10px',
          fontSize: '0.9rem',
          animation: 'slide-in 0.3s ease-out'
        }}>
          {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Main Profile Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Side: Avatar & Stats Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', padding: '2.5rem 1.5rem' }}>
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '2rem',
            fontWeight: 800,
            boxShadow: '0 8px 20px rgba(255, 90, 54, 0.25)',
            border: '3px solid rgba(255,255,255,0.1)'
          }}>
            {initials}
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{user.displayName}</h3>
            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
              {preference}
            </span>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', width: '100%', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>User ID:</span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{user.uid.substring(0, 10)}...</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Security Method:</span>
              <strong style={{ color: 'var(--text-primary)' }}>NextAuth JWT</strong>
            </div>
          </div>
        </div>

        {/* Right Side: Profile Edit Form */}
        <div className="card" style={{ padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            Personal Details
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={14} style={{ color: 'var(--primary)' }} />
                Full Name
              </label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={14} style={{ color: 'var(--secondary)' }} />
                Email Address
              </label>
              <input
                type="email"
                className="form-control"
                value={user.email}
                disabled
                style={{ opacity: 0.65, cursor: 'not-allowed', backgroundColor: 'rgba(255,255,255,0.02)' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Email address is managed by identity verification and cannot be changed.
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Phone size={14} style={{ color: 'var(--success)' }} />
                Mobile Number
              </label>
              <input
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="E.g., +91 90795 67123"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={14} style={{ color: 'var(--warning)' }} />
                Diet Preference
              </label>
              <select
                className="form-control"
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
              >
                <option value="None">None (Eat Anything)</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="Keto">Keto</option>
                <option value="Gluten-Free">Gluten-Free</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.8rem 1.5rem', alignSelf: 'start', marginTop: '0.5rem' }}
              disabled={isSaving}
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile'}
            </button>

          </form>
        </div>

      </div>

    </div>
  );
}
