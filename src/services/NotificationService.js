// =====================================================
// GIGAZONE - SERVICE DE NOTIFICATIONS PREMIUM
// Sons en base64 + Toasts + Push Notifications
// =====================================================

// Sons en base64 (générés, très légers)
const SOUNDS = {
  // Son de succès - carillon harmonique
  success: 'data:audio/wav;base64,UklGRl4FAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YToFAAB/f39/f39/f4CAgIGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8AAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f39+fXx7enl4d3Z1dHNycXBvbm1sa2ppaGdmZWRjYmFgX15dXFtaWVhXVlVUU1JRUE9OTUxLSklIR0ZFRENCQUBAPz49PDs6OTg3NjU0MzIxMC8uLSwrKikoJyYlJCMiISAfHh0cGxoZGBcWFRQTEhEQDw4NDAsKCQgHBgUEAwIBAP/+/fz7+vn49/b19PPy8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcC/vr28u7q5uLe2tbSzsrGwr66trKuqqainpqWko6KhoJ+enZybmpmYl5aVlJOSkZCPjo2Mi4qJiIeGhYSDgoGAf35+f39/',
  
  // Son de notification - pop moderne
  notification: 'data:audio/wav;base64,UklGRpQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YXADAAB/f4GDhYeJi42PkZOVl5mbnZ+ho6WnqautrK2ur7CxsrO0tbW2t7i5uru8vb6/wMHBwsPExcbGx8jJysvMzc7Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/wABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUFCQkNDREVGR0hJSktMTU5PUFFSUlNUVVZXWFlaW1xdXl5fYGBgYGBfX15dXFtaWVhXVlVUU1JRUUBQTk5NTExLS0pJSEdHRkZFREREQ0JBQUA/Pj08Ozs6OTk4Nzc2NTU0MzMyMjExMC8vLi0tLCsrKikoKCcmJiUkJCMiIiEgIB8eHh0cHBsaGhkYGBcWFhUUFBMSEhEQEA8ODg0MDAsLCgkJCAgHBgYFBAQDAgIBAQAA//7+/fz8+/r6+fj49/b29fT08/Ly8fDw7+7u7ezs6+rq6ejn5+bm5eTk4+Li4eDg39/e3t3c3Nva2tnZ2NjX1tbV1dTU09PS0tHR0NDPz87OzczMy8vKysnJyMjHx8bGxcXExMPDwsLBwcDAv7++vr29vLy7u7q6ubm4uLe3trW1tLSzs7KysbGwsK+vrq6tra2srKurqqqpqaiopqampaSko6OioqGhoKCfn56enZ2cnJubmpmZmJiXl5aWlZWUlJOTkpKRkZCQj4+Ojo2NjIyLi4qKiYmIiIeHhoaFhYSEg4OCgoGBgIB/f35+fX19fHx7e3p6eXl5eHh3d3Z2dXV1dHRzc3JycXFwcHBvb25ubW1tbGxra2pqamppaWhoZ2dnZmZmZWVkZGRjY2NiYmFhYWBgX19fXl5eXV1dXFxcW1tbWlpaWVlZWFhYV1dXVlZWVVVVVFRUU1NTUlJSUVFRUFBQT09PTk5OTU1NTExMS0tLSkpKSUlJSEhIR0dHRkZGRUVFREREQ0NDQkJCQUFBQEBAQEA/',
  
  // Son de cash/argent - pièces
  money: 'data:audio/wav;base64,UklGRkQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSAEAACAf4B/gYCBgoGCg4KDhIOEhYSFhoWGh4aHiIeIiYiJiomKi4qLjIuMjYyNjo2Oj46PkI+QkZCRkpGSk5KTlJOUlZSVlpWWl5aXmJeYmZiZmpmam5qbnJubnJycnZ2dnp6en5+foKCgoaGhoqKio6OjpKSkpaWlpqamp6enpqamp6anp6enpqalpaWkpKOjo6KioaGgoJ+fn56enZ2cnJubmpqZmZiYl5eWlpWVlJSTk5KSkZGQkI+Pjo6NjYyMi4uKiomJiIiHh4aGhYWEhIODgoKBgYCAgH9/fn59fXx8e3t6enl5eHh3d3Z2dXV0dHNzcnJxcXBwb29ubm1tbGxra2pqaWloaGdnZmZlZWRkY2NiYmFhYGBfX15eXV1cXFtbWlpZWVhYV1dWVlVVVFRTU1JSUVFQUFBPTk5NTU1MTEtLS0pKSklJSUhISEdHR0ZGRT8+ODc2NTQzMzIxMTAwLy8uLi0tLCwsKysqKioqKSkpKCgoKCcnJycnJyYmJiYmJicnJycnKCgoKCkpKSkqKisrKywsLS0uLi8vMDAxMTIyMzQ0NTY2Nzg4OTo6Ozw8PT0+Pj9AQEFBQkNDRERFRUZGR0dISElJSkpLS0xMTU1OTk9PUFFRU1RVVldYWVpbXF1eX2BhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX5/gIGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4A==',
  
  // Son de célébration - fanfare courte
  celebration: 'data:audio/wav;base64,UklGRrQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YZAEAACAf4CAgICBgYGCgoKDg4OEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaXl5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWmpqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PExMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4ODh4eHi4uLj4+Pk5OTl5eXm5ubn5+fo6Ojp6enq6urr6+vs7Ozt7e3u7u7v7+/w8PDx8fHy8vLz8/P09PT19fX29vb39/f4+Pj5+fn6+vr7+/v8/Pz9/f3+/v7///8AAAEAAQACAAIABAAEAAUABQAGAAYACAAIAAIACQAJAA0ADQAOABAAEQATABQAFgAYABoAHQAfACEAJAAmACkALAAvADIANQA4ADsAPgBBAEQARwBKAE0AUABTAFYAWQBcAF8AYgBlAGgAawBuAHEAdAB3AHoAfQCAAIMAfwB8AHkAdgBzAHAAbQBqAGcAZABhAF4AWwBYAFUAUgBPAEwASQBGAEMAPwA8ADkANgAzADAALQAqACcAJAAhAB4AGwAYABUAEgAPAAwACQAGAAMA',
  
  // Son de message - bulle chat
  message: 'data:audio/wav;base64,UklGRiQCAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQACAACAf4GCg4WGiImLjI6PkZKUlZeYmpudnqChoqSlp6iqq62ur7GytLW3uLm7vL2/wMHDxMXHyMnKzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/wABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXF1eX2BhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX5/f39+fXx7enl4d3Z1dHNycXBvbm1sa2ppaGdmZWRjYmFgX15dXFtaWVhXVlVUU1JRUE9OTUxLSklIR0ZFRENCQUA/Pj08Ozo5ODc2NTQzMjEwLy4tLCsqKSgnJiUkIyIhIB8eHRwbGhkYFxYVFBMSERAPDg0MCwoJCAcGBQQDAgEA',
  
  // Son d'alerte - attention
  alert: 'data:audio/wav;base64,UklGRpQCAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YXACAAB/f4CAgYGCgoODhISFhYaGh4eIiImJioqLi4yMjY2Ojo+PkJCRkZKSk5OUlJWVlpaXl5iYmZmampubm5ycnZ2enp+foKCgoaGhoqKjo6SkpaWlpqamp6eoqKmpqaqqq6usrK2trq6vr7CwsbGysrOztLS1tba2t7e4uLm5urq7u7y8vb2+vr+/wMDAwcHCwsPDxMTFxcbGx8fIyMnJysrLy8zMzc3Ozs/P0NDR0dLS09PU1NXV1tbX19jY2dna2tvb3Nzd3d7e39/g4OHh4uLj4+Tk5eXm5ufn5+jn5+fm5uXl5OTj4+Li4eHg4N/f3t7d3dzc29va2tnZ2NjX19bW1dXU1NPT0tLR0dDQz8/OzszMy8vKysnJyMjHx8bGxcXExMPDwsLBwcDAv7++vr29vLy7u7q6ubm4uLe3tra1tbS0s7OysrGxsLCvr66ura2srKurqqqpqaioqKenp6ampqWlpKSjo6OioqGhoaCgn5+enp2dnJycm5uampmZmJiXl5aWlZWUlJOTkpKRkZCQj4+Ojo2NjIyLi4qKiYmIiIeHhoaFhYSEg4OCgoGBgIB/fw==',
  
  // Son d'erreur
  error: 'data:audio/wav;base64,UklGRkQCAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSACAAB/f35+fX18fHt7enp5eXh4d3d2dnV1dHRzc3JycXFwcG9vbm5tbWxsa2tqamlpaGhnZ2ZmZWVkZGNjYmJhYWBgX19eXl1dXFxbW1paWVlYWFdXVlZVVVRUU1NSUlFRUFBPT05OTU1MTEtLS0pKSUlISEdHRkZFRURUQ0NCQkFBQEA/Pz4+PT08PDs7Ojo5OTg4Nzc2NjU1NDQzMzIyMTEwMC8vLi4tLSwsKysqKikpKCgnJyYmJSUkJCMjIiIhISAgHx8eHh0dHBwbGxoaGRkYGBcXFhYVFRQUExMSEhEREBAQDw8ODg0NDAwLCwoKCQkICAcHBwYGBQUEBAMDAgIBAQAAAQECAgMDBAQFBQYGBwcICAkJCgoLCwwMDQ0ODg8PEBAREREREhITExQUFRUWFhcXGBgZGRoaGxscHB0dHh4fHyAgISEiIiMjJCQlJSYmJycpKSkqKissLC0tLi4vLzAwMTEyMjMzNDQ1NTY2Nzc4ODk5Ojo7Ozw8PT0+Pj8/'
};

// Configuration par défaut
const DEFAULT_CONFIG = {
  enabled: true,
  volume: 0.7,
  soundEnabled: true,
  toastEnabled: true,
  pushEnabled: false,
  doNotDisturb: false,
  doNotDisturbStart: '22:00',
  doNotDisturbEnd: '08:00',
  sounds: {
    success: true,
    notification: true,
    money: true,
    celebration: true,
    message: true,
    alert: true,
    error: true
  }
};

// Types de notifications
export const NOTIFICATION_TYPES = {
  COMMANDE_VALIDEE: {
    sound: 'success',
    icon: '✅',
    title: 'Demande validée',
    color: 'green'
  },
  NOUVEAU_FILLEUL: {
    sound: 'celebration',
    icon: '🎉',
    title: 'Nouveau filleul',
    color: 'purple'
  },
  COMMISSION_RECUE: {
    sound: 'money',
    icon: '💰',
    title: 'Commission reçue',
    color: 'yellow'
  },
  TICKETS_PRETS: {
    sound: 'success',
    icon: '🎫',
    title: 'Tickets prêts',
    color: 'pink'
  },
  NOUVEAU_MESSAGE: {
    sound: 'message',
    icon: '💬',
    title: 'Nouveau message',
    color: 'blue'
  },
  ALERTE: {
    sound: 'alert',
    icon: '⚠️',
    title: 'Alerte',
    color: 'orange'
  },
  ERREUR: {
    sound: 'error',
    icon: '❌',
    title: 'Erreur',
    color: 'red'
  },
  INFO: {
    sound: 'notification',
    icon: 'ℹ️',
    title: 'Information',
    color: 'blue'
  }
};

