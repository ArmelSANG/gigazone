import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, BellOff, Volume2, VolumeX, Smartphone, 
  Moon, Sun, Play, Check, X, Settings, ChevronDown
} from 'lucide-react';
import notificationService, { NOTIFICATION_TYPES, SOUNDS, DEFAULT_CONFIG } from '../services/NotificationService';

// =====================================================
// HOOK useNotifications
// =====================================================

export function useNotifications() {
  const [config, setConfig] = useState(notificationService.config);
  
  useEffect(() => {
    const unsubscribe = notificationService.addListener(setConfig);
    return unsubscribe;
  }, []);
  
  const notify = useCallback((type, message, options) => {
    return notificationService.notify(type, message, options);
  }, []);
  
  const success = useCallback((message, options) => notificationService.success(message, options), []);
  const filleul = useCallback((message, options) => notificationService.filleul(message, options), []);
  const commission = useCallback((message, options) => notificationService.commission(message, options), []);
  const tickets = useCallback((message, options) => notificationService.tickets(message, options), []);
  const message = useCallback((msg, options) => notificationService.message(msg, options), []);
  const alert = useCallback((message, options) => notificationService.alert(message, options), []);
  const error = useCallback((message, options) => notificationService.error(message, options), []);
  const info = useCallback((message, options) => notificationService.info(message, options), []);
  
  const updateConfig = useCallback((newConfig) => {
    notificationService.saveConfig(newConfig);
  }, []);
  
  const testSound = useCallback((soundType) => {
    notificationService.testSound(soundType);
  }, []);
  
  const requestPushPermission = useCallback(async () => {
    return notificationService.requestPushPermission();
  }, []);
  
  return {
    config,
    updateConfig,
    notify,
    success,
    filleul,
    commission,
    tickets,
    message,
    alert,
    error,
    info,
    testSound,
    requestPushPermission
  };
}

// =====================================================
// COMPOSANT NotificationSettings
// =====================================================

