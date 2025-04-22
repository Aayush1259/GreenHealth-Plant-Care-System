"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Leaf, Shield, MessageSquare, User, HelpCircle, Flower, Download } from 'lucide-react';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Icons} from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge";
import { BottomNavbar } from '@/components/BottomNavbar';
import { GreenHealthLogo, GreenHealthLogoWithText } from '@/components/LogoImage';
import { getUserActivities, UserActivity, getTimeAgo } from '@/services/activity-service';
import ReminderDropdown from '@/components/ReminderDropdown';

const features = [
  {
    title: 'Plant Identification',
    description: 'Identify plant species from an image.',
    href: '/identify',
    icon: Leaf,
    color: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    title: 'Disease Detection',
    description: 'Detect plant diseases from an image.',
    href: '/disease',
    icon: Shield,
    color: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    title: 'Community',
    description: 'Connect with other plant enthusiasts.',
    href: '/community',
    icon: MessageSquare,
    color: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    title: 'My Garden',
    description: 'Track care information and set reminders for your plants.',
    href: '/garden',
    icon: Flower,
    color: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
];

// Plant-themed images for the slider
const images = [
  "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=1470&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470058869958-2a77ade41c02?q=80&w=1470&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1459156212016-c812468e2115?q=80&w=1470&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1530968464165-7a1861cbaf9f?q=80&w=1470&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507746212228-2d3645cbeb56?q=80&w=1470&auto=format&fit=crop",
];

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    setIsLoaded(true);
    const intervalId = setInterval(() => {
      setCurrentImage((prevImage) => (prevImage + 1) % images.length);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (user && hasMounted) {
      const fetchActivities = async () => {
        setLoadingActivities(true);
        try {
          const userActivities = await getUserActivities(user.uid, 5);
          setActivities(userActivities);
        } catch (error) {
          console.error('Error fetching user activities:', error);
        } finally {
          setLoadingActivities(false);
        }
      };
      fetchActivities();
    } else if (!user && hasMounted) {
      setActivities([]);
    }
  }, [user, hasMounted]);

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

  return (
    <div className={`app-container ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      {/* Header */}
      <header className="app-header">
        <div className="flex items-center">
          <GreenHealthLogo width={36} height={36} className="mr-2" />
          <h1 className="text-2xl font-bold text-primary">GreenHealth</h1>
        </div>
        <div className="flex items-center gap-2">
          <ReminderDropdown 
            onAddReminderClick={() => router.push('/garden')}
          />
        </div>
      </header>

      {/* PWA Install Banner */}
      <div className="mb-6 bg-green-50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <Download className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-green-800">Install GreenHealth</h3>
            <p className="text-xs text-green-700">Add to your home screen for better experience</p>
          </div>
        </div>
        <Button 
          size="sm" 
          className="bg-green-600 text-white hover:bg-green-700"
          onClick={() => router.push('/install')}
        >
          Install
        </Button>
      </div>

      {/* Image Slider */}
      <section className="relative h-56 mb-8 rounded-lg overflow-hidden shadow-md">
        {images.map((image, index) => (
          <Image
            key={index}
            src={image}
            alt={`Plant Image ${index + 1}`}
            fill={true}
            sizes="100%"
            priority={index === 0}
            style={{ 
              objectFit: 'cover',
              opacity: currentImage === index ? 1 : 0,
              transition: 'opacity 1s ease-in-out'
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-6 text-white">
          <h2 className="text-2xl font-bold mb-1">Welcome to GreenHealth</h2>
          <p className="text-sm font-medium opacity-90">Your smart companion for plant identification and care</p>
        </div>
        
        {/* Dots for slider navigation */}
        <div className="absolute bottom-2 right-4 flex space-x-1">
          {images.map((_, index) => (
            <button
              key={index}
              aria-label={`View image ${index + 1}`}
              className={`w-2 h-2 rounded-full transition-all ${
                currentImage === index ? 'bg-white scale-125' : 'bg-white/50'
              }`}
              onClick={() => setCurrentImage(index)}
            />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature) => (
            <Link key={feature.title} href={feature.href}>
              <Card className="card-hover border border-border/30 h-full">
                <CardHeader className="pb-2">
                  <div className={`w-10 h-10 rounded-full ${feature.color} flex items-center justify-center mb-2`}>
                    <feature.icon className="feature-icon" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      
      {/* Recent Activity Section */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          {hasMounted && user && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => router.push('/activities')}
            >
              View All
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {!hasMounted ? (
            <div className="text-center text-sm text-muted-foreground p-4">Loading activity...</div>
          ) : !user ? (
            <p className="text-center text-sm text-muted-foreground p-4">
              Login to see your recent activity.
            </p>
          ) : loadingActivities ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : activities.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground p-4">
              No recent activity found.
            </p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-muted/30 rounded-md transition-colors">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getIconBgColor(activity)} flex items-center justify-center`}>
                  {getActivityIcon(activity)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {getTimeAgo(activity.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Bottom Navigation */}
      <BottomNavbar />
    </div>
  );
}
