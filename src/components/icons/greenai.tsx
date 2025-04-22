import React from "react";

export const GreenAI = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Bot icon path from Lucide */}
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M12 2a2 2 0 0 0-2 2v7h4V4a2 2 0 0 0-2-2z" />
    <circle cx="8" cy="16" r="1" />
    <circle cx="16" cy="16" r="1" />
  </svg>
);

export default { GreenAI }; 