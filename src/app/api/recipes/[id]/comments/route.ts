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

    const reviews = await prisma.recipeReview.findMany({
      where: { recipeId },
      include: {
        user: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format comments to match frontend model
    const formattedComments = reviews.map(c => {
      const diffMs = Date.now() - new Date(c.createdAt).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      let relativeTime = 'Just now';
      if (diffDays > 0) {
        relativeTime = `${diffDays}d ago`;
      } else if (diffHours > 0) {
        relativeTime = `${diffHours}h ago`;
      } else {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins > 0) relativeTime = `${diffMins}m ago`;
      }

      return {
        id: c.id,
        user: c.user.fullName,
        text: c.comment || '',
        time: relativeTime,
      };
    });

    return NextResponse.json({ success: true, comments: formattedComments });
  } catch (error: any) {
    console.error('Error getting recipe comments:', error);
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
    const { user_id, comment } = body;

    if (!user_id || !comment) {
      return NextResponse.json({ success: false, error: 'user_id and comment fields are required' }, { status: 400 });
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

    // Create a new recipe review / comment
    const newReview = await prisma.recipeReview.create({
      data: {
        userId: user_id,
        recipeId,
        rating: 5,
        comment: comment.trim(),
      },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    const formattedComment = {
      id: newReview.id,
      user: newReview.user.fullName,
      text: newReview.comment || '',
      time: 'Just now',
    };

    return NextResponse.json({ success: true, comment: formattedComment });
  } catch (error: any) {
    console.error('Error posting recipe comment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
