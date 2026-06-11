import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, full_name, email, mobile_number, dietary_preference } = body;

    if (!user_id || !full_name || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: user_id, full_name, email' },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: { id: user_id },
      update: {
        fullName: full_name,
        email: email,
        mobileNumber: mobile_number || undefined,
        dietaryPreference: dietary_preference || undefined,
      },
      create: {
        id: user_id,
        fullName: full_name,
        email: email,
        mobileNumber: mobile_number || '',
        dietaryPreference: dietary_preference || 'None',
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Error in auth sync route:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
