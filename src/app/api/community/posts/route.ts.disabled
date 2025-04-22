import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
  try {
    // Get all community posts with user info, comments count, and likes count
    const posts = await prisma.communityPost.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    return NextResponse.json(posts);
  } catch (error: any) {
    console.error('Error fetching community posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community posts', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { text, imageUrl } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'Post text is required' },
        { status: 400 }
      );
    }

    // Create the post
    const post = await prisma.communityPost.create({
      data: {
        text,
        imageUrl,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error('Error creating community post:', error);
    return NextResponse.json(
      { error: 'Failed to create community post', details: error.message },
      { status: 500 }
    );
  }
} 