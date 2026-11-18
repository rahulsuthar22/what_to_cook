'use client';

import React, { useEffect, useState } from 'react';
import { AdminSpinner } from '@/components/admin/AdminLoader';
import {
  Shield,
  UserPlus,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Crown,
  Lock,
  RefreshCw,
} from 'lucide-react';

interface AdminMember {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function StaffPage() {
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>(['ADMIN']);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('ADMIN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/admins');
      const data = await res.json();
      if (data.success) {
        if (data.admins) setAdmins(data.admins);
        if (Array.isArray(data.roles) && data.roles.length > 0) {
          setAvailableRoles(data.roles);
          setNewRole((prev) => (prev && data.roles.includes(prev) ? prev : data.roles[0]));
        }
      }
    } catch (err: unknown) {
      console.error('Failed to fetch staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch('/api/admin/admins')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          if (data.admins) setAdmins(data.admins);
          if (Array.isArray(data.roles) && data.roles.length > 0) {
            setAvailableRoles(data.roles);
            setNewRole(data.roles[0]);
          }
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to fetch staff data:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    if (!newEmail || !newPassword) {
      setFormError('Email and Password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole || 'ADMIN',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormSuccess(`Staff account created for ${data.admin.email}`);
        setNewEmail('');
        setNewPassword('');
        setNewRole(availableRoles[0] || 'ADMIN');
        fetchStaffData();
      } else {
        setFormError(data.error || 'Failed to create staff account.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRoleLabel = (role: string) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const superAdmin = admins.find(
    (a) => a.role.toUpperCase() === 'SUPERADMIN' || a.role === 'SuperAdmin'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: '0 0 0.25rem 0' }}>
            Staff
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Manage staff accounts and roles.
          </p>
        </div>

        <button
          onClick={fetchStaffData}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 0.85rem',
            borderRadius: '6px',
            backgroundColor: '#1b1e2c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--text-secondary)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.82rem',
            transition: 'background 0.15s ease',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* SuperAdmin Card */}
      <div style={{
        backgroundColor: '#12141f',
        border: '1px solid rgba(255, 209, 102, 0.2)',
        borderRadius: '10px',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 209, 102, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffd166',
            flexShrink: 0,
          }}>
            <Crown size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.15rem' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>
                Super Admin
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {superAdmin ? (
                <>{superAdmin.email} • Created {new Date(superAdmin.createdAt).toLocaleDateString()}</>
              ) : (
                'No SuperAdmin found. Run: npm run create:superadmin'
              )}
            </div>
          </div>
        </div>

        <span style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          padding: '0.35rem 0.65rem',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          CLI Managed
        </span>
      </div>

      {/* Grid: Form & List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        alignItems: 'start',
      }}>
        {/* Form: Add Staff */}
        <div style={{
          backgroundColor: '#12141f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '1.25rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <UserPlus size={17} style={{ color: 'var(--primary)' }} />
            Add Staff
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Create a new staff account.
          </p>

          {formSuccess && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(6, 214, 160, 0.1)',
              border: '1px solid rgba(6, 214, 160, 0.25)',
              color: '#06d6a0',
              fontSize: '0.8rem',
              marginBottom: '1rem',
            }}>
              <CheckCircle2 size={15} />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 71, 111, 0.1)',
              border: '1px solid rgba(239, 71, 111, 0.25)',
              color: '#ef476f',
              fontSize: '0.8rem',
              marginBottom: '1rem',
            }}>
              <AlertCircle size={15} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="name@whattocook.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem 0.6rem 2.25rem',
                    borderRadius: '6px',
                    backgroundColor: '#0a0b12',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem 0.6rem 2.25rem',
                    borderRadius: '6px',
                    backgroundColor: '#0a0b12',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '6px',
                  backgroundColor: '#0a0b12',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {formatRoleLabel(role)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                padding: '0.7rem',
                borderRadius: '6px',
                backgroundColor: 'var(--primary)',
                border: 'none',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.8 : 1,
                marginTop: '0.25rem',
                transition: 'opacity 0.15s ease',
              }}
            >
              {isSubmitting ? (
                <>
                  <AdminSpinner size={15} color="#ffffff" />
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add Staff</span>
              )}
            </button>
          </form>
        </div>

        {/* List of Staff */}
        <div style={{
          backgroundColor: '#12141f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '1.25rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Shield size={17} style={{ color: 'var(--secondary)' }} />
            All Staff ({admins.length})
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Accounts with portal access.
          </p>

          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2.5rem 1rem',
            }}>
              <AdminSpinner size={22} color="var(--primary)" />
            </div>
          ) : admins.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '2rem' }}>
              No staff found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {admins.map((adm) => {
                const isSuper = adm.role.toUpperCase() === 'SUPERADMIN' || adm.role === 'SuperAdmin';

                return (
                  <div
                    key={adm.id}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: '8px',
                      backgroundColor: '#171a27',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.65rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: isSuper
                          ? 'rgba(255, 209, 102, 0.12)'
                          : 'rgba(0, 180, 216, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSuper ? '#ffd166' : '#00b4d8',
                        flexShrink: 0,
                      }}>
                        {isSuper ? <Crown size={16} /> : <Shield size={16} />}
                      </div>

                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.85rem', color: '#fff' }}>
                          {adm.email}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar size={11} />
                          {new Date(adm.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: isSuper
                        ? 'rgba(255, 209, 102, 0.12)'
                        : 'rgba(0, 180, 216, 0.12)',
                      color: isSuper ? '#ffd166' : '#00b4d8',
                      textTransform: 'uppercase',
                    }}>
                      {adm.role}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
