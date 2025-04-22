import React, { useEffect } from 'react';
import { auth, db, storage } from '../firebaseConfig';
import ClientWrapper from './wrapper/ClientWrapper';

const Garden = () => {
  // This is a wrapper component to adapt the Next.js page to React Router
  
  // Dynamic import of the actual Garden page component
  const GardenPage = React.lazy(() => import('../app/garden/page'));
  
  useEffect(() => {
    // Add any custom logic needed for the garden page, like authentication checks
    console.log("Garden page mounted");
    
    // Clean up function
    return () => {
      console.log("Garden page unmounted");
    };
  }, []);
  
  return (
    <ClientWrapper>
      <React.Suspense fallback={<div className="flex justify-center items-center h-[80vh]">Loading Garden...</div>}>
        <GardenPage />
      </React.Suspense>
    </ClientWrapper>
  );
};

export default Garden; 