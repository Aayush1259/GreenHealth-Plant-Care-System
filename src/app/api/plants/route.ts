import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';

// GET /api/plants - Retrieve all plants
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Return plants, either all plants or user's plants if authenticated
    let plants;
    
    if (session?.user?.id) {
      // If user is authenticated, return their plants
      plants = await prisma.plant.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          _count: {
            select: {
              diseaseChecks: true
            }
          }
        }
      });
    } else {
      // For public access or testing, return limited plant data
      plants = await prisma.plant.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          commonName: true,
          scientificName: true,
          imageUrl: true,
          createdAt: true
        }
      });
    }
    
    return NextResponse.json(plants);
  } catch (error: any) {
    console.error('Error fetching plants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plants', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/plants - Create a new plant
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
    const { 
      commonName, 
      scientificName, 
      detailedAnalysis,
      growthHabit,
      lifespan,
      lightRequirements,
      waterRequirements,
      soilPreferences,
      suitableLocations,
      potentialProblems,
      careTips,
      imageUrl 
    } = body;
    
    // Validate required field
    if (!commonName || commonName.trim() === '') {
      return NextResponse.json(
        { error: 'Common name is required' },
        { status: 400 }
      );
    }
    
    // Create plant in database
    const plant = await prisma.plant.create({
      data: {
        commonName,
        scientificName,
        detailedAnalysis,
        growthHabit,
        lifespan,
        lightRequirements,
        waterRequirements,
        soilPreferences,
        suitableLocations,
        potentialProblems,
        careTips,
        imageUrl,
        userId: session.user.id
      }
    });
    
    return NextResponse.json(plant, { status: 201 });
  } catch (error: any) {
    console.error('Error creating plant:', error);
    return NextResponse.json(
      { error: 'Failed to create plant', details: error.message },
      { status: 500 }
    );
  }
} 