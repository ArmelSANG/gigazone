import React, { useState } from 'react';
import { 
  Search, Wifi, Clock, CreditCard, Activity, 
  CheckCircle, XCircle, AlertCircle, ArrowRight, ArrowLeft,
  History, Zap, Globe, User, Phone, Smartphone, Sun, Moon, Monitor
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { usePageSEO, SEO_CONFIGS } from '../hooks/usePageSEO';

const SUPABASE_URL = 'https://dfflzuwyntrdfxujvsqr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmZmx6dXd5bnRyZGZ4dWp2c3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNDE4NjMsImV4cCI6MjA4NDgxNzg2M30.tZgXgUUalq-5y7nh1fxA5mo5CsGJU2_8l_T-z1Cc-24';

const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { 
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
});
const formatCurrency = (num) => new Intl.NumberFormat('fr-FR').format(num || 0) + ' FCFA';
const maskWhatsApp = (num) => {
  if (!num || num.length < 4) return num || '--';
  const str = String(num);
  return str.slice(0, -4) + '**' + str.slice(-2);
};

export default function PublicCheck() {
  usePageSEO(SEO_CONFIGS.check);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  
  // Thème unifié (partagé avec les autres pages)
  const { isDark: dark, toggle: toggleTheme } = useTheme();

  const handleCodeChange = (e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''));

  const verifyCode = async (e) => {
    e.preventDefault();
    const cleanedCode = code.replace(/[^a-zA-Z0-9]/g, '').trim();
    if (!cleanedCode) { setError('Veuillez entrer un code WiFi'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const connResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/connections?username=eq.${encodeURIComponent(cleanedCode)}&select=*&order=connected_at.desc`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
      );
      const connData = await connResponse.json();
      if (connData && connData.length > 0) {
        const macAddresses = [...new Set(connData.map(c => c.mac_address).filter(Boolean))];
        
        // Récupérer les utilisateurs enregistrés (par MAC)
        let linkedUsers = [];
        
        if (macAddresses.length > 0) {
          const macFilter = macAddresses.map(m => `mac_address.eq.${encodeURIComponent(m)}`).join(',');
          const userByMacRes = await fetch(
            `${SUPABASE_URL}/rest/v1/users?or=(${macFilter})&select=full_name,whatsapp,mac_address`,
            { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
          );
          const userByMac = await userByMacRes.json();
          if (Array.isArray(userByMac)) linkedUsers.push(...userByMac);
        }
        
        // Créer un map des utilisateurs par MAC
        const userByMacMap = {};
        for (const u of linkedUsers) {
          if (u.mac_address) userByMacMap[u.mac_address.toUpperCase()] = u;
        }
        
        // Créer la liste des appareils basée sur les MAC des connexions
        const devices = macAddresses.map(mac => {
          const user = userByMacMap[mac.toUpperCase()];
          const deviceConns = connData.filter(c => c.mac_address === mac);
          return {
            mac_address: mac,
            full_name: user?.full_name || null,
            whatsapp: user?.whatsapp || null,
            sessions: deviceConns.length,
            lastSeen: deviceConns[0]?.connected_at || null
          };
        });
        
        const totalSpent = connData.reduce((sum, c) => sum + (c.price || 0), 0);
        setResult({ 
          found: true, 
          code: cleanedCode, 
          totalSessions: connData.length, 
          totalSpent, 
          lastConnection: connData[0], 
          history: connData.slice(0, 10), 
          users: linkedUsers.filter((u, i, arr) => arr.findIndex(x => x.mac_address === u.mac_address) === i),
          devices: devices
        });
      } else {
        setResult({ found: false, code: cleanedCode });
      }
    } catch (err) { console.error('Error:', err); setError('Une erreur est survenue. Veuillez réessayer.'); }
    setLoading(false);
  };

  // Theme classes
  const bg = dark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900';
  const card = dark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200 shadow-sm';
  const cardInner = dark ? 'bg-slate-800/60' : 'bg-gray-50 border border-gray-200';
  const input = dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200';
  const inputText = dark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-gray-400';
  const sub = dark ? 'text-slate-400' : 'text-gray-500';
  const sub2 = dark ? 'text-slate-500' : 'text-gray-400';
  const histRow = dark ? 'bg-slate-800/50' : 'bg-gray-50';
  const notFoundBg = dark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200 shadow-sm';
  const btnSecBg = dark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300 text-slate-900';

  return (
    <div className={`min-h-screen ${bg}`}>
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-40 -left-40 w-80 h-80 bg-pink-500 rounded-full filter blur-[120px] ${dark ? 'opacity-20' : 'opacity-10'}`} />
        <div className={`absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500 rounded-full filter blur-[120px] ${dark ? 'opacity-20' : 'opacity-10'}`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-cyan-500 rounded-full filter blur-[120px] ${dark ? 'opacity-10' : 'opacity-5'}`} />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Theme toggle */}
        <div className="flex justify-end mb-2">
          <button 
            onClick={toggleTheme} 
            className={`p-2 rounded-xl transition-all ${dark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-200 text-gray-500'}`}
            title={dark ? 'Mode clair' : 'Mode sombre'}
          >
            {dark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 shadow-lg shadow-pink-500/30">
            <Wifi className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-3">
            <span>Giga</span>
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Zone</span>
          </h1>
          <p className={`${sub} text-sm sm:text-base`}>Vérification de code WiFi</p>
          <p className={`text-xs ${sub2} mt-1`}>z.ifiaas.com/check</p>
        </div>

        {/* Search Form */}
        <form onSubmit={verifyCode} className="mb-6 sm:mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl blur opacity-30" />
            <div className={`relative ${input} rounded-2xl p-2 border`}>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-3 px-3 sm:px-4">
                  <Search className={`w-5 h-5 ${sub} flex-shrink-0`} />
                  <input type="text" value={code} onChange={handleCodeChange} placeholder="Entrez votre code WiFi..."
                    className={`flex-1 bg-transparent ${inputText} outline-none py-3 text-base sm:text-lg w-full`} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 flex-shrink-0">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Vérifier</span><ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          </div>
          <p className={`text-xs ${sub2} mt-2 text-center`}>Lettres et chiffres uniquement (espaces ignorés)</p>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-400 text-sm sm:text-base">{error}</span>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 sm:space-y-6">
            {result.found ? (
              <>
                {/* Success */}
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-green-500" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold">Code valide</h2>
                      <p className={`${sub} text-sm truncate`}>Code: <span className="font-mono text-green-400">{result.code}</span></p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={() => setShowSessionsModal(true)}
                    className={`${card} border rounded-xl p-4 sm:p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                      </div>
                      <span className={`${sub} text-xs sm:text-sm`}>Appareils</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold">{result.devices?.length || 0}</p>
                    <p className={`text-xs ${sub2} mt-1`}>Cliquez pour voir les détails</p>
                  </button>
                  <div className={`${card} border rounded-xl p-4 sm:p-5`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      </div>
                      <span className={`${sub} text-xs sm:text-sm`}>Dépensé</span>
                    </div>
                    <p className="text-xl sm:text-3xl font-bold text-green-500">{formatCurrency(result.totalSpent)}</p>
                  </div>
                </div>

                {/* Sessions Modal */}
                {showSessionsModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowSessionsModal(false)}>
                    <div 
                      className={`w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl ${dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} border shadow-2xl`}
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Header fixe */}
                      <div className={`px-4 sm:px-5 py-4 border-b ${dark ? 'border-slate-700' : 'border-gray-200'} flex items-center justify-between flex-shrink-0`}>
                        <div>
                          <h3 className="font-semibold flex items-center gap-2 text-base">
                            <Smartphone className="w-5 h-5 text-pink-500" />
                            Appareils connectés
                          </h3>
                          <p className={`text-xs ${sub2} mt-0.5`}>{result.devices?.length || 0} appareil{(result.devices?.length || 0) > 1 ? 's' : ''} • {result.totalSessions} connexion{result.totalSessions > 1 ? 's' : ''}</p>
                        </div>
                        <button 
                          onClick={() => setShowSessionsModal(false)}
                          className={`p-2 -mr-2 rounded-xl transition ${dark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Contenu scrollable */}
                      <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
                        {result.devices && result.devices.length > 0 ? (
                          <div className="space-y-3">
                            {result.devices.map((device, i) => (
                              <div key={i} className={`${cardInner} rounded-xl p-3 sm:p-4 transition-all hover:scale-[1.01]`}>
                                {/* En-tête appareil */}
                                <div className="flex items-start gap-3 mb-3">
                                  <div className={`w-10 h-10 rounded-xl ${device.full_name ? 'bg-gradient-to-br from-pink-500 to-purple-600' : dark ? 'bg-slate-700' : 'bg-gray-200'} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                                    {device.full_name ? device.full_name.charAt(0).toUpperCase() : <Smartphone className={`w-5 h-5 ${dark ? 'text-slate-400' : 'text-gray-500'}`} />}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold truncate text-sm sm:text-base">{device.full_name || 'Appareil non enregistré'}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-100 text-pink-600'}`}>
                                        {device.sessions} session{device.sessions > 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Infos détaillées */}
                                <div className={`space-y-2.5 pt-3 border-t ${dark ? 'border-slate-700' : 'border-gray-200'}`}>
                                  {/* WhatsApp */}
                                  <div className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-lg ${dark ? 'bg-green-500/20' : 'bg-green-100'} flex items-center justify-center flex-shrink-0`}>
                                      <Phone className="w-3.5 h-3.5 text-green-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className={`text-xs ${sub2}`}>WhatsApp</p>
                                      {device.whatsapp ? (
                                        <a href={`https://wa.me/${device.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 hover:underline text-sm font-mono">
                                          {maskWhatsApp(device.whatsapp)}
                                        </a>
                                      ) : <span className={`${sub2} text-sm`}>Non renseigné</span>}
                                    </div>
                                  </div>
                                  
                                  {/* MAC */}
                                  <div className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-lg ${dark ? 'bg-cyan-500/20' : 'bg-cyan-100'} flex items-center justify-center flex-shrink-0`}>
                                      <Smartphone className="w-3.5 h-3.5 text-cyan-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className={`text-xs ${sub2}`}>Adresse MAC</p>
                                      <p className={`${sub} text-sm font-mono truncate`}>{device.mac_address || '--'}</p>
                                    </div>
                                  </div>
                                  
                                  {/* Dernière connexion */}
                                  <div className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-lg ${dark ? 'bg-purple-500/20' : 'bg-purple-100'} flex items-center justify-center flex-shrink-0`}>
                                      <Clock className="w-3.5 h-3.5 text-purple-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className={`text-xs ${sub2}`}>Dernière connexion</p>
                                      <p className={`text-sm font-medium`}>{device.lastSeen ? formatDate(device.lastSeen) : '--'}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <div className={`w-16 h-16 rounded-2xl ${dark ? 'bg-slate-800' : 'bg-gray-100'} flex items-center justify-center mx-auto mb-4`}>
                              <Smartphone className={`w-8 h-8 ${dark ? 'text-slate-600' : 'text-gray-400'}`} />
                            </div>
                            <p className={`font-medium ${sub}`}>Aucun appareil</p>
                            <p className={`text-sm ${sub2} mt-1`}>Pas d'appareil connecté avec ce code</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Footer avec indication scroll si nécessaire */}
                      {result.devices && result.devices.length > 2 && (
                        <div className={`px-4 py-2 border-t ${dark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-100 bg-gray-50'} text-center flex-shrink-0`}>
                          <p className={`text-xs ${sub2}`}>↕ Faites défiler pour voir plus</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Connected Users */}
                {result.users && result.users.length > 0 && (
                  <div className={`${card} border rounded-xl p-4 sm:p-5`}>
                    <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                      Utilisateur{result.users.length > 1 ? 's' : ''} associé{result.users.length > 1 ? 's' : ''}
                    </h3>
                    <div className="space-y-3">
                      {result.users.map((u, i) => (
                        <div key={i} className={`${cardInner} rounded-xl p-3 sm:p-4`}>
                          <div className="flex items-center gap-3 mb-2.5">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <p className="font-semibold text-sm sm:text-base truncate">{u.full_name || 'Non renseigné'}</p>
                          </div>
                          <div className="space-y-2 ml-0 sm:ml-[52px]">
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                              {u.whatsapp ? (
                                <a href={`https://wa.me/${u.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 hover:underline text-sm">
                                  {maskWhatsApp(u.whatsapp)}
                                </a>
                              ) : <span className={`${sub2} text-sm`}>Non renseigné</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                              <span className={`${sub} text-xs sm:text-sm font-mono truncate`}>{u.mac_address || '--'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last Connection */}
                {result.lastConnection && (
                  <div className={`${card} border rounded-xl p-4 sm:p-5`}>
                    <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />
                      Dernière connexion
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                      <div>
                        <span className={`${sub2} text-xs sm:text-sm`}>Forfait</span>
                        <p className="font-medium text-pink-400 text-sm sm:text-base">{result.lastConnection.profile_name}</p>
                      </div>
                      <div>
                        <span className={`${sub2} text-xs sm:text-sm`}>Prix</span>
                        <p className="font-medium text-green-400 text-sm sm:text-base">{formatCurrency(result.lastConnection.price)}</p>
                      </div>
                      <div className="col-span-2">
                        <span className={`${sub2} text-xs sm:text-sm`}>Date</span>
                        <p className="font-medium text-sm sm:text-base">{formatDate(result.lastConnection.connected_at)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* History */}
                {result.history.length > 1 && (
                  <div className={`${card} border rounded-xl p-4 sm:p-5`}>
                    <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                      <History className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                      Historique des connexions
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {result.history.map((conn, i) => (
                        <div key={i} className={`flex items-center justify-between p-2.5 sm:p-3 ${histRow} rounded-lg gap-2`}>
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-2 h-2 rounded-full flex-shrink-0 bg-pink-500" />
                            <div className="min-w-0">
                              <p className="font-medium text-xs sm:text-sm truncate">{conn.profile_name}</p>
                              <p className={`text-xs ${sub2}`}>{formatDate(conn.connected_at)}</p>
                            </div>
                          </div>
                          <span className="text-green-400 font-medium text-xs sm:text-sm whitespace-nowrap">{formatCurrency(conn.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={`${notFoundBg} border rounded-2xl p-6 sm:p-8 text-center`}>
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${dark ? 'bg-slate-800' : 'bg-gray-100'} flex items-center justify-center mx-auto mb-4`}>
                  <XCircle className={`w-7 h-7 sm:w-8 sm:h-8 ${dark ? 'text-slate-500' : 'text-gray-400'}`} />
                </div>
                <h2 className="text-lg sm:text-xl font-bold mb-2">Code non trouvé</h2>
                <p className={`${sub} text-sm sm:text-base mb-6`}>
                  Le code «<span className="font-mono text-pink-400">{result.code}</span>» n'a aucun historique.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a href="http://10.10.10.1/status"
                    className="px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm sm:text-base">
                    <ArrowLeft className="w-5 h-5" /> Retour
                  </a>
                  <a href="https://wa.me/2290167455462" target="_blank" rel="noopener noreferrer"
                    className={`px-5 py-3 ${btnSecBg} rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 text-sm sm:text-base`}>
                    <Globe className="w-5 h-5" /> Contacter le support
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Cards */}
        {!result && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
            <div className={`${card} border rounded-xl p-4 sm:p-5`}>
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center mb-3">
                <Search className="w-5 h-5 text-pink-500" />
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Vérifiez votre code</h3>
              <p className={`text-xs sm:text-sm ${sub}`}>Entrez votre code WiFi ou identifiant pour consulter votre historique de connexion.</p>
            </div>
            <div className={`${card} border rounded-xl p-4 sm:p-5`}>
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                <History className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Historique complet</h3>
              <p className={`text-xs sm:text-sm ${sub}`}>Consultez toutes vos sessions, forfaits utilisés et dépenses totales.</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 sm:mt-16 text-center pb-4">
          <p className={`${sub2} text-xs sm:text-sm`}>
            GigaZone by <a href="https://ifiaas.com" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline">IFIAAS</a>
          </p>
          <p className={`${dark ? 'text-slate-600' : 'text-gray-300'} text-xs mt-1`}>© 2026 - Tous droits réservés</p>
        </footer>
      </div>
    </div>
  );
}
