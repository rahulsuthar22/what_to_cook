import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

/**
 * Derives the authenticated user strictly from server-side session or JWT token.
 * Never trusts client-supplied query params or body fields for identity.
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<AuthContext | null> {
  // 1. Try NextAuth JWT token (works directly with NextRequest in App Router)
  if (request) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (token && token.id) {
        const role = String(token.role || 'User').toUpperCase();
        const isAdmin = role === 'SUPERADMIN' || role === 'ADMIN';
        return {
          userId: String(token.id),
          email: String(token.email || ''),
          role,
          isAdmin,
        };
      }
    } catch (err) {
      // Continue to fallback
    }
  }

  // 2. Fallback to getServerSession
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).id) {
      const role = String((session.user as any).role || 'User').toUpperCase();
      const isAdmin = role === 'SUPERADMIN' || role === 'ADMIN';
      return {
        userId: String((session.user as any).id),
        email: String(session.user.email || ''),
        role,
        isAdmin,
      };
    }
  } catch (err) {
    // Session retrieval error
  }

  return null;
}
