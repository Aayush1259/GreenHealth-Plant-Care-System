import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hash } from 'bcrypt';
import { z } from 'zod';

// Schema for validating registration input
const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// In-memory storage for registered users (since PostgreSQL has been removed)
// This is just for demonstration and will be reset when the server restarts
const registeredUsers: any[] = [];

export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json();
    const result = RegisterSchema.safeParse(body);
    
    if (!result.success) {
      const { errors } = result.error;
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }
    
    const { name, email, password } = result.data;
    
    // Check if user already exists in our in-memory storage
    const existingUser = registeredUsers.find(user => user.email === email);
    
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }
    
    // Hash the password
    const hashedPassword = await hash(password, 10);
    
    // Create the user in memory
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    registeredUsers.push(newUser);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json(
      { message: 'User registered successfully', user: userWithoutPassword }, 
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Registration failed', error: error.message }, 
      { status: 500 }
    );
  }
} 