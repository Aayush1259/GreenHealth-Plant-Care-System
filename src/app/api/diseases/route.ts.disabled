import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/diseases - Retrieve all disease checks
export async function GET(request: NextRequest) {
  try {
    const diseaseChecks = await prisma.diseaseCheck.findMany({
      include: {
        plant: {
          select: {
            commonName: true,
            scientificName: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    return NextResponse.json(diseaseChecks);
  } catch (error) {
    console.error('Error fetching disease checks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch disease checks' },
      { status: 500 }
    );
  }
}

// POST /api/diseases - Create a new disease check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      diseaseName,
      confidence,
      severity,
      treatment,
      prevention,
      imageUrl,
      plantId,
      userId,
    } = body;

    // Validate required fields
    if (!plantId || !userId) {
      return NextResponse.json(
        { error: 'Plant ID and user ID are required' },
        { status: 400 }
      );
    }

    // Create new disease check
    const diseaseCheck = await prisma.diseaseCheck.create({
      data: {
        diseaseName,
        confidence,
        severity,
        treatment,
        prevention,
        imageUrl,
        plantId,
        userId,
      },
    });

    return NextResponse.json(diseaseCheck, { status: 201 });
  } catch (error) {
    console.error('Error creating disease check:', error);
    return NextResponse.json(
      { error: 'Failed to create disease check' },
      { status: 500 }
    );
  }
} 