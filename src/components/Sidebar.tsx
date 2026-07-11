'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSession } from 'next-auth/react';
import { 
  LayoutDashboard, 
  ChefHat, 
  Calendar, 
  ShoppingBag, 
  ShieldAlert, 
  LogOut, 
  UtensilsCrossed,
  User,
  BarChart3,
  Sparkles,
  Menu,
  X,
  Film
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = (session?.user as any)?.role === 'Admin' || (session?.user as any)?.role === 'SuperAdmin';

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'What to Cook?', path: '/recommendations', icon: ChefHat },
    { name: 'Food Reels', path: '/reels', icon: Film },
    { name: 'Meal Planner', path: '/planner', icon: Calendar },
    { name: 'Grocery List', path: '/grocery', icon: ShoppingBag },
    { name: 'Reports & Stats', path: '/reports', icon: BarChart3 },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Future Specs', path: '/future', icon: Sparkles },
    ...(isAdmin ? [{ name: 'Admin Portal', path: '/admin', icon: ShieldAlert }] : []),
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="mobile-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #ff7a45 100%)',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <UtensilsCrossed size={16} />
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            WhatToCook
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Navigation Menu"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header (Desktop) */}
        <div className="sidebar-brand-header" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2.5rem', paddingLeft: '0.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #ff7a45 100%)',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 10px var(--primary-glow)'
          }}>
            <UtensilsCrossed size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.1, background: 'linear-gradient(90deg, #fff 0%, var(--text-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              WhatToCook
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.05em' }}>
              SMART RECIPES
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav style={{ flex: 1 }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path} 
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        {user && (
          <div style={{ 
            marginTop: 'auto', 
            paddingTop: '1.5rem', 
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.displayName} 
                  style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--border-color)', flexShrink: 0 }} 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, var(--primary) 0%, #ff7a45 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 650,
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-display)',
                  flexShrink: 0
                }}>
                  {user.displayName ? user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.displayName}
                  </span>
                  {isAdmin && (
                    <span style={{
                      backgroundColor: 'rgba(255, 90, 54, 0.15)',
                      color: 'var(--primary)',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      padding: '0.07rem 0.35rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      lineHeight: 1
                    }}>
                      Admin
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </span>
              </div>
            </div>
            <button 
              onClick={() => {
                handleLinkClick();
                logout();
              }} 
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
