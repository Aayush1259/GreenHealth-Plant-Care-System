"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';

export function BottomNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-border/30 py-2 px-2 z-10">
        <div className="h-14"></div>
      </footer>
    );
  }

  const navItems = [
    { path: '/', label: 'Home', icon: Icons.home },
    { path: '/assistant', label: 'Green AI', icon: Icons.greenAI },
    { path: '/profile', label: 'Profile', icon: Icons.user },
  ];

  return (
    <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-border/30 py-2 px-2 z-10">
      <nav className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const IconComponent = item.icon;

          const iconClass = isActive ? "text-primary" : "text-gray-500";
          const labelClass = isActive ? "text-primary font-medium" : "text-gray-500";
          const buttonClass = isActive ? "text-primary" : "";

          return (
            <Button 
              key={item.path}
              variant="ghost" 
              className={cn(
                "flex flex-col items-center justify-center h-14 w-16 relative",
                buttonClass
              )}
              onClick={() => router.push(item.path)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <IconComponent className={cn("h-5 w-5", iconClass)} />
              <span className={cn("text-xs mt-1", labelClass)}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-primary rounded-t-full" />
              )}
            </Button>
          );
        })}
      </nav>
    </footer>
  );
}
