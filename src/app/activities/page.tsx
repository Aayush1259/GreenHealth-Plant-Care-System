"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Shield, MessageSquare, Flower, ArrowLeft, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { BottomNavbar } from '@/components/BottomNavbar';
import { getUserActivities, UserActivity, getTimeAgo } from '@/services/activity-service';

export default function ActivitiesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Load user activities from Firestore
  useEffect(() => {
    if (user) {
      const fetchActivities = async () => {
        setLoadingActivities(true);
        try {
          // Get more activities (20) for the full page
          const userActivities = await getUserActivities(user.uid, 20);
          setActivities(userActivities);
        } catch (error) {
          console.error('Error fetching user activities:', error);
        } finally {
          setLoadingActivities(false);
        }
      };

      fetchActivities();
    } else {
      // Redirect if not logged in
      router.push('/login');
    }
  }, [user, router]);

  // Helper function to get the appropriate icon for an activity
  const getActivityIcon = (activity: UserActivity) => {
    switch(activity.iconType || activity.type) {
      case 'leaf':
      case 'plant_identification':
        return <Leaf className="h-5 w-5 text-emerald-700" />;
      case 'shield':
      case 'disease_detection':
        return <Shield className="h-5 w-5 text-amber-700" />;
      case 'message':
      case 'community_post':
      case 'join_community':
        return <MessageSquare className="h-5 w-5 text-blue-700" />;
      case 'flower':
      case 'garden_add':
        return <Flower className="h-5 w-5 text-primary" />;
      default:
        return <Leaf className="h-5 w-5 text-emerald-700" />;
    }
  };

  // Helper function to get the background color for an activity icon
  const getIconBgColor = (activity: UserActivity) => {
    switch(activity.iconType || activity.type) {
      case 'leaf':
      case 'plant_identification':
        return 'bg-emerald-100';
      case 'shield':
      case 'disease_detection':
        return 'bg-amber-100';
      case 'message':
      case 'community_post':
      case 'join_community':
        return 'bg-blue-100';
      case 'flower':
      case 'garden_add':
        return 'bg-primary/10';
      default:
        return 'bg-emerald-100';
    }
  };

  if (!isLoaded || (user && loadingActivities)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`app-container ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      {/* Header */}
      <header className="app-header">
        <div className="flex items-center">
          <Activity className="h-7 w-7 text-primary mr-2" />
          <h1 className="text-2xl font-bold text-primary">Activity History</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary text-xs font-normal px-2 py-1">
            {activities.length} Activities
          </Badge>
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
        </div>
      </header>

      <section className="mb-6">
        <p className="text-muted-foreground text-sm">
          View your complete plant care activity history.
        </p>
      </section>

      {/* Activities List */}
      <section className="space-y-4 mb-20">
        {activities.length === 0 ? (
          <Card className="border border-primary/20 bg-primary/5">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Activities Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start identifying plants, checking for diseases, or managing your garden to build your activity history.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => router.push('/identify')} variant="outline" size="sm">
                  <Leaf className="h-4 w-4 mr-2" />
                  Identify Plants
                </Button>
                <Button onClick={() => router.push('/disease')} variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Check Diseases
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {activities.map((activity, index) => (
              <Card key={activity.id || index} className="border border-border/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${getIconBgColor(activity)} flex items-center justify-center`}>
                      {getActivityIcon(activity)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{activity.title}</h3>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{getTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </section>

      {/* Bottom Navigation */}
      <BottomNavbar />
    </div>
  );
} 