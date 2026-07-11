import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, full_name, email, mobile_number, dietary_preference, avatar_url } = body;

    if (!user_id || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: user_id, email' },
        { status: 400 }
      );
    }

    // Production-Grade: Cleanly bypass standard users table synchronization for admin accounts
    if (user_id.startsWith('admin_')) {
      const admin = await prisma.admin.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (admin) {
        return NextResponse.json({
          success: true,
          user: {
            id: user_id,
            fullName: 'Admin',
            email: admin.email,
            mobileNumber: '',
            dietaryPreference: 'None',
            avatarUrl: null,
          },
        });
      }
    }

    const user = await prisma.user.upsert({
      where: { id: user_id },
      update: {
        fullName: full_name || 'User',
        email: email.toLowerCase().trim(),
        mobileNumber: mobile_number || undefined,
        dietaryPreference: dietary_preference || undefined,
        avatarUrl: avatar_url || undefined,
      },
      create: {
        id: user_id,
        fullName: full_name || 'User',
        email: email.toLowerCase().trim(),
        mobileNumber: mobile_number || '',
        dietaryPreference: dietary_preference || 'None',
        avatarUrl: avatar_url || null,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Error in auth sync route:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
