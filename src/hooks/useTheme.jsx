import React, { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import themeService, { THEME_MODES } from '../services/ThemeService';

// =====================================================
// HOOK useTheme
// =====================================================

export function useTheme() {
  // Initialiser avec les valeurs synchronisées
  const [state, setState] = useState(() => {
    const synced = themeService.sync();
    return {
      theme: synced.theme,
      mode: synced.mode,
      isDark: synced.isDark
    };
  });

  // Synchroniser à chaque mount et lors des changements
  useEffect(() => {
    // Synchroniser immédiatement avec localStorage et appliquer au document
    const synced = themeService.sync();
    setState({
      theme: synced.theme,
      mode: synced.mode,
      isDark: synced.isDark
    });
    
    // S'abonner aux changements futurs
    const unsubscribe = themeService.addListener((data) => {
      setState({
        theme: data.theme,
        mode: data.mode,
        isDark: data.isDark
      });
    });
    
    return unsubscribe;
  }, []);

  const setThemeMode = useCallback((newMode) => {
    themeService.setMode(newMode);
  }, []);

  const toggle = useCallback(() => {
    themeService.toggle();
  }, []);

  const cycle = useCallback(() => {
    themeService.cycle();
  }, []);

  return {
    theme: state.theme,
    mode: state.mode,
    isDark: state.isDark,
    darkMode: state.isDark, // Alias pour compatibilité
    setMode: setThemeMode,
    toggle,
    cycle,
    setDarkMode: (dark) => themeService.setMode(dark ? THEME_MODES.DARK : THEME_MODES.LIGHT),
    getModeIcon: () => themeService.getModeIcon(),
    getModeLabel: () => themeService.getModeLabel()
  };
}

// =====================================================
// COMPOSANT ThemeToggle Simple (icône seule)
// =====================================================

export function ThemeToggle({ className = '' }) {
  const { isDark, mode, cycle } = useTheme();

  const getIcon = () => {
    switch (mode) {
      case THEME_MODES.LIGHT:
        return <Sun className="w-5 h-5" />;
      case THEME_MODES.DARK:
        return <Moon className="w-5 h-5" />;
      case THEME_MODES.AUTO:
        return isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />;
      default:
        return <Sun className="w-5 h-5" />;
    }
  };

  return (
    <button
      onClick={cycle}
      className={`p-2 rounded-lg transition ${
        isDark 
          ? 'bg-gray-800 hover:bg-gray-800 text-white' 
          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
      } ${className}`}
      title={`Mode: ${themeService.getModeLabel()}`}
    >
      {getIcon()}
    </button>
  );
}

// =====================================================
// COMPOSANT ThemeToggleAdvanced (avec menu déroulant)
// =====================================================

export function ThemeToggleAdvanced({ className = '' }) {
  const { isDark, mode, setMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { mode: THEME_MODES.AUTO, icon: <Monitor className="w-4 h-4" />, label: 'Automatique', desc: 'Jour/Nuit (6h-19h)' },
    { mode: THEME_MODES.LIGHT, icon: <Sun className="w-4 h-4" />, label: 'Clair', desc: 'Toujours clair' },
    { mode: THEME_MODES.DARK, icon: <Moon className="w-4 h-4" />, label: 'Sombre', desc: 'Toujours sombre' }
  ];

  const currentOption = options.find(o => o.mode === mode) || options[0];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
          isDark 
            ? 'bg-gray-800 hover:bg-gray-800 text-white' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }`}
      >
        {currentOption.icon}
        <span className="text-sm font-medium hidden sm:inline">{currentOption.label}</span>
      </button>

      {isOpen && (
        <>
          {/* Overlay pour fermer */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Menu */}
          <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg z-50 overflow-hidden ${
            isDark 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}>
            {options.map((option) => (
              <button
                key={option.mode}
                onClick={() => {
                  setMode(option.mode);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                  mode === option.mode
                    ? isDark 
                      ? 'bg-pink-500/20 text-pink-400' 
                      : 'bg-pink-50 text-pink-600'
                    : isDark
                      ? 'hover:bg-gray-800 text-white'
                      : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${
                  mode === option.mode
                    ? 'bg-pink-500/20'
                    : isDark ? 'bg-slate-700' : 'bg-gray-200'
                }`}>
                  {option.icon}
                </div>
                <div>
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {option.desc}
                  </div>
                </div>
                {mode === option.mode && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-pink-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// =====================================================
// COMPOSANT ThemeToggleCompact (3 boutons)
// =====================================================

export function ThemeToggleCompact({ className = '' }) {
  const { isDark, mode, setMode } = useTheme();

  const options = [
    { mode: THEME_MODES.AUTO, icon: <Monitor className="w-4 h-4" />, label: 'Auto' },
    { mode: THEME_MODES.LIGHT, icon: <Sun className="w-4 h-4" />, label: 'Clair' },
    { mode: THEME_MODES.DARK, icon: <Moon className="w-4 h-4" />, label: 'Sombre' }
  ];

  return (
    <div className={`flex gap-1 p-1 rounded-xl ${
      isDark ? 'bg-gray-800' : 'bg-gray-200'
    } ${className}`}>
      {options.map((option) => (
        <button
          key={option.mode}
          onClick={() => setMode(option.mode)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
            mode === option.mode
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
              : isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'
          }`}
          title={option.label}
        >
          {option.icon}
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export default useTheme;
