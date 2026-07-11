import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/config/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        fullName: { label: 'Full Name', type: 'text' },
        mobileNumber: { label: 'Mobile Number', type: 'text' },
        dietaryPreference: { label: 'Dietary Preference', type: 'text' },
        isRegistering: { label: 'Is Registering', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error('Email is required');
        }

        const email = credentials.email.toLowerCase().trim();
        const rawPassword = credentials.password;

        // 1. REGISTRATION FLOW
        if (credentials.isRegistering === 'true') {
          // Strict Validation Rules (Production-Grade)
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Please provide a valid email address.');
          }

          if (!rawPassword || rawPassword.length < 6) {
            throw new Error('Password must be at least 6 characters long.');
          }

          const fullName = credentials.fullName?.trim() || '';
          if (!fullName || fullName.length < 2) {
            throw new Error('Full Name must be at least 2 characters long.');
          }

          const mobileNumber = credentials.mobileNumber?.trim() || '';
          if (mobileNumber && !/^\+?[0-9\s\-]{7,15}$/.test(mobileNumber)) {
            throw new Error('Please provide a valid phone number format.');
          }

          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            throw new Error('An account with this email already exists.');
          }

          // Generate secure password hash
          const passwordHash = await bcrypt.hash(rawPassword, 10);

          // Generate a clean secure user ID
          const userId = 'usr_' + crypto.randomUUID();
          
          const newUser = await prisma.user.create({
            data: {
              id: userId,
              fullName,
              email,
              mobileNumber,
              dietaryPreference: credentials.dietaryPreference || 'None',
              passwordHash,
            },
          });

          return {
            id: newUser.id,
            name: newUser.fullName,
            email: newUser.email,
          };
        }

        // 2. LOGIN FLOW
        if (!rawPassword) {
          throw new Error('Password is required.');
        }

        // Check if the user is an admin first
        const admin = await prisma.admin.findUnique({
          where: { email },
        });

        if (admin) {
          const passwordMatch = await bcrypt.compare(rawPassword, admin.passwordHash);
          if (!passwordMatch) {
            throw new Error('Invalid email or password.');
          }
          return {
            id: `admin_${admin.id}`,
            name: 'Admin',
            email: admin.email,
            role: admin.role,
          };
        }

        // Check if the user is a standard user
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error('No account found with this email. Please register first.');
        }

        if (!user.passwordHash) {
          throw new Error('This account was registered using Google. Please sign in with Google.');
        }

        const passwordMatch = await bcrypt.compare(rawPassword, user.passwordHash);
        if (!passwordMatch) {
          throw new Error('Invalid email or password.');
        }

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: 'User',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.image = user.image;
        token.role = (user as any).role || 'User';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id as string;
        (session.user as any).image = token.image as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