export function NotificationSettings({ darkMode = true }) {
  const { config, updateConfig, testSound, requestPushPermission } = useNotifications();
  const [pushPermission, setPushPermission] = useState('default');
  const [expanded, setExpanded] = useState(false);
  
  useEffect(() => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);
  
  const bgCard = darkMode ? 'bg-gray-800/50' : 'bg-white';
  const borderCard = darkMode ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const bgInput = darkMode ? 'bg-gray-900' : 'bg-gray-100';
  
  const handlePushToggle = async () => {
    if (!config.pushEnabled) {
      const granted = await requestPushPermission();
      if (granted) {
        updateConfig({ pushEnabled: true });
        setPushPermission('granted');
      }
    } else {
      updateConfig({ pushEnabled: false });
    }
  };
  
  const soundTypes = [
    { key: 'success', label: 'Succès', icon: '✅' },
    { key: 'notification', label: 'Notification', icon: '🔔' },
    { key: 'money', label: 'Argent', icon: '💰' },
    { key: 'celebration', label: 'Célébration', icon: '🎉' },
    { key: 'message', label: 'Message', icon: '💬' },
    { key: 'alert', label: 'Alerte', icon: '⚠️' },
    { key: 'error', label: 'Erreur', icon: '❌' }
  ];
  
  return (
    <div className={`${bgCard} border ${borderCard} rounded-2xl overflow-hidden`}>
      {/* Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-700/30 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h3 className={`font-semibold ${textPrimary}`}>Notifications</h3>
            <p className={`text-sm ${textSecondary}`}>Sons, toasts et push</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle principal */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateConfig({ enabled: !config.enabled });
            }}
            className={`w-12 h-7 rounded-full transition-all duration-300 ${
              config.enabled 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600' 
                : darkMode ? 'bg-gray-700' : 'bg-gray-300'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
              config.enabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <ChevronDown className={`w-5 h-5 ${textSecondary} transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {/* Contenu */}
      {expanded && (
        <div className={`p-4 pt-0 space-y-4 border-t ${borderCard}`}>
          
          {/* Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${textSecondary}`}>Volume</span>
              <span className={`text-sm ${textPrimary}`}>{Math.round(config.volume * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <VolumeX className={`w-4 h-4 ${textSecondary}`} />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.volume}
                onChange={(e) => updateConfig({ volume: parseFloat(e.target.value) })}
                className="flex-1 accent-pink-500"
              />
              <Volume2 className={`w-4 h-4 ${textSecondary}`} />
            </div>
          </div>
          
          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sons */}
            <div 
              className={`p-3 rounded-xl ${bgInput} flex items-center justify-between cursor-pointer`}
              onClick={() => updateConfig({ soundEnabled: !config.soundEnabled })}
            >
              <div className="flex items-center gap-2">
                <Volume2 className={`w-4 h-4 ${config.soundEnabled ? 'text-pink-500' : textSecondary}`} />
                <span className={`text-sm ${textPrimary}`}>Sons</span>
              </div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                config.soundEnabled ? 'bg-pink-500 text-white' : darkMode ? 'bg-gray-700' : 'bg-gray-300'
              }`}>
                {config.soundEnabled && <Check className="w-3 h-3" />}
              </div>
            </div>
            
            {/* Toasts */}
            <div 
              className={`p-3 rounded-xl ${bgInput} flex items-center justify-between cursor-pointer`}
              onClick={() => updateConfig({ toastEnabled: !config.toastEnabled })}
            >
              <div className="flex items-center gap-2">
                <Bell className={`w-4 h-4 ${config.toastEnabled ? 'text-pink-500' : textSecondary}`} />
                <span className={`text-sm ${textPrimary}`}>Toasts</span>
              </div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                config.toastEnabled ? 'bg-pink-500 text-white' : darkMode ? 'bg-gray-700' : 'bg-gray-300'
              }`}>
                {config.toastEnabled && <Check className="w-3 h-3" />}
              </div>
            </div>
            
            {/* Push */}
            <div 
              className={`p-3 rounded-xl ${bgInput} flex items-center justify-between cursor-pointer`}
              onClick={handlePushToggle}
            >
              <div className="flex items-center gap-2">
                <Smartphone className={`w-4 h-4 ${config.pushEnabled ? 'text-pink-500' : textSecondary}`} />
                <span className={`text-sm ${textPrimary}`}>Push</span>
              </div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                config.pushEnabled && pushPermission === 'granted' 
                  ? 'bg-pink-500 text-white' 
                  : darkMode ? 'bg-gray-700' : 'bg-gray-300'
              }`}>
                {config.pushEnabled && pushPermission === 'granted' && <Check className="w-3 h-3" />}
              </div>
            </div>
          </div>
          
          {/* Ne pas déranger */}
          <div className={`p-3 rounded-xl ${bgInput} space-y-3`}>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => updateConfig({ doNotDisturb: !config.doNotDisturb })}
            >
              <div className="flex items-center gap-2">
                <Moon className={`w-4 h-4 ${config.doNotDisturb ? 'text-purple-500' : textSecondary}`} />
                <span className={`text-sm ${textPrimary}`}>Ne pas déranger</span>
              </div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                config.doNotDisturb ? 'bg-purple-500 text-white' : darkMode ? 'bg-gray-700' : 'bg-gray-300'
              }`}>
                {config.doNotDisturb && <Check className="w-3 h-3" />}
              </div>
            </div>
            
            {config.doNotDisturb && (
              <div className="flex items-center gap-2 text-sm">
                <span className={textSecondary}>De</span>
                <input
                  type="time"
                  value={config.doNotDisturbStart}
                  onChange={(e) => updateConfig({ doNotDisturbStart: e.target.value })}
                  className={`px-2 py-1 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border ${borderCard} outline-none`}
                />
                <span className={textSecondary}>à</span>
                <input
                  type="time"
                  value={config.doNotDisturbEnd}
                  onChange={(e) => updateConfig({ doNotDisturbEnd: e.target.value })}
                  className={`px-2 py-1 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border ${borderCard} outline-none`}
                />
              </div>
            )}
          </div>
          
          {/* Sons par type */}
          <div className="space-y-2">
            <span className={`text-sm ${textSecondary}`}>Tester les sons</span>
            <div className="flex flex-wrap gap-2">
              {soundTypes.map(sound => (
                <button
                  key={sound.key}
                  onClick={() => testSound(sound.key)}
                  disabled={!config.soundEnabled}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition ${
                    config.sounds[sound.key] && config.soundEnabled
                      ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 hover:from-pink-500/30 hover:to-purple-500/30'
                      : `${bgInput} ${textSecondary} opacity-50`
                  }`}
                  title={`Jouer le son ${sound.label}`}
                >
                  <span>{sound.icon}</span>
                  <Play className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}

// =====================================================
// COMPOSANT NotificationDemo (pour tester)
// =====================================================

export function NotificationDemo({ darkMode = true }) {
  const { success, filleul, commission, tickets, message, alert, error, info } = useNotifications();
  
  const bgCard = darkMode ? 'bg-gray-800/50' : 'bg-white';
  const borderCard = darkMode ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  
  const demos = [
    { label: 'Succès', icon: '✅', action: () => success('Votre demande a été validée avec succès !') },
    { label: 'Filleul', icon: '🎉', action: () => filleul('Jean Dupont vient de s\'inscrire avec votre code !') },
    { label: 'Commission', icon: '💰', action: () => commission('Vous avez reçu 150 FCFA de commission !') },
    { label: 'Tickets', icon: '🎫', action: () => tickets('Vos 50 tickets sont prêts à télécharger !') },
    { label: 'Message', icon: '💬', action: () => message('Nouveau message du support technique') },
    { label: 'Alerte', icon: '⚠️', action: () => alert('Votre solde de commission est faible') },
    { label: 'Erreur', icon: '❌', action: () => error('Une erreur est survenue, veuillez réessayer') },
    { label: 'Info', icon: 'ℹ️', action: () => info('Une mise à jour est disponible') }
  ];
  
  return (
    <div className={`${bgCard} border ${borderCard} rounded-2xl p-4`}>
      <h3 className={`font-semibold ${textPrimary} mb-3`}>Tester les notifications</h3>
      <div className="flex flex-wrap gap-2">
        {demos.map(demo => (
          <button
            key={demo.label}
            onClick={demo.action}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 hover:from-pink-500/30 hover:to-purple-500/30 transition"
          >
            <span>{demo.icon}</span>
            <span>{demo.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default NotificationSettings;