class NotificationService {
  constructor() {
    this.config = this.loadConfig();
    this.audioContext = null;
    this.toastContainer = null;
    this.toasts = [];
    this.listeners = [];
  }

  // Charger la configuration
  loadConfig() {
    try {
      const saved = localStorage.getItem('gigazone_notifications_config');
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading notification config:', e);
    }
    return DEFAULT_CONFIG;
  }

  // Sauvegarder la configuration
  saveConfig(config) {
    this.config = { ...this.config, ...config };
    try {
      localStorage.setItem('gigazone_notifications_config', JSON.stringify(this.config));
    } catch (e) {
      console.error('Error saving notification config:', e);
    }
    this.notifyListeners();
  }

  // Ajouter un listener pour les changements de config
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(l => l(this.config));
  }

  // Vérifier si on est en mode Ne Pas Déranger
  isDoNotDisturbActive() {
    if (!this.config.doNotDisturb) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = this.config.doNotDisturbStart.split(':').map(Number);
    const [endH, endM] = this.config.doNotDisturbEnd.split(':').map(Number);
    
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;
    
    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Passage par minuit
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  // Jouer un son
  async playSound(soundType) {
    if (!this.config.enabled || !this.config.soundEnabled) return;
    if (this.isDoNotDisturbActive()) return;
    if (!this.config.sounds[soundType]) return;
    
    try {
      const audio = new Audio(SOUNDS[soundType]);
      audio.volume = this.config.volume;
      await audio.play();
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  }

  // Test d'un son
  async testSound(soundType) {
    try {
      const audio = new Audio(SOUNDS[soundType]);
      audio.volume = this.config.volume;
      await audio.play();
    } catch (e) {
      console.error('Error testing sound:', e);
    }
  }

  // Créer le container des toasts
  createToastContainer() {
    if (this.toastContainer) return;
    
    this.toastContainer = document.createElement('div');
    this.toastContainer.id = 'gigazone-toast-container';
    this.toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
      pointer-events: none;
    `;
    document.body.appendChild(this.toastContainer);
  }

  // Afficher un toast
  showToast(type, message, options = {}) {
    if (!this.config.enabled || !this.config.toastEnabled) return;
    if (this.isDoNotDisturbActive() && !options.force) return;
    
    this.createToastContainer();
    
    const notifType = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.INFO;
    const colors = {
      green: { bg: 'rgba(16, 185, 129, 0.95)', border: '#10B981' },
      purple: { bg: 'rgba(139, 92, 246, 0.95)', border: '#8B5CF6' },
      yellow: { bg: 'rgba(245, 158, 11, 0.95)', border: '#F59E0B' },
      pink: { bg: 'rgba(236, 72, 153, 0.95)', border: '#EC4899' },
      blue: { bg: 'rgba(59, 130, 246, 0.95)', border: '#3B82F6' },
      orange: { bg: 'rgba(249, 115, 22, 0.95)', border: '#F97316' },
      red: { bg: 'rgba(239, 68, 68, 0.95)', border: '#EF4444' }
    };
    
    const color = colors[notifType.color] || colors.blue;
    
    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${color.bg};
      backdrop-filter: blur(10px);
      border: 1px solid ${color.border};
      border-radius: 16px;
      padding: 16px 20px;
      color: white;
      font-family: 'Inter', -apple-system, sans-serif;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      transform: translateX(120%);
      transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s;
      pointer-events: auto;
      cursor: pointer;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      max-width: 100%;
    `;
    
    const iconSpan = document.createElement('span');
    iconSpan.style.cssText = 'font-size: 24px; flex-shrink: 0;';
    iconSpan.textContent = options.icon || notifType.icon;
    
    const content = document.createElement('div');
    content.style.cssText = 'flex: 1; min-width: 0;';
    
    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 600; font-size: 14px; margin-bottom: 4px;';
    title.textContent = options.title || notifType.title;
    
    const msg = document.createElement('div');
    msg.style.cssText = 'font-size: 13px; opacity: 0.9; line-height: 1.4; word-wrap: break-word;';
    msg.textContent = message;
    
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
      background: rgba(255,255,255,0.2);
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 14px;
      transition: background 0.2s;
    `;
    closeBtn.innerHTML = '✕';
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.3)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.2)';
    
    content.appendChild(title);
    content.appendChild(msg);
    toast.appendChild(iconSpan);
    toast.appendChild(content);
    toast.appendChild(closeBtn);
    
    this.toastContainer.appendChild(toast);
    
    // Animation entrée
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });
    
    // Fermeture
    const close = () => {
      toast.style.transform = 'translateX(120%)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    };
    
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      close();
    };
    
    toast.onclick = () => {
      if (options.onClick) options.onClick();
      close();
    };
    
    // Auto-close
    const duration = options.duration || 5000;
    if (duration > 0) {
      setTimeout(close, duration);
    }
    
    return { close };
  }

  // Demander la permission push
  async requestPushPermission() {
    if (!('Notification' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }

  // Envoyer une notification push
  async sendPush(type, message, options = {}) {
    if (!this.config.enabled || !this.config.pushEnabled) return;
    if (this.isDoNotDisturbActive() && !options.force) return;
    
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    
    const notifType = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.INFO;
    
    try {
      const notification = new Notification(options.title || notifType.title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag || `gigazone-${Date.now()}`,
        renotify: options.renotify || false,
        silent: !this.config.soundEnabled
      });
      
      if (options.onClick) {
        notification.onclick = () => {
          window.focus();
          options.onClick();
          notification.close();
        };
      }
      
      // Auto-close
      setTimeout(() => notification.close(), options.duration || 8000);
      
      return notification;
    } catch (e) {
      console.error('Error sending push notification:', e);
    }
  }

  // Méthode principale pour envoyer une notification
  async notify(type, message, options = {}) {
    if (!this.config.enabled) return;
    
    const notifType = NOTIFICATION_TYPES[type];
    if (!notifType) {
      console.warn('Unknown notification type:', type);
      return;
    }
    
    // Jouer le son
    if (this.config.soundEnabled) {
      this.playSound(notifType.sound);
    }
    
    // Afficher le toast
    if (this.config.toastEnabled) {
      this.showToast(type, message, options);
    }
    
    // Envoyer la push si en arrière-plan
    if (this.config.pushEnabled && document.hidden) {
      this.sendPush(type, message, options);
    }
  }

  // Raccourcis pour les types courants
  success(message, options = {}) {
    return this.notify('COMMANDE_VALIDEE', message, options);
  }

  filleul(message, options = {}) {
    return this.notify('NOUVEAU_FILLEUL', message, options);
  }

  commission(message, options = {}) {
    return this.notify('COMMISSION_RECUE', message, options);
  }

  tickets(message, options = {}) {
    return this.notify('TICKETS_PRETS', message, options);
  }

  message(message, options = {}) {
    return this.notify('NOUVEAU_MESSAGE', message, options);
  }

  alert(message, options = {}) {
    return this.notify('ALERTE', message, options);
  }

  error(message, options = {}) {
    return this.notify('ERREUR', message, options);
  }

  info(message, options = {}) {
    return this.notify('INFO', message, options);
  }
}

// Instance singleton
const notificationService = new NotificationService();

export default notificationService;
export { SOUNDS, DEFAULT_CONFIG };
