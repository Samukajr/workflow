import { atom } from 'jotai';
import { User } from '@/types';

// Auth store
export const userAtom = atom<User | null>(null);
export const tokenAtom = atom<string | null>(localStorage.getItem('token') || null);
export const isAuthenticatedAtom = atom((get) => !!get(tokenAtom));

// UI store
export const loadingAtom = atom(false);
export const toastAtom = atom<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
