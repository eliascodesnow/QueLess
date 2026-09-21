import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Short, human-typeable join codes: "AMB-274" style, used in the public
// join link as an alternative to scanning the QR code.
const PREFIXES = ['AMB', 'AVE', 'BEL', 'CEDAR', 'DUKA', 'ELDO', 'FERN', 'GOLD', 'HAVEN', 'IVY'];

export function generateJoinCode() {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const digits = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${digits}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
