import React, { useState, useEffect } from 'react';
import { 
  Bell, ShoppingCart, UserPlus, FileText, MessageSquare, 
  DollarSign, Check, CheckCheck, Trash2, RefreshCw, Eye,
  Clock, Filter, Key
} from 'lucide-react';
import { supabaseGet, supabasePatch, supabaseDelete } from '../../config/supabase';

const NOTIF_TYPES = {
  nouvelle_commande: { icon: ShoppingCart, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  nouveau_promoteur: { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-500/10' },
  preuve_uploadee: { icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  message_promoteur: { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  demande_retrait: { icon: DollarSign, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  demande_reinitialisation: { icon: Key, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  nouveau_promoteur: { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-500/10' }
};

export default function AdminNotificationsPromo({ darkMode, onUnreadCount }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, nouvelle_commande, etc.

  useEffect(() => {
    loadNotifications();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await supabaseGet('notifications_admin?select=*&order=created_at.desc&limit=100');
    if (data) {
      setNotifications(data);
      // Compter les non lues et informer le parent
      const unread = data.filter(n => !n.lu).length;
      if (onUnreadCount) onUnreadCount(unread);
    }
    setLoading(false);
  };

  const markAsRead = async (id) => {
    await supabasePatch(`notifications_admin?id=eq.${id}`, { 
      lu: true, 
      lu_at: new Date().toISOString() 
    });
    loadNotifications();
  };

  const markAllAsRead = async () => {
    await supabasePatch('notifications_admin?lu=eq.false', { 
      lu: true, 
      lu_at: new Date().toISOString() 
    });
    loadNotifications();
  };

  const deleteNotification = async (id) => {
    if (!confirm('Supprimer cette notification?')) return;
    await supabaseDelete(`notifications_admin?id=eq.${id}`);
    loadNotifications();
  };

  const deleteAllRead = async () => {
    if (!confirm('Supprimer toutes les notifications lues?')) return;
    await supabaseDelete('notifications_admin?lu=eq.true');
    loadNotifications();
  };

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.lu;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.lu).length;

  const cardBg = darkMode ? 'bg-gray-800/50' : 'bg-white';
  const cardBorder = darkMode ? 'border-slate-700' : 'border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className={`${cardBg} border ${cardBorder} rounded-xl p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-pink-500/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />
            </div>
            <div>
              <h2 className={`text-lg sm:text-xl font-bold ${textPrimary}`}>Notifications Promoteurs</h2>
              <p className={`text-sm ${textSecondary}`}>
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={loadNotifications}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition`}
              title="Rafraîchir"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''} ${textSecondary}`} />
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition text-xs sm:text-sm"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tout marquer</span> lu
              </button>
            )}
            
            {notifications.some(n => n.lu) && (
              <button
                onClick={deleteAllRead}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition text-xs sm:text-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Supprimer</span> lues
              </button>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Toutes', count: notifications.length },
            { id: 'unread', label: 'Non lues', count: unreadCount },
            { id: 'nouvelle_commande', label: '🛒 Commandes' },
            { id: 'nouveau_promoteur', label: '👤 Inscriptions' },
            { id: 'message_promoteur', label: '💬 Messages' },
            { id: 'demande_reinitialisation', label: '🔑 Réinit. code' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filter === f.id
                  ? 'bg-pink-500 text-white'
                  : `${darkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'} hover:bg-pink-500/20`
              }`}
            >
              {f.label} {f.count !== undefined && `(${f.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des notifications */}
      <div className="space-y-3">
        {loading && notifications.length === 0 ? (
          <div className={`${cardBg} border ${cardBorder} rounded-xl p-12 text-center`}>
            <RefreshCw className={`w-8 h-8 mx-auto mb-3 ${textSecondary} animate-spin`} />
            <p className={textSecondary}>Chargement...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className={`${cardBg} border ${cardBorder} rounded-xl p-12 text-center`}>
            <Bell className={`w-12 h-12 mx-auto mb-3 ${textSecondary} opacity-50`} />
            <p className={textSecondary}>Aucune notification</p>
          </div>
        ) : (
          filteredNotifications.map(notif => {
            const typeConfig = NOTIF_TYPES[notif.type] || NOTIF_TYPES.nouvelle_commande;
            const Icon = typeConfig.icon;
            
            return (
              <div
                key={notif.id}
                className={`${cardBg} border ${cardBorder} rounded-xl p-4 transition ${
                  !notif.lu ? 'border-l-4 border-l-pink-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${typeConfig.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${typeConfig.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className={`font-semibold ${textPrimary} ${!notif.lu ? 'text-pink-400' : ''}`}>
                          {notif.titre}
                        </h3>
                        <p className={`text-sm ${textSecondary} mt-1`}>
                          {notif.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notif.lu && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-500 transition"
                            title="Marquer comme lu"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-3 mt-2 text-xs ${textSecondary}`}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(notif.created_at)}
                      </span>
                      {notif.lu && (
                        <span className="flex items-center gap-1 text-green-500">
                          <Check className="w-3 h-3" />
                          Lu
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
