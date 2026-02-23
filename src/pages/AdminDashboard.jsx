import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Wifi, CreditCard, Activity, Search, Download, 
  RefreshCw, Calendar, TrendingUp, BarChart3, PieChart, 
  ArrowUpRight, Clock, Moon, Sun, Menu, X, ExternalLink,
  MessageCircle, Send, CheckCircle, XCircle, User, Bell,
  Megaphone, Trash2, Eye, AlertTriangle, Zap, Gift, Settings,
  Tag, Percent, Copy, Plus, Edit2, Smartphone, ChevronUp, 
  ChevronDown, ArrowLeft, Phone, Hash, Shield, Save, DollarSign, Monitor
} from 'lucide-react';

// Hook thème unifié
import { useTheme } from '../hooks/useTheme';
import { usePageSEO, SEO_CONFIGS } from '../hooks/usePageSEO';

// Composants Admin Promoteurs
import AdminPromoteurs from '../components/admin/AdminPromoteurs';
import AdminCommandesPromo from '../components/admin/AdminCommandesPromo';
import AdminNotificationsPromo from '../components/admin/AdminNotificationsPromo';
import AdminSettings from '../components/admin/AdminSettings';

// Configuration Supabase
const SUPABASE_URL = 'https://dfflzuwyntrdfxujvsqr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmZmx6dXd5bnRyZGZ4dWp2c3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNDE4NjMsImV4cCI6MjA4NDgxNzg2M30.tZgXgUUalq-5y7nh1fxA5mo5CsGJU2_8l_T-z1Cc-24';

// API Helper
const supabaseFetch = async (endpoint) => {
  // Si l'endpoint a déjà un limit, pas de pagination auto
  if (endpoint.includes('limit=')) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    } catch (error) {
      console.error('Supabase fetch error:', error);
      return [];
    }
  }
  
  // Auto-pagination pour dépasser la limite de 1000 lignes
  const PAGE_SIZE = 1000;
  let allData = [];
  let offset = 0;
  let hasMore = true;
  
  try {
    while (hasMore) {
      const separator = endpoint.includes('?') ? '&' : '?';
      const paginatedEndpoint = `${endpoint}${separator}limit=${PAGE_SIZE}&offset=${offset}`;
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${paginatedEndpoint}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        }
      });
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(data);
        offset += PAGE_SIZE;
        if (data.length < PAGE_SIZE) hasMore = false;
      }
    }
    return allData;
  } catch (error) {
    console.error('Supabase fetch error:', error);
    return allData.length > 0 ? allData : [];
  }
};

const supabaseDelete = async (endpoint) => {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    return true;
  } catch (e) { return false; }
};

const supabasePatch = async (endpoint, data) => {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      method: 'PATCH',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    return r.json();
  } catch (e) { return null; }
};

