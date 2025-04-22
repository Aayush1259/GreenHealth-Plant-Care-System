'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { Home, HelpCircle, User, Mail } from 'lucide-react';
import { GreenHealthLogo, GreenHealthLogoWithText } from '@/components/LogoImage';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Add effect to set isLoaded to true after component mount for smooth transitions
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter your email and password.',
      });
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      toast({
        title: 'Success',
        description: 'You have successfully signed in.',
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign In Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Passwords do not match.',
      });
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name);
      toast({
        title: 'Success',
        description: 'Your account has been created.',
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: 'Success',
        description: 'You have successfully signed in with Google.',
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google Sign In Error',
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
              <CardTitle className="text-2xl text-center mt-4">Welcome to GreenHealth</CardTitle>
              <CardDescription className="text-center text-base">
                {isSignUp ? 'Create an account to get started' : 'Sign in to your account'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6">
              <Tabs defaultValue="signin" onValueChange={(value) => setIsSignUp(value === 'signup')}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="youremail@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Password</Label>
                      <Button
                        type="button"
                        onClick={() => router.push('/reset-password')}
                        className="text-xs text-primary underline-offset-4 hover:underline"
                        variant="link"
                        size="sm"
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    disabled={loading} 
                    onClick={handleSignIn}
                  >
                    {loading ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Please wait
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="signup" className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="youremail@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    disabled={loading} 
                    onClick={handleSignUp}
                  >
                    {loading ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Creating account
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </Button>
                </TabsContent>
              </Tabs>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
                <Icons.google className="mr-2 h-4 w-4" />
                Google
              </Button>
            </CardContent>
            <CardFooter className="flex justify-center p-6 border-t">
              <p className="px-8 text-center text-sm text-muted-foreground">
                By signing in, you agree to our{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => {/* Add terms page */}}>
                  Terms of Service
                </Button>{" "}
                and{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => {/* Add privacy page */}}>
                  Privacy Policy
                </Button>
                .
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
} 