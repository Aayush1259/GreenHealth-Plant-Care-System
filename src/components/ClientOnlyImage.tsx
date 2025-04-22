'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

export function ClientOnlyImage(props: ImageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial client render before hydration, render a placeholder
  if (!mounted) {
    return (
      <div 
        className={`bg-muted/50 ${props.className || ''}`} 
        style={{ 
          position: 'relative',
          width: '100%', 
          height: '100%',
          overflow: 'hidden' 
        }}
      />
    );
  }

  // After hydration, render the actual image
  return <Image {...props} />;
} 