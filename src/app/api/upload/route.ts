import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary-server';
import { auth } from '@/lib/firebase-admin';

// Flag to indicate development environment
const isDevelopment = process.env.NODE_ENV === 'development';

export async function POST(req: NextRequest) {
  try {
    // Get authorization token from headers
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    // Check authentication
    if (!token) {
      if (isDevelopment) {
        console.warn('⚠️ No auth token provided in development - proceeding anyway');
      } else {
        return NextResponse.json(
          { error: 'Unauthorized: No token provided' },
          { status: 401 }
        );
      }
    }

    let userId = 'dev-user';
    
    if (token) {
      try {
        // Verify Firebase token
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (firebaseError) {
        console.error('Firebase auth error:', firebaseError);
        if (!isDevelopment) {
          return NextResponse.json(
            { error: 'Unauthorized: Invalid token' },
            { status: 401 }
          );
        } else {
          console.warn('⚠️ Firebase auth error in development - proceeding anyway');
        }
      }
    }

    // Parse the request body
    const body = await req.json();
    const { image, folder = 'plant-images' } = body;

    // Validate the image
    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(image, folder);

    if (result.success) {
      return NextResponse.json({
        url: result.url,
        publicId: result.publicId,
        userId
      });
    } else {
      throw new Error('Failed to upload to Cloudinary');
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image', details: error.message },
      { status: 500 }
    );
  }
}

// For deleting images
export async function DELETE(req: NextRequest) {
  try {
    // Get authorization token from headers
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    // Check authentication
    if (!token) {
      if (isDevelopment) {
        console.warn('⚠️ No auth token provided in development - proceeding anyway');
      } else {
        return NextResponse.json(
          { error: 'Unauthorized: No token provided' },
          { status: 401 }
        );
      }
    }

    if (token && !isDevelopment) {
      try {
        // Verify Firebase token
        await auth.verifyIdToken(token);
      } catch (firebaseError) {
        console.error('Firebase auth error:', firebaseError);
        return NextResponse.json(
          { error: 'Unauthorized: Invalid token' },
          { status: 401 }
        );
      }
    }

    // Parse the URL and get the publicId
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    const result = await deleteFromCloudinary(publicId);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      throw new Error('Failed to delete from Cloudinary');
    }
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image', details: error.message },
      { status: 500 }
    );
  }
} 