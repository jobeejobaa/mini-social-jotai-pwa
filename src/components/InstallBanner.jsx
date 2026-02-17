import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  installPromptEventAtom,
  installBannerDismissedAtom,
  lastInstallBannerTriggerAtom,
  shouldShowInstallBannerAtom,
  pageVisitCountAtom,
  postsWrittenCountAtom,
  isPageTrigger,
  isPostsTrigger,
} from '../atoms/pwa';
import './InstallBanner.css';

export default function InstallBanner() {
  const setPromptEvent = useSetAtom(installPromptEventAtom);
  const setDismissed = useSetAtom(installBannerDismissedAtom);
  const setLastTrigger = useSetAtom(lastInstallBannerTriggerAtom);
  const promptEvent = useAtomValue(installPromptEventAtom);
  const shouldShow = useAtomValue(shouldShowInstallBannerAtom);
  const pageVisits = useAtomValue(pageVisitCountAtom);
  const postsWritten = useAtomValue(postsWrittenCountAtom);
  const lastTrigger = useAtomValue(lastInstallBannerTriggerAtom);

  // Capturer l’événement beforeinstallprompt (Chrome, Edge, etc.)
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [setPromptEvent]);

  // Quand on atteint un nouveau seuil (5, 7, 9 pages ou 8, 12 posts), réautoriser l’affichage de la bannière
  useEffect(() => {
    const pageTrigger = isPageTrigger(pageVisits) ? pageVisits : 0;
    const postsTrigger = isPostsTrigger(postsWritten) ? postsWritten : 0;
    const currentTrigger = Math.max(pageTrigger, postsTrigger);
    if (currentTrigger === 0) return;
    if (currentTrigger > lastTrigger) {
      setLastTrigger(currentTrigger);
      setDismissed(false);
    }
  }, [pageVisits, postsWritten, lastTrigger, setLastTrigger, setDismissed]);

  const getCurrentTrigger = () =>
    Math.max(
      isPageTrigger(pageVisits) ? pageVisits : 0,
      isPostsTrigger(postsWritten) ? postsWritten : 0
    );

  const handleInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setDismissed(true);
      setLastTrigger(getCurrentTrigger());
    }
  };

  const handleDismiss = () => {
    setLastTrigger(getCurrentTrigger());
    setDismissed(true);
  };

  if (!shouldShow) return null;

  return (
    <div className="install-banner" role="dialog" aria-label="Installer l’application">
      <p className="install-banner-text">
        Installez Mini Social sur votre appareil pour une meilleure expérience.
      </p>
      <div className="install-banner-actions">
        {promptEvent && (
          <button type="button" className="install-banner-btn install-banner-btn-primary" onClick={handleInstall}>
            Installer
          </button>
        )}
        <button type="button" className="install-banner-btn install-banner-btn-dismiss" onClick={handleDismiss}>
          Plus tard
        </button>
      </div>
    </div>
  );
}
