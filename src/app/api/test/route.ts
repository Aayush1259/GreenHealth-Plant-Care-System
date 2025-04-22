import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface TestResult {
  status: 'success' | 'error';
  result?: any;
  error?: string;
}

interface DatabaseTests {
  userCount: TestResult;
  plantCount: TestResult;
  postCount: TestResult;
  sampleUser: TestResult;
  [key: string]: TestResult;
}

export async function GET(req: NextRequest) {
  try {
    // Test database connectivity with multiple queries
    const testResults: {
      status: 'success' | 'partial_success' | 'error';
      timestamp: string;
      databaseTests: DatabaseTests;
    } = {
      status: 'success',
      timestamp: new Date().toISOString(),
      databaseTests: {} as DatabaseTests
    };
    
    // Test 1: Count users
    try {
      const userCount = await prisma.user.count();
      testResults.databaseTests['userCount'] = {
        status: 'success',
        result: userCount
      };
    } catch (error) {
      testResults.databaseTests['userCount'] = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
    
    // Test 2: Count plants
    try {
      const plantCount = await prisma.plant.count();
      testResults.databaseTests['plantCount'] = {
        status: 'success',
        result: plantCount
      };
    } catch (error) {
      testResults.databaseTests['plantCount'] = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
    
    // Test 3: Count community posts
    try {
      const postCount = await prisma.communityPost.count();
      testResults.databaseTests['postCount'] = {
        status: 'success',
        result: postCount
      };
    } catch (error) {
      testResults.databaseTests['postCount'] = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
    
    // Test 4: Get a sample user (without sensitive info)
    try {
      const user = await prisma.user.findFirst({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          _count: {
            select: {
              plants: true,
              diseaseChecks: true,
              posts: true
            }
          }
        }
      });
      
      testResults.databaseTests['sampleUser'] = {
        status: 'success',
        result: user
      };
    } catch (error) {
      testResults.databaseTests['sampleUser'] = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
    
    // Calculate overall status
    const hasErrors = Object.values(testResults.databaseTests).some(
      (test: TestResult) => test.status === 'error'
    );
    
    if (hasErrors) {
      testResults.status = 'partial_success';
    }
    
    return NextResponse.json(testResults);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database test failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 