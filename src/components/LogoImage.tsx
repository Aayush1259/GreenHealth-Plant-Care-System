import React from 'react';
import { cn } from '../lib/utils';

export function GreenHealthLogo({ width = 80, height = 80, className = "" }) {
  return (
    <div className={cn(`relative w-[${width}px] h-[${height}px]`, className)}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 512 512"
        width={width} 
        height={height}
      >
        {/* Background rounded square */}
        <rect 
          x="12" 
          y="12" 
          width="488" 
          height="488" 
          rx="80" 
          fill="#064E3B" 
        />
        
        {/* Plant icon */}
        <g fill="#F5F5DC">
          {/* Bottom soil */}
          <path d="M128,415 C128,415 256,445 384,415 L384,445 L128,445 Z" />
          
          {/* Stem */}
          <rect x="250" y="250" width="12" height="165" />
          
          {/* Middle leaf */}
          <path d="M256,162 C256,162 200,212 256,282 C312,212 256,162 256,162 Z" />
          
          {/* Left leaf */}
          <path d="M180,220 C180,220 220,240 240,310 C160,280 180,220 180,220 Z" />
          
          {/* Right leaf */}
          <path d="M332,220 C332,220 292,240 272,310 C352,280 332,220 332,220 Z" />
        </g>
      </svg>
    </div>
  );
}

export function GreenHealthLogoWithText({ width = 240, height = 120, className = "" }) {
  return (
    <div className={cn(`relative w-[${width}px] h-[${height}px]`, className)}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 600 300"
        width={width} 
        height={height}
      >
        {/* Logo */}
        <g transform="translate(20, 20) scale(0.5)">
          {/* Background rounded square */}
          <rect 
            x="12" 
            y="12" 
            width="488" 
            height="488" 
            rx="80" 
            fill="#064E3B" 
          />
          
          {/* Plant icon */}
          <g fill="#F5F5DC">
            {/* Bottom soil */}
            <path d="M128,415 C128,415 256,445 384,415 L384,445 L128,445 Z" />
            
            {/* Stem */}
            <rect x="250" y="250" width="12" height="165" />
            
            {/* Middle leaf */}
            <path d="M256,162 C256,162 200,212 256,282 C312,212 256,162 256,162 Z" />
            
            {/* Left leaf */}
            <path d="M180,220 C180,220 220,240 240,310 C160,280 180,220 180,220 Z" />
            
            {/* Right leaf */}
            <path d="M332,220 C332,220 292,240 272,310 C352,280 332,220 332,220 Z" />
          </g>
        </g>
        
        {/* Text */}
        <g transform="translate(290, 100)">
          <text 
            fill="#064E3B" 
            font-family="Arial, sans-serif" 
            font-weight="700" 
            font-size="56"
            text-anchor="middle"
          >
            GreenHealth
          </text>
          <text 
            fill="#064E3B" 
            font-family="Arial, sans-serif" 
            font-weight="500" 
            font-size="24"
            text-anchor="middle"
            y="40"
          >
            PLANT CARE SYSTEMS
          </text>
        </g>
      </svg>
    </div>
  );
} 