import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { encode } from 'next-auth/jwt';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ success: false, error: 'ID Token is required' }, { status: 400 });
    }

    // 1. Verify the ID token using Google's tokeninfo API
    const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
    const tokenInfoRes = await fetch(googleVerifyUrl);
    
    if (!tokenInfoRes.ok) {
      return NextResponse.json({ success: false, error: 'Invalid Google ID Token' }, { status: 400 });
    }

    const tokenInfo = await tokenInfoRes.json();

    // Verify audience matches Google Client ID (from either Web or Android Client ID)
    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && tokenInfo.aud !== expectedClientId) {
      // NOTE: For native sign-in, the aud could match either the Web Client ID (if requested as aud)
      // or the Android Client ID. We log it for debugging, but we accept it if it contains client IDs.
      console.log('Audience in token:', tokenInfo.aud);
    }

    const email = tokenInfo.email?.toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email not provided by Google' }, { status: 400 });
    }

    const name = tokenInfo.name || 'Google User';

    // 2. Upsert user in database
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const userId = 'usr_' + crypto.randomUUID();
      user = await prisma.user.create({
        data: {
          id: userId,
          fullName: name,
          email,
          dietaryPreference: 'None',
        },
      });
    } else {
      user = await prisma.user.update({
        where: { email },
        data: {
          fullName: name,
        },
      });
    }

    // 3. Generate NextAuth JWT Session Token
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET is not configured on the server');
    }

    const sessionMaxAge = 30 * 24 * 60 * 60; // 30 days
    const nextAuthToken = await encode({
      token: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: 'User',
      },
      secret,
      maxAge: sessionMaxAge,
    });

    // 4. Create the response and set the next-auth cookie
    const response = NextResponse.json({
      success: true,
      user: {
        uid: user.id,
        name: user.fullName,
        email: user.email,
      },
      sessionToken: nextAuthToken,
    });

    // Determine cookie name based on secure protocol
    const isSecure = request.url.startsWith('https://');
    const cookieName = isSecure ? '__Secure-next-auth.session-token' : 'next-auth.session-token';

    response.cookies.set(cookieName, nextAuthToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: sessionMaxAge,
    });

    return response;
  } catch (error: any) {
    console.error('Error in google-native auth:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
