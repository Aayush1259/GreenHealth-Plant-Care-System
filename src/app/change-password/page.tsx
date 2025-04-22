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
import { Home, Lock } from 'lucide-react';
import { BottomNavbar } from '@/components/BottomNavbar';
import { GreenHealthLogo } from '@/components/LogoImage';
import { useAuth } from '@/contexts/AuthContext';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, updatePassword } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Add effect to set isLoaded to true after component mount for smooth transitions
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && isLoaded) {
      router.push('/login');
    }
  }, [user, isLoaded, router]);

  // If user is not authenticated, show loading
  if (!user && isLoaded) {
    return null; // Will redirect due to the effect
  }

  const handleChangePassword = async () => {
    // Validate inputs
    if (!currentPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter your current password.',
      });
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter and confirm your new password.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'New password and confirmation do not match.',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'New password must be at least 6 characters long.',
      });
      return;
    }

    setLoading(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordChanged(true);
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: 'Success',
        description: 'Your password has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Password Change Error',
        description: error.message || 'Failed to change password. Please check your current password.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`app-container ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      <header className="app-header">
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

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-md">
            <CardHeader className="space-y-1 flex flex-col items-center">
              <div className="bg-primary-50 p-3 rounded-full">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl text-center">Change Password</CardTitle>
              <CardDescription className="text-center">
                Update your account password
              </CardDescription>
            </CardHeader>
            
            {!passwordChanged ? (
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  disabled={loading} 
                  onClick={handleChangePassword}
                >
                  {loading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Please wait
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </CardContent>
            ) : (
              <CardContent className="space-y-4 pt-0">
                <div className="p-4 bg-green-50 rounded-md text-green-800 text-center">
                  <Icons.check className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <p>Password changed successfully!</p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => setPasswordChanged(false)}
                >
                  Change Password Again
                </Button>
              </CardContent>
            )}

            <CardFooter className="flex justify-center space-x-4 pt-2">
              <Button 
                variant="link" 
                onClick={() => router.push('/profile')}
                className="text-sm text-primary"
              >
                Back to Profile
              </Button>
              <Button 
                variant="link" 
                onClick={() => router.push('/')}
                className="text-sm text-primary"
              >
                Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      <BottomNavbar />
    </div>
  );
} 