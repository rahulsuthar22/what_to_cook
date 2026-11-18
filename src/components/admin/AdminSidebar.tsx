'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useCurrentUserRole } from '@/hooks/useAdminAuth';
import { AdminSpinner, startAdminNav } from '@/components/admin/AdminLoader';
import {
  LayoutDashboard,
  ChefHat,
  Users2,
  Users,
  Star,
  Calendar,
  Tag,
  Package,
  ExternalLink,
  LogOut,
  Flame
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { session, roleDisplayName, isSuperAdmin } = useCurrentUserRole();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    startAdminNav();
    await signOut({ callbackUrl: '/admin/login' });
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Recipes', path: '/admin/recipes', icon: ChefHat },
    { name: 'Ingredients', path: '/admin/ingredients', icon: Package },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Reviews', path: '/admin/reviews', icon: Star },
    { name: 'Meal Plans', path: '/admin/mealplans', icon: Calendar },
    { name: 'Taxonomy', path: '/admin/taxonomy', icon: Tag },
    { name: 'Staff', path: '/admin/admins', icon: Users2 },
  ];

  const adminEmail = session?.user?.email || 'admin@whattocook.com';

  return (
    <aside style={{
      width: '240px',
      minWidth: '240px',
      backgroundColor: '#0f111a',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100vh',
      position: 'sticky',
      top: 0,
      padding: '1.25rem 0.85rem',
      zIndex: 40,
    }}>
      {/* Top Branding & Navigation */}
      <div>
        {/* Brand */}
        <Link
          href="/admin"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.45rem 0.65rem',
            marginBottom: '1.5rem',
            textDecoration: 'none'
          }}
        >
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            <Flame size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', lineHeight: 1.2 }}>
              WhatToCook
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Admin
            </div>
          </div>
        </Link>

        {/* Navigation Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'rgba(255, 90, 54, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(255, 90, 54, 0.25)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile & Actions */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        paddingTop: '0.85rem',
      }}>
        {/* Admin info */}
        <div style={{
          padding: '0.6rem 0.75rem',
          borderRadius: '6px',
          backgroundColor: '#161924',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <div style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: isSuperAdmin ? '#ffd166' : 'var(--text-secondary)',
            marginBottom: '0.15rem',
          }}>
            {roleDisplayName}
          </div>
          <div style={{
            fontSize: '0.78rem',
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {adminEmail}
          </div>
        </div>

        {/* Public App link */}
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            transition: 'background 0.15s ease',
          }}
        >
          <span>Public App</span>
          <ExternalLink size={13} style={{ opacity: 0.6 }} />
        </Link>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 500,
            color: '#ef476f',
            backgroundColor: 'transparent',
            border: '1px solid rgba(239, 71, 111, 0.2)',
            cursor: isLoggingOut ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {isLoggingOut ? (
            <>
              <AdminSpinner size={14} color="#ef476f" />
              <span>Signing out...</span>
            </>
          ) : (
            <>
              <LogOut size={14} />
              <span>Sign out</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
