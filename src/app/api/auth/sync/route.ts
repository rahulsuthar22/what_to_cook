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
            dietary_preference: 'None',
            avatarUrl: null,
          },
        });
      }
    }

    // Upsert User core record (matching current segregated schema)
    const user = await prisma.user.upsert({
      where: { id: user_id },
      update: {
        fullName: full_name || 'User',
        email: email.toLowerCase().trim(),
        mobileNumber: mobile_number || undefined,
        avatarUrl: avatar_url || undefined,
      },
      create: {
        id: user_id,
        fullName: full_name || 'User',
        email: email.toLowerCase().trim(),
        mobileNumber: mobile_number || '',
        avatarUrl: avatar_url || null,
      },
      include: {
        diets: {
          include: {
            diet: true,
          },
        },
      },
    });

    // If dietary_preference is provided, sync with UserDiet relational table
    let activeDiet = 'None';
    if (dietary_preference && dietary_preference !== 'None') {
      const diet = await prisma.diet.findFirst({
        where: {
          name: {
            equals: dietary_preference,
            mode: 'insensitive',
          },
        },
      });

      if (diet) {
        await prisma.userDiet.upsert({
          where: {
            userId_dietId: {
              userId: user.id,
              dietId: diet.id,
            },
          },
          update: {},
          create: {
            userId: user.id,
            dietId: diet.id,
          },
        });
        activeDiet = diet.name;
      }
    } else if (user.diets && user.diets.length > 0) {
      activeDiet = user.diets[0].diet.name;
    }

    // Return backwards-compatible response for frontend components
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        avatarUrl: user.avatarUrl,
        dietaryPreference: activeDiet,
        dietary_preference: activeDiet,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error in auth sync route:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
