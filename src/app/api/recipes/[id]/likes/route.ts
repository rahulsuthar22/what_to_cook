import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const recipeId = resolvedParams.id;
    if (!recipeId) {
      return NextResponse.json({ success: false, error: 'Invalid recipe ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    const likesCount = await prisma.recipeFavourite.count({
      where: { recipeId },
    });

    let liked = false;
    if (userId) {
      const userLike = await prisma.recipeFavourite.findUnique({
        where: {
          userId_recipeId: {
            userId,
            recipeId,
          },
        },
      });
      liked = !!userLike;
    }

    return NextResponse.json({ success: true, likesCount, liked });
  } catch (error: any) {
    console.error('Error getting recipe likes:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const recipeId = resolvedParams.id;
    if (!recipeId) {
      return NextResponse.json({ success: false, error: 'Invalid recipe ID' }, { status: 400 });
    }

    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ success: false, error: 'user_id is required' }, { status: 400 });
    }

    // Ensure user exists in database to satisfy foreign key constraint
    await prisma.user.upsert({
      where: { id: user_id },
      update: {},
      create: {
        id: user_id,
        fullName: 'User',
        email: `${user_id}@whattocook.app`,
      },
    });

    // Check if user already liked
    const existingLike = await prisma.recipeFavourite.findUnique({
      where: {
        userId_recipeId: {
          userId: user_id,
          recipeId,
        },
      },
    });

    let liked = false;
    if (existingLike) {
      // Unlike
      await prisma.recipeFavourite.delete({
        where: {
          userId_recipeId: {
            userId: user_id,
            recipeId,
          },
        },
      });
      liked = false;
    } else {
      // Like
      await prisma.recipeFavourite.create({
        data: {
          userId: user_id,
          recipeId,
        },
      });
      liked = true;
    }

    const likesCount = await prisma.recipeFavourite.count({
      where: { recipeId },
    });

    return NextResponse.json({ success: true, liked, likesCount });
  } catch (error: any) {
    console.error('Error toggling recipe like:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
