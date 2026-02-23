import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, Search, Filter, Eye, CheckCircle, XCircle, 
  Upload, Download, Clock, Package, User, Calendar, RefreshCw,
  FileText, AlertCircle, DollarSign
} from 'lucide-react';
import { supabaseGet, supabasePatch, supabaseUpload, supabasePost, supabaseStorageDelete, extractStoragePath } from '../../config/supabase';
import { formatCurrency, formatDate, formatDateShort, statutColors } from '../../utils/helpers';

export default function AdminCommandesPromo({ darkMode }) {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [stats, setStats] = useState({ 
    total: 0, 
    enAttente: 0, 
    validees: 0, 
    refusees: 0,
    montantTotal: 0 
  });

  // Charger commandes
  useEffect(() => {
    loadCommandes();
  }, []);

  const loadCommandes = async () => {
    setLoading(true);
    
    // Requête 1: Charger les commandes (sans jointure)
    const commandesData = await supabaseGet(
      'commandes_promoteurs?select=*&order=created_at.desc'
    );
    
    console.log('Commandes chargées:', commandesData);
    
    if (commandesData && commandesData.length > 0) {
      // Requête 2: Charger les promoteurs
      const promoteursData = await supabaseGet('promoteurs?select=id,nom_complet,whatsapp,code_unique');
      
      // Créer un map des promoteurs
      const promoteursMap = {};
      if (promoteursData) {
        promoteursData.forEach(p => {
          promoteursMap[p.id] = p;
        });
      }
      
      // Fusionner les données
      const commandesAvecPromoteurs = commandesData.map(c => ({
        ...c,
        promoteurs: promoteursMap[c.promoteur_id] || { nom_complet: 'Inconnu', whatsapp: '', code_unique: '' }
      }));
      
      setCommandes(commandesAvecPromoteurs);
      
      setStats({
        total: commandesAvecPromoteurs.length,
        enAttente: commandesAvecPromoteurs.filter(c => c.statut === 'en_attente').length,
        validees: commandesAvecPromoteurs.filter(c => c.statut === 'validee').length,
        refusees: commandesAvecPromoteurs.filter(c => c.statut === 'refusee').length,
        montantTotal: commandesAvecPromoteurs.filter(c => c.statut === 'validee').reduce((s, c) => s + (c.net_a_payer || 0), 0)
      });
    } else {
      setCommandes([]);
      setStats({ total: 0, enAttente: 0, validees: 0, refusees: 0, montantTotal: 0 });
    }
    
    setLoading(false);
  };

  // Filtrer commandes
  const filteredCommandes = useMemo(() => {
    let result = [...commandes];
    
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(c => 
        c.forfait_nom?.toLowerCase().includes(s) ||
        c.promoteurs?.nom_complet?.toLowerCase().includes(s) ||
        c.promoteurs?.code_unique?.toLowerCase().includes(s)
      );
    }
    
    if (filterStatut !== 'all') {
      result = result.filter(c => c.statut === filterStatut);
    }
    
    return result;
  }, [commandes, search, filterStatut]);

  // Valider commande
  const validerCommande = async (commande, fichierUrl = null) => {
    await supabasePatch(`commandes_promoteurs?id=eq.${commande.id}`, {
      statut: 'validee',
      validated_at: new Date().toISOString(),
      fichier_tickets_url: fichierUrl || commande.fichier_tickets_url
    });
    
    // Notification promoteur
    await supabasePost('notifications_promoteurs', {
      promoteur_id: commande.promoteur_id,
      type: 'commande',
      titre: '✅ Commande validée !',
      message: `Votre commande de ${commande.quantite} tickets ${commande.forfait_nom} a été validée. Téléchargez vos tickets dans "Mes fichiers".`
    });
    
    loadCommandes();
    setSelectedCommande(null);
  };

  // Refuser commande
  const refuserCommande = async (commande, motif) => {
    await supabasePatch(`commandes_promoteurs?id=eq.${commande.id}`, {
      statut: 'refusee',
      motif_refus: motif || 'Paiement non vérifié'
    });
    
    // Notification promoteur
    await supabasePost('notifications_promoteurs', {
      promoteur_id: commande.promoteur_id,
      type: 'alert',
      titre: '❌ Commande refusée',
      message: `Votre commande de ${commande.quantite} tickets ${commande.forfait_nom} a été refusée. Motif: ${motif || 'Paiement non vérifié'}`
    });
    
    loadCommandes();
    setSelectedCommande(null);
  };

  // Upload PDF tickets (fonctionne pour toutes les commandes)
  const handleUploadPDF = async (e, commande, validateAfter = false) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    // Vérifier le type de fichier
    if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
      alert('❌ Veuillez sélectionner un fichier PDF');
      return;
    }
    
    setUploadingPDF(true);
    
    try {
      // Supprimer l'ancien fichier s'il existe
      if (commande.fichier_tickets_url) {
        const oldPath = extractStoragePath(commande.fichier_tickets_url, 'commandes');
        if (oldPath) {
          console.log('Deleting old PDF:', oldPath);
          await supabaseStorageDelete('commandes', oldPath);
        }
      }
      
      const fileName = `tickets/${commande.promoteur_id}/${Date.now()}-tickets.pdf`;
      console.log('Uploading PDF:', fileName, 'Type:', file.type, 'Size:', file.size);
      
      const url = await supabaseUpload('commandes', fileName, file);
      
      console.log('PDF uploaded successfully:', url);
      
      if (validateAfter && commande.statut === 'en_attente') {
        // Upload + Valider
        await validerCommande(commande, url);
      } else {
        // Juste mettre à jour le fichier
        await supabasePatch(`commandes_promoteurs?id=eq.${commande.id}`, {
          fichier_tickets_url: url
        });
        
        // Notification au promoteur
        const isReplacement = !!commande.fichier_tickets_url;
        await supabasePost('notifications_promoteurs', {
          promoteur_id: commande.promoteur_id,
          type: 'fichier',
          titre: isReplacement ? '🔄 Fichier tickets mis à jour' : '📄 Fichier tickets disponible',
          message: isReplacement
            ? `Le fichier tickets pour votre commande ${commande.forfait_nom} a été remplacé. Retéléchargez-le dans "Mes fichiers".`
            : `Vos tickets pour la commande ${commande.forfait_nom} sont disponibles dans "Mes fichiers".`
        });
        
        loadCommandes();
        alert(isReplacement ? '✅ Fichier PDF remplacé (ancien supprimé) !' : '✅ Fichier PDF uploadé avec succès !');
      }
    } catch (err) {
      console.error('Upload error:', err);
      
      // Message d'erreur plus explicite
      let errorMsg = err.message || 'Erreur inconnue';
      if (errorMsg.includes('404') || errorMsg.includes('not found')) {
        errorMsg = 'Le bucket "commandes" n\'existe pas dans Supabase Storage. Veuillez le créer via l\'interface Supabase.';
      } else if (errorMsg.includes('403') || errorMsg.includes('policy')) {
        errorMsg = 'Accès refusé. Vérifiez les policies du bucket Storage.';
      }
      
      alert('❌ Erreur upload: ' + errorMsg);
    }
    
    setUploadingPDF(false);
    e.target.value = ''; // Reset input
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
          { label: 'Total', value: stats.total, icon: ShoppingCart, color: 'text-pink-500' },
          { label: 'En attente', value: stats.enAttente, icon: Clock, color: 'text-yellow-500' },
          { label: 'Validées', value: stats.validees, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Refusées', value: stats.refusees, icon: XCircle, color: 'text-red-500' },
          { label: 'Encaissé', value: formatCurrency(stats.montantTotal), icon: DollarSign, color: 'text-green-500' }
        ].map(s => (
          <div key={s.label} className={`${cardBg} border ${cardBorder} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <span className={`text-xl font-bold ${textPrimary}`}>{s.value}</span>
            </div>
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
                placeholder="Rechercher commande..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl ${inputBg} ${textPrimary} border outline-none focus:border-pink-500`}
              />
            </div>
          </div>
          
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className={`px-4 py-2.5 rounded-xl ${inputBg} ${textPrimary} border outline-none`}
          >
            <option value="all">Tous statuts</option>
            <option value="en_attente">En attente</option>
            <option value="validee">Validées</option>
            <option value="refusee">Refusées</option>
          </select>
          
          <button
            onClick={loadCommandes}
            className={`p-2.5 rounded-xl ${inputBg} border hover:border-pink-500 transition`}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''} ${textSecondary}`} />
          </button>
        </div>
      </div>

      {/* Liste commandes en attente prioritaires */}
      {stats.enAttente > 0 && filterStatut === 'all' && (
        <div className={`${cardBg} border-2 border-yellow-500/50 rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <span className={`font-semibold ${textPrimary}`}>{stats.enAttente} commande(s) en attente de validation</span>
          </div>
          <div className="space-y-3">
            {commandes.filter(c => c.statut === 'en_attente').slice(0, 3).map(cmd => (
              <div 
                key={cmd.id}
                onClick={() => setSelectedCommande(cmd)}
                className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'} cursor-pointer transition`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-medium ${textPrimary}`}>{cmd.promoteurs?.nom_complet}</div>
                    <div className={`text-sm ${textSecondary}`}>
                      {cmd.quantite}× {cmd.forfait_nom} • {formatCurrency(cmd.net_a_payer)}
                    </div>
                  </div>
                  <span className="text-yellow-500 text-sm">{formatDateShort(cmd.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste complète */}
      <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCommandes.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className={`w-12 h-12 mx-auto mb-3 ${textSecondary} opacity-50`} />
            <p className={textSecondary}>Aucune commande trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-900/50' : 'bg-gray-50'} border-b ${cardBorder}`}>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap ${textSecondary}`}>Promoteur</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap ${textSecondary}`}>Forfait</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap ${textSecondary}`}>Qté</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap ${textSecondary}`}>Montant</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap ${textSecondary}`}>Date</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap ${textSecondary}`}>Statut</th>
                  <th className={`px-4 py-3 text-right text-xs font-semibold uppercase whitespace-nowrap ${textSecondary}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommandes.map(cmd => {
                  const statut = statutColors[cmd.statut] || statutColors.en_attente;
                  return (
                    <tr key={cmd.id} className={`border-b ${cardBorder} hover:${darkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className={`font-medium ${textPrimary}`}>{cmd.promoteurs?.nom_complet}</div>
                        <div className={`text-sm ${textSecondary}`}>{cmd.promoteurs?.code_unique}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={textPrimary}>{cmd.forfait_nom}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={textPrimary}>{cmd.quantite} tickets</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-pink-500 font-medium">{formatCurrency(cmd.net_a_payer)}</div>
                        <div className={`text-xs ${textSecondary}`}>Frais de service</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={textSecondary}>{formatDateShort(cmd.created_at)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statut.bg} ${statut.text}`}>
                          {statut.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedCommande(cmd)}
                            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition`}
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4 text-blue-400" />
                          </button>
                          {cmd.statut === 'en_attente' && (
                            <>
                              <button
                                onClick={() => validerCommande(cmd)}
                                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-green-500/20' : 'hover:bg-green-50'} transition`}
                                title="Valider"
                              >
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              </button>
                              <button
                                onClick={() => refuserCommande(cmd)}
                                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-50'} transition`}
                                title="Refuser"
                              >
                                <XCircle className="w-4 h-4 text-red-400" />
                              </button>
                            </>
                          )}
                          {cmd.fichier_tickets_url && (
                            <a
                              href={cmd.fichier_tickets_url}
                              target="_blank"
                              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition`}
                              title="Télécharger PDF"
                            >
                              <Download className="w-4 h-4 text-purple-400" />
                            </a>
                          )}
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

      {/* Modal détails commande */}
      {selectedCommande && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedCommande(null)} />
          <div className={`relative ${cardBg} border ${cardBorder} rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <h3 className={`text-xl font-bold ${textPrimary} mb-6`}>Détails de la commande</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Infos commande */}
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-900' : 'bg-gray-100'}`}>
                  <div className={`text-xs ${textSecondary} mb-1`}>Promoteur</div>
                  <div className={`font-medium ${textPrimary}`}>{selectedCommande.promoteurs?.nom_complet}</div>
                  <div className={`text-sm ${textSecondary}`}>{selectedCommande.promoteurs?.whatsapp}</div>
                </div>
                
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-900' : 'bg-gray-100'}`}>
                  <div className={`text-xs ${textSecondary} mb-2`}>Détails financiers</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={textSecondary}>Forfait</span>
                      <span className={textPrimary}>{selectedCommande.forfait_nom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textSecondary}>Quantité</span>
                      <span className={textPrimary}>{selectedCommande.quantite}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textSecondary}>Valeur des tickets</span>
                      <span className={textPrimary}>{formatCurrency(selectedCommande.total_brut)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textSecondary}>Frais de service ({selectedCommande.taux_remise}%)</span>
                      <span className="text-pink-500">{formatCurrency(selectedCommande.montant_remise)}</span>
                    </div>
                    {selectedCommande.commission_utilisee > 0 && (
                      <div className="flex justify-between">
                        <span className={textSecondary}>Commission utilisée</span>
                        <span className="text-blue-500">-{formatCurrency(selectedCommande.commission_utilisee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-700">
                      <span className="font-semibold">Total payé</span>
                      <span className="font-bold text-pink-500">{formatCurrency(selectedCommande.net_a_payer)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textSecondary}>Tickets à créer</span>
                      <span className="text-green-500">{selectedCommande.quantite} tickets</span>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-900' : 'bg-gray-100'}`}>
                  <div className={`text-xs ${textSecondary} mb-1`}>Moyen de paiement</div>
                  <div className={textPrimary}>{selectedCommande.moyen_paiement || 'Non spécifié'}</div>
                </div>
              </div>

              {/* Preuve paiement */}
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-900' : 'bg-gray-100'}`}>
                  <div className={`text-xs ${textSecondary} mb-2`}>Preuve de paiement</div>
                  {selectedCommande.preuve_paiement_url ? (
                    <img 
                      src={selectedCommande.preuve_paiement_url} 
                      alt="Preuve" 
                      className="w-full rounded-lg border border-gray-700 cursor-pointer hover:opacity-90 transition"
                      onClick={() => setFullscreenImage(selectedCommande.preuve_paiement_url)}
                    />
                  ) : (
                    <div className={`text-center py-8 ${textSecondary}`}>
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Aucune preuve uploadée</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {selectedCommande.statut === 'en_attente' && (
                  <div className="space-y-3">
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) => handleUploadPDF(e, selectedCommande, true)}
                        className="hidden"
                        disabled={uploadingPDF}
                      />
                      <div className={`flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-medium text-base ${
                        uploadingPDF ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      } bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30 transition`}>
                        {uploadingPDF ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                        {uploadingPDF ? 'Upload en cours...' : 'Upload ticket'}
                      </div>
                    </label>
                    
                    <button
                      onClick={() => refuserCommande(selectedCommande)}
                      className="w-full py-3 rounded-xl font-medium text-base bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition"
                    >
                      Refuser
                    </button>
                  </div>
                )}

                {selectedCommande.statut !== 'en_attente' && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl ${
                      selectedCommande.statut === 'validee' ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                      <div className={`font-medium ${selectedCommande.statut === 'validee' ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedCommande.statut === 'validee' ? '✅ Commande validée' : '❌ Commande refusée'}
                      </div>
                      {selectedCommande.motif_refus && (
                        <div className={`text-sm ${textSecondary} mt-1`}>Motif: {selectedCommande.motif_refus}</div>
                      )}
                      {selectedCommande.validated_at && (
                        <div className={`text-sm ${textSecondary} mt-1`}>Le {formatDate(selectedCommande.validated_at)}</div>
                      )}
                    </div>
                    
                    {/* Upload/Remplacement PDF pour commandes validées */}
                    {selectedCommande.statut === 'validee' && (
                      <div className="space-y-3">
                        {selectedCommande.fichier_tickets_url ? (
                          <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-900' : 'bg-gray-100'}`}>
                            <div className={`text-xs ${textSecondary} mb-2`}>Fichier tickets actuel</div>
                            <a 
                              href={selectedCommande.fichier_tickets_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-purple-400 hover:text-purple-300"
                            >
                              <Download className="w-4 h-4" />
                              Télécharger le PDF actuel
                            </a>
                          </div>
                        ) : (
                          <div className={`p-3 rounded-xl ${darkMode ? 'bg-yellow-500/10' : 'bg-yellow-100'} border border-yellow-500/30`}>
                            <div className="flex items-center gap-2 text-yellow-500">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm">Aucun fichier tickets uploadé</span>
                            </div>
                          </div>
                        )}
                        
                        <label className="block">
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleUploadPDF(e, selectedCommande, false)}
                            className="hidden"
                            disabled={uploadingPDF}
                          />
                          <div className={`flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer ${
                            uploadingPDF ? 'opacity-50' : ''
                          } bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition`}>
                            {uploadingPDF ? (
                              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Upload className="w-5 h-5" />
                            )}
                            {uploadingPDF ? 'Upload...' : (selectedCommande.fichier_tickets_url ? '🔄 Remplacer le PDF' : '📤 Ajouter PDF tickets')}
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedCommande(null)}
              className={`w-full mt-6 py-3 rounded-xl font-medium ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'} ${textPrimary} transition`}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen image viewer */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition z-10"
          >
            <XCircle className="w-6 h-6" />
          </button>
          <img 
            src={fullscreenImage} 
            alt="Preuve de paiement" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
