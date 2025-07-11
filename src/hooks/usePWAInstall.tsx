
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Check if app is already installed
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    
    console.log('🔧 PWA Install Status Check:', {
      isInstalled: isAppInstalled,
      displayMode: window.matchMedia('(display-mode: standalone)').matches,
      standalone: (window.navigator as any).standalone,
      referrer: document.referrer
    });
    
    setIsInstalled(isAppInstalled);

    // Don't show prompt if already installed
    if (isAppInstalled) {
      console.log('🔧 PWA already installed, skipping prompt');
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🔧 PWA Install prompt event triggered');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user hasn't dismissed it recently
      const dismissedTime = localStorage.getItem('pwa-install-dismissed-time');
      const now = Date.now();
      
      // Show prompt if never dismissed or dismissed more than 24 hours ago
      if (!dismissedTime || (now - parseInt(dismissedTime)) > oneDay) {
        console.log('🔧 Showing PWA install prompt after delay');
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 2000); // 2 second delay
      } else {
        console.log('🔧 PWA prompt was dismissed recently, not showing');
      }
    };

    const handleAppInstalled = () => {
      console.log('🔧 PWA app successfully installed');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed-time');
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS Safari, show a custom prompt after delay if not installed
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = (window.navigator as any).standalone;
    
    if (isIOS && !isInStandaloneMode) {
      console.log('🔧 iOS detected, showing custom install prompt');
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed-time');
        if (!dismissed || (Date.now() - parseInt(dismissed)) > oneDay) {
          setShowInstallPrompt(true);
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      console.log('🔧 No deferred prompt available, showing manual instructions');
      // For browsers without install prompt, show instructions
      alert('To install this app:\n\n• Chrome/Edge: Click the menu (⋮) and select "Install app"\n• Safari: Click Share button and "Add to Home Screen"');
      return;
    }

    try {
      console.log('🔧 Attempting PWA installation...');
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ PWA installation accepted by user');
      } else {
        console.log('❌ PWA installation declined by user');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('❌ Error during PWA installation:', error);
    }
  };

  const dismissInstallPrompt = () => {
    console.log('🔧 PWA install prompt dismissed by user');
    setShowInstallPrompt(false);
    // Remember dismissal for 24 hours
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
  };

  return {
    canInstall: !!deferredPrompt,
    showInstallPrompt,
    isInstalled,
    installApp,
    dismissInstallPrompt
  };
};
