import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, Filter, Eye, Ban, CheckCircle, XCircle, 
  Phone, MapPin, Calendar, TrendingUp, Gift, Download,
  ChevronDown, ChevronUp, ExternalLink, RefreshCw, Award, Percent, Save, Link, Trash2, AlertTriangle
} from 'lucide-react';
import { supabaseGet, supabasePatch, supabasePost, supabaseDelete } from '../../config/supabase';
import { formatCurrency, formatDate, formatWhatsAppLink, getNiveauInfo, getNiveauBonus } from '../../utils/helpers';

export default function AdminPromoteurs({ darkMode }) {
  const [promoteurs, setPromoteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPromoteur, setSelectedPromoteur] = useState(null);
  const [stats, setStats] = useState({ total: 0, actifs: 0, bronze: 0, silver: 0, gold: 0 });
  
  // Taux global et édition taux
  const [tauxGlobal, setTauxGlobal] = useState(70);
  const [editingTaux, setEditingTaux] = useState(null);
  const [savingTaux, setSavingTaux] = useState(false);
  
  // Suppression
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Charger promoteurs et taux global
  useEffect(() => {
    loadPromoteurs();
    loadTauxGlobal();
  }, []);

  const loadTauxGlobal = async () => {
    const settings = await supabaseGet('settings_global?cle=eq.taux_remise_global');
    if (settings && settings[0]) {
      setTauxGlobal(parseFloat(settings[0].valeur) || 70);
    }
  };

  const loadPromoteurs = async () => {
    setLoading(true);
    const data = await supabaseGet('promoteurs?select=*&order=created_at.desc');
    if (data) {
      setPromoteurs(data);
      
      // Stats
      setStats({
        total: data.length,
        actifs: data.filter(p => p.actif).length,
        bronze: data.filter(p => p.niveau === 'bronze').length,
        silver: data.filter(p => p.niveau === 'silver').length,
        gold: data.filter(p => p.niveau === 'gold').length
      });
    }
    setLoading(false);
  };

  // Sauvegarder le taux personnalisé
  const saveTauxPersonnalise = async () => {
    if (!selectedPromoteur) return;
    setSavingTaux(true);
    
    const newTaux = editingTaux === '' || editingTaux === null ? null : parseFloat(editingTaux);
    
    await supabasePatch(`promoteurs?id=eq.${selectedPromoteur.id}`, {
      taux_remise: newTaux
    });
    
    // Mettre à jour localement
    setPromoteurs(prev => prev.map(p => 
      p.id === selectedPromoteur.id ? { ...p, taux_remise: newTaux } : p
    ));
    setSelectedPromoteur(prev => ({ ...prev, taux_remise: newTaux }));
    
    setSavingTaux(false);
  };

  // Calculer le taux effectif d'un promoteur
  const getTauxEffectifPromoteur = (promoteur) => {
    const tauxBase = promoteur.taux_remise !== null && promoteur.taux_remise !== undefined 
      ? parseFloat(promoteur.taux_remise) 
      : tauxGlobal;
    const bonus = getNiveauBonus(promoteur.niveau);
    return {
      tauxBase,
      bonus,
      total: tauxBase + bonus,
      estPersonnalise: promoteur.taux_remise !== null && promoteur.taux_remise !== undefined
    };
  };

  // Filtrer promoteurs
  const filteredPromoteurs = useMemo(() => {
    let result = [...promoteurs];
    
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => 
        p.nom_complet?.toLowerCase().includes(s) ||
        p.code_unique?.toLowerCase().includes(s) ||
        p.whatsapp?.includes(s) ||
        p.ville?.toLowerCase().includes(s)
      );
    }
    
    if (filterNiveau !== 'all') {
      result = result.filter(p => p.niveau === filterNiveau);
    }
    
    if (filterStatus !== 'all') {
      result = result.filter(p => filterStatus === 'actif' ? p.actif : !p.actif);
    }
    
    return result;
  }, [promoteurs, search, filterNiveau, filterStatus]);

  // Suspendre/Activer promoteur
  const toggleStatus = async (promoteur) => {
    await supabasePatch(`promoteurs?id=eq.${promoteur.id}`, { 
      actif: !promoteur.actif 
    });
    loadPromoteurs();
  };

  // Suppression complète d'un promoteur et toutes ses données
  const deletePromoteur = async (promoteur) => {
    setDeleting(true);
    try {
      const pid = promoteur.id;
      
      // 1. Supprimer les tokens de réinitialisation
      await supabaseDelete(`reset_tokens?promoteur_id=eq.${pid}`);
      
      // 2. Supprimer les demandes de récupération
      await supabaseDelete(`demandes_recuperation?promoteur_id=eq.${pid}`);
      
      // 3. Supprimer les notifications du promoteur
      await supabaseDelete(`notifications_promoteurs?promoteur_id=eq.${pid}`);
      
      // 4. Supprimer les notifications admin liées
      await supabaseDelete(`notifications_admin?promoteur_id=eq.${pid}`);
      
      // 5. Supprimer les commissions (en tant que promoteur ET filleul)
      await supabaseDelete(`commissions_historique?promoteur_id=eq.${pid}`);
      await supabaseDelete(`commissions_historique?filleul_id=eq.${pid}`);
      
      // 6. Supprimer les commandes
      await supabaseDelete(`commandes_promoteurs?promoteur_id=eq.${pid}`);
      
      // 7. Détacher les filleuls (mettre parrain_id à null)
      await supabasePatch(`promoteurs?parrain_id=eq.${pid}`, { parrain_id: null });
      
      // 8. Supprimer le promoteur
      await supabaseDelete(`promoteurs?id=eq.${pid}`);
      
      setSelectedPromoteur(null);
      setConfirmDelete(null);
      setEditingTaux(null);
      loadPromoteurs();
    } catch (e) {
      console.error('Erreur suppression promoteur:', e);
      alert('Erreur lors de la suppression. Réessayez.');
    }
    setDeleting(false);
  };

  // Générer token unique pour réinitialisation
  const generateResetToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 48; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  // Envoyer lien de réinitialisation sécurisé
  const sendRecoveryLink = async (promoteur) => {
    try {
      // Générer un token unique
      const token = generateResetToken();
      
      // Date d'expiration (24h)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Sauvegarder dans la base de données
      const result = await supabasePost('reset_tokens', {
        promoteur_id: promoteur.id,
        token: token,
        expires_at: expiresAt.toISOString(),
        created_by: 'admin'
      });
      
      if (!result) {
        alert('Erreur lors de la création du lien. Veuillez réessayer.');
        return;
      }
      
      // Construire le lien
      const resetLink = `https://z.ifiaas.com/reset/${token}`;
      
      // Message WhatsApp
      const message = `🔐 *GigaZone - Réinitialisation de votre code*

Bonjour ${promoteur.nom_complet},

Cliquez sur le lien ci-dessous pour réinitialiser votre code de connexion :

${resetLink}

⏰ Ce lien expire dans 24 heures.

⚠️ *Attention* : Une fois utilisé, votre ancien code ne fonctionnera plus.

Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.

L'équipe GigaZone`;

      window.open(formatWhatsAppLink(promoteur.whatsapp, message), '_blank');
      
      alert('Lien de réinitialisation envoyé !');
      
    } catch (error) {
      console.error('Erreur envoi lien reset:', error);
      alert('Erreur lors de l\'envoi du lien.');
    }
  };

  const cardBg = darkMode ? 'bg-slate-800/50' : 'bg-white';
  const cardBorder = darkMode ? 'border-slate-700' : 'border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-slate-400' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200';

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'pink' },
          { label: 'Actifs', value: stats.actifs, color: 'green' },
          { label: '🥉 Bronze', value: stats.bronze, color: 'orange' },
          { label: '🥈 Silver', value: stats.silver, color: 'gray' },
          { label: '🥇 Gold', value: stats.gold, color: 'yellow' }
        ].map(s => (
          <div key={s.label} className={`${cardBg} border ${cardBorder} rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${textPrimary}`}>{s.value}</div>
            <div className={`text-sm ${textSecondary}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className={`${cardBg} border ${cardBorder} rounded-xl p-4`}>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${textSecondary}`} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher promoteur..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl ${inputBg} ${textPrimary} border outline-none focus:border-pink-500`}
              />
            </div>
          </div>
          
          <select
            value={filterNiveau}
            onChange={(e) => setFilterNiveau(e.target.value)}
            className={`px-4 py-2.5 rounded-xl ${inputBg} ${textPrimary} border outline-none`}
          >
            <option value="all">Tous niveaux</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2.5 rounded-xl ${inputBg} ${textPrimary} border outline-none`}
          >
            <option value="all">Tous statuts</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Suspendus</option>
          </select>
          
          <button
            onClick={loadPromoteurs}
            className={`p-2.5 rounded-xl ${inputBg} border hover:border-pink-500 transition`}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''} ${textSecondary}`} />
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPromoteurs.length === 0 ? (
          <div className="text-center py-12">
            <Users className={`w-12 h-12 mx-auto mb-3 ${textSecondary} opacity-50`} />
            <p className={textSecondary}>Aucun promoteur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-900/50' : 'bg-gray-50'} border-b ${cardBorder}`}>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap ${textSecondary}`}>Promoteur</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap ${textSecondary}`}>Code</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap ${textSecondary}`}>Niveau</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap ${textSecondary}`}>Taux</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap ${textSecondary}`}>Commandes</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap ${textSecondary}`}>Commission</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap ${textSecondary}`}>Statut</th>
                  <th className={`px-4 py-3 text-right text-xs font-semibold uppercase whitespace-nowrap ${textSecondary}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPromoteurs.map(p => {
                  const niveauInfo = getNiveauInfo(p.niveau);
                  const tauxInfo = getTauxEffectifPromoteur(p);
                  return (
                    <tr key={p.id} className={`border-b ${cardBorder} hover:${darkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {p.nom_complet?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className={`font-medium ${textPrimary}`}>{p.nom_complet}</div>
                            <div className={`text-sm ${textSecondary}`}>{p.ville}, {p.pays}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-pink-500">{p.code_unique}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-lg text-sm ${niveauInfo.bg} ${niveauInfo.color}`}>
                          {niveauInfo.icon} {niveauInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="text-pink-500 font-semibold">{tauxInfo.total}%</span>
                          {tauxInfo.estPersonnalise && (
                            <span className="text-[10px] text-yellow-400" title="Taux personnalisé">⚙️</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={textPrimary}>{p.total_commandes || 0}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-green-500">{formatCurrency(p.solde_commission || 0)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          p.actif 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {p.actif ? 'Actif' : 'Suspendu'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedPromoteur(p)}
                            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition`}
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4 text-blue-400" />
                          </button>
                          <a
                            href={formatWhatsAppLink(p.whatsapp)}
                            target="_blank"
                            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition`}
                            title="Contacter WhatsApp"
                          >
                            <Phone className="w-4 h-4 text-green-400" />
                          </a>
                          <button
                            onClick={() => sendRecoveryLink(p)}
                            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition`}
                            title="Envoyer lien de réinitialisation"
                          >
                            <Link className="w-4 h-4 text-purple-400" />
                          </button>
                          <button
                            onClick={() => toggleStatus(p)}
                            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition`}
                            title={p.actif ? 'Suspendre' : 'Activer'}
                          >
                            {p.actif 
                              ? <Ban className="w-4 h-4 text-red-400" />
                              : <CheckCircle className="w-4 h-4 text-green-400" />
                            }
                          </button>
                          <button
                            onClick={() => setConfirmDelete(p)}
                            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition`}
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal détails */}
      {selectedPromoteur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedPromoteur(null)} />
          <div className={`relative ${cardBg} border ${cardBorder} rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
            <h3 className={`text-xl font-bold ${textPrimary} mb-6`}>Détails promoteur</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                  {selectedPromoteur.nom_complet?.charAt(0)}
                </div>
                <div>
                  <div className={`text-lg font-semibold ${textPrimary}`}>{selectedPromoteur.nom_complet}</div>
                  <div className={textSecondary}>{selectedPromoteur.ville}, {selectedPromoteur.pays}</div>
                </div>
              </div>

              <div className={`grid grid-cols-2 gap-4 p-4 rounded-xl ${darkMode ? 'bg-slate-900' : 'bg-gray-100'}`}>
                <div>
                  <div className={`text-xs ${textSecondary}`}>Code d'accès</div>
                  <div className="font-mono text-pink-500">{selectedPromoteur.code_unique}</div>
                </div>
                <div>
                  <div className={`text-xs ${textSecondary}`}>Code parrainage</div>
                  <div className="font-mono text-purple-500">{selectedPromoteur.code_parrainage}</div>
                </div>
                <div>
                  <div className={`text-xs ${textSecondary}`}>WhatsApp</div>
                  <div className={textPrimary}>{selectedPromoteur.whatsapp}</div>
                </div>
                <div>
                  <div className={`text-xs ${textSecondary}`}>Niveau</div>
                  <div className={getNiveauInfo(selectedPromoteur.niveau).color}>
                    {getNiveauInfo(selectedPromoteur.niveau).icon} {getNiveauInfo(selectedPromoteur.niveau).label}
                  </div>
                </div>
                <div>
                  <div className={`text-xs ${textSecondary}`}>Commandes</div>
                  <div className={textPrimary}>{selectedPromoteur.total_commandes || 0}</div>
                </div>
                <div>
                  <div className={`text-xs ${textSecondary}`}>Commission disponible</div>
                  <div className="text-green-500">{formatCurrency(selectedPromoteur.solde_commission || 0)}</div>
                </div>
                <div>
                  <div className={`text-xs ${textSecondary}`}>Commission totale gagnée</div>
                  <div className="text-blue-500">{formatCurrency(selectedPromoteur.total_commission_gagnee || 0)}</div>
                </div>
                <div>
                  <div className={`text-xs ${textSecondary}`}>Inscrit le</div>
                  <div className={textPrimary}>{formatDate(selectedPromoteur.created_at)}</div>
                </div>
              </div>

              {/* Section Taux de frais de service */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'border-pink-500/30 bg-pink-500/5' : 'border-pink-200 bg-pink-50'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Percent className="w-5 h-5 text-pink-500" />
                  <span className={`font-semibold ${textPrimary}`}>Taux de frais de service</span>
                </div>
                
                {(() => {
                  const tauxInfo = getTauxEffectifPromoteur(selectedPromoteur);
                  return (
                    <div className="space-y-3">
                      {/* Taux effectif actuel */}
                      <div className="flex items-center justify-between">
                        <span className={textSecondary}>Taux effectif actuel :</span>
                        <span className="text-xl font-bold text-pink-500">{tauxInfo.total}%</span>
                      </div>
                      
                      {/* Détail calcul */}
                      <div className={`text-xs ${textSecondary} space-y-1`}>
                        <div className="flex justify-between">
                          <span>Taux de base {tauxInfo.estPersonnalise ? '(personnalisé)' : '(global)'}</span>
                          <span className={textPrimary}>{tauxInfo.tauxBase}%</span>
                        </div>
                        {tauxInfo.bonus > 0 && (
                          <div className="flex justify-between">
                            <span>Réduction niveau {selectedPromoteur.niveau}</span>
                            <span className="text-green-500">-{tauxInfo.bonus}%</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Modification */}
                      <div className="pt-3 border-t border-gray-600">
                        <label className={`block text-xs ${textSecondary} mb-2`}>
                          Taux personnalisé (laisser vide pour utiliser le taux global {tauxGlobal}%)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={editingTaux !== null ? editingTaux : (selectedPromoteur.taux_remise ?? '')}
                            onChange={(e) => setEditingTaux(e.target.value)}
                            placeholder={`Global: ${tauxGlobal}%`}
                            className={`flex-1 px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} outline-none focus:border-pink-500`}
                          />
                          <button
                            onClick={saveTauxPersonnalise}
                            disabled={savingTaux}
                            className="px-4 py-2 rounded-lg bg-pink-500 text-white font-medium hover:bg-pink-600 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            {savingTaux ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Enregistrer
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => toggleStatus(selectedPromoteur)}
                  className={`flex-1 py-2.5 rounded-xl font-medium ${
                    selectedPromoteur.actif 
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                      : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                  } transition`}
                >
                  {selectedPromoteur.actif ? 'Suspendre' : 'Activer'}
                </button>
                <button
                  onClick={() => setConfirmDelete(selectedPromoteur)}
                  className="py-2.5 px-4 rounded-xl font-medium bg-red-600/10 text-red-500 hover:bg-red-600/20 transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
                <button
                  onClick={() => { setSelectedPromoteur(null); setEditingTaux(null); }}
                  className={`flex-1 py-2.5 rounded-xl font-medium ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'} ${textPrimary} transition`}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => !deleting && setConfirmDelete(null)} />
          <div className={`relative ${cardBg} border border-red-500/30 rounded-2xl p-6 max-w-md w-full`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${textPrimary}`}>Suppression définitive</h3>
                <p className={`text-sm ${textSecondary}`}>Cette action est irréversible</p>
              </div>
            </div>
            
            <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-red-500/5 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${textPrimary} mb-2`}>
                Vous allez supprimer <strong className="text-red-500">{confirmDelete.nom_complet}</strong> et toutes ses données :
              </p>
              <ul className={`text-xs ${textSecondary} space-y-1 ml-4`}>
                <li>• Toutes ses commandes</li>
                <li>• Tout son historique de commissions</li>
                <li>• Toutes ses notifications</li>
                <li>• Ses demandes de récupération</li>
                <li>• Ses tokens de réinitialisation</li>
                <li>• Les notifications admin associées</li>
                <li>• Ses filleuls seront détachés (pas supprimés)</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => deletePromoteur(confirmDelete)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Confirmer la suppression
                  </>
                )}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className={`flex-1 py-3 rounded-xl font-medium ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'} ${textPrimary} transition disabled:opacity-50`}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
