import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const recipeId = parseInt(resolvedParams.id, 10);
    if (isNaN(recipeId)) {
      return NextResponse.json({ success: false, error: 'Invalid recipe ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    const likesCount = await prisma.recipeLike.count({
      where: { recipeId },
    });

    let liked = false;
    if (userId) {
      const userLike = await prisma.recipeLike.findUnique({
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
    const recipeId = parseInt(resolvedParams.id, 10);
    if (isNaN(recipeId)) {
      return NextResponse.json({ success: false, error: 'Invalid recipe ID' }, { status: 400 });
    }

    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ success: false, error: 'user_id is required' }, { status: 400 });
    }

    // Check if user already liked
    const existingLike = await prisma.recipeLike.findUnique({
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
      await prisma.recipeLike.delete({
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
      await prisma.recipeLike.create({
        data: {
          userId: user_id,
          recipeId,
        },
      });
      liked = true;
    }

    const likesCount = await prisma.recipeLike.count({
      where: { recipeId },
    });

    return NextResponse.json({ success: true, liked, likesCount });
  } catch (error: any) {
    console.error('Error toggling recipe like:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
