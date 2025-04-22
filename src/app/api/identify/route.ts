import { NextRequest, NextResponse } from 'next/server';
import { serverIdentifyPlant } from '@/ai/flows/identify-plant';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { photoUrl, contentType = 'image/jpeg' } = body;
    
    if (!photoUrl) {
      return NextResponse.json({ error: 'No photo URL provided' }, { status: 400 });
    }
    
    const result = await serverIdentifyPlant(photoUrl, contentType);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in plant identification API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to identify plant',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 