'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentUserRole } from '@/hooks/useAdminAuth';
import { ExternalLink, Shield } from 'lucide-react';

export default function AdminHeader() {
  const pathname = usePathname();
  const { session, roleDisplayName, isSuperAdmin } = useCurrentUserRole();

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard';
    if (pathname === '/admin/recipes') return 'Recipes';
    if (pathname === '/admin/recipes/import') return 'Import';
    if (pathname === '/admin/recipes/export') return 'Export';
    if (pathname === '/admin/users') return 'Users';
    if (pathname === '/admin/reviews') return 'Reviews';
    if (pathname === '/admin/mealplans') return 'Meal Plans';
    if (pathname === '/admin/taxonomy') return 'Taxonomy';
    if (pathname === '/admin/admins') return 'Staff';
    if (pathname === '/admin/ingredients') return 'Ingredients';
    return 'Admin';
  };

  const adminEmail = session?.user?.email || 'admin@whattocook.com';

  return (
    <header style={{
      height: '60px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      backgroundColor: '#0f111a',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
    }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', margin: 0 }}>
          {getPageTitle()}
        </h1>
      </div>

    </header>
  );
}
