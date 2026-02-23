import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Wifi, Home, ShoppingCart, TrendingUp, Gift, FileText, Bell, 
  User, LogOut, Menu, X, Moon, Sun, Plus, ChevronRight, Download,
  Copy, QrCode, Users, DollarSign, Package, Clock, CheckCircle, CheckCheck,
  AlertCircle, Eye, ExternalLink, RefreshCw, Filter, Search,
  Calendar, ArrowUpRight, ArrowDownRight, Sparkles, Award, BarChart3, PieChart, Activity, Wallet
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { supabaseGet, supabasePatch } from '../config/supabase';
import { 
  formatCurrency, formatDate, formatDateShort, getNiveauInfo, 
  generateQRCodeURL, copyToClipboard, statutColors, downloadFile
} from '../utils/helpers';
import ChatWidget from '../components/chat/ChatWidget';
import { NotificationSettings, NotificationDemo, useNotifications } from '../components/NotificationSettings';
import { useTheme, ThemeToggleCompact } from '../hooks/useTheme';
import { usePageSEO, SEO_CONFIGS } from '../hooks/usePageSEO';

// =====================================================
// COMPOSANTS RÉUTILISABLES
// =====================================================

const StatCard = ({ icon: Icon, label, value, subValue, trend, color = 'pink', darkMode = true }) => {
  const colors = {
    pink: { gradient: 'from-pink-500 to-purple-600', lightBg: 'from-pink-50 to-purple-50', lightBorder: 'border-pink-100' },
    green: { gradient: 'from-green-500 to-emerald-600', lightBg: 'from-green-50 to-emerald-50', lightBorder: 'border-green-100' },
    blue: { gradient: 'from-blue-500 to-cyan-600', lightBg: 'from-blue-50 to-cyan-50', lightBorder: 'border-blue-100' },
    orange: { gradient: 'from-orange-500 to-amber-600', lightBg: 'from-orange-50 to-amber-50', lightBorder: 'border-orange-100' }
  };
  
  const colorConfig = colors[color];
  
  return (
    <div className={`rounded-2xl p-5 transition ${
      darkMode 
        ? 'bg-gray-800/50 border border-gray-700 hover:border-gray-600' 
        : `bg-gradient-to-br ${colorConfig.lightBg} border ${colorConfig.lightBorder} shadow-sm hover:shadow-md`
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorConfig.gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{value}</div>
      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
      {subValue && <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{subValue}</div>}
    </div>
  );
};

const CommandeCard = ({ commande, onClick, darkMode = true }) => {
  const statut = statutColors[commande.statut] || statutColors.en_attente;
  
  return (
    <div 
      onClick={onClick}
      className={`rounded-xl p-4 transition cursor-pointer ${
        darkMode 
          ? 'bg-gray-800/50 border border-gray-700 hover:border-pink-500/50' 
          : 'bg-white border border-gray-200 hover:border-pink-300 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{commande.forfait_nom}</div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{commande.quantite} tickets × {formatCurrency(commande.prix_unitaire)}</div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statut.bg} ${statut.text}`}>
          {statut.label}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>{formatDateShort(commande.created_at)}</span>
        <span className="font-semibold text-pink-500">{formatCurrency(commande.net_a_payer)}</span>
      </div>
    </div>
  );
};

const NotificationItem = ({ notif, onRead, darkMode }) => {
  const icons = {
    commission: '💰',
    filleul: '🎉',
    commande: '📦',
    info: 'ℹ️',
    alert: '⚠️'
  };
  
  return (
    <div 
      className={`p-4 rounded-xl border transition cursor-pointer ${
        notif.lu 
          ? darkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200'
          : darkMode ? 'bg-gray-800/50 border-pink-500/30 hover:border-pink-500/50' : 'bg-pink-50/50 border-pink-200 hover:border-pink-300'
      }`}
      onClick={() => !notif.lu && onRead(notif.id)}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icons[notif.type] || '📌'}</span>
        <div className="flex-1">
          <div className={`font-medium ${notif.lu ? darkMode ? 'text-gray-400' : 'text-gray-500' : darkMode ? 'text-white' : 'text-gray-900'}`}>{notif.titre}</div>
          <div className={`text-sm mt-1 ${notif.lu ? darkMode ? 'text-gray-500' : 'text-gray-400' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notif.message}</div>
          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-2`}>{formatDate(notif.created_at)}</div>
        </div>
        {!notif.lu && <div className="w-2 h-2 rounded-full bg-pink-500" />}
      </div>
    </div>
  );
};

// =====================================================
// DASHBOARD PRINCIPAL
// =====================================================

export default function PromoteurDashboard() {
  usePageSEO(SEO_CONFIGS.promoteur);
  const navigate = useNavigate();
  const location = useLocation();
  const { promoteur, logout, refreshPromoteur } = useAuth();
  
  // Thème unifié
  const { isDark: darkMode, toggle: toggleTheme } = useTheme();
  
  // UI States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('accueil');
  const [loading, setLoading] = useState(true);
  
  // Notifications hook
  const { success, filleul: notifyFilleul, commission, tickets, info } = useNotifications();
  
  // Refs pour détecter les changements (nouvelles données)
  const prevDataRef = React.useRef({ commandes: [], filleuls: [], commissions: [] });
  const isFirstLoad = React.useRef(true);
  
  // Data States
  const [commandes, setCommandes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [filleuls, setFilleuls] = useState([]);
  const [commissionsHistory, setCommissionsHistory] = useState([]);
  const [forfaits, setForfaits] = useState([]);
  const [stats, setStats] = useState({
    totalCommandes: 0,
    commandesEnAttente: 0,
    ticketsCrees: 0,
    totalCommissions: 0,
    totalFilleuls: 0,
    demandesMois: 0,
    ticketsMois: 0,
    ticketsMoisDernier: 0,
    valeurTickets: 0,
    valeurTicketsMois: 0,
    valeurTicketsMoisDernier: 0
  });
  
  // Filters
  const [commandeFilter, setCommandeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Modals
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Navigation tabs - defined after unreadCount below

  // Charger les données
  useEffect(() => {
    if (promoteur) {
      loadAllData();
    }
  }, [promoteur]);
  
  // Auto-refresh toutes les 30 secondes pour les notifications en temps réel
  useEffect(() => {
    if (!promoteur) return;
    const interval = setInterval(() => {
      loadAllData();
    }, 30000);
    return () => clearInterval(interval);
  }, [promoteur]);

  const loadAllData = async () => {
    setLoading(true);
    
    // Charger toutes les données en parallèle
    const [commandesData, notificationsData, filleulsData, commissionsData, forfaitsData] = await Promise.all([
      supabaseGet(`commandes_promoteurs?promoteur_id=eq.${promoteur.id}&select=*&order=created_at.desc`),
      supabaseGet(`notifications_promoteurs?promoteur_id=eq.${promoteur.id}&select=*&order=created_at.desc&limit=50`),
      supabaseGet(`promoteurs?parrain_id=eq.${promoteur.id}&select=id,nom_complet,created_at,total_commandes`),
      supabaseGet(`commissions_historique?promoteur_id=eq.${promoteur.id}&select=*&order=created_at.desc&limit=50`),
      supabaseGet('packages?select=*&order=price.asc')
    ]);
    
    // Détecter les changements et notifier (sauf au premier chargement)
    if (!isFirstLoad.current && commandesData && filleulsData && commissionsData) {
      const prev = prevDataRef.current;
      
      // Nouvelles commandes validées
      const newValidees = commandesData.filter(c => 
        c.statut === 'validee' && 
        !prev.commandes.find(pc => pc.id === c.id && pc.statut === 'validee')
      );
      newValidees.forEach(cmd => {
        success(`Demande #${cmd.id} validée ! ${cmd.quantite} tickets prêts.`);
      });
      
      // Nouveaux tickets prêts à télécharger
      const newWithPdf = commandesData.filter(c => 
        c.pdf_url && !prev.commandes.find(pc => pc.id === c.id && pc.pdf_url)
      );
      newWithPdf.forEach(cmd => {
        if (!newValidees.find(v => v.id === cmd.id)) {
          tickets(`${cmd.quantite} tickets prêts à télécharger !`);
        }
      });
      
      // Nouveaux filleuls
      const newFilleuls = filleulsData.filter(f => 
        !prev.filleuls.find(pf => pf.id === f.id)
      );
      newFilleuls.forEach(f => {
        notifyFilleul(`${f.nom_complet} vient de rejoindre votre équipe !`);
      });
      
      // Nouvelles commissions
      const newCommissions = commissionsData.filter(c => 
        !prev.commissions.find(pc => pc.id === c.id)
      );
      newCommissions.forEach(comm => {
        if (comm.type === 'gagnee') {
          commission(`+${comm.montant} FCFA de commission !`);
        }
      });
    }
    
    // Mettre à jour les refs pour la prochaine comparaison
    prevDataRef.current = {
      commandes: commandesData || [],
      filleuls: filleulsData || [],
      commissions: commissionsData || []
    };
    isFirstLoad.current = false;
    
    // Mettre à jour les states
    if (commandesData) setCommandes(commandesData);
    if (notificationsData) setNotifications(notificationsData);
    if (filleulsData) setFilleuls(filleulsData);
    if (commissionsData) setCommissionsHistory(commissionsData);
    if (forfaitsData) setForfaits(forfaitsData);
    
    // Calculer stats avec les données fraîches
    calculateStats(commandesData || [], filleulsData || []);
    
    setLoading(false);
  };

  const loadCommandes = async () => {
    const data = await supabaseGet(
      `commandes_promoteurs?promoteur_id=eq.${promoteur.id}&select=*&order=created_at.desc`
    );
    if (data) {
      setCommandes(data);
      calculateStats(data, filleuls);
    }
  };

  const loadNotifications = async () => {
    const data = await supabaseGet(
      `notifications_promoteurs?promoteur_id=eq.${promoteur.id}&select=*&order=created_at.desc&limit=50`
    );
    if (data) setNotifications(data);
  };

  const loadFilleuls = async () => {
    const data = await supabaseGet(
      `promoteurs?parrain_id=eq.${promoteur.id}&select=id,nom_complet,created_at,total_commandes`
    );
    if (data) setFilleuls(data);
  };

  const loadCommissions = async () => {
    const data = await supabaseGet(
      `commissions_historique?promoteur_id=eq.${promoteur.id}&select=*&order=created_at.desc&limit=50`
    );
    if (data) setCommissionsHistory(data);
  };

  const loadForfaits = async () => {
    const data = await supabaseGet('packages?select=*&order=price.asc');
    if (data) setForfaits(data);
  };

  const calculateStats = (commandesData = [], filleulsData = []) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const cmds = commandesData.length > 0 ? commandesData : commandes;
    const fils = filleulsData.length > 0 ? filleulsData : filleuls;
    
    const demandesValidees = cmds.filter(c => c.statut === 'validee');
    const demandesMois = demandesValidees.filter(c => new Date(c.created_at) >= startOfMonth);
    const demandesMoisDernier = demandesValidees.filter(c => {
      const date = new Date(c.created_at);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    });
    
    // Calculer le nombre total de tickets créés
    const ticketsCrees = demandesValidees.reduce((sum, c) => sum + (c.quantite || 0), 0);
    const ticketsMois = demandesMois.reduce((sum, c) => sum + (c.quantite || 0), 0);
    const ticketsMoisDernier = demandesMoisDernier.reduce((sum, c) => sum + (c.quantite || 0), 0);
    
    // Calculer la valeur des tickets (total_brut = valeur des tickets)
    const valeurTickets = demandesValidees.reduce((sum, c) => sum + (c.total_brut || 0), 0);
    const valeurTicketsMois = demandesMois.reduce((sum, c) => sum + (c.total_brut || 0), 0);
    const valeurTicketsMoisDernier = demandesMoisDernier.reduce((sum, c) => sum + (c.total_brut || 0), 0);
    
    setStats({
      totalCommandes: cmds.length,
      commandesEnAttente: cmds.filter(c => c.statut === 'en_attente').length,
      ticketsCrees,
      totalCommissions: promoteur?.total_commission_gagnee || 0,
      totalFilleuls: fils.length,
      demandesMois: demandesMois.length,
      ticketsMois,
      ticketsMoisDernier,
      valeurTickets,
      valeurTicketsMois,
      valeurTicketsMoisDernier
    });
  };

  // Marquer notification comme lue
  const markAsRead = async (notifId) => {
    await supabasePatch(`notifications_promoteurs?id=eq.${notifId}`, { 
      lu: true, 
      lu_at: new Date().toISOString() 
    });
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, lu: true } : n));
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    await supabasePatch(`notifications_promoteurs?promoteur_id=eq.${promoteur.id}&lu=eq.false`, { 
      lu: true, 
      lu_at: new Date().toISOString() 
    });
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
  };

  // Copier code parrainage
  const handleCopyCode = async () => {
    await copyToClipboard(promoteur.code_parrainage);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Filtrer commandes
  const filteredCommandes = useMemo(() => {
    let result = [...commandes];
    
    if (commandeFilter !== 'all') {
      result = result.filter(c => c.statut === commandeFilter);
    }
    
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      if (dateFilter === 'week') filterDate.setDate(now.getDate() - 7);
      if (dateFilter === 'month') filterDate.setMonth(now.getMonth() - 1);
      if (dateFilter === '3months') filterDate.setMonth(now.getMonth() - 3);
      result = result.filter(c => new Date(c.created_at) >= filterDate);
    }
    
    return result;
  }, [commandes, commandeFilter, dateFilter]);

  // Notifications non lues
  const unreadCount = notifications.filter(n => !n.lu).length;

  // Navigation tabs
  const tabs = [
    { id: 'accueil', label: 'Accueil', icon: Home },
    { id: 'commandes', label: 'Mes Demandes', icon: ShoppingCart, badge: stats.commandesEnAttente },
    { id: 'statistiques', label: 'Statistiques', icon: TrendingUp },
    { id: 'parrainage', label: 'Parrainage', icon: Gift },
    { id: 'fichiers', label: 'Mes fichiers', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'profil', label: 'Mon profil', icon: User }
  ];

  // Niveau info
  const niveauInfo = getNiveauInfo(promoteur?.niveau);

  // Déconnexion
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!promoteur) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // =====================================================
  // RENDU DES SECTIONS
  // =====================================================

  const renderAccueil = () => (
    <div className="space-y-6">
      {/* Header bienvenue */}
      <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
              Bienvenue, {promoteur.nom_complet.split(' ')[0]} ! 👋
            </h2>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Voici un aperçu de votre activité</p>
          </div>
          <div className={`px-4 py-2 rounded-xl ${niveauInfo.bg} flex items-center gap-2`}>
            <span className="text-2xl">{niveauInfo.icon}</span>
            <div>
              <div className={`font-semibold ${niveauInfo.color}`}>{niveauInfo.label}</div>
              {niveauInfo.bonus && <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{niveauInfo.bonus} bonus</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={ShoppingCart} 
          label="Demandes validées" 
          value={commandes.filter(c => c.statut === 'validee').length}
          subValue={`${stats.commandesEnAttente} en attente`}
          color="pink"
          darkMode={darkMode}
        />
        <StatCard 
          icon={Package} 
          label="Tickets créés" 
          value={stats.ticketsCrees}
          subValue={`${stats.ticketsMois} ce mois`}
          color="green"
          darkMode={darkMode}
        />
        <StatCard 
          icon={DollarSign} 
          label="Solde commission" 
          value={formatCurrency(promoteur.solde_commission)}
          subValue="Utilisable sur prochaine demande"
          color="blue"
          darkMode={darkMode}
        />
        <StatCard 
          icon={Users} 
          label="Filleuls actifs" 
          value={stats.totalFilleuls}
          subValue={`${formatCurrency(stats.totalCommissions)} gagnés`}
          color="blue"
          darkMode={darkMode}
        />
      </div>

      {/* Stats valeur des tickets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`rounded-2xl p-6 transition ${
          darkMode 
            ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20' 
            : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
              darkMode ? 'bg-emerald-500/20' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
            }`}>
              <Wallet className={`w-6 h-6 ${darkMode ? 'text-emerald-400' : 'text-white'}`} />
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              darkMode ? 'text-emerald-400 bg-emerald-500/20' : 'text-emerald-600 bg-emerald-100'
            }`}>Total</span>
          </div>
          <div className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(stats.valeurTickets)}</div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Valeur totale des tickets</div>
          <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-emerald-500/20' : 'border-emerald-200'}`}>
            <div className="flex justify-between text-sm">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Ce mois</span>
              <span className={`font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatCurrency(stats.valeurTicketsMois)}</span>
            </div>
          </div>
        </div>
        
        <div className={`rounded-2xl p-6 transition ${
          darkMode 
            ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20' 
            : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
              darkMode ? 'bg-amber-500/20' : 'bg-gradient-to-br from-amber-500 to-orange-600'
            }`}>
              <Calendar className={`w-6 h-6 ${darkMode ? 'text-amber-400' : 'text-white'}`} />
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              darkMode ? 'text-amber-400 bg-amber-500/20' : 'text-amber-600 bg-amber-100'
            }`}>Mois dernier</span>
          </div>
          <div className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.ticketsMoisDernier} tickets</div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Créés le mois dernier</div>
          <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-amber-500/20' : 'border-amber-200'}`}>
            <div className="flex justify-between text-sm">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Valeur</span>
              <span className={`font-medium ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>{formatCurrency(stats.valeurTicketsMoisDernier)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/promoteur/nouvelle-commande')}
          className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-6 text-left hover:shadow-xl hover:shadow-pink-500/20 transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
              <Plus className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">Nouvelle demande</div>
              <div className="text-white/70">Créer des tickets WiFi</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('parrainage')}
          className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200 shadow-sm'} border rounded-2xl p-6 text-left hover:border-pink-500/50 transition group`}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center group-hover:scale-110 transition">
              <Gift className="w-7 h-7 text-orange-400" />
            </div>
            <div>
              <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Parrainer</div>
              <div className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Code : <span className="font-mono text-pink-400">{promoteur.code_parrainage}</span></div>
            </div>
          </div>
        </button>
      </div>

      {/* Dernières demandes */}
      <div className={`${darkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dernières demandes</h3>
          <button 
            onClick={() => setActiveTab('commandes')}
            className="text-pink-400 text-sm hover:text-pink-300 flex items-center gap-1"
          >
            Voir tout <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        {commandes.length === 0 ? (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune demande pour le moment</p>
            <button 
              onClick={() => navigate('/promoteur/nouvelle-commande')}
              className="mt-4 text-pink-400 hover:text-pink-300"
            >
              Créer ma première demande →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {commandes.slice(0, 3).map(cmd => (
              <CommandeCard 
                key={cmd.id} 
                commande={cmd} 
                onClick={() => setSelectedCommande(cmd)}
                darkMode={darkMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCommandes = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Mes demandes</h2>
        <button
          onClick={() => navigate('/promoteur/nouvelle-commande')}
          className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouvelle demande
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <select
          value={commandeFilter}
          onChange={(e) => setCommandeFilter(e.target.value)}
          className={`px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} outline-none focus:border-pink-500`}
        >
          <option value="all">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="validee">Validées</option>
          <option value="refusee">Refusées</option>
        </select>
        
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={`px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} outline-none focus:border-pink-500`}
        >
          <option value="all">Toutes les dates</option>
          <option value="week">7 derniers jours</option>
          <option value="month">30 derniers jours</option>
          <option value="3months">3 derniers mois</option>
        </select>
      </div>

      {/* Liste */}
      {filteredCommandes.length === 0 ? (
        <div className={`${darkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-2xl p-12 text-center`}>
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Aucune demande trouvée</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCommandes.map(cmd => (
            <div 
              key={cmd.id}
              className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200 shadow-sm'} border rounded-xl p-5 hover:border-pink-500/50 transition cursor-pointer`}
              onClick={() => setSelectedCommande(cmd)}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                    <Package className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{cmd.forfait_nom}</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {cmd.quantite} tickets × {formatCurrency(cmd.prix_unitaire)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(cmd.net_a_payer)}</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Frais de service</div>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-sm font-medium ${statutColors[cmd.statut].bg} ${statutColors[cmd.statut].text}`}>
                    {statutColors[cmd.statut].label}
                  </span>
                </div>
              </div>
              
              <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <span>{formatDate(cmd.created_at)}</span>
                {cmd.fichier_tickets_url && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(cmd.fichier_tickets_url, `tickets-${cmd.id}.pdf`);
                    }}
                    className="text-pink-400 hover:text-pink-300 flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" /> Télécharger tickets
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStatistiques = () => {
    // Préparer les données pour les graphiques
    const demandesValidees = commandes.filter(c => c.statut === 'validee');
    
    // Données pour graphique d'évolution (7 derniers jours)
    const getLast7DaysData = () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStr = date.toLocaleDateString('fr-FR', { weekday: 'short' });
        const dateStr = date.toISOString().split('T')[0];
        
        const dayDemandes = demandesValidees.filter(c => 
          c.created_at?.startsWith(dateStr)
        );
        
        days.push({
          day: dayStr,
          demandes: dayDemandes.length,
          tickets: dayDemandes.reduce((sum, c) => sum + (c.quantite || 0), 0)
        });
      }
      return days;
    };
    
    // Données pour graphique camembert (répartition par forfait)
    const getForfaitData = () => {
      const forfaitMap = {};
      demandesValidees.forEach(c => {
        const nom = c.forfait_nom || 'Autre';
        forfaitMap[nom] = (forfaitMap[nom] || 0) + c.quantite;
      });
      return Object.entries(forfaitMap).map(([name, value]) => ({ name, value }));
    };
    
    const COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
    const evolutionData = getLast7DaysData();
    const forfaitData = getForfaitData();
    
    return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>📊 Statistiques</h2>
        <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <Activity className="w-4 h-4" />
          Mis à jour en temps réel
        </div>
      </div>

      {/* Stats cards premium */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-2xl p-5 ${
          darkMode 
            ? 'bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20' 
            : 'bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 shadow-sm'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-pink-500/20' : 'bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg'}`}>
              <ShoppingCart className={`w-5 h-5 ${darkMode ? 'text-pink-400' : 'text-white'}`} />
            </div>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total demandes</span>
          </div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{commandes.length}</div>
          <div className={`text-sm mt-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            {demandesValidees.length} validées
          </div>
        </div>
        
        <div className={`rounded-2xl p-5 ${
          darkMode 
            ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20' 
            : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 shadow-sm'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-green-500/20' : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg'}`}>
              <Package className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-white'}`} />
            </div>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tickets créés</span>
          </div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.ticketsCrees}</div>
          <div className={`text-sm mt-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            +{stats.ticketsMois} ce mois
          </div>
        </div>
        
        <div className={`rounded-2xl p-5 ${
          darkMode 
            ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20' 
            : 'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 shadow-sm'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-blue-500/20' : 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg'}`}>
              <DollarSign className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-white'}`} />
            </div>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Commissions</span>
          </div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(promoteur.total_commission_gagnee)}</div>
          <div className={`text-sm mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {formatCurrency(promoteur.solde_commission)} disponible
          </div>
        </div>
        
        <div className={`rounded-2xl p-5 ${
          darkMode 
            ? 'bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20' 
            : 'bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 shadow-sm'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-orange-500/20' : 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg'}`}>
              <Users className={`w-5 h-5 ${darkMode ? 'text-orange-400' : 'text-white'}`} />
            </div>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Filleuls</span>
          </div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.totalFilleuls}</div>
          <div className={`text-sm mt-1 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
            {formatCurrency(stats.totalCommissions)} gagnés
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des demandes */}
        <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800/30 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-pink-500" />
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Évolution (7 jours)</h3>
          </div>
          
          {evolutionData.some(d => d.tickets > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="day" stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} />
                <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff', 
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '0.75rem',
                    color: darkMode ? '#fff' : '#1f2937'
                  }}
                  labelStyle={{ color: darkMode ? '#fff' : '#1f2937' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tickets" 
                  stroke="#ec4899" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorTickets)" 
                  name="Tickets"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-[250px] flex items-center justify-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Pas encore de données</p>
                <p className="text-sm">Créez des tickets pour voir l'évolution</p>
              </div>
            </div>
          )}
        </div>

        {/* Répartition par forfait */}
        <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800/30 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-purple-500" />
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Répartition par forfait</h3>
          </div>
          
          {forfaitData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={forfaitData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {forfaitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff', 
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '0.75rem'
                  }}
                  formatter={(value) => [`${value} tickets`, 'Quantité']}
                />
              </RePieChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-[250px] flex items-center justify-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className="text-center">
                <PieChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Pas encore de données</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historique commissions */}
      <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800/30 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Historique des commissions</h3>
        
        {commissionsHistory.length === 0 ? (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune commission pour le moment</p>
            <p className="text-sm mt-2">Parrainez des promoteurs pour gagner des commissions !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {commissionsHistory.slice(0, 10).map(comm => (
              <div key={comm.id} className={`flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    comm.type === 'gagnee' ? 'bg-green-500/20' : 'bg-orange-500/20'
                  }`}>
                    {comm.type === 'gagnee' ? (
                      <ArrowUpRight className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-orange-400" />
                    )}
                  </div>
                  <div>
                    <div className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>
                      {comm.type === 'gagnee' ? 'Commission reçue' : 'Commission utilisée'}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{comm.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${comm.type === 'gagnee' ? 'text-green-400' : 'text-orange-400'}`}>
                    {comm.type === 'gagnee' ? '+' : '-'}{formatCurrency(comm.montant)}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatDateShort(comm.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  };

  const renderParrainage = () => {
    const lienParrainage = `https://z.ifiaas.com/inscription?parrain=${promoteur.code_parrainage}`;
    
    const handleCopyLink = async () => {
      await copyToClipboard(lienParrainage);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    };
    
    const handleShareWhatsApp = () => {
      const message = encodeURIComponent(
        `🚀🔥 *OPPORTUNITÉ RARE – BUSINESS WIFI RENTABLE* 🔥🚀\n\n` +
        `Tu cherches un business *SIMPLE, RAPIDE et RENTABLE* ?\n\n` +
        `Avec *GigaZone*, transforme ta connexion internet en *SOURCE DE REVENUS* 💰\n\n` +
        `📍 *Installe ton WifiZone :*\n` +
        `Maison 🏠 | Boutique 🏪 | Restaurant 🍽️ | Atelier 🔧 | Salon 💇 | École 🎓 | Quartier 🏘️\n` +
        `Et commence à vendre l'accès internet autour de toi.\n\n` +
        `💸 *POURQUOI C'EST UNE OPPORTUNITÉ EN OR ?*\n` +
        `✅ Investissement ultra accessible : moins de 50.000F\n` +
        `✅ Installation 100% GRATUITE par nos techniciens\n` +
        `✅ Tu gardes 100% de TES ventes\n` +
        `✅ Accompagnement pour l'enregistrement ARCEP\n` +
        `✅ Support technique continu\n` +
        `✅ Disponible partout en Afrique 🌍\n\n` +
        `📈 Pendant que d'autres consomment internet…\n` +
        `*TOI tu le vends.*\n` +
        `Pendant que d'autres dépensent…\n` +
        `*TOI tu encaisses.*\n\n` +
        `🎯 *Les premiers installés gagnent le plus.*\n` +
        `Ne laisse pas ton quartier passer avant toi.\n\n` +
        `👉 *Inscris-toi maintenant :*\n${lienParrainage}\n\n` +
        `🎟 Code parrain : *${promoteur.code_parrainage}*\n\n` +
        `📞 Infos & assistance : +229 01 67 45 54 62\n` +
        `💬 Chat direct sur : z.ifiaas.com\n\n` +
        `💰 *Lance ton business WiFi aujourd'hui.*\n` +
        `*Encaisse dès cette semaine.* 🚀`
      );
      window.open(`https://wa.me/?text=${message}`, '_blank');
    };
    
    return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Parrainage</h2>

      {/* Code parrainage */}
      <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Votre code de parrainage</h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>Partagez ce code pour gagner des commissions sur les commandes de vos filleuls</p>
            
            <div className="flex items-center gap-3">
              <div className={`px-6 py-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl font-mono text-2xl tracking-widest text-orange-400`}>
                {promoteur.code_parrainage}
              </div>
              <button
                onClick={handleCopyCode}
                className={`p-3 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} rounded-xl transition`}
              >
                {codeCopied ? <CheckCircle className="w-6 h-6 text-green-400" /> : <Copy className="w-6 h-6 text-gray-400" />}
              </button>
              <button
                onClick={() => setShowQRCode(true)}
                className={`p-3 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} rounded-xl transition`}
              >
                <QrCode className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalFilleuls}</div>
            <div className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Filleuls</div>
          </div>
        </div>
      </div>

      {/* Lien de parrainage */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>🔗 Lien de parrainage</h3>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4 text-sm`}>Partagez ce lien directement - le code sera automatiquement appliqué</p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className={`flex-1 px-4 py-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl text-sm text-green-400 font-mono truncate`}>
            {lienParrainage}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-2 px-4 py-3 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} rounded-xl transition text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {codeCopied ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              Copier
            </button>
            <button
              onClick={handleShareWhatsApp}
              className={`flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl transition text-sm font-medium text-white`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Stats parrainage */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200 shadow-sm'} border rounded-xl p-5`}>
          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mb-1`}>Commissions gagnées</div>
          <div className="text-2xl font-bold text-green-400">{formatCurrency(promoteur.total_commission_gagnee)}</div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200 shadow-sm'} border rounded-xl p-5`}>
          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mb-1`}>Solde utilisable</div>
          <div className="text-2xl font-bold text-pink-400">{formatCurrency(promoteur.solde_commission)}</div>
        </div>
      </div>

      {/* Liste filleuls */}
      <div className={`${darkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-2xl p-6`}>
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Vos filleuls</h3>
        
        {filleuls.length === 0 ? (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Vous n'avez pas encore de filleuls</p>
            <p className="text-sm mt-2">Partagez votre code pour commencer !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filleuls.map(filleul => (
              <div key={filleul.id} className={`flex items-center justify-between p-4 ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-xl`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {filleul.nom_complet.charAt(0)}
                  </div>
                  <div>
                    <div className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{filleul.nom_complet}</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Inscrit le {formatDateShort(filleul.created_at)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{filleul.total_commandes} commandes</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  };

  const renderFichiers = () => {
    const commandesAvecFichiers = commandes.filter(c => c.fichier_tickets_url);
    
    return (
      <div className="space-y-6">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Mes fichiers</h2>

        {commandesAvecFichiers.length === 0 ? (
          <div className={`rounded-2xl p-12 text-center ${darkMode ? 'bg-gray-800/30 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
            <FileText className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-300'}`} />
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Aucun fichier disponible</p>
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Les fichiers de vos commandes validées apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {commandesAvecFichiers.map(cmd => (
              <div key={cmd.id} className={`rounded-xl p-5 flex items-center justify-between ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
                    <FileText className={`w-6 h-6 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
                  </div>
                  <div>
                    <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Tickets - {cmd.forfait_nom}</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{cmd.quantite} tickets • {formatDateShort(cmd.created_at)}</div>
                  </div>
                </div>
                <button
                  onClick={() => downloadFile(cmd.fichier_tickets_url, `tickets-${cmd.id}.pdf`)}
                  className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                    darkMode 
                      ? 'bg-pink-500/10 text-pink-400 hover:bg-pink-500/20' 
                      : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
                  }`}
                >
                  <Download className="w-5 h-5" />
                  Télécharger
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Notifications</h2>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <>
              <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-100 text-pink-600'}`}>
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </span>
              <button
                onClick={markAllAsRead}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  darkMode 
                    ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' 
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Tout marquer</span> lu
              </button>
            </>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className={`rounded-2xl p-12 text-center ${darkMode ? 'bg-gray-800/30 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
          <Bell className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-300'}`} />
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => (
            <NotificationItem key={notif.id} notif={notif} onRead={markAsRead} darkMode={darkMode} />
          ))}
        </div>
      )}
    </div>
  );

  const renderProfil = () => (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Mon profil</h2>

      {/* Infos principales */}
      <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200 shadow-sm'} border rounded-2xl p-6`}>
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
            {promoteur.nom_complet.charAt(0)}
          </div>
          <div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{promoteur.nom_complet}</h3>
            <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full ${niveauInfo.bg}`}>
              <span>{niveauInfo.icon}</span>
              <span className={niveauInfo.color}>{niveauInfo.label}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mb-1`}>Code d'accès</div>
            <div className={`font-mono text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{promoteur.code_unique}</div>
          </div>
          <div>
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mb-1`}>Code parrainage</div>
            <div className="font-mono text-lg text-pink-400">{promoteur.code_parrainage}</div>
          </div>
          <div>
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mb-1`}>WhatsApp</div>
            <div className={darkMode ? 'text-white' : 'text-gray-900'}>{promoteur.whatsapp}</div>
          </div>
          <div>
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mb-1`}>Localisation</div>
            <div className={darkMode ? 'text-white' : 'text-gray-900'}>{promoteur.ville}, {promoteur.pays}</div>
          </div>
          <div>
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mb-1`}>Inscrit le</div>
            <div className={darkMode ? 'text-white' : 'text-gray-900'}>{formatDate(promoteur.created_at)}</div>
          </div>
          <div>
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mb-1`}>Total commandes</div>
            <div className={darkMode ? 'text-white' : 'text-gray-900'}>{promoteur.total_commandes}</div>
          </div>
        </div>
      </div>

      {/* Progression niveau */}
      <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200 shadow-sm'} border rounded-2xl p-6`}>
        <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Progression de niveau</h4>
        <div className="space-y-4">
          {['bronze', 'silver', 'gold'].map((niv, idx) => {
            const info = getNiveauInfo(niv);
            const seuils = [0, 51, 201];
            const isActive = promoteur.niveau === niv;
            const isPassed = ['bronze', 'silver', 'gold'].indexOf(promoteur.niveau) >= idx;
            
            return (
              <div key={niv} className={`flex items-center gap-4 p-3 rounded-xl ${isActive ? info.bg : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isPassed ? '' : 'opacity-50'}`}>
                  {info.icon}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${isPassed ? info.color : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{info.label}</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{seuils[idx]}+ commandes {info.bonus && `• ${info.bonus}`}</div>
                </div>
                {isActive && <CheckCircle className="w-5 h-5 text-green-400" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      <NotificationSettings darkMode={darkMode} />
      
      {/* Test des notifications */}
      <NotificationDemo darkMode={darkMode} />

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          to="/admin"
          className={`flex-1 py-3 rounded-xl font-medium ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} transition flex items-center justify-center gap-2`}
        >
          <ExternalLink className="w-5 h-5" />
          Accès admin
        </Link>
        <button
          onClick={handleLogout}
          className="flex-1 py-3 rounded-xl font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 transition flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>
    </div>
  );

  // =====================================================
  // LAYOUT PRINCIPAL
  // =====================================================

  // Classes dynamiques selon le thème
  const bgMain = darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900';
  const bgSidebar = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const bgCard = darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
  const bgHeader = darkMode ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen ${bgMain}`}>
      
      {/* Sidebar Desktop */}
      <aside className={`fixed left-0 top-0 bottom-0 w-64 ${bgSidebar} border-r hidden lg:flex flex-col`}>
        {/* Logo - Header fixe */}
        <div className={`flex-shrink-0 p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-bold ${textPrimary}`}>GigaZone</span>
          </Link>
        </div>

        {/* Navigation avec scroll */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 transparent' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-500/30'
                  : darkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-pink-500 text-xs text-white font-bold min-w-[20px] text-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          ))}
          
          {/* Infos promoteur - dans la zone scrollable */}
          <div className="mt-4 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {promoteur.nom_complet?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold ${textPrimary} truncate`}>{promoteur.nom_complet}</div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${textSecondary}`}>{niveauInfo.icon} {niveauInfo.label}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={textSecondary}>Code:</span>
              <span className="font-mono text-pink-400">{promoteur.code_unique}</span>
            </div>
          </div>
        </nav>

        {/* Footer Sidebar - Fixe en bas */}
        <div className={`flex-shrink-0 p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} space-y-2`}>
          <Link
            to="/admin"
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl ${
              darkMode 
                ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100' 
            } transition text-sm`}
          >
            <ExternalLink className="w-4 h-4" />
            Accès admin
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
          <div className={`text-center text-xs ${textSecondary} pt-2`}>
            © 2026 GigaZone
          </div>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className={`absolute left-0 top-0 bottom-0 w-64 ${bgSidebar} flex flex-col`}>
            {/* Header fixe */}
            <div className={`flex-shrink-0 p-4 flex items-center justify-between border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-white" />
                </div>
                <span className={`font-bold ${textPrimary}`}>GigaZone</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className={textSecondary}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Nav avec scroll */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 transparent' }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    activeTab === tab.id
                      ? 'bg-pink-500/20 text-pink-400'
                      : darkMode 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-pink-500 text-xs text-white font-bold min-w-[20px] text-center">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </button>
              ))}
              
              {/* Infos promoteur - dans la zone scrollable */}
              <div className={`mt-4 flex items-center gap-3 p-3 ${darkMode ? 'bg-gray-800/50' : 'bg-gray-100'} rounded-xl`}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {promoteur.nom_complet?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} truncate text-sm`}>{promoteur.nom_complet}</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{niveauInfo.icon} {niveauInfo.label}</div>
                  <div className="text-xs text-pink-400 font-mono mt-1">Code: {promoteur.code_unique}</div>
                </div>
              </div>
            </nav>

            {/* Footer Mobile - Fixe en bas */}
            <div className={`flex-shrink-0 p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} space-y-2`}>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/admin"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl ${darkMode ? 'text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'} transition text-xs`}
                >
                  <ExternalLink className="w-4 h-4" />
                  Admin
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition text-xs font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
              <div className="text-center text-xs text-gray-500">
                © 2026 GigaZone
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className={`sticky top-0 z-40 ${bgHeader} backdrop-blur-lg border-b px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className={`lg:hidden p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} rounded-lg`}
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold">
                {tabs.find(t => t.id === activeTab)?.label}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => { loadAllData(); refreshPromoteur(); }}
                className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                title={darkMode ? 'Mode clair' : 'Mode sombre'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`relative p-2 rounded-lg transition ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full text-xs flex items-center justify-center text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              <div className={`hidden sm:flex items-center gap-3 pl-3 border-l ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm font-semibold text-white">
                  {promoteur.nom_complet.charAt(0)}
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{promoteur.nom_complet.split(' ')[0]}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'accueil' && renderAccueil()}
              {activeTab === 'commandes' && renderCommandes()}
              {activeTab === 'statistiques' && renderStatistiques()}
              {activeTab === 'parrainage' && renderParrainage()}
              {activeTab === 'fichiers' && renderFichiers()}
              {activeTab === 'notifications' && renderNotifications()}
              {activeTab === 'profil' && renderProfil()}
            </>
          )}
        </main>
      </div>

      {/* Modal QR Code */}
      {showQRCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowQRCode(false)} />
          <div className={`relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 max-w-sm w-full text-center`}>
            <button 
              onClick={() => setShowQRCode(false)}
              className={`absolute top-4 right-4 p-1 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-lg`}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4">QR Code Parrainage</h3>
            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              <img 
                src={generateQRCodeURL(`https://z.ifiaas.com/inscription?parrain=${promoteur.code_parrainage}`, 200)}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
              Scannez ce code pour vous inscrire avec le parrainage de <strong className={darkMode ? 'text-white' : 'text-gray-900'}>{promoteur.nom_complet}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Modal Détails Commande */}
      {selectedCommande && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedCommande(null)} />
          <div className={`relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
            <button 
              onClick={() => setSelectedCommande(null)}
              className={`absolute top-4 right-4 p-1 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-lg`}
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold mb-6">Détails de la commande</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Forfait</span>
                <span className="font-medium">{selectedCommande.forfait_nom}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Quantité</span>
                <span className="font-medium">{selectedCommande.quantite} tickets</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Prix unitaire</span>
                <span className="font-medium">{formatCurrency(selectedCommande.prix_unitaire)}</span>
              </div>
              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-4`} />
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Valeur des tickets</span>
                <span className="font-medium">{formatCurrency(selectedCommande.total_brut)}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Frais de service ({selectedCommande.taux_remise}%)</span>
                <span className="font-medium text-pink-400">{formatCurrency(selectedCommande.montant_remise)}</span>
              </div>
              {selectedCommande.commission_utilisee > 0 && (
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Commission utilisée</span>
                  <span className="font-medium text-blue-400">-{formatCurrency(selectedCommande.commission_utilisee)}</span>
                </div>
              )}
              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-4`} />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total payé</span>
                <span className="font-bold text-pink-400">{formatCurrency(selectedCommande.net_a_payer)}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Tickets créés</span>
                <span className="font-semibold text-green-400">{selectedCommande.quantite} tickets</span>
              </div>
              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-4`} />
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Statut</span>
                <span className={`px-3 py-1 rounded-full text-sm ${statutColors[selectedCommande.statut].bg} ${statutColors[selectedCommande.statut].text}`}>
                  {statutColors[selectedCommande.statut].label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Date</span>
                <span>{formatDate(selectedCommande.created_at)}</span>
              </div>
              
              {selectedCommande.fichier_tickets_url && (
                <button
                  onClick={() => downloadFile(selectedCommande.fichier_tickets_url, `tickets-${selectedCommande.id}.pdf`)}
                  className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Télécharger les tickets
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Widget */}
      <ChatWidget 
        userId={promoteur.id} 
        userName={promoteur.nom_complet}
        userType="promoteur"
      />
    </div>
  );
}
