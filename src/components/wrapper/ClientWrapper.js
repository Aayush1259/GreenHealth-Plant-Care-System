'use client';

import React from 'react';

// This component serves as a wrapper for Next.js pages to make them compatible with React Router
const ClientWrapper = ({ children }) => {
  return (
    <div className="next-page-wrapper">
      {children}
    </div>
  );
};

export default ClientWrapper; 