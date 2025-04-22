'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Bot } from 'lucide-react';
import { Icons } from '@/components/icons';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Add effect to set isLoaded to true after component mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      toast({
        title: 'Registration Successful',
        description: 'Your account has been created. You can now log in.',
        variant: 'default'
      });

      // Redirect to login page after successful registration
      setTimeout(() => {
        router.push('/login');
      }, 1500); // Small delay to show the success message
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background flex flex-col ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      {/* Header */}
      <header className="flex items-center justify-center relative border-b border-border/30 py-5 px-4">
        <div className="absolute left-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 -ml-2">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
            <span className="sr-only">Back</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-green-600" />
          <h1 className="text-xl font-semibold text-green-700">Create Account</h1>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="text-center pb-2 pt-6">
            <CardTitle className="text-xl text-gray-800">Sign up for an account</CardTitle>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm text-gray-600">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-md border-gray-200 focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm text-gray-600">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-md border-gray-200 focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm text-gray-600">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-md border-gray-200 focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md py-2.5 mt-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> 
                    Creating account...
                  </>
                ) : (
                  <>Sign Up</>
                )}
              </Button>
            </form>
            
            <p className="text-center text-sm mt-8 text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-green-600 hover:text-green-700 hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation has been removed */}
    </div>
  );
} 