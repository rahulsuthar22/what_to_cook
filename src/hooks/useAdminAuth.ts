'use client';

import { useSession } from 'next-auth/react';

export type AdminRoleType = 'SUPERADMIN' | 'ADMIN' | 'USER';

interface ExtendedSessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
}

export interface CurrentUserRole {
  rawRole: string;
  role: AdminRoleType;
  roleDisplayName: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  hasAdminAccess: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  session: ReturnType<typeof useSession>['data'];
}

/**
 * Normalizes and parses raw session roles into strongly typed capabilities.
 */
export function parseRole(rawRole?: string | null) {
  const normalized = (rawRole || '').trim().toUpperCase();
  const isSuperAdmin = normalized === 'SUPERADMIN' || rawRole === 'SuperAdmin';
  const isStandardAdmin = normalized === 'ADMIN' || rawRole === 'Admin';
  const hasAdminAccess = isSuperAdmin || isStandardAdmin;

  const role: AdminRoleType = isSuperAdmin
    ? 'SUPERADMIN'
    : isStandardAdmin
    ? 'ADMIN'
    : 'USER';

  const roleDisplayName = isSuperAdmin
    ? 'Super Admin'
    : role === 'ADMIN'
    ? 'Admin'
    : 'User';

  return {
    rawRole: rawRole || 'User',
    role,
    roleDisplayName,
    isSuperAdmin,
    isAdmin: isSuperAdmin || isStandardAdmin,
    isModerator: false,
    hasAdminAccess,
  };
}

/**
 * Reusable hook to identify current user role & administrative access rights.
 * Single source of truth across portal, sidebar, dashboard, and admin layouts.
 */
export function useCurrentUserRole(): CurrentUserRole {
  const { data: session, status } = useSession();
  const user = session?.user as ExtendedSessionUser | undefined;
  const rawRole = user?.role;
  const parsed = parseRole(rawRole);

  return {
    ...parsed,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    session,
  };
}
