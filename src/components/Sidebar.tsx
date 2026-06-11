'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
  Sparkles
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'What to Cook?', path: '/recommendations', icon: ChefHat },
    { name: 'Meal Planner', path: '/planner', icon: Calendar },
    { name: 'Grocery List', path: '/grocery', icon: ShoppingBag },
    { name: 'Reports & Stats', path: '/reports', icon: BarChart3 },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Future Specs', path: '/future', icon: Sparkles },
    { name: 'Admin Portal', path: '/admin', icon: ShieldAlert },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2.5rem', paddingLeft: '0.5rem' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.displayName}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </span>
          </div>
          <button 
            onClick={logout} 
            className="btn btn-secondary"
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
}
