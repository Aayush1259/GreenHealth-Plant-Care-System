"use client";

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Use a more immediate approach rather than waiting for window load
      const registerSW = async () => {
        try {
          // First check if there's an existing registration
          const existingRegistration = await navigator.serviceWorker.getRegistration();
          
          if (existingRegistration?.active) {
            console.log('Service worker already active:', existingRegistration.scope);
            return existingRegistration;
          }
          
          // Register the service worker
          const registration = await navigator.serviceWorker.register('/service-worker.js', { 
            scope: '/' 
          });
          
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Wait for the service worker to be activated if needed
          if (!registration.active) {
            await new Promise<void>((resolve) => {
              if (registration.active) {
                resolve();
                return;
              }
              
              const onStateChange = () => {
                if (registration.active) {
                  if (registration.installing) {
                    registration.installing.removeEventListener('statechange', onStateChange);
                  }
                  resolve();
                }
              };
              
              if (registration.installing) {
                registration.installing.addEventListener('statechange', onStateChange);
              } else {
                // In case we missed the installing phase
                resolve();
              }
            });
            
            console.log('Service worker is now active');
          }
          
          return registration;
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      };
      
      registerSW();
      
      // Handle service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed - page will reload for the new version');
        window.location.reload();
      });
    }
  }, []);

  return null; // This component doesn't render anything
} 