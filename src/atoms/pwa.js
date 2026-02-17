import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

/** Nombre de pages visitées (pour afficher la notif install : à 3, puis toutes les 2) */
export const pageVisitCountAtom = atomWithStorage('mini-social-pwa-page-visits', 0);

/** Nombre de posts écrits par l'utilisateur (notif install tous les 4 posts) */
export const postsWrittenCountAtom = atomWithStorage('mini-social-pwa-posts-written', 0);

/** Événement beforeinstallprompt fourni par le navigateur (null si déjà installé ou non supporté) */
export const installPromptEventAtom = atom(null);

/** true si l'utilisateur a fermé la bannière pour ce "seuil" (on réaffiche au prochain seuil : 5, 7, 9 ou 4, 8 posts) */
export const installBannerDismissedAtom = atomWithStorage('mini-social-pwa-install-dismissed', false);

/** Dernier seuil (pages ou posts) pour lequel on a affiché la bannière → permet de réafficher au prochain seuil */
export const lastInstallBannerTriggerAtom = atomWithStorage('mini-social-pwa-last-trigger', 0);

/** Est-ce un "seuil pages" qui déclenche la notif ? (3, 5, 7, 9...) */
export function isPageTrigger(count) {
  return count >= 3 && (count === 3 || (count - 3) % 2 === 0);
}

/** Est-ce un "seuil posts" qui déclenche la notif ? (4, 8, 12...) */
export function isPostsTrigger(count) {
  return count >= 4 && count % 4 === 0;
}

/**
 * Faut-il afficher la bannière d'installation ?
 * - Après 3 pages visitées, puis toutes les 2 pages (3, 5, 7, 9...)
 * - Ou tous les 4 posts écrits (4, 8, 12...)
 * - Et seulement si l'utilisateur n'a pas déjà dismiss pour ce seuil
 */
export const shouldShowInstallBannerAtom = atom((get) => {
  const dismissed = get(installBannerDismissedAtom);
  const lastTrigger = get(lastInstallBannerTriggerAtom);
  const pageVisits = get(pageVisitCountAtom);
  const postsWritten = get(postsWrittenCountAtom);

  const pageTriggerVal = isPageTrigger(pageVisits) ? pageVisits : 0;
  const postsTriggerVal = isPostsTrigger(postsWritten) ? postsWritten : 0;
  const currentTrigger = Math.max(pageTriggerVal, postsTriggerVal);

  if (currentTrigger === 0) return false;
  if (currentTrigger > lastTrigger) return true;
  return !dismissed;
});
