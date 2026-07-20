import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes, with later classes winning conflicts.
 *
 * This matters more here than in a typical project. The app currently contains
 * class strings like:
 *   "bg-white text-gray-900 border border-border bg-white text-gray-900 bg-bg text-text"
 * — a half-finished token migration where both the old and new colours survive.
 * Plain string concatenation leaves the winner to stylesheet order, which is
 * effectively arbitrary. twMerge resolves conflicts deterministically, so a
 * caller's `className` override always beats the component default.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
