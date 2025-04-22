'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Home, ArrowLeft } from 'lucide-react';
import { GreenHealthLogo } from '@/components/LogoImage';
import { useAuth } from '@/contexts/AuthContext';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Add effect to set isLoaded to true after component mount for smooth transitions
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter your email address.',
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
      toast({
        title: 'Success',
        description: 'Password reset email sent. Please check your inbox.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Reset Password Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`app-container ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      <header className="app-header py-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
            <span className="sr-only">Back</span>
          </Button>
          <GreenHealthLogo width={32} height={32} />
          <h1 className="text-2xl font-bold text-primary ml-2">GreenHealth</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <Home className="h-5 w-5" />
            <span className="sr-only">Home</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 mb-8">
        <div className="w-full max-w-md">
          <Card className="shadow-md">
            <CardHeader className="space-y-3 flex flex-col items-center pt-8 pb-6">
              <GreenHealthLogo width={64} height={64} />
              <CardTitle className="text-2xl text-center mt-4">Reset Password</CardTitle>
              <CardDescription className="text-center text-base">
                Enter your email to receive a password reset link
              </CardDescription>
            </CardHeader>
            
            {!resetSent ? (
              <CardContent className="space-y-6 px-6 pt-2">
                <div className="space-y-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="youremail@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full mt-4" 
                  disabled={loading} 
                  onClick={handleResetPassword}
                >
                  {loading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Please wait
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </CardContent>
            ) : (
              <CardContent className="space-y-4 px-6 pt-2">
                <div className="p-6 bg-green-50 rounded-md text-green-800 text-center">
                  <Icons.check className="h-8 w-8 mx-auto mb-3 text-green-600" />
                  <p className="text-base">Reset link sent! Check your email inbox and follow the instructions to reset your password.</p>
                </div>
              </CardContent>
            )}

            <CardFooter className="flex justify-center p-6 border-t">
              <Button 
                variant="link" 
                onClick={() => router.push('/login')}
                className="text-sm text-primary"
              >
                Back to login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      {/* Bottom navbar has been removed */}
    </div>
  );
} 