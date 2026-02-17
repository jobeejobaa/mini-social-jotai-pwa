import { atomWithStorage } from 'jotai/utils';

/** Utilisateur connecté (persisté dans localStorage). null = non connecté. */
export const userAtom = atomWithStorage('mini-social-user', null);
