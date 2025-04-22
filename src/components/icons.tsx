import React from 'react';
import {
  Check,
  User,
  Bell,
  Home,
  Loader2,
  Bot,
  type LucideIcon,
} from "lucide-react";

import dynamic from 'next/dynamic';
import { Google } from "./icons/google";

// For consistency, directly use the Bot icon without dynamic import
// This ensures the icon is the same everywhere
export type Icon = LucideIcon;

export const Icons = {
  spinner: Loader2,
  check: Check,
  user: User,
  bell: Bell,
  home: Home,
  google: Google,
  greenAI: Bot, // Use the Bot icon directly for greenAI
} as const;

export { Google } from './icons/google';
