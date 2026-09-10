import { clsx, type ClassValue } from 'clsx';

// Utility for merging Tailwind classes
// Install clsx: pnpm add clsx
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
