import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

// Higher-order component to handle authentication for protected routes
const withAuth = (Component) => {
  const WithAuth = (props) => {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }, []);

    if (loading) {
      return <div className="flex items-center justify-center h-screen">Checking authentication...</div>;
    }

    if (!authenticated) {
      return <Navigate to="/login" replace />;
    }

    return <Component {...props} />;
  };

  return WithAuth;
};

export default withAuth; 