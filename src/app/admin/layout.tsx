'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrentUserRole } from '@/hooks/useAdminAuth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { AdminPageLoader, AdminRouteProgress } from '@/components/admin/AdminLoader';
import { ShieldAlert } from 'lucide-react';

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasAdminAccess, isAuthenticated, isLoading } = useCurrentUserRole();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // If not on login page and finished loading, ensure user is authenticated as an admin
    if (!isLoginPage && !isLoading) {
      if (!isAuthenticated || !hasAdminAccess) {
        router.push('/admin/login');
      }
    }
  }, [isLoginPage, isLoading, isAuthenticated, hasAdminAccess, router]);

  // If on login page, render children directly with the route progress indicator
  if (isLoginPage) {
    return (
      <>
        <AdminRouteProgress />
        {children}
      </>
    );
  }

  // Loading state while checking authentication
  if (isLoading) {
    return (
      <AdminPageLoader
        title="Administrator Control Center"
        subtitle="Verifying administrative privileges & credentials..."
        fullScreen
      />
    );
  }

  // Not authorized fallback (while redirecting)
  if (!isAuthenticated || !hasAdminAccess) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0b10',
        color: '#fff',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <ShieldAlert size={48} style={{ color: '#ef476f' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.9rem' }}>
          This portal is restricted to authorized administrators. Redirecting to administrator login...
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#0b0c13',
      color: 'var(--text-primary)',
    }}>
      <AdminRouteProgress />
      <AdminSidebar />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>
        <AdminHeader />
        <main style={{
          flex: 1,
          padding: '2rem',
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}

