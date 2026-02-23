// =====================================================
// GIGAZONE - SERVICE DE THÈME UNIFIÉ
// Synchronisé entre toutes les pages
// =====================================================

const THEME_KEY = 'gigazone_theme';
const THEME_MODE_KEY = 'gigazone_theme_mode';

// Modes disponibles
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

// Heures pour le mode auto
const AUTO_DARK_START = 19; // 19h
const AUTO_DARK_END = 6;    // 6h

class ThemeService {
  constructor() {
    this.listeners = [];
    this.initialized = false;
    this.init();
  }

  // Initialisation
  init() {
    this.mode = this.loadMode();
    this.currentTheme = this.calculateTheme();
    
    // Appliquer le thème initial au document
    this.applyThemeToDocument();
    this.initialized = true;
    
    // Écouter les changements de localStorage (sync entre onglets)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
      
      // Vérifier le mode auto toutes les minutes
      if (this.mode === THEME_MODES.AUTO) {
        this.startAutoCheck();
      }
    }
  }

  // Synchroniser avec localStorage (appelé à chaque navigation)
  sync() {
    this.mode = this.loadMode();
    this.currentTheme = this.calculateTheme();
    this.applyThemeToDocument();
    return {
      theme: this.currentTheme,
      mode: this.mode,
      isDark: this.currentTheme === 'dark'
    };
  }

  // Appliquer le thème au document HTML
  applyThemeToDocument() {
    if (typeof document === 'undefined') return;
    
    const html = document.documentElement;
    const body = document.body;
    
    if (this.currentTheme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
      if (body) {
        body.classList.add('dark');
        body.classList.remove('light');
        body.style.backgroundColor = '#030712'; // gray-950
        body.style.color = '#f9fafb'; // gray-50
      }
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      if (body) {
        body.classList.remove('dark');
        body.classList.add('light');
        body.style.backgroundColor = '#f9fafb'; // gray-50
        body.style.color = '#111827'; // gray-900
      }
    }
  }

  // Charger le mode depuis localStorage
  loadMode() {
    try {
      const saved = localStorage.getItem(THEME_MODE_KEY);
      if (saved && Object.values(THEME_MODES).includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.error('Error loading theme mode:', e);
    }
    return THEME_MODES.AUTO; // Par défaut: auto
  }

  // Sauvegarder le mode
  saveMode(mode) {
    try {
      localStorage.setItem(THEME_MODE_KEY, mode);
    } catch (e) {
      console.error('Error saving theme mode:', e);
    }
  }

  // Calculer le thème actuel basé sur le mode
  calculateTheme() {
    if (this.mode === THEME_MODES.LIGHT) {
      return 'light';
    }
    if (this.mode === THEME_MODES.DARK) {
      return 'dark';
    }
    // Mode auto: basé sur l'heure
    const hour = new Date().getHours();
    if (hour >= AUTO_DARK_START || hour < AUTO_DARK_END) {
      return 'dark';
    }
    return 'light';
  }

  // Vérifier et mettre à jour le thème (pour mode auto)
  checkAutoTheme() {
    if (this.mode === THEME_MODES.AUTO) {
      const newTheme = this.calculateTheme();
      if (newTheme !== this.currentTheme) {
        this.currentTheme = newTheme;
        this.applyThemeToDocument();
        this.notifyListeners();
      }
    }
  }

  // Démarrer la vérification auto
  startAutoCheck() {
    if (this.autoInterval) {
      clearInterval(this.autoInterval);
    }
    this.autoInterval = setInterval(() => this.checkAutoTheme(), 60000); // Toutes les minutes
  }

  // Arrêter la vérification auto
  stopAutoCheck() {
    if (this.autoInterval) {
      clearInterval(this.autoInterval);
      this.autoInterval = null;
    }
  }

  // Gérer les changements de localStorage (sync entre onglets)
  handleStorageChange(event) {
    if (event.key === THEME_MODE_KEY) {
      this.mode = event.newValue || THEME_MODES.AUTO;
      this.currentTheme = this.calculateTheme();
      this.applyThemeToDocument();
      
      if (this.mode === THEME_MODES.AUTO) {
        this.startAutoCheck();
      } else {
        this.stopAutoCheck();
      }
      
      this.notifyListeners();
    }
  }

  // Obtenir le thème actuel (avec sync)
  getTheme() {
    this.mode = this.loadMode();
    this.currentTheme = this.calculateTheme();
    return this.currentTheme;
  }

  // Obtenir le mode actuel (avec sync)
  getMode() {
    this.mode = this.loadMode();
    this.currentTheme = this.calculateTheme();
    return this.mode;
  }

  // Est-ce que c'est le mode sombre?
  isDark() {
    return this.getTheme() === 'dark';
  }

  // Changer le mode
  setMode(mode) {
    if (!Object.values(THEME_MODES).includes(mode)) {
      console.warn('Invalid theme mode:', mode);
      return;
    }
    
    this.mode = mode;
    this.saveMode(mode);
    this.currentTheme = this.calculateTheme();
    this.applyThemeToDocument();
    
    if (mode === THEME_MODES.AUTO) {
      this.startAutoCheck();
    } else {
      this.stopAutoCheck();
    }
    
    this.notifyListeners();
  }

  // Toggle simple (light <-> dark, sort du mode auto)
  toggle() {
    if (this.currentTheme === 'dark') {
      this.setMode(THEME_MODES.LIGHT);
    } else {
      this.setMode(THEME_MODES.DARK);
    }
  }

  // Cycle: auto -> light -> dark -> auto
  cycle() {
    const modes = [THEME_MODES.AUTO, THEME_MODES.LIGHT, THEME_MODES.DARK];
    const currentIndex = modes.indexOf(this.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.setMode(modes[nextIndex]);
  }

  // Ajouter un listener
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Notifier tous les listeners
  notifyListeners() {
    const data = {
      theme: this.currentTheme,
      mode: this.mode,
      isDark: this.isDark()
    };
    this.listeners.forEach(listener => listener(data));
  }

  // Obtenir l'icône du mode
  getModeIcon() {
    switch (this.mode) {
      case THEME_MODES.LIGHT:
        return '☀️';
      case THEME_MODES.DARK:
        return '🌙';
      case THEME_MODES.AUTO:
        return '🌓';
      default:
        return '🌓';
    }
  }

  // Obtenir le label du mode
  getModeLabel() {
    switch (this.mode) {
      case THEME_MODES.LIGHT:
        return 'Clair';
      case THEME_MODES.DARK:
        return 'Sombre';
      case THEME_MODES.AUTO:
        return 'Auto';
      default:
        return 'Auto';
    }
  }
}

// Instance singleton
const themeService = new ThemeService();

export default themeService;
export { ThemeService };