// Formatters
const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);
const formatCurrency = (num) => `${formatNumber(num)} F`;
const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { 
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
});
const formatDateShort = (date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

// Admin password hash (SHA-256)
const ADMIN_HASH = 'e9a76a89516e3c0cd657b9ece6dd180e89b4c782f42905b6fe892840f49969a3';
const hashPassword = async (pwd) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export default function AdminDashboard() {
  // SEO
  usePageSEO(SEO_CONFIGS.admin);
  
  // ============================================
  // TOUS LES HOOKS DOIVENT ÊTRE DÉCLARÉS ICI
  // (avant tout return conditionnel)
  // ============================================
  
  // Auth states
  const [isAuth, setIsAuth] = useState(() => localStorage.getItem('gz_admin') === 'ok' || sessionStorage.getItem('gz_admin') === 'ok');
  const [loginPwd, setLoginPwd] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  // initialLoad est true seulement si on est déjà authentifié au chargement
  const [dataReady, setDataReady] = useState(false);
  
  // Thème unifié (partagé avec PromoteurDashboard)
  const { isDark: darkMode, toggle: toggleTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('gz_admin_tab');
    return stored || 'dashboard';
  });
  const [loading, setLoading] = useState(false);
  const [notifPromoCount, setNotifPromoCount] = useState(0);
  const [pendingCommandesCount, setPendingCommandesCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  
  // Persister l'onglet actif
  useEffect(() => {
    localStorage.setItem('gz_admin_tab', activeTab);
  }, [activeTab]);
  
  // Charger les compteurs de badges au démarrage
  useEffect(() => {
    const loadBadgeCounts = async () => {
      try {
        // Notifications promoteurs non lues
        const notifRes = await fetch(`${SUPABASE_URL}/rest/v1/notifications_admin?lu=eq.false&select=id`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotifPromoCount(Array.isArray(data) ? data.length : 0);
        }
        
        // Commandes promoteurs en attente
        const cmdRes = await fetch(`${SUPABASE_URL}/rest/v1/commandes_promoteurs?statut=eq.en_attente&select=id`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (cmdRes.ok) {
          const data = await cmdRes.json();
          setPendingCommandesCount(Array.isArray(data) ? data.length : 0);
        }
        
        // Chat support - conversations avec messages non répondus
        const chatRes = await fetch(`${SUPABASE_URL}/rest/v1/chat_conversations?status=eq.active&select=id,last_message_by`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (chatRes.ok) {
          const data = await chatRes.json();
          const unread = Array.isArray(data) ? data.filter(c => c.last_message_by === 'visitor').length : 0;
          setChatUnreadCount(unread);
        }
      } catch (e) {
        console.log('Badge count error:', e);
      }
    };
    loadBadgeCounts();
    const interval = setInterval(loadBadgeCounts, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Data states
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [packages, setPackages] = useState([]);
  const [devices, setDevices] = useState([]);
  const [deviceModal, setDeviceModal] = useState(null);
  const [userSort, setUserSort] = useState({ key: 'registered_at', dir: 'desc' });
  const [userDrawer, setUserDrawer] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayConnections: 0,
    todayRevenue: 0,
    uniqueToday: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    // Nouveaux stats
    todayUsers: 0,
    yesterdayUsers: 0,
    yesterdayConnections: 0,
    yesterdayRevenue: 0,
    yesterdayUnique: 0,
    weekConnections: 0,
    monthConnections: 0,
    retentionRate: 0,
    avgConnectionsPerUser: 0,
    // Stats par catégorie
    categoryStats: [],
    // Stats période sélectionnée
    selectedPeriodUsers: 0,
    selectedPeriodConnections: 0,
    selectedPeriodRevenue: 0,
    selectedPeriodUnique: 0
  });
  
  // Dashboard period filter
  const [dashboardPeriod, setDashboardPeriod] = useState('today');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Filter states
  const [userSearch, setUserSearch] = useState('');
  const [connectionSearch, setConnectionSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [connectionCustomDate, setConnectionCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [connectionPage, setConnectionPage] = useState(1);
  const CONNECTIONS_PER_PAGE = 50;
  
  // Fetch data function
  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, connectionsData, packagesData, devicesData] = await Promise.all([
        supabaseFetch('users?select=*&order=registered_at.desc'),
        supabaseFetch('connections?select=*&order=connected_at.desc'),
        supabaseFetch('packages?select=*&order=price.asc'),
        supabaseFetch('devices?select=*&order=created_at.desc')
      ]);
      
      setUsers(Array.isArray(usersData) ? usersData : []);
      setConnections(Array.isArray(connectionsData) ? connectionsData : []);
      setPackages(Array.isArray(packagesData) ? packagesData : []);
      setDevices(Array.isArray(devicesData) ? devicesData : []);
      
      // Calculate comprehensive stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
      const yesterdayEnd = todayStart;
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
      const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
      
      const usrs = Array.isArray(usersData) ? usersData : [];
      const conns = Array.isArray(connectionsData) ? connectionsData : [];
      const pkgs = Array.isArray(packagesData) ? packagesData : [];
      
      // Users stats
      const todayUsers = usrs.filter(u => u.registered_at >= todayStart && u.registered_at < todayEnd);
      const yesterdayUsers = usrs.filter(u => u.registered_at >= yesterdayStart && u.registered_at < yesterdayEnd);
      
      // Connections stats
      const todayConns = conns.filter(c => c.connected_at >= todayStart && c.connected_at < todayEnd);
      const yesterdayConns = conns.filter(c => c.connected_at >= yesterdayStart && c.connected_at < yesterdayEnd);
      const weekConns = conns.filter(c => c.connected_at >= weekAgo);
      const monthConns = conns.filter(c => c.connected_at >= monthAgo);
      
      // Unique users
      const uniqueToday = new Set(todayConns.map(c => c.username)).size;
      const uniqueYesterday = new Set(yesterdayConns.map(c => c.username)).size;
      
      // Retention rate (users who connected in both last week and this week)
      const lastWeekUsers = new Set(conns.filter(c => c.connected_at >= twoWeeksAgo && c.connected_at < weekAgo).map(c => c.username));
      const thisWeekUsers = new Set(weekConns.map(c => c.username));
      const returningUsers = [...lastWeekUsers].filter(u => thisWeekUsers.has(u)).length;
      const retentionRate = lastWeekUsers.size > 0 ? Math.round((returningUsers / lastWeekUsers.size) * 100) : 0;
      
      // Avg connections per user
      const avgConnectionsPerUser = usrs.length > 0 ? (conns.length / usrs.length).toFixed(1) : 0;
      
      // Category stats
      const categories = [...new Set(pkgs.map(p => p.category).filter(Boolean))];
      const categoryStats = categories.map(cat => {
        const catProfiles = pkgs.filter(p => p.category === cat).map(p => p.profile_name);
        const catConns = conns.filter(c => catProfiles.includes(c.profile_name));
        return {
          category: cat,
          connections: catConns.length,
          revenue: catConns.reduce((sum, c) => sum + (c.price || 0), 0),
          percentage: conns.length > 0 ? Math.round((catConns.length / conns.length) * 100) : 0
        };
      });
      
      setStats({
        totalUsers: usrs.length,
        todayConnections: todayConns.length,
        todayRevenue: todayConns.reduce((sum, c) => sum + (c.price || 0), 0),
        uniqueToday: uniqueToday,
        weekRevenue: weekConns.reduce((sum, c) => sum + (c.price || 0), 0),
        monthRevenue: monthConns.reduce((sum, c) => sum + (c.price || 0), 0),
        // New stats
        todayUsers: todayUsers.length,
        yesterdayUsers: yesterdayUsers.length,
        yesterdayConnections: yesterdayConns.length,
        yesterdayRevenue: yesterdayConns.reduce((sum, c) => sum + (c.price || 0), 0),
        yesterdayUnique: uniqueYesterday,
        weekConnections: weekConns.length,
        monthConnections: monthConns.length,
        retentionRate,
        avgConnectionsPerUser: parseFloat(avgConnectionsPerUser),
        categoryStats,
        // Période sélectionnée (sera recalculé)
        selectedPeriodUsers: todayUsers.length,
        selectedPeriodConnections: todayConns.length,
        selectedPeriodRevenue: todayConns.reduce((sum, c) => sum + (c.price || 0), 0),
        selectedPeriodUnique: uniqueToday
      });
      
      setDataReady(true);
    } catch (error) {
      console.error('Error fetching data:', error);
      setDataReady(true); // Même en cas d'erreur, on affiche le dashboard
    }
    setLoading(false);
  };
  
  // useEffect pour charger les données au montage si déjà authentifié
  useEffect(() => {
    if (isAuth && !dataReady) {
      fetchData();
    }
  }, [isAuth, dataReady]);
  
  // Rafraîchissement automatique toutes les 60 secondes
  useEffect(() => {
    if (!isAuth || !dataReady) return;
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [isAuth, dataReady]);

  // ============================================
  // TOUS LES useMemo DOIVENT ÊTRE ICI (avant les returns conditionnels)
  // ============================================
  
  // Enriched users with computed stats
  const enrichedUsers = useMemo(() => {
    return users.map(u => {
      const userConns = connections.filter(c => c.mac_address === u.mac_address);
      const devCount = devices.filter(d => d.user_id === u.id).length;
      const totalSpent = userConns.reduce((s, c) => s + (c.price || 0), 0);
      const connCount = userConns.length;
      const lastSeen = userConns.length > 0 ? userConns[0].connected_at : null;
      return { ...u, _conns: userConns, _devCount: devCount, _totalSpent: totalSpent, _connCount: connCount, _lastSeen: lastSeen };
    });
  }, [users, connections, devices]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    let result = enrichedUsers.filter(u => 
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.whatsapp?.includes(userSearch) ||
      u.mac_address?.toLowerCase().includes(userSearch.toLowerCase())
    );
    const { key, dir } = userSort;
    result.sort((a, b) => {
      let va = a[key] ?? a['_' + key] ?? '', vb = b[key] ?? b['_' + key] ?? '';
      if (typeof va === 'number') return dir === 'asc' ? va - vb : vb - va;
      if (key === 'registered_at' || key === '_lastSeen' || key === 'lastSeen') {
        va = va ? new Date(va).getTime() : 0; vb = vb ? new Date(vb).getTime() : 0;
        return dir === 'asc' ? va - vb : vb - va;
      }
      if (key === '_devCount' || key === '_totalSpent' || key === '_connCount') {
        return dir === 'asc' ? (a[key] || 0) - (b[key] || 0) : (b[key] || 0) - (a[key] || 0);
      }
      return dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return result;
  }, [enrichedUsers, userSearch, userSort]);

  // Filtered connections
  const filteredConnections = useMemo(() => {
    let filtered = connections;
    if (connectionSearch) {
      filtered = filtered.filter(c =>
        c.username?.toLowerCase().includes(connectionSearch.toLowerCase()) ||
        c.profile_name?.toLowerCase().includes(connectionSearch.toLowerCase()) ||
        c.mac_address?.toLowerCase().includes(connectionSearch.toLowerCase())
      );
    }
    if (dateFilter !== 'all') {
      const now = new Date();
      if (dateFilter === 'custom') {
        // Filtre par date personnalisée
        const selectedDate = new Date(connectionCustomDate);
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        filtered = filtered.filter(c => {
          const connDate = new Date(c.connected_at);
          return connDate >= startOfDay && connDate <= endOfDay;
        });
      } else {
        const filterDate = new Date();
        if (dateFilter === 'today') filterDate.setHours(0, 0, 0, 0);
        else if (dateFilter === 'week') filterDate.setDate(now.getDate() - 7);
        else if (dateFilter === 'month') filterDate.setMonth(now.getMonth() - 1);
        filtered = filtered.filter(c => new Date(c.connected_at) >= filterDate);
      }
    }
    if (categoryFilter !== 'all') {
      const categoryProfiles = packages.filter(p => p.category === categoryFilter).map(p => p.profile_name);
      filtered = filtered.filter(c => categoryProfiles.includes(c.profile_name));
    }
    return filtered;
  }, [connections, connectionSearch, dateFilter, connectionCustomDate, categoryFilter, packages]);
  
  // Reset page when filters change
  useEffect(() => {
    setConnectionPage(1);
  }, [connectionSearch, dateFilter, connectionCustomDate, categoryFilter]);

  // Paginated connections for table display
  const totalConnectionPages = Math.max(1, Math.ceil(filteredConnections.length / CONNECTIONS_PER_PAGE));
  const paginatedConnections = useMemo(() => {
    const start = (connectionPage - 1) * CONNECTIONS_PER_PAGE;
    return filteredConnections.slice(start, start + CONNECTIONS_PER_PAGE);
  }, [filteredConnections, connectionPage, CONNECTIONS_PER_PAGE]);

  // Stats connexions filtrées
  const connectionStats = useMemo(() => {
    const totalConnections = filteredConnections.length;
    const totalRevenue = filteredConnections.reduce((sum, c) => sum + (c.price || 0), 0);
    return { totalConnections, totalRevenue };
  }, [filteredConnections]);
  
  // Package stats
  const packageStats = useMemo(() => {
    return packages.map(pkg => ({
      ...pkg,
      sales: connections.filter(c => c.profile_name === pkg.profile_name).length,
      revenue: connections.filter(c => c.profile_name === pkg.profile_name).reduce((sum, c) => sum + (c.price || 0), 0)
    })).sort((a, b) => b.sales - a.sales);
  }, [packages, connections]);
  
  // Chart data for last 7 days
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayConns = connections.filter(c => c.connected_at?.startsWith(dateStr));
      days.push({
        date: formatDateShort(date),
        connections: dayConns.length,
        revenue: dayConns.reduce((sum, c) => sum + (c.price || 0), 0)
      });
    }
    return days;
  }, [connections]);
  
  const maxRevenue = useMemo(() => {
    if (!chartData || chartData.length === 0) return 1;
    const max = Math.max(...chartData.map(d => d.revenue || 0));
    return max > 0 ? max : 1;
  }, [chartData]);
  
  const maxConnections = useMemo(() => {
    if (!chartData || chartData.length === 0) return 1;
    const max = Math.max(...chartData.map(d => d.connections || 0));
    return max > 0 ? max : 1;
  }, [chartData]);

  // Enhanced chart data with new users
  const enhancedChartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayConns = connections.filter(c => c.connected_at?.startsWith(dateStr));
      const dayUsers = users.filter(u => u.registered_at?.startsWith(dateStr));
      days.push({
        date: formatDateShort(date),
        fullDate: dateStr,
        connections: dayConns.length,
        revenue: dayConns.reduce((sum, c) => sum + (c.price || 0), 0),
        newUsers: dayUsers.length,
        uniqueUsers: new Set(dayConns.map(c => c.username)).size
      });
    }
    return days;
  }, [connections, users]);

  const maxNewUsers = useMemo(() => {
    if (!enhancedChartData || enhancedChartData.length === 0) return 1;
    const max = Math.max(...enhancedChartData.map(d => d.newUsers || 0));
    return max > 0 ? max : 1;
  }, [enhancedChartData]);

  // Period stats calculation
  const periodStats = useMemo(() => {
    const now = new Date();
    let startDate, endDate, prevStartDate, prevEndDate, periodLabel;
    
    if (dashboardPeriod === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      endDate = now.toISOString();
      prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
      prevEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      periodLabel = "Aujourd'hui";
    } else if (dashboardPeriod === 'yesterday') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2).toISOString();
      prevEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
      periodLabel = "Hier";
    } else if (dashboardPeriod === 'week') {
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
      endDate = now.toISOString();
      prevStartDate = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
      prevEndDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
      periodLabel = "7 derniers jours";
    } else if (dashboardPeriod === 'month') {
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
      endDate = now.toISOString();
      prevStartDate = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();
      prevEndDate = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
      periodLabel = "30 derniers jours";
    } else if (dashboardPeriod === 'custom') {
      const selectedDate = new Date(customDate);
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).toISOString();
      endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1).toISOString();
      prevStartDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 1).toISOString();
      prevEndDate = startDate;
      periodLabel = new Date(customDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    } else {
      // Default to today
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      endDate = now.toISOString();
      prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
      prevEndDate = startDate;
      periodLabel = "Aujourd'hui";
    }
    
    // Current period stats
    const periodConns = connections.filter(c => c.connected_at >= startDate && c.connected_at < endDate);
    const periodUsers = users.filter(u => u.registered_at >= startDate && u.registered_at < endDate);
    const periodUnique = new Set(periodConns.map(c => c.username)).size;
    const periodRevenue = periodConns.reduce((sum, c) => sum + (c.price || 0), 0);
    
    // Previous period stats for comparison
    const prevConns = connections.filter(c => c.connected_at >= prevStartDate && c.connected_at < prevEndDate);
    const prevUsers = users.filter(u => u.registered_at >= prevStartDate && u.registered_at < prevEndDate);
    const prevUnique = new Set(prevConns.map(c => c.username)).size;
    const prevRevenue = prevConns.reduce((sum, c) => sum + (c.price || 0), 0);
    
    // Calculate variations
    const calcVariation = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };
    
    return {
      periodLabel,
      users: periodUsers.length,
      usersVariation: calcVariation(periodUsers.length, prevUsers.length),
      connections: periodConns.length,
      connectionsVariation: calcVariation(periodConns.length, prevConns.length),
      revenue: periodRevenue,
      revenueVariation: calcVariation(periodRevenue, prevRevenue),
      unique: periodUnique,
      uniqueVariation: calcVariation(periodUnique, prevUnique),
      // Previous period for comparison table
      prevUsers: prevUsers.length,
      prevConnections: prevConns.length,
      prevRevenue: prevRevenue,
      prevUnique: prevUnique
    };
  }, [dashboardPeriod, customDate, connections, users]);

  // Comparison data today vs yesterday
  const comparisonData = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
    const yesterdayEnd = todayStart;
    
    const todayConns = connections.filter(c => c.connected_at >= todayStart && c.connected_at < todayEnd);
    const yesterdayConns = connections.filter(c => c.connected_at >= yesterdayStart && c.connected_at < yesterdayEnd);
    const todayUsers = users.filter(u => u.registered_at >= todayStart && u.registered_at < todayEnd);
    const yesterdayUsers = users.filter(u => u.registered_at >= yesterdayStart && u.registered_at < yesterdayEnd);
    
    return {
      today: {
        users: todayUsers.length,
        connections: todayConns.length,
        revenue: todayConns.reduce((sum, c) => sum + (c.price || 0), 0),
        unique: new Set(todayConns.map(c => c.username)).size
      },
      yesterday: {
        users: yesterdayUsers.length,
        connections: yesterdayConns.length,
        revenue: yesterdayConns.reduce((sum, c) => sum + (c.price || 0), 0),
        unique: new Set(yesterdayConns.map(c => c.username)).size
      }
    };
  }, [connections, users]);

  // Auth handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    const h = await hashPassword(loginPwd);
    if (h === ADMIN_HASH) {
      localStorage.setItem('gz_admin', 'ok');
      sessionStorage.setItem('gz_admin', 'ok');
      // Charger les données d'abord
      await fetchData();
      // Puis activer l'authentification (déclenche le re-render vers le dashboard)
      setIsAuth(true);
      setLoginPwd('');
    } else {
      setLoginError('Mot de passe incorrect');
      setLoginPwd('');
    }
    setLoginLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('gz_admin');
    sessionStorage.removeItem('gz_admin');
    setIsAuth(false);
    setDataReady(false);
    // Réinitialiser les données
    setUsers([]);
    setConnections([]);
    setPackages([]);
    setDevices([]);
    setStats({
      totalUsers: 0,
      todayConnections: 0,
      todayRevenue: 0,
      uniqueToday: 0,
      weekRevenue: 0,
      monthRevenue: 0
    });
  };

  // ============================================
  // LOGIN SCREEN (return conditionnel APRÈS les hooks)
  // ============================================
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 shadow-lg shadow-pink-500/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              <span>Giga</span><span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Zone</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Accès administrateur</p>
          </div>
          <form onSubmit={handleLogin} className="bg-gray-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 block">Mot de passe</label>
              <input
                type="password"
                value={loginPwd}
                onChange={(e) => setLoginPwd(e.target.value)}
                placeholder="••••••••"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border bg-gray-800 border-slate-700 text-white placeholder-gray-500 outline-none transition focus:border-pink-500"
              />
            </div>
            {loginError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {loginError}
              </div>
            )}
            <button
              type="submit"
              disabled={loginLoading || !loginPwd}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {loginLoading ? 'Connexion...' : 'Accéder au dashboard'}
            </button>
          </form>
          
          {/* Bouton retour */}
          <Link 
            to="/"
            className="flex items-center justify-center gap-2 mt-4 py-3 text-gray-400 hover:text-pink-400 transition text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          
          <p className="text-center text-xs text-slate-600 mt-4">Powered by IFIAAS</p>
        </div>
      </div>
    );
  }

  // ============================================
  // ÉCRAN DE CHARGEMENT (après auth, avant données prêtes)
  // ============================================
  if (!dataReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 shadow-lg shadow-pink-500/30">
            <RefreshCw className="w-8 h-8 text-white animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            <span>Giga</span><span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Zone</span>
          </h1>
          <p className="text-gray-400 text-sm">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // DASHBOARD (suite du composant si authentifié)
  // ============================================

  // Helper: get devices for a user
  const getUserDevices = (userId) => devices.filter(d => d.user_id === userId);
  const showUserDevices = (user) => {
    const userDevs = getUserDevices(user.id);
    setDeviceModal({ userName: user.full_name || 'Utilisateur', devices: userDevs });
  };

  // Sort handler
  const toggleSort = (key) => {
    setUserSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  };
  const SortIcon = ({ col }) => {
    if (userSort.key !== col) return <ChevronDown className="w-3 h-3 opacity-30" />;
    return userSort.dir === 'asc' ? <ChevronUp className="w-3 h-3 text-pink-400" /> : <ChevronDown className="w-3 h-3 text-pink-400" />;
  };

  // Badge helper
  const getUserBadge = (connCount) => {
    if (connCount >= 50) return { label: '⭐ VIP', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' };
    if (connCount >= 10) return { label: 'Régulier', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' };
    return { label: 'Nouveau', cls: 'bg-slate-500/15 text-gray-400 border-slate-500/20' };
  };

  // Time ago helper
  const timeAgo = (date) => {
    if (!date) return '--';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}j`;
    return `${Math.floor(days / 30)}mois`;
  };

  // Copy to clipboard
  const copyToClip = async (text) => {
    try { await navigator.clipboard.writeText(text); } catch { prompt('Copier:', text); }
  };

  // Edit user
  const openEdit = (user) => {
    setEditForm({ full_name: user.full_name || '', whatsapp: user.whatsapp || '', npi_ravip: user.npi_ravip || '' });
    setEditModal(user);
  };
  const saveEdit = async () => {
    if (!editModal) return;
    setEditSaving(true);
    const res = await supabasePatch(`users?id=eq.${editModal.id}`, editForm);
    setEditSaving(false);
    if (res) { setEditModal(null); fetchData(); }
  };

  // Delete user
  const deleteUser = async (user) => {
    if (!confirm(`Supprimer ${user.full_name || 'cet utilisateur'} ?\nCette action est irréversible.`)) return;
    await supabaseDelete(`devices?user_id=eq.${user.id}`);
    await supabaseDelete(`users?id=eq.${user.id}`);
    fetchData();
  };
  
  // Export CSV
  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v || ''}"`).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const bgClass = darkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900';
  const cardClass = darkMode ? 'bg-gray-900/50 border-slate-800' : 'bg-white border-gray-200';
  const inputClass = darkMode ? 'bg-gray-800 border-slate-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-slate-900 placeholder-gray-400';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bgClass}`}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${darkMode ? 'bg-gray-900 border-r border-slate-800' : 'bg-white border-r border-gray-200'} flex flex-col`}>
        {/* Header - Fixed */}
        <div className="p-4 pb-3 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg truncate">GigaZone</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Admin Panel</p>
            </div>
          </Link>
        </div>
        
        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: darkMode ? '#475569 transparent' : '#cbd5e1 transparent' }}>
          <div className="space-y-1.5">
            {[
              { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
              { id: 'users', icon: Users, label: 'Utilisateurs' },
              { id: 'connections', icon: Activity, label: 'Connexions' },
              { id: 'check', icon: ExternalLink, label: 'Vérification code', isLink: true, to: '/check' },
              { id: 'packages', icon: CreditCard, label: 'Forfaits' },
              { id: 'promo', icon: Tag, label: 'Codes Promo' },
              { id: 'promoteurs', icon: Megaphone, label: 'Promoteurs' },
              { id: 'commandes_promo', icon: Gift, label: 'Commandes Promo', badge: pendingCommandesCount },
              { id: 'notifs_promo', icon: Bell, label: 'Notifs Promo', badge: notifPromoCount },
              { id: 'notifications', icon: Bell, label: 'Notifications' },
              { id: 'chat', icon: MessageCircle, label: 'Chat Support', badge: chatUnreadCount },
              { id: 'settings', icon: Settings, label: 'Paramètres' },
            ].map(item => (
              item.isLink ? (
                <Link
                  key={item.id}
                  to={item.to}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium truncate">{item.label}</span>
                </Link>
              ) : (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${activeTab === item.id 
                    ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-500 border border-pink-500/30' 
                    : `${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium truncate">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-auto bg-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              )
            ))}
          </div>
        </nav>
        
        {/* Footer - Fixed */}
        <div className="flex-shrink-0 px-3 py-3 space-y-2 border-t" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)' }}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${darkMode ? 'border-red-500/20 text-red-400 hover:bg-red-500/10' : 'border-red-200 text-red-500 hover:bg-red-50'}`}
          >
            <X className="w-4 h-4" /> Déconnexion
          </button>
          <p className={`text-center text-[11px] pt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Powered by <span className="font-semibold text-pink-500">IFIAAS</span></p>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className={`sticky top-0 z-30 px-3 sm:px-4 lg:px-8 py-3 sm:py-4 backdrop-blur-xl border-b ${darkMode ? 'bg-gray-950/80 border-gray-800' : 'bg-gray-50/80 border-gray-200'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button onClick={() => setSidebarOpen(true)} className={`lg:hidden p-2 rounded-lg flex-shrink-0 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}>
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold capitalize truncate">{activeTab}</h2>
                <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} hidden sm:block`}>
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <button
                onClick={fetchData}
                disabled={loading}
                className={`p-1.5 sm:p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} ${loading ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={toggleTheme}
                className={`p-1.5 sm:p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                title={darkMode ? 'Mode clair' : 'Mode sombre'}
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
              <button
                onClick={handleLogout}
                className={`lg:hidden p-1.5 sm:p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                title="Déconnexion"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Live</span>
              </div>
            </div>
          </div>
        </header>
        
        <div className="p-3 sm:p-4 lg:p-8 overflow-x-hidden">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Period Selector */}
              <div className={`p-4 rounded-2xl border ${cardClass}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Période:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'today', label: "Aujourd'hui" },
                      { id: 'yesterday', label: 'Hier' },
                      { id: 'week', label: '7 jours' },
                      { id: 'month', label: '30 jours' },
                      { id: 'custom', label: '📅 Date' }
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => setDashboardPeriod(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          dashboardPeriod === p.id
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                            : darkMode 
                              ? 'bg-slate-700/50 text-gray-300 hover:bg-gray-700/50' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {dashboardPeriod === 'custom' && (
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className={`px-3 py-1.5 rounded-lg text-sm border ${
                        darkMode 
                          ? 'bg-slate-700 border-slate-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    />
                  )}
                  <span className={`ml-auto text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {periodStats.periodLabel}
                  </span>
                </div>
              </div>

              {/* Main Stats Cards - 4 cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { 
                    label: 'Nouveaux utilisateurs', 
                    value: periodStats.users, 
                    variation: periodStats.usersVariation,
                    icon: Users, 
                    color: 'pink',
                    gradient: 'from-pink-500 to-rose-500'
                  },
                  { 
                    label: 'Connexions', 
                    value: periodStats.connections, 
                    variation: periodStats.connectionsVariation,
                    icon: Activity, 
                    color: 'cyan',
                    gradient: 'from-cyan-500 to-blue-500'
                  },
                  { 
                    label: 'Revenus', 
                    value: formatCurrency(periodStats.revenue), 
                    variation: periodStats.revenueVariation,
                    icon: CreditCard, 
                    color: 'green',
                    gradient: 'from-green-500 to-emerald-500'
                  },
                  { 
                    label: 'Utilisateurs uniques', 
                    value: periodStats.unique, 
                    variation: periodStats.uniqueVariation,
                    icon: Wifi, 
                    color: 'orange',
                    gradient: 'from-orange-500 to-amber-500'
                  },
                ].map((stat, i) => (
                  <div key={i} className={`p-3 sm:p-5 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-lg ${cardClass}`}>
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className={`p-1.5 sm:p-2 rounded-xl bg-gradient-to-br ${stat.gradient} bg-opacity-20`} style={{background: `rgba(${stat.color === 'pink' ? '233,30,140' : stat.color === 'cyan' ? '6,182,212' : stat.color === 'green' ? '16,185,129' : '249,115,22'}, 0.15)`}}>
                        <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{color: stat.color === 'pink' ? '#E91E8C' : stat.color === 'cyan' ? '#06B6D4' : stat.color === 'green' ? '#10B981' : '#F97316'}} />
                      </div>
                      {stat.variation !== undefined && (
                        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          stat.variation > 0 
                            ? 'bg-green-500/20 text-green-500' 
                            : stat.variation < 0 
                              ? 'bg-red-500/20 text-red-500' 
                              : darkMode ? 'bg-slate-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {stat.variation > 0 ? <ChevronUp className="w-3 h-3" /> : stat.variation < 0 ? <ChevronDown className="w-3 h-3" /> : null}
                          {stat.variation > 0 ? '+' : ''}{stat.variation}%
                        </div>
                      )}
                    </div>
                    <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                    <p className="text-lg sm:text-2xl font-bold mt-1">{typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Secondary Stats Cards - 4 cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { 
                    label: 'Revenus (7j)', 
                    value: formatCurrency(stats.weekRevenue), 
                    subLabel: `${stats.weekConnections} connexions`,
                    icon: TrendingUp, 
                    color: 'purple'
                  },
                  { 
                    label: 'Revenus (30j)', 
                    value: formatCurrency(stats.monthRevenue), 
                    subLabel: `${stats.monthConnections} connexions`,
                    icon: BarChart3, 
                    color: 'indigo'
                  },
                  { 
                    label: 'Taux de rétention', 
                    value: `${stats.retentionRate}%`, 
                    subLabel: 'Clients fidèles',
                    icon: RefreshCw, 
                    color: 'emerald'
                  },
                  { 
                    label: 'Moy. conn./user', 
                    value: stats.avgConnectionsPerUser, 
                    subLabel: `${stats.totalUsers} utilisateurs`,
                    icon: Users, 
                    color: 'sky'
                  },
                ].map((stat, i) => (
                  <div key={i} className={`p-3 sm:p-4 rounded-2xl border transition-all hover:scale-[1.02] ${cardClass}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon className={`w-4 h-4 ${
                        stat.color === 'purple' ? 'text-purple-500' : 
                        stat.color === 'indigo' ? 'text-indigo-500' : 
                        stat.color === 'emerald' ? 'text-emerald-500' : 'text-sky-500'
                      }`} />
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                    </div>
                    <p className="text-lg sm:text-xl font-bold">{stat.value}</p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{stat.subLabel}</p>
                  </div>
                ))}
              </div>

              {/* Comparison Table - Today vs Yesterday */}
              <div className={`p-6 rounded-2xl border ${cardClass}`}>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  Comparaison Aujourd'hui vs Hier
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`text-xs uppercase ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        <th className="text-left py-2 px-3 whitespace-nowrap">Métrique</th>
                        <th className="text-center py-2 px-3 whitespace-nowrap">Aujourd'hui</th>
                        <th className="text-center py-2 px-3 whitespace-nowrap">Hier</th>
                        <th className="text-center py-2 px-3 whitespace-nowrap">Variation</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {[
                        { label: '👥 Nouveaux utilisateurs', today: comparisonData.today.users, yesterday: comparisonData.yesterday.users },
                        { label: '🔌 Connexions', today: comparisonData.today.connections, yesterday: comparisonData.yesterday.connections },
                        { label: '💰 Revenus', today: comparisonData.today.revenue, yesterday: comparisonData.yesterday.revenue, isCurrency: true },
                        { label: '📱 Utilisateurs uniques', today: comparisonData.today.unique, yesterday: comparisonData.yesterday.unique },
                      ].map((row, i) => {
                        const variation = row.yesterday === 0 
                          ? (row.today > 0 ? 100 : 0)
                          : Math.round(((row.today - row.yesterday) / row.yesterday) * 100);
                        return (
                          <tr key={i} className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                            <td className="py-3 px-3 font-medium whitespace-nowrap">{row.label}</td>
                            <td className="py-3 px-3 text-center font-semibold whitespace-nowrap">
                              {row.isCurrency ? formatCurrency(row.today) : formatNumber(row.today)}
                            </td>
                            <td className={`py-3 px-3 text-center whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {row.isCurrency ? formatCurrency(row.yesterday) : formatNumber(row.yesterday)}
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                variation > 0 
                                  ? 'bg-green-500/20 text-green-500' 
                                  : variation < 0 
                                    ? 'bg-red-500/20 text-red-500' 
                                    : darkMode ? 'bg-slate-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                              }`}>
                                {variation > 0 ? <ChevronUp className="w-3 h-3" /> : variation < 0 ? <ChevronDown className="w-3 h-3" /> : null}
                                {variation > 0 ? '+' : ''}{variation}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className={`p-6 rounded-2xl border ${cardClass}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-pink-500" />
                      Revenus (7 jours)
                    </h3>
                    <span className="text-sm font-medium text-pink-500">{formatCurrency(stats.weekRevenue)}</span>
                  </div>
                  <div className="flex items-end gap-2 h-40">
                    {enhancedChartData && enhancedChartData.length > 0 ? enhancedChartData.map((day, i) => {
                      const heightPercent = maxRevenue > 0 ? ((day.revenue || 0) / maxRevenue) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                          <div className="relative w-full">
                            <div 
                              className="w-full bg-gradient-to-t from-pink-500 to-purple-500 rounded-t-lg transition-all group-hover:from-pink-400 group-hover:to-purple-400"
                              style={{ height: `${Math.max(heightPercent, 2)}%`, minHeight: '8px' }}
                            />
                            <div className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-800 text-white'}`}>
                              {formatCurrency(day.revenue)}
                            </div>
                          </div>
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{day.date}</span>
                        </div>
                      );
                    }) : (
                      <div className="flex-1 flex items-center justify-center text-gray-500">
                        Aucune donnée
                      </div>
                    )}
                  </div>
                </div>
                
                {/* New Users + Connections Chart */}
                <div className={`p-6 rounded-2xl border ${cardClass}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5 text-cyan-500" />
                      Inscriptions & Connexions
                    </h3>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"></span>
                        Connexions
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></span>
                        Nouveaux
                      </span>
                    </div>
                  </div>
                  <div className="flex items-end gap-2 h-40">
                    {enhancedChartData && enhancedChartData.length > 0 ? enhancedChartData.map((day, i) => {
                      const connPercent = maxConnections > 0 ? ((day.connections || 0) / maxConnections) * 100 : 0;
                      const userPercent = maxNewUsers > 0 ? ((day.newUsers || 0) / maxNewUsers) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                          <div className="relative w-full flex gap-1 items-end justify-center" style={{ height: '100%' }}>
                            <div 
                              className="w-[45%] bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t transition-all group-hover:from-cyan-400 group-hover:to-blue-400"
                              style={{ height: `${Math.max(connPercent, 2)}%`, minHeight: '4px' }}
                              title={`${day.connections} connexions`}
                            />
                            <div 
                              className="w-[45%] bg-gradient-to-t from-green-500 to-emerald-500 rounded-t transition-all group-hover:from-green-400 group-hover:to-emerald-400"
                              style={{ height: `${Math.max(userPercent, 2)}%`, minHeight: '4px' }}
                              title={`${day.newUsers} nouveaux`}
                            />
                            <div className={`absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-800 text-white'}`}>
                              {day.connections} conn. / {day.newUsers} new
                            </div>
                          </div>
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{day.date}</span>
                        </div>
                      );
                    }) : (
                      <div className="flex-1 flex items-center justify-center text-gray-500">
                        Aucune donnée
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Distribution + Top Packages */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Category Distribution */}
                <div className={`p-6 rounded-2xl border ${cardClass}`}>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-500" />
                    Répartition par catégorie
                  </h3>
                  <div className="space-y-3">
                    {stats.categoryStats && stats.categoryStats.length > 0 ? stats.categoryStats.map((cat, i) => {
                      const colors = ['from-pink-500 to-rose-500', 'from-cyan-500 to-blue-500', 'from-green-500 to-emerald-500', 'from-orange-500 to-amber-500', 'from-purple-500 to-indigo-500'];
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize">{cat.category || 'Autre'}</span>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {cat.connections} connexions
                              </span>
                              <span className="text-sm font-semibold text-green-500">{formatCurrency(cat.revenue)}</span>
                            </div>
                          </div>
                          <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                            <div 
                              className={`h-full bg-gradient-to-r ${colors[i % colors.length]} transition-all`}
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{cat.percentage}%</span>
                          </div>
                        </div>
                      );
                    }) : (
                      <p className={`text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucune catégorie</p>
                    )}
                  </div>
                </div>

                {/* Top Packages */}
                <div className={`p-6 rounded-2xl border ${cardClass}`}>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-orange-500" />
                    Top 6 Forfaits
                  </h3>
                  <div className="space-y-3">
                    {packageStats.slice(0, 6).map((pkg, i) => (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' :
                            i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                            i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                            darkMode ? 'bg-slate-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium flex items-center gap-2">
                              {pkg.name}
                              {pkg.is_best && <span className="text-xs">🏆</span>}
                              {pkg.is_popular && <span className="text-xs">⭐</span>}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatCurrency(pkg.price)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-500">{formatCurrency(pkg.revenue)}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{pkg.sales} ventes</p>
                        </div>
                      </div>
                    ))}
                    {packageStats.length === 0 && (
                      <p className={`text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucun forfait</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className={`p-6 rounded-2xl border ${cardClass}`}>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  Activité récente
                </h3>
                <div className="space-y-3">
                  {connections.slice(0, 8).map((conn, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.01] ${darkMode ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {conn.username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{conn.username}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{conn.profile_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-500">{formatCurrency(conn.price)}</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(conn.connected_at)}</p>
                      </div>
                    </div>
                  ))}
                  {connections.length === 0 && (
                    <p className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucune connexion récente</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Users Tab — Enhanced */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3">
                <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border ${inputClass}`}>
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Rechercher nom, WhatsApp, MAC, code..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm sm:text-base"
                  />
                </div>
                <div className="flex gap-2 justify-between sm:justify-end">
                  <span className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium ${cardClass}`}>
                    <Users className="w-4 h-4 text-pink-400" /> {filteredUsers.length}
                  </span>
                  <button onClick={() => exportCSV(filteredUsers, 'utilisateurs')} className="btn btn-primary flex items-center gap-1.5 text-xs sm:text-sm">
                    <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span> CSV
                  </button>
                </div>
              </div>
              
              <div className={`rounded-2xl border overflow-hidden ${cardClass}`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                      <tr>
                        {[
                          { key: 'full_name', label: 'Utilisateur', align: 'left' },
                          { key: '_connCount', label: 'Statut', align: 'center' },
                          { key: 'whatsapp', label: 'WhatsApp', align: 'left' },
                          { key: '_devCount', label: 'Appareils', align: 'center' },
                          { key: '_totalSpent', label: 'Total dépensé', align: 'right' },
                          { key: '_lastSeen', label: 'Dernier vu', align: 'left' },
                          { key: 'registered_at', label: 'Inscription', align: 'left' },
                          { key: null, label: 'Actions', align: 'center' },
                        ].map((col, ci) => (
                          <th
                            key={ci}
                            className={`px-4 py-3 text-${col.align} text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${col.key ? 'cursor-pointer select-none hover:text-pink-400 transition' : ''}`}
                            onClick={() => col.key && toggleSort(col.key)}
                          >
                            <span className="inline-flex items-center gap-1">
                              {col.label}
                              {col.key && <SortIcon col={col.key} />}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-gray-200'}`}>
                      {filteredUsers.map((user, i) => {
                        const badge = getUserBadge(user._connCount);
                        return (
                          <tr key={i} className={`${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition`}>
                            {/* Utilisateur */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button onClick={() => setUserDrawer(user)} className="flex items-center gap-3 hover:opacity-80 transition text-left">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                  {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                  <span className="font-semibold block">{user.full_name || '--'}</span>
                                </div>
                              </button>
                            </td>
                            {/* Statut */}
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                                {badge.label}
                              </span>
                              <div className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{user._connCount} cx</div>
                            </td>
                            {/* WhatsApp */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <a href={`https://wa.me/${user.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-green-500 hover:underline text-sm">
                                <Phone className="w-3.5 h-3.5" />{user.whatsapp || '--'}
                              </a>
                            </td>
                            {/* Appareils */}
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              {user._devCount > 0 ? (
                                <button onClick={() => showUserDevices(user)} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold transition-all hover:scale-105 bg-purple-500/15 text-purple-400 border border-purple-500/20 hover:bg-purple-500/25">
                                  <Smartphone className="w-3.5 h-3.5" />{user._devCount}
                                </button>
                              ) : (
                                <span className={`text-sm ${darkMode ? 'text-slate-600' : 'text-gray-400'}`}>0</span>
                              )}
                            </td>
                            {/* Total dépensé */}
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <span className={`font-bold text-sm ${user._totalSpent > 0 ? 'text-pink-400' : darkMode ? 'text-slate-600' : 'text-gray-400'}`}>
                                {user._totalSpent > 0 ? formatCurrency(user._totalSpent) : '0 F'}
                              </span>
                            </td>
                            {/* Dernier vu */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {user._lastSeen ? (
                                <div>
                                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{timeAgo(user._lastSeen)}</span>
                                  <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(user._lastSeen).split(',')[0]}</div>
                                </div>
                              ) : (
                                <span className={`text-sm ${darkMode ? 'text-slate-600' : 'text-gray-400'}`}>--</span>
                              )}
                            </td>
                            {/* Inscription */}
                            <td className={`px-4 py-3 text-sm whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {user.registered_at ? formatDate(user.registered_at).split(',')[0] : '--'}
                            </td>
                            {/* Actions */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => setUserDrawer(user)} className={`p-1.5 rounded-lg transition ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-pink-400' : 'hover:bg-gray-100 text-gray-400 hover:text-pink-500'}`} title="Voir fiche">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button onClick={() => openEdit(user)} className={`p-1.5 rounded-lg transition ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-blue-400' : 'hover:bg-gray-100 text-gray-400 hover:text-blue-500'}`} title="Modifier">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteUser(user)} className={`p-1.5 rounded-lg transition ${darkMode ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`} title="Supprimer">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="p-8 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Aucun utilisateur trouvé</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Connections Tab */}
          {activeTab === 'connections' && (
            <div className="space-y-6">
              {/* Stats dynamiques en haut */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 sm:p-5 rounded-2xl border ${cardClass} bg-gradient-to-br from-blue-500/10 to-cyan-500/10`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-white">{connectionStats.totalConnections}</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Connexions</div>
                    </div>
                  </div>
                </div>
                <div className={`p-4 sm:p-5 rounded-2xl border ${cardClass} bg-gradient-to-br from-green-500/10 to-emerald-500/10`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-green-400">{formatCurrency(connectionStats.totalRevenue)}</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Revenus</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtres */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className={`flex-1 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border ${inputClass}`}>
                    <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={connectionSearch}
                      onChange={(e) => setConnectionSearch(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-sm sm:text-base"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl border outline-none text-sm ${inputClass}`}
                    >
                      <option value="all">Toutes dates</option>
                      <option value="today">Aujourd'hui</option>
                      <option value="week">7 jours</option>
                      <option value="month">30 jours</option>
                      <option value="custom">📅 Date</option>
                    </select>
                    {dateFilter === 'custom' && (
                      <input
                        type="date"
                        value={connectionCustomDate}
                        onChange={(e) => setConnectionCustomDate(e.target.value)}
                        className={`px-3 py-2 rounded-xl border outline-none text-sm ${inputClass}`}
                      />
                    )}
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl border outline-none text-sm ${inputClass}`}
                    >
                      <option value="all">Toutes cat.</option>
                      <option value="rapide">⚡ Ultra Rapide</option>
                      <option value="navigation">🌐 Navigation</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => exportCSV(filteredConnections, 'connexions')}
                    className="btn btn-primary flex items-center gap-1.5 text-xs sm:text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span> CSV
                  </button>
                </div>
              </div>
              
              <div className={`rounded-2xl border overflow-hidden ${cardClass}`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Username</th>
                        <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Nom complet</th>
                        <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">WhatsApp</th>
                        <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Forfait</th>
                        <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Prix</th>
                        <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">MAC</th>
                        <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Date</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-gray-200'}`}>
                      {paginatedConnections.map((conn, i) => {
                        const linkedUser = users.find(u => u.mac_address === conn.mac_address);
                        return (
                        <tr key={i} className={darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-3 font-medium whitespace-nowrap">{conn.username}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {linkedUser?.full_name || <span className={darkMode ? 'text-slate-600' : 'text-gray-400'}>--</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {linkedUser?.whatsapp ? (
                              <a href={`https://wa.me/${linkedUser.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-green-500 hover:text-green-400 hover:underline text-sm">
                                <Phone className="w-3.5 h-3.5" />{linkedUser.whatsapp}
                              </a>
                            ) : (
                              <span className={darkMode ? 'text-slate-600' : 'text-gray-400'}>--</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                              {conn.profile_name}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-green-500 whitespace-nowrap">{formatCurrency(conn.price)}</td>
                          <td className="px-4 py-3 font-mono text-sm whitespace-nowrap">{conn.mac_address}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(conn.connected_at)}</td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredConnections.length === 0 && (
                  <div className="p-8 text-center">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Aucune connexion trouvée</p>
                  </div>
                )}
                {/* Pagination */}
                {filteredConnections.length > CONNECTIONS_PER_PAGE && (
                  <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {((connectionPage - 1) * CONNECTIONS_PER_PAGE) + 1}–{Math.min(connectionPage * CONNECTIONS_PER_PAGE, filteredConnections.length)} sur {filteredConnections.length.toLocaleString('fr-FR')} connexions
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setConnectionPage(1)}
                        disabled={connectionPage === 1}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${connectionPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-pink-500/10 text-pink-500'} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      >««</button>
                      <button
                        onClick={() => setConnectionPage(p => Math.max(1, p - 1))}
                        disabled={connectionPage === 1}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${connectionPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-pink-500/10 text-pink-500'} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      >‹</button>
                      {Array.from({ length: Math.min(5, totalConnectionPages) }, (_, i) => {
                        let page;
                        if (totalConnectionPages <= 5) {
                          page = i + 1;
                        } else if (connectionPage <= 3) {
                          page = i + 1;
                        } else if (connectionPage >= totalConnectionPages - 2) {
                          page = totalConnectionPages - 4 + i;
                        } else {
                          page = connectionPage - 2 + i;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setConnectionPage(page)}
                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                              connectionPage === page
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
                                : `${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`
                            }`}
                          >{page}</button>
                        );
                      })}
                      <button
                        onClick={() => setConnectionPage(p => Math.min(totalConnectionPages, p + 1))}
                        disabled={connectionPage === totalConnectionPages}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${connectionPage === totalConnectionPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-pink-500/10 text-pink-500'} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      >›</button>
                      <button
                        onClick={() => setConnectionPage(totalConnectionPages)}
                        disabled={connectionPage === totalConnectionPages}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${connectionPage === totalConnectionPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-pink-500/10 text-pink-500'} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      >»»</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Packages Tab */}
          {activeTab === 'packages' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {packageStats.map((pkg, i) => (
                  <div key={i} className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] ${cardClass} ${pkg.is_best ? 'ring-2 ring-pink-500/50' : ''}`}>
                    {(pkg.is_best || pkg.is_popular) && (
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-bold mb-3 ${pkg.is_best ? 'bg-pink-500/20 text-pink-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {pkg.is_best ? '🏆 Meilleur' : '⭐ Populaire'}
                      </div>
                    )}
                    <h4 className="font-semibold mb-1">{pkg.name}</h4>
                    <p className={`text-sm mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{pkg.category}</p>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-2xl font-bold text-pink-500">{formatNumber(pkg.price)}</span>
                      <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>FCFA</span>
                    </div>
                    <div className={`space-y-2 py-2 border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                      <div className="flex justify-between text-sm">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Durée</span>
                        <span className="font-medium">{pkg.duration}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Data</span>
                        <span className="font-medium">{pkg.data_limit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Vitesse</span>
                        <span className="font-medium">{pkg.speed}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-dashed" style={{borderColor: darkMode ? '#334155' : '#e5e7eb'}}>
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Ventes</span>
                        <span className="font-bold text-cyan-500">{pkg.sales}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Revenus</span>
                        <span className="font-bold text-green-500">{formatCurrency(pkg.revenue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Promo Codes Tab */}
          {activeTab === 'promo' && (
            <PromoCodesSection 
              darkMode={darkMode} 
              cardClass={cardClass} 
              inputClass={inputClass}
            />
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <NotificationsSection 
              darkMode={darkMode} 
              cardClass={cardClass} 
              inputClass={inputClass}
            />
          )}

          {/* Chat Support Tab */}
          {activeTab === 'chat' && (
            <ChatSupportSection 
              darkMode={darkMode} 
              cardClass={cardClass} 
              inputClass={inputClass}
              conversations={conversations}
              setConversations={setConversations}
              chatMessages={chatMessages}
              setChatMessages={setChatMessages}
              selectedConversation={selectedConversation}
              setSelectedConversation={setSelectedConversation}
              supabaseFetch={supabaseFetch}
              onUnreadCount={setChatUnreadCount}
            />
          )}

          {/* Promoteurs Tab */}
          {activeTab === 'promoteurs' && (
            <AdminPromoteurs darkMode={darkMode} />
          )}

          {/* Commandes Promoteurs Tab */}
          {activeTab === 'commandes_promo' && (
            <AdminCommandesPromo darkMode={darkMode} />
          )}

          {/* Notifications Promoteurs Tab */}
          {activeTab === 'notifs_promo' && (
            <AdminNotificationsPromo 
              darkMode={darkMode} 
              onUnreadCount={setNotifPromoCount}
            />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <AdminSettings darkMode={darkMode} />
          )}
        </div>
      </main>

      {/* Device Modal */}
      {deviceModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setDeviceModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div 
            className={`relative w-full max-w-md rounded-2xl border shadow-2xl ${darkMode ? 'bg-gray-900 border-slate-700' : 'bg-white border-gray-200'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between p-5 border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Appareils associés</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{deviceModal.userName}</p>
                </div>
              </div>
              <button 
                onClick={() => setDeviceModal(null)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
              {deviceModal.devices.length === 0 ? (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Smartphone className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>Aucun appareil associé</p>
                </div>
              ) : (
                deviceModal.devices.map((dev, i) => (
                  <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition ${darkMode ? 'bg-gray-800/50 border-slate-700 hover:border-purple-500/30' : 'bg-gray-50 border-gray-200 hover:border-purple-300'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${darkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-mono text-sm font-semibold">{dev.mac_address}</div>
                        <div className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {dev.device_name || `Appareil ${i + 1}`} — {dev.created_at ? formatDate(dev.created_at) : '--'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className={`px-5 py-3 border-t text-center ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {deviceModal.devices.length} appareil{deviceModal.devices.length !== 1 ? 's' : ''} trouvé{deviceModal.devices.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Drawer */}
      {userDrawer && (
        <div className="fixed inset-0 z-[9998] flex justify-end" onClick={() => setUserDrawer(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className={`relative w-full max-w-lg h-full overflow-y-auto shadow-2xl border-l ${darkMode ? 'bg-gray-900 border-slate-700' : 'bg-white border-gray-200'}`}
            onClick={e => e.stopPropagation()}
            style={{ animation: 'slideInRight 0.3s ease' }}
          >
            <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
            {/* Header */}
            <div className={`sticky top-0 z-10 backdrop-blur-xl p-5 border-b ${darkMode ? 'bg-gray-900/90 border-slate-700' : 'bg-white/90 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <button onClick={() => setUserDrawer(null)} className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { openEdit(userDrawer); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 transition">
                    <Edit2 className="w-3.5 h-3.5" /> Modifier
                  </button>
                  <button onClick={() => { deleteUser(userDrawer); setUserDrawer(null); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition">
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Card */}
            <div className="p-5 space-y-5">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3 shadow-lg shadow-pink-500/20">
                  {userDrawer.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <h2 className="text-xl font-bold">{userDrawer.full_name || '--'}</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {(() => { const b = getUserBadge(userDrawer._connCount); return <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${b.cls}`}>{b.label}</span>; })()}
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{userDrawer._connCount} connexion{userDrawer._connCount !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className={`rounded-xl border divide-y ${darkMode ? 'bg-gray-800/50 border-slate-700 divide-slate-700' : 'bg-gray-50 border-gray-200 divide-gray-200'}`}>
                {[
                  { icon: <User className="w-4 h-4" />, label: 'Nom complet', value: userDrawer.full_name || '--' },
                  { icon: <Phone className="w-4 h-4" />, label: 'WhatsApp', value: userDrawer.whatsapp || '--', link: userDrawer.whatsapp ? `https://wa.me/${userDrawer.whatsapp}` : null, color: 'text-green-500' },
                  { icon: <Hash className="w-4 h-4" />, label: 'NPI / RAVIP', value: userDrawer.npi_ravip || 'Non renseigné' },
                  { icon: <Wifi className="w-4 h-4" />, label: 'MAC principale', value: userDrawer.mac_address || '--', mono: true },
                  { icon: <Smartphone className="w-4 h-4" />, label: 'Appareils associés', value: `${userDrawer._devCount} appareil${userDrawer._devCount !== 1 ? 's' : ''}`, action: () => showUserDevices(userDrawer) },
                  { icon: <Calendar className="w-4 h-4" />, label: 'Membre depuis', value: userDrawer.registered_at ? formatDate(userDrawer.registered_at) : '--' },
                  { icon: <Clock className="w-4 h-4" />, label: 'Dernière connexion', value: userDrawer._lastSeen ? `${timeAgo(userDrawer._lastSeen)} — ${formatDate(userDrawer._lastSeen)}` : 'Jamais' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>{item.icon}</span>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.link ? (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className={`text-sm font-medium ${item.color || ''} hover:underline`}>{item.value}</a>
                      ) : item.action ? (
                        <button onClick={item.action} className="text-sm font-medium text-purple-400 hover:underline">{item.value}</button>
                      ) : (
                        <span className={`text-sm font-medium ${item.mono ? 'font-mono tracking-wider' : ''} ${item.color || ''}`}>{item.value}</span>
                      )}
                      {item.copy && item.value !== '----' && (
                        <button onClick={() => copyToClip(item.value)} className={`p-1 rounded transition ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-400'}`}>
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className={`rounded-xl p-4 border text-center ${darkMode ? 'bg-gray-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-xl font-bold text-pink-400">{formatCurrency(userDrawer._totalSpent)}</div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total dépensé</div>
                </div>
                <div className={`rounded-xl p-4 border text-center ${darkMode ? 'bg-gray-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-xl font-bold text-cyan-400">{userDrawer._connCount}</div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Connexions</div>
                </div>
                <div className={`rounded-xl p-4 border text-center ${darkMode ? 'bg-gray-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-xl font-bold text-purple-400">{userDrawer._devCount}</div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Appareils</div>
                </div>
              </div>

              {/* Recent Connections */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-pink-400" /> Dernières connexions
                </h3>
                <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-gray-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                  {userDrawer._conns && userDrawer._conns.length > 0 ? (
                    <div className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                      {userDrawer._conns.slice(0, 15).map((c, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5">
                          <div>
                            <div className="text-sm font-medium">{c.profile_name || '--'}</div>
                            <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {c.connected_at ? formatDate(c.connected_at) : '--'}
                            </div>
                          </div>
                          <span className={`text-sm font-bold ${c.price ? 'text-pink-400' : darkMode ? 'text-slate-600' : 'text-gray-400'}`}>
                            {c.price ? formatCurrency(c.price) : '--'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`p-6 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucune connexion</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className={`relative w-full max-w-md rounded-2xl border shadow-2xl ${darkMode ? 'bg-gray-900 border-slate-700' : 'bg-white border-gray-200'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between p-5 border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-bold">Modifier l'utilisateur</h3>
              </div>
              <button onClick={() => setEditModal(null)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { key: 'full_name', label: 'Nom complet', icon: <User className="w-4 h-4" />, type: 'text' },
                { key: 'whatsapp', label: 'WhatsApp', icon: <Phone className="w-4 h-4" />, type: 'tel' },
                { key: 'npi_ravip', label: 'NPI / RAVIP', icon: <Hash className="w-4 h-4" />, type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {field.icon} {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={editForm[field.key] || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none transition focus:border-pink-500 ${inputClass}`}
                  />
                </div>
              ))}
            </div>
            <div className={`flex gap-3 p-5 border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <button onClick={() => setEditModal(null)} className={`flex-1 px-4 py-2.5 rounded-xl border font-medium transition ${darkMode ? 'border-slate-700 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                Annuler
              </button>
              <button onClick={saveEdit} disabled={editSaving} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {editSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Chat Support Section Component
function ChatSupportSection({ 
  darkMode, cardClass, inputClass, conversations, setConversations,
  chatMessages, setChatMessages, selectedConversation, setSelectedConversation, supabaseFetch, onUnreadCount 
}) {
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState('list');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showActions, setShowActions] = useState(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const lastMessageCountRef = useRef({});
  const audioContextRef = useRef(null);

  // Fonction pour jouer un son de notification
  const playNotificationSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  // Fonction pour jouer un son d'envoi
  const playSendSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(600, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }, []);

  // Scroll automatique vers le bas
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, scrollToBottom]);

  // Fetch initial des conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Polling temps réel pour les messages et conversations
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      // Refresh conversations
      try {
        const data = await supabaseFetch('chat_conversations?select=*&order=updated_at.desc');
        if (Array.isArray(data)) {
          // Vérifier les nouveaux messages non lus
          const newUnread = {};
          for (const conv of data) {
            if (conv.status === 'open') {
              const msgData = await supabaseFetch(`chat_messages?conversation_id=eq.${conv.id}&select=id,sender_type&order=created_at.desc&limit=20`);
              const visitorMsgs = Array.isArray(msgData) ? msgData.filter(m => m.sender_type === 'visitor').length : 0;
              const prevCount = lastMessageCountRef.current[conv.id] || 0;
              
              if (visitorMsgs > prevCount && prevCount > 0) {
                // Nouveau message visiteur !
                playNotificationSound();
                newUnread[conv.id] = (unreadCounts[conv.id] || 0) + (visitorMsgs - prevCount);
              } else if (unreadCounts[conv.id]) {
                newUnread[conv.id] = unreadCounts[conv.id];
              }
              lastMessageCountRef.current[conv.id] = visitorMsgs;
            }
          }
          setUnreadCounts(prev => ({ ...prev, ...newUnread }));
          setConversations(data);
        }
      } catch (e) {}

      // Refresh messages si conversation sélectionnée
      if (selectedConversation?.id) {
        try {
          const msgData = await supabaseFetch(`chat_messages?conversation_id=eq.${selectedConversation.id}&order=created_at.asc`);
          if (Array.isArray(msgData) && msgData.length !== chatMessages.length) {
            const hadNewVisitorMsg = msgData.length > chatMessages.length && 
              msgData.slice(chatMessages.length).some(m => m.sender_type === 'visitor');
            if (hadNewVisitorMsg) {
              playNotificationSound();
            }
            setChatMessages(msgData);
            // Marquer comme lu
            setUnreadCounts(prev => ({ ...prev, [selectedConversation.id]: 0 }));
          }
        } catch (e) {}
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [selectedConversation, chatMessages.length, supabaseFetch, playNotificationSound, unreadCounts]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await supabaseFetch('chat_conversations?select=*&order=updated_at.desc');
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching conversations:', e);
    }
    setLoading(false);
  };

  const fetchMessages = async (conversationId) => {
    try {
      const data = await supabaseFetch(`chat_messages?conversation_id=eq.${conversationId}&order=created_at.asc`);
      setChatMessages(Array.isArray(data) ? data : []);
      // Marquer comme lu
      setUnreadCounts(prev => ({ ...prev, [conversationId]: 0 }));
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
  };

  const selectConversation = (conv) => {
    setSelectedConversation(conv);
    fetchMessages(conv.id);
    setMobileView('chat');
    setShowActions(null);
  };

  const backToList = () => {
    setMobileView('list');
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    playSendSound();

    const msg = {
      conversation_id: selectedConversation.id,
      sender_type: 'admin',
      sender_name: 'Support GigaZone',
      message: messageText,
      message_type: 'text'
    };

    // Ajouter optimistiquement
    setChatMessages(prev => [...prev, { ...msg, created_at: new Date().toISOString(), id: 'temp-' + Date.now() }]);

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/chat_messages`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(msg)
      });

      // Mettre à jour updated_at de la conversation
      await fetch(`${SUPABASE_URL}/rest/v1/chat_conversations?id=eq.${selectedConversation.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updated_at: new Date().toISOString() })
      });

      // Garder le focus sur l'input
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (e) {
      console.error('Error sending message:', e);
    }
  };

  const closeConversation = async (convId) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/chat_conversations?id=eq.${convId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'closed', closed_at: new Date().toISOString() })
      });
      fetchConversations();
      if (selectedConversation?.id === convId) {
        setSelectedConversation(null);
        setChatMessages([]);
        setMobileView('list');
      }
      setShowActions(null);
    } catch (e) {
      console.error('Error closing conversation:', e);
    }
  };

  const reopenConversation = async (convId) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/chat_conversations?id=eq.${convId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'open', closed_at: null, updated_at: new Date().toISOString() })
      });
      fetchConversations();
      if (selectedConversation?.id === convId) {
        setSelectedConversation({ ...selectedConversation, status: 'open', closed_at: null });
      }
      setShowActions(null);
    } catch (e) {
      console.error('Error reopening conversation:', e);
    }
  };

  const deleteConversation = async (convId) => {
    if (!window.confirm('Supprimer cette conversation et tous ses messages ?')) return;
    
    try {
      // Supprimer les messages d'abord
      await fetch(`${SUPABASE_URL}/rest/v1/chat_messages?conversation_id=eq.${convId}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      // Puis la conversation
      await fetch(`${SUPABASE_URL}/rest/v1/chat_conversations?id=eq.${convId}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      fetchConversations();
      if (selectedConversation?.id === convId) {
        setSelectedConversation(null);
        setChatMessages([]);
        setMobileView('list');
      }
      setShowActions(null);
    } catch (e) {
      console.error('Error deleting conversation:', e);
    }
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  const openConversations = conversations.filter(c => c.status === 'open');
  const closedConversations = conversations.filter(c => c.status === 'closed');
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  // Report unread count to parent for sidebar badge
  useEffect(() => {
    if (onUnreadCount) onUnreadCount(totalUnread);
  }, [totalUnread, onUnreadCount]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              Chat Support
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                  {totalUnread}
                </span>
              )}
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {openConversations.length} conversation{openConversations.length !== 1 ? 's' : ''} active{openConversations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button 
          onClick={fetchConversations}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:opacity-90 transition w-full sm:w-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Chat Interface */}
      <div className={`rounded-2xl border overflow-hidden ${cardClass}`} style={{ height: 'calc(100vh - 240px)', minHeight: '400px' }}>
        <div className="flex h-full">
          {/* Conversations List - Desktop always visible, Mobile conditional */}
          <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-80 border-r ${darkMode ? 'border-slate-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
            <div className={`p-4 border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'} flex items-center justify-between`}>
              <h3 className="font-semibold">Conversations</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-100 text-pink-600'}`}>
                {openConversations.length} active{openConversations.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-pink-500" />
                </div>
              ) : openConversations.length === 0 && closedConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-gray-400'}`} />
                  <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Aucune conversation</p>
                </div>
              ) : (
                <>
                  {/* Open conversations */}
                  {openConversations.map(conv => (
                    <div 
                      key={conv.id}
                      className={`p-4 cursor-pointer transition-colors border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'} ${
                        selectedConversation?.id === conv.id 
                          ? 'bg-pink-500/20 border-l-4 border-l-pink-500' 
                          : `hover:${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`
                      }`}
                    >
                      <div className="flex items-start gap-3" onClick={() => selectConversation(conv)}>
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                            <User className="w-5 h-5 text-pink-500" />
                          </div>
                          {unreadCounts[conv.id] > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                              {unreadCounts[conv.id]}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium truncate">{conv.visitor_name || 'Visiteur'}</span>
                            <span className={`text-xs flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {formatTime(conv.updated_at)}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {conv.page_url?.split('/').pop() || 'Page inconnue'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>En ligne</span>
                          </div>
                        </div>
                      </div>
                      {/* Actions rapides */}
                      <div className="flex gap-2 mt-2 pl-13">
                        <button 
                          onClick={(e) => { e.stopPropagation(); closeConversation(conv.id); }}
                          className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-slate-700 hover:bg-gray-700 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'} transition`}
                        >
                          ✓ Fermer
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                          className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-600'} transition`}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Closed conversations */}
                  {closedConversations.length > 0 && (
                    <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                      <div className={`px-4 py-2 ${darkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                        <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          Fermées ({closedConversations.length})
                        </span>
                      </div>
                      {closedConversations.map(conv => (
                        <div 
                          key={conv.id}
                          className={`p-3 cursor-pointer opacity-70 hover:opacity-100 transition border-b ${darkMode ? 'border-slate-700/30' : 'border-gray-100'} ${
                            selectedConversation?.id === conv.id ? (darkMode ? 'bg-gray-800' : 'bg-gray-100') : ''
                          }`}
                        >
                          <div className="flex items-center justify-between" onClick={() => selectConversation(conv)}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <XCircle className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                              <span className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {conv.visitor_name || 'Visiteur'}
                              </span>
                              <span className={`text-xs ${darkMode ? 'text-slate-600' : 'text-gray-400'}`}>
                                {formatDate(conv.closed_at || conv.updated_at)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2 pl-6">
                            <button 
                              onClick={(e) => { e.stopPropagation(); reopenConversation(conv.id); }}
                              className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' : 'bg-green-100 hover:bg-green-200 text-green-600'} transition`}
                            >
                              ↩ Rouvrir
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                              className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-600'} transition`}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Chat Area - Desktop always visible, Mobile conditional */}
          <div className={`${mobileView === 'chat' ? 'flex' : 'hidden'} lg:flex flex-col flex-1`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className={`p-3 sm:p-4 border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'} flex items-center gap-3`}>
                  <button 
                    onClick={backToList}
                    className={`lg:hidden p-2 -ml-1 rounded-lg transition ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                    <User className="w-5 h-5 text-pink-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{selectedConversation.visitor_name || 'Visiteur'}</h4>
                    <p className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {selectedConversation.visitor_ip || 'IP inconnue'} • {selectedConversation.page_url?.split('/').pop() || ''}
                    </p>
                  </div>
                  
                  {/* Actions boutons */}
                  <div className="flex items-center gap-2">
                    {selectedConversation.status === 'open' ? (
                      <button 
                        onClick={() => closeConversation(selectedConversation.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm flex-shrink-0 ${darkMode ? 'bg-slate-700 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} transition`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Fermer</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => reopenConversation(selectedConversation.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm flex-shrink-0 bg-green-500/20 text-green-400 hover:bg-green-500/30 transition`}
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Rouvrir</span>
                      </button>
                    )}
                    <button 
                      onClick={() => deleteConversation(selectedConversation.id)}
                      className={`p-1.5 rounded-lg text-red-400 ${darkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-100'} transition`}
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status banner si fermé */}
                {selectedConversation.status === 'closed' && (
                  <div className={`px-4 py-2 text-center text-sm ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                    Conversation fermée le {formatDate(selectedConversation.closed_at)} à {formatTime(selectedConversation.closed_at)}
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-gray-400'}`} />
                      <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Aucun message</p>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((msg, i) => (
                        <div key={msg.id || i} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2.5 ${
                            msg.sender_type === 'admin' 
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-br-sm' 
                              : msg.sender_type === 'ai'
                              ? `${darkMode ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-cyan-50 border border-cyan-200'} rounded-bl-sm`
                              : msg.sender_type === 'system'
                              ? `${darkMode ? 'bg-gray-800 border border-slate-700' : 'bg-gray-100 border border-gray-200'} rounded-lg text-center italic`
                              : `${darkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded-bl-sm`
                          }`}>
                            {msg.sender_type !== 'admin' && msg.sender_type !== 'system' && (
                              <div className={`text-xs font-medium mb-1 ${msg.sender_type === 'ai' ? 'text-cyan-400' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {msg.sender_type === 'ai' ? '🤖 Assistant IA' : msg.sender_name || 'Visiteur'}
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                            <div className={`text-[10px] mt-1 ${msg.sender_type === 'admin' ? 'text-white/70' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {formatTime(msg.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input Area */}
                {selectedConversation.status === 'open' && (
                  <div className={`p-3 sm:p-4 border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <div className="flex gap-2 sm:gap-3">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyPress}
                        placeholder="Votre message..."
                        autoComplete="off"
                        className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border outline-none focus:ring-2 focus:ring-pink-500/50 transition text-sm sm:text-base ${inputClass}`}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Envoyer</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <MessageCircle className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-slate-700' : 'text-gray-300'}`} />
                  <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Sélectionnez une conversation
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Choisissez une conversation pour commencer
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// Notifications Section Component
function NotificationsSection({ darkMode, cardClass, inputClass }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    icon: '',
    priority: 'normal',
    target: 'all',
    action_url: '',
    action_text: '',
    duration: 10000,
    play_sound: true
  });

  const NOTIFICATION_TYPES = [
    { id: 'info', label: 'Information', icon: 'ℹ️', color: 'blue' },
    { id: 'promo', label: 'Promotion', icon: '🎉', color: 'pink' },
    { id: 'alert', label: 'Alerte', icon: '⚠️', color: 'yellow' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧', color: 'gray' },
    { id: 'success', label: 'Succès', icon: '✅', color: 'green' },
    { id: 'urgent', label: 'Urgent', icon: '🚨', color: 'red' }
  ];

  const TARGETS = [
    { id: 'all', label: 'Tous les utilisateurs' },
    { id: 'login', label: 'Page de connexion' },
    { id: 'status', label: 'Page statut' },
    { id: 'alogin', label: 'Page après connexion' }
  ];

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/notifications?order=created_at.desc&limit=50`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
    setLoading(false);
  };

  // Send notification
  const sendNotification = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) return;

    setSending(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...formData,
          is_active: true,
          created_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        setFormData({
          title: '',
          message: '',
          type: 'info',
          icon: '',
          priority: 'normal',
          target: 'all',
          action_url: '',
          action_text: '',
          duration: 10000,
          play_sound: true
        });
        setShowForm(false);
        fetchNotifications();
      }
    } catch (e) {
      console.error('Error sending notification:', e);
    }
    setSending(false);
  };

  // Delete notification
  const deleteNotification = async (id) => {
    if (!confirm('Supprimer cette notification?')) return;
    
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      fetchNotifications();
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  };

  // Toggle notification active status
  const toggleActive = async (id, currentStatus) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      fetchNotifications();
    } catch (e) {
      console.error('Error toggling notification:', e);
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { 
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
  });

  const getTypeConfig = (type) => NOTIFICATION_TYPES.find(t => t.id === type) || NOTIFICATION_TYPES[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Bell className="w-7 h-7 text-pink-500" />
            Notifications Push
          </h2>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            Envoyez des notifications en temps réel à tous les clients connectés
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchNotifications}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${darkMode ? 'border-slate-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-100'} transition`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:opacity-90 transition"
          >
            <Megaphone className="w-4 h-4" />
            Nouvelle notification
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className={`p-6 rounded-2xl border ${cardClass}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Créer une notification
          </h3>
          
          <form onSubmit={sendNotification} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Offre spéciale!"
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-pink-500/50 transition ${inputClass}`}
                  maxLength={100}
                  required
                />
              </div>

              {/* Type */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {NOTIFICATION_TYPES.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({...formData, type: type.id, icon: type.icon})}
                      className={`p-2 rounded-lg border text-center transition ${
                        formData.type === type.id
                          ? 'border-pink-500 bg-pink-500/20'
                          : `${darkMode ? 'border-slate-700 hover:border-slate-600' : 'border-gray-200 hover:border-gray-300'}`
                      }`}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <p className="text-xs mt-1">{type.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Message *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Votre message aux utilisateurs..."
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-pink-500/50 transition resize-none ${inputClass}`}
                maxLength={500}
                required
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Target */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Cible
                </label>
                <select
                  value={formData.target}
                  onChange={(e) => setFormData({...formData, target: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-pink-500/50 transition ${inputClass}`}
                >
                  {TARGETS.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Priorité
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-pink-500/50 transition ${inputClass}`}
                >
                  <option value="low">Basse</option>
                  <option value="normal">Normale</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Durée (secondes)
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-pink-500/50 transition ${inputClass}`}
                >
                  <option value={5000}>5s</option>
                  <option value={10000}>10s</option>
                  <option value={15000}>15s</option>
                  <option value={30000}>30s</option>
                  <option value={0}>Manuel (fermeture manuelle)</option>
                </select>
              </div>
            </div>

            {/* Action URL */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  URL d'action (optionnel)
                </label>
                <input
                  type="url"
                  value={formData.action_url}
                  onChange={(e) => setFormData({...formData, action_url: e.target.value})}
                  placeholder="https://..."
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-pink-500/50 transition ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Texte du bouton
                </label>
                <input
                  type="text"
                  value={formData.action_text}
                  onChange={(e) => setFormData({...formData, action_text: e.target.value})}
                  placeholder="En savoir plus"
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-pink-500/50 transition ${inputClass}`}
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.play_sound}
                  onChange={(e) => setFormData({...formData, play_sound: e.target.checked})}
                  className="w-4 h-4 rounded border-slate-600 text-pink-500 focus:ring-pink-500"
                />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>🔔 Jouer un son</span>
              </label>
            </div>

            {/* Preview */}
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>APERÇU</p>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{formData.icon || getTypeConfig(formData.type).icon}</span>
                  <div>
                    <p className="font-semibold">{formData.title || 'Titre de la notification'}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formData.message || 'Votre message apparaîtra ici...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={`px-6 py-3 rounded-xl border ${darkMode ? 'border-slate-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-100'} transition`}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={sending || !formData.title || !formData.message}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition"
              >
                {sending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Envoyer maintenant
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { type: 'promo', title: '🎉 Promo Flash', message: 'Offre spéciale: -20% sur tous les forfaits pendant 1 heure!', color: 'from-pink-500 to-purple-500' },
          { type: 'maintenance', title: '🔧 Maintenance', message: 'Maintenance prévue ce soir de 23h à 2h. Merci de votre compréhension.', color: 'from-gray-500 to-slate-600' },
          { type: 'info', title: 'ℹ️ Information', message: 'Nouveau forfait disponible! Découvrez notre offre 7 jours illimitée.', color: 'from-blue-500 to-cyan-500' },
          { type: 'alert', title: '⚠️ Alerte', message: 'Votre session expire bientôt. Rechargez votre compte pour continuer.', color: 'from-yellow-500 to-orange-500' }
        ].map((template, i) => (
          <button
            key={i}
            onClick={() => {
              setFormData({...formData, ...template, icon: template.title.split(' ')[0]});
              setShowForm(true);
            }}
            className={`p-4 rounded-xl border ${cardClass} hover:scale-[1.02] transition-all text-left`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${template.color} flex items-center justify-center text-xl mb-3`}>
              {template.title.split(' ')[0]}
            </div>
            <h4 className="font-medium text-sm">{template.title.slice(3)}</h4>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'} line-clamp-2`}>{template.message}</p>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className={`rounded-2xl border ${cardClass} overflow-hidden`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'} flex items-center justify-between`}>
          <h3 className="font-semibold">Historique des notifications</h3>
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-pink-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-gray-400'}`} />
            <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Aucune notification envoyée</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {notifications.map(notif => {
              const typeConfig = getTypeConfig(notif.type);
              return (
                <div key={notif.id} className={`p-4 flex items-start gap-4 ${!notif.is_active ? 'opacity-50' : ''}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    darkMode ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    {notif.icon || typeConfig.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{notif.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        notif.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                        notif.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-slate-500/20 text-gray-400'
                      }`}>
                        {notif.priority}
                      </span>
                      {!notif.is_active && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-600/50 text-gray-400">
                          Désactivée
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} line-clamp-2`}>
                      {notif.message}
                    </p>
                    <div className={`flex items-center gap-4 mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <span>📅 {formatDate(notif.created_at)}</span>
                      <span>🎯 {TARGETS.find(t => t.id === notif.target)?.label || notif.target}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(notif.id, notif.is_active)}
                      className={`p-2 rounded-lg transition ${
                        notif.is_active 
                          ? 'text-green-500 hover:bg-green-500/20' 
                          : `${darkMode ? 'text-gray-500 hover:bg-gray-800' : 'text-gray-400 hover:bg-gray-100'}`
                      }`}
                      title={notif.is_active ? 'Désactiver' : 'Activer'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className={`p-2 rounded-lg ${darkMode ? 'text-gray-500 hover:bg-red-500/20 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'} transition`}
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Promo Codes Section Component
function PromoCodesSection({ darkMode, cardClass, inputClass }) {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percent',
    discount_value: 10,
    min_amount: 150,
    max_uses: null,
    valid_until: ''
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/promo_codes?order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      const data = await response.json();
      setPromoCodes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching promo codes:', e);
    }
    setLoading(false);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'GZ';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({...formData, code});
  };

  const savePromoCode = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discount_value) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        max_uses: formData.max_uses || null,
        valid_until: formData.valid_until || null,
        is_active: true
      };

      const url = editingId 
        ? `${SUPABASE_URL}/rest/v1/promo_codes?id=eq.${editingId}`
        : `${SUPABASE_URL}/rest/v1/promo_codes`;

      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        resetForm();
        fetchPromoCodes();
      }
    } catch (e) {
      console.error('Error saving promo code:', e);
    }
    setSaving(false);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percent',
      discount_value: 10,
      min_amount: 150,
      max_uses: null,
      valid_until: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  const editPromoCode = (promo) => {
    setFormData({
      code: promo.code,
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_amount: promo.min_amount,
      max_uses: promo.max_uses || '',
      valid_until: promo.valid_until ? promo.valid_until.split('T')[0] : ''
    });
    setEditingId(promo.id);
    setShowForm(true);
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/promo_codes?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      fetchPromoCodes();
    } catch (e) {
      console.error('Error toggling promo code:', e);
    }
  };

  const deletePromoCode = async (id) => {
    if (!confirm('Supprimer ce code promo?')) return;
    
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/promo_codes?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      fetchPromoCodes();
    } catch (e) {
      console.error('Error deleting promo code:', e);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR', { 
    day: '2-digit', month: 'short', year: 'numeric'
  }) : 'Illimité';

  const activeCount = promoCodes.filter(p => p.is_active).length;
  const totalUses = promoCodes.reduce((sum, p) => sum + (p.current_uses || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Tag className="w-7 h-7 text-pink-500" />
            Codes Promo
          </h2>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            {activeCount} code{activeCount !== 1 ? 's' : ''} actif{activeCount !== 1 ? 's' : ''} • {totalUses} utilisation{totalUses !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchPromoCodes}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${darkMode ? 'border-slate-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-100'} transition`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button 
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Nouveau code
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className={`p-5 rounded-2xl border ${cardClass}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Codes actifs</span>
          </div>
          <p className="text-3xl font-bold">{activeCount}</p>
        </div>
        <div className={`p-5 rounded-2xl border ${cardClass}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-500" />
            </div>
            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Utilisations</span>
          </div>
          <p className="text-3xl font-bold">{totalUses}</p>
        </div>
        <div className={`p-5 rounded-2xl border ${cardClass}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Percent className="w-5 h-5 text-purple-500" />
            </div>
            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Total codes</span>
          </div>
          <p className="text-3xl font-bold">{promoCodes.length}</p>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className={`p-6 rounded-2xl border ${cardClass}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-500" />
            {editingId ? 'Modifier le code' : 'Créer un code promo'}
          </h3>
          
          <form onSubmit={savePromoCode} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Code */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="GZPROMO10"
                    className={`flex-1 px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-pink-500/50 transition uppercase font-mono ${inputClass}`}
                    maxLength={20}
                    required
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className={`px-4 py-3 rounded-xl border ${darkMode ? 'border-slate-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-100'} transition`}
                    title="Générer un code"
                  >
                    <Zap className="w-5 h-5 text-yellow-500" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Ex: Promo rentrée scolaire"
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-pink-500/50 transition ${inputClass}`}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {/* Type */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Type de réduction
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-pink-500/50 transition ${inputClass}`}
                >
                  <option value="percent">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe (F)</option>
                </select>
              </div>

              {/* Value */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Valeur *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({...formData, discount_value: parseInt(e.target.value) || 0})}
                    min={1}
                    max={formData.discount_type === 'percent' ? 100 : 10000}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-pink-500/50 transition ${inputClass}`}
                    required
                  />
                  <span className={`absolute right-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formData.discount_type === 'percent' ? '%' : 'F'}
                  </span>
                </div>
              </div>

              {/* Min Amount */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Montant min
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.min_amount}
                    onChange={(e) => setFormData({...formData, min_amount: parseInt(e.target.value) || 150})}
                    min={0}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-pink-500/50 transition ${inputClass}`}
                  />
                  <span className={`absolute right-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>F</span>
                </div>
              </div>

              {/* Max Uses */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Utilisations max
                </label>
                <input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({...formData, max_uses: e.target.value ? parseInt(e.target.value) : ''})}
                  placeholder="Illimité"
                  min={1}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-pink-500/50 transition ${inputClass}`}
                />
              </div>
            </div>

            {/* Valid Until */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date d'expiration
                </label>
                <input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-pink-500/50 transition ${inputClass}`}
                />
              </div>
              <div className={`flex items-end pb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`}>
                Laissez vide pour un code sans expiration
              </div>
            </div>

            {/* Preview */}
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>APERÇU</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎟️</span>
                  <div>
                    <p className="font-mono font-bold text-lg">{formData.code || 'CODE'}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formData.description || 'Aucune description'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-500">
                    -{formData.discount_value}{formData.discount_type === 'percent' ? '%' : 'F'}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Min: {formData.min_amount}F
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className={`px-6 py-3 rounded-xl border ${darkMode ? 'border-slate-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-100'} transition`}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving || !formData.code || !formData.discount_value}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {editingId ? 'Modifier' : 'Créer le code'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promo Codes List */}
      <div className={`rounded-2xl border ${cardClass} overflow-hidden`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'} flex items-center justify-between`}>
          <h3 className="font-semibold">Liste des codes promo</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-pink-500" />
          </div>
        ) : promoCodes.length === 0 ? (
          <div className="p-8 text-center">
            <Tag className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-gray-400'}`} />
            <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Aucun code promo créé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Code</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Réduction</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Utilisations</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Expiration</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Statut</th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {promoCodes.map(promo => (
                  <tr key={promo.id} className={!promo.is_active ? 'opacity-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-pink-500">{promo.code}</span>
                        <button 
                          onClick={() => copyCode(promo.code)}
                          className={`p-1 rounded ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                          title="Copier"
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                      {promo.description && (
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{promo.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-green-500">
                        -{promo.discount_value}{promo.discount_type === 'percent' ? '%' : 'F'}
                      </span>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Min: {promo.min_amount}F</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold">{promo.current_uses || 0}</span>
                      <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
                        {promo.max_uses ? ` / ${promo.max_uses}` : ' / ∞'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                        {formatDate(promo.valid_until)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        promo.is_active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-slate-500/20 text-gray-400'
                      }`}>
                        {promo.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => editPromoCode(promo)}
                          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition`}
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => toggleActive(promo.id, promo.is_active)}
                          className={`p-2 rounded-lg transition ${
                            promo.is_active 
                              ? 'text-green-500 hover:bg-green-500/20' 
                              : `${darkMode ? 'text-gray-500 hover:bg-gray-800' : 'text-gray-400 hover:bg-gray-100'}`
                          }`}
                          title={promo.is_active ? 'Désactiver' : 'Activer'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePromoCode(promo.id)}
                          className={`p-2 rounded-lg ${darkMode ? 'text-gray-500 hover:bg-red-500/20 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'} transition`}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
