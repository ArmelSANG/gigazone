import React, { useState, useEffect } from 'react';
import { Download, X, Wifi, Smartphone } from 'lucide-react';

const PWA_PROMPT_KEY = 'wifipro_pwa_last_prompt';
const PROMPT_INTERVAL = 60 * 60 * 1000; // 1 heure en millisecondes

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Vérifier si on est sur une page MikroTik (ne pas afficher)
    const path = window.location.pathname;
    if (path.includes('/mikrotik') || path.includes('/hotspot')) {
      return;
    }

    // Capturer l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Vérifier si on doit afficher le prompt (toutes les heures)
      checkAndShowPrompt();
    };

    // Vérifier périodiquement si on doit afficher le prompt
    const checkAndShowPrompt = () => {
      const lastPrompt = localStorage.getItem(PWA_PROMPT_KEY);
      const now = Date.now();
      
      if (!lastPrompt || (now - parseInt(lastPrompt)) > PROMPT_INTERVAL) {
        setShowPrompt(true);
      }
    };

    // Vérifier immédiatement au chargement
    const savedPrompt = localStorage.getItem(PWA_PROMPT_KEY);
    if (!savedPrompt || (Date.now() - parseInt(savedPrompt)) > PROMPT_INTERVAL) {
      // Si l'événement beforeinstallprompt a déjà été déclenché
      if (deferredPrompt) {
        setShowPrompt(true);
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Vérifier toutes les minutes si on doit afficher
    const interval = setInterval(() => {
      if (deferredPrompt && !isInstalled) {
        checkAndShowPrompt();
      }
    }, 60000); // Vérifier chaque minute

    // Écouter l'installation réussie
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearInterval(interval);
    };
  }, [deferredPrompt, isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Déclencher le prompt d'installation natif
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    // Enregistrer le timestamp
    localStorage.setItem(PWA_PROMPT_KEY, Date.now().toString());
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    // Enregistrer le timestamp pour ne pas réafficher avant 1 heure
    localStorage.setItem(PWA_PROMPT_KEY, Date.now().toString());
    setShowPrompt(false);
  };

  // Ne rien afficher si installé ou pas de prompt disponible
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] animate-slide-up">
      <div className="max-w-md mx-auto bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-pink-500/30 rounded-2xl shadow-2xl shadow-pink-500/20 overflow-hidden">
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Wifi Pro</h3>
              <p className="text-xs text-slate-400">Application officielle</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 rounded-lg hover:bg-slate-700/50 transition text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-4 py-3">
          <p className="text-slate-300 text-sm mb-3">
            📱 Installez l'application pour un accès rapide et une meilleure expérience !
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition shadow-lg"
            >
              <Download className="w-4 h-4" />
              Installer
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 text-slate-400 hover:text-white font-medium rounded-xl hover:bg-slate-700/50 transition"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
      
      {/* Animation CSS */}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}