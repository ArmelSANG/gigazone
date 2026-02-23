import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Percent, CreditCard, FileText, Plus, Trash2,
  CheckCircle, AlertCircle, RefreshCw, X, Edit2, Smartphone, 
  Wallet, ChevronRight, Phone, User, FileEdit
} from 'lucide-react';
import { supabaseGet, supabasePatch, supabasePost } from '../../config/supabase';

export default function AdminSettings({ darkMode }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Settings
  const [tauxRemise, setTauxRemise] = useState(70);
  const [tauxCommission, setTauxCommission] = useState(5);
  const [seuilSilver, setSeuilSilver] = useState(51);
  const [seuilGold, setSeuilGold] = useState(201);
  const [bonusSilver, setBonusSilver] = useState(2);
  const [bonusGold, setBonusGold] = useState(5);
  
  // Moyens de paiement (nouveau format)
  const [moyensPaiement, setMoyensPaiement] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    type: 'mobile',
    reseau: 'MTN',
    numero: '',
    nom: '',
    mode: '',
    details: ''
  });
  
  // CGU
  const [cguContent, setCguContent] = useState('');
  const [cguVersion, setCguVersion] = useState('1.0');

  // Réseaux Mobile Money disponibles
  const reseaux = [
    { id: 'MTN', label: 'MTN Mobile Money', color: 'bg-yellow-500', icon: '🟡' },
    { id: 'Moov', label: 'Moov Money', color: 'bg-blue-500', icon: '🔵' },
    { id: 'Celtiis', label: 'Celtiis Cash', color: 'bg-green-500', icon: '🟢' },
    { id: 'Autres', label: 'Autre réseau', color: 'bg-gray-500', icon: '⚪' }
  ];

  // Charger settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    
    const data = await supabaseGet('settings_global?select=*');
    if (data) {
      data.forEach(item => {
        switch (item.cle) {
          case 'taux_remise_global': setTauxRemise(parseFloat(item.valeur)); break;
          case 'taux_commission_parrainage': setTauxCommission(parseFloat(item.valeur)); break;
          case 'seuil_silver': setSeuilSilver(parseInt(item.valeur)); break;
          case 'seuil_gold': setSeuilGold(parseInt(item.valeur)); break;
          case 'bonus_silver': setBonusSilver(parseFloat(item.valeur)); break;
          case 'bonus_gold': setBonusGold(parseFloat(item.valeur)); break;
          case 'moyens_paiement_v2': 
            try {
              setMoyensPaiement(JSON.parse(item.valeur));
            } catch {
              setMoyensPaiement([]);
            }
            break;
        }
      });
    }
    
    // Charger CGU
    const cgu = await supabaseGet('cgu_versions?actif=eq.true&select=*&limit=1');
    if (cgu && cgu.length > 0) {
      setCguContent(cgu[0].contenu);
      setCguVersion(cgu[0].version);
    }
    
    setLoading(false);
  };

  // Sauvegarder un paramètre
  const saveSetting = async (cle, valeur) => {
    const existing = await supabaseGet(`settings_global?cle=eq.${cle}`);
    if (existing && existing.length > 0) {
      await supabasePatch(`settings_global?cle=eq.${cle}`, { 
        valeur: typeof valeur === 'object' ? JSON.stringify(valeur) : String(valeur),
        updated_at: new Date().toISOString()
      });
    } else {
      await supabasePost('settings_global', {
        cle,
        valeur: typeof valeur === 'object' ? JSON.stringify(valeur) : String(valeur)
      });
    }
  };

  // Sauvegarder tous les paramètres
  const handleSaveAll = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Générer aussi l'ancien format pour compatibilité
      const moyensNoms = moyensPaiement.map(m => 
        m.type === 'mobile' ? `${m.reseau} Mobile Money` : m.mode
      );
      
      await Promise.all([
        saveSetting('taux_remise_global', tauxRemise),
        saveSetting('taux_commission_parrainage', tauxCommission),
        saveSetting('seuil_silver', seuilSilver),
        saveSetting('seuil_gold', seuilGold),
        saveSetting('bonus_silver', bonusSilver),
        saveSetting('bonus_gold', bonusGold),
        saveSetting('moyens_paiement_v2', moyensPaiement),
        saveSetting('moyens_paiement', moyensNoms)
      ]);
      
      setSuccess('Paramètres sauvegardés avec succès !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    }
    
    setSaving(false);
  };

  // Sauvegarder CGU
  const handleSaveCGU = async () => {
    setSaving(true);
    setError('');
    
    try {
      await supabasePatch('cgu_versions?actif=eq.true', { actif: false });
      
      const newVersion = (parseFloat(cguVersion) + 0.1).toFixed(1);
      await supabasePost('cgu_versions', {
        version: newVersion,
        contenu: cguContent,
        actif: true
      });
      
      setCguVersion(newVersion);
      setSuccess('CGU mis à jour (version ' + newVersion + ')');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la mise à jour des CGU');
    }
    
    setSaving(false);
  };

  // Ouvrir modal ajout
  const openAddPaymentModal = () => {
    setEditingPayment(null);
    setPaymentForm({
      type: 'mobile',
      reseau: 'MTN',
      numero: '',
      nom: '',
      mode: '',
      details: ''
    });
    setShowPaymentModal(true);
  };

  // Ouvrir modal édition
  const openEditPaymentModal = (payment, index) => {
    setEditingPayment(index);
    setPaymentForm({ ...payment });
    setShowPaymentModal(true);
  };

  // Sauvegarder moyen de paiement
  const savePayment = () => {
    // Validation
    if (paymentForm.type === 'mobile') {
      if (!paymentForm.numero || !paymentForm.nom) {
        setError('Veuillez remplir le numéro et le nom du compte');
        return;
      }
    } else {
      if (!paymentForm.mode || !paymentForm.details) {
        setError('Veuillez remplir le mode et les détails');
        return;
      }
    }

    const newPayment = {
      id: editingPayment !== null ? moyensPaiement[editingPayment].id : Date.now(),
      type: paymentForm.type,
      ...(paymentForm.type === 'mobile' 
        ? { reseau: paymentForm.reseau, numero: paymentForm.numero, nom: paymentForm.nom }
        : { mode: paymentForm.mode, details: paymentForm.details }
      )
    };

    if (editingPayment !== null) {
      // Modification
      const updated = [...moyensPaiement];
      updated[editingPayment] = newPayment;
      setMoyensPaiement(updated);
    } else {
      // Ajout
      setMoyensPaiement([...moyensPaiement, newPayment]);
    }

    setShowPaymentModal(false);
    setError('');
  };

  // Supprimer moyen de paiement
  const deletePayment = (index) => {
    if (confirm('Supprimer ce moyen de paiement ?')) {
      setMoyensPaiement(moyensPaiement.filter((_, i) => i !== index));
    }
  };

  // Obtenir info réseau
  const getReseauInfo = (reseauId) => {
    return reseaux.find(r => r.id === reseauId) || reseaux[3];
  };

  const cardBg = darkMode ? 'bg-slate-800/50' : 'bg-white';
  const cardBorder = darkMode ? 'border-slate-700' : 'border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-slate-400' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Taux et pourcentages */}
      <div className={`${cardBg} border ${cardBorder} rounded-xl p-6`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
            <Percent className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className={`font-semibold ${textPrimary}`}>Taux et pourcentages</h3>
            <p className={`text-sm ${textSecondary}`}>Configuration des frais de service et commissions</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
              Taux de frais de service global (%)
            </label>
            <input
              type="number"
              value={tauxRemise}
              onChange={(e) => setTauxRemise(parseFloat(e.target.value))}
              className={`w-full px-4 py-3 rounded-xl ${inputBg} ${textPrimary} border outline-none focus:border-pink-500`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
              Commission parrainage (%)
            </label>
            <input
              type="number"
              value={tauxCommission}
              onChange={(e) => setTauxCommission(parseFloat(e.target.value))}
              className={`w-full px-4 py-3 rounded-xl ${inputBg} ${textPrimary} border outline-none focus:border-pink-500`}
            />
          </div>
        </div>
      </div>

      {/* Niveaux */}
      <div className={`${cardBg} border ${cardBorder} rounded-xl p-6`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <span className="text-xl">🏆</span>
          </div>
          <div>
            <h3 className={`font-semibold ${textPrimary}`}>Niveaux promoteurs</h3>
            <p className={`text-sm ${textSecondary}`}>Seuils et bonus par niveau</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
              🥈 Seuil Silver (commandes)
            </label>
            <input
              type="number"
              value={seuilSilver}
              onChange={(e) => setSeuilSilver(parseInt(e.target.value))}
              className={`w-full px-4 py-3 rounded-xl ${inputBg} ${textPrimary} border outline-none focus:border-pink-500`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
              Bonus Silver (%)
            </label>
            <input
              type="number"
              value={bonusSilver}
              onChange={(e) => setBonusSilver(parseFloat(e.target.value))}
              className={`w-full px-4 py-3 rounded-xl ${inputBg} ${textPrimary} border outline-none focus:border-pink-500`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
              🥇 Seuil Gold (commandes)
            </label>
            <input
              type="number"
              value={seuilGold}
              onChange={(e) => setSeuilGold(parseInt(e.target.value))}
              className={`w-full px-4 py-3 rounded-xl ${inputBg} ${textPrimary} border outline-none focus:border-pink-500`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
              Bonus Gold (%)
            </label>
            <input
              type="number"
              value={bonusGold}
              onChange={(e) => setBonusGold(parseFloat(e.target.value))}
              className={`w-full px-4 py-3 rounded-xl ${inputBg} ${textPrimary} border outline-none focus:border-pink-500`}
            />
          </div>
        </div>
      </div>

      {/* Moyens de paiement - NOUVEAU DESIGN PREMIUM */}
      <div className={`${cardBg} border ${cardBorder} rounded-xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`font-semibold ${textPrimary}`}>Moyens de paiement</h3>
              <p className={`text-sm ${textSecondary}`}>{moyensPaiement.length} moyen(s) configuré(s)</p>
            </div>
          </div>
          <button
            onClick={openAddPaymentModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:shadow-lg hover:shadow-green-500/30 transition"
          >
            <Plus className="w-5 h-5" />
            Ajouter
          </button>
        </div>

        {/* Liste des moyens de paiement */}
        {moyensPaiement.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'bg-slate-900/50' : 'bg-gray-50'} rounded-xl border-2 border-dashed ${cardBorder}`}>
            <Wallet className={`w-12 h-12 mx-auto mb-3 ${textSecondary} opacity-50`} />
            <p className={textSecondary}>Aucun moyen de paiement configuré</p>
            <p className={`text-sm ${textSecondary} mt-1`}>Cliquez sur "Ajouter" pour commencer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {moyensPaiement.map((payment, idx) => {
              const isMobile = payment.type === 'mobile';
              const reseauInfo = isMobile ? getReseauInfo(payment.reseau) : null;
              
              return (
                <div 
                  key={payment.id || idx}
                  className={`relative overflow-hidden rounded-xl border ${cardBorder} ${darkMode ? 'bg-slate-900/50' : 'bg-gray-50'} hover:border-green-500/50 transition`}
                >
                  {/* Barre colorée */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isMobile ? reseauInfo.color : 'bg-purple-500'}`} />
                  
                  <div className="p-4 pl-5">
                    {/* Ligne principale : Icône + Infos */}
                    <div className="flex items-center gap-3">
                      {/* Icône */}
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isMobile 
                          ? `${reseauInfo.color}/20` 
                          : 'bg-purple-500/20'
                      }`}>
                        {isMobile ? (
                          <Smartphone className={`w-5 h-5 sm:w-6 sm:h-6 ${
                            payment.reseau === 'MTN' ? 'text-yellow-400' :
                            payment.reseau === 'Moov' ? 'text-blue-400' :
                            payment.reseau === 'Celtiis' ? 'text-green-400' : 'text-gray-400'
                          }`} />
                        ) : (
                          <FileEdit className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                        )}
                      </div>
                      
                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold ${textPrimary} flex items-center gap-2 text-sm sm:text-base`}>
                          {isMobile ? (
                            <>
                              {reseauInfo.icon} {reseauInfo.label}
                            </>
                          ) : (
                            <>
                              🎨 {payment.mode}
                            </>
                          )}
                        </div>
                        {isMobile ? (
                          <div className={`text-xs sm:text-sm ${textSecondary} mt-1`}>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {payment.numero}
                              <span className="mx-1">•</span>
                              <User className="w-3 h-3" />
                              {payment.nom}
                            </span>
                          </div>
                        ) : (
                          <div className={`text-xs sm:text-sm ${textSecondary} mt-1 line-clamp-1`}>
                            {payment.details}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Boutons d'action - ligne séparée sur mobile */}
                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-700/50">
                      <button
                        onClick={() => openEditPaymentModal(payment, idx)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => deletePayment(idx)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bouton sauvegarder */}
      <button
        onClick={handleSaveAll}
        disabled={saving}
        className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-xl hover:shadow-pink-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Save className="w-5 h-5" />
        )}
        Sauvegarder les paramètres
      </button>

      {/* CGU */}
      <div className={`${cardBg} border ${cardBorder} rounded-xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className={`font-semibold ${textPrimary}`}>Conditions Générales d'Utilisation</h3>
              <p className={`text-sm ${textSecondary}`}>Version actuelle: {cguVersion}</p>
            </div>
          </div>
        </div>

        <textarea
          value={cguContent}
          onChange={(e) => setCguContent(e.target.value)}
          rows={15}
          className={`w-full px-4 py-3 rounded-xl ${inputBg} ${textPrimary} border outline-none focus:border-pink-500 font-mono text-sm`}
          placeholder="Contenu des CGU en Markdown..."
        />

        <button
          onClick={handleSaveCGU}
          disabled={saving}
          className="w-full mt-4 py-3 rounded-xl font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          Publier nouvelle version CGU
        </button>
      </div>

      {/* MODAL PREMIUM - Ajout/Modification moyen de paiement */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          
          <div className={`relative w-full max-w-lg max-h-[90vh] ${darkMode ? 'bg-slate-900' : 'bg-white'} rounded-2xl shadow-2xl overflow-hidden flex flex-col`}>
            {/* Header gradient - fixe */}
            <div className="flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {editingPayment !== null ? 'Modifier' : 'Ajouter'} un moyen de paiement
                    </h3>
                    <p className="text-sm text-white/80">
                      Configurez les informations de paiement
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Type de paiement */}
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-3`}>
                  Type de moyen de paiement
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentForm({ ...paymentForm, type: 'mobile' })}
                    className={`p-4 rounded-xl border-2 transition ${
                      paymentForm.type === 'mobile'
                        ? 'border-green-500 bg-green-500/10'
                        : `${cardBorder} hover:border-green-500/50`
                    }`}
                  >
                    <Smartphone className={`w-8 h-8 mx-auto mb-2 ${paymentForm.type === 'mobile' ? 'text-green-400' : textSecondary}`} />
                    <div className={`font-medium ${paymentForm.type === 'mobile' ? 'text-green-400' : textPrimary}`}>
                      Mobile Money
                    </div>
                    <div className={`text-xs ${textSecondary} mt-1`}>
                      MTN, Moov, Celtiis...
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentForm({ ...paymentForm, type: 'personnalise' })}
                    className={`p-4 rounded-xl border-2 transition ${
                      paymentForm.type === 'personnalise'
                        ? 'border-purple-500 bg-purple-500/10'
                        : `${cardBorder} hover:border-purple-500/50`
                    }`}
                  >
                    <FileEdit className={`w-8 h-8 mx-auto mb-2 ${paymentForm.type === 'personnalise' ? 'text-purple-400' : textSecondary}`} />
                    <div className={`font-medium ${paymentForm.type === 'personnalise' ? 'text-purple-400' : textPrimary}`}>
                      Personnalisé
                    </div>
                    <div className={`text-xs ${textSecondary} mt-1`}>
                      Virement, espèces...
                    </div>
                  </button>
                </div>
              </div>

              {/* Champs Mobile Money */}
              {paymentForm.type === 'mobile' && (
                <div className="space-y-4">
                  {/* Sélection réseau */}
                  <div>
                    <label className={`block text-sm font-medium ${textSecondary} mb-3`}>
                      Réseau
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {reseaux.map(reseau => (
                        <button
                          key={reseau.id}
                          onClick={() => setPaymentForm({ ...paymentForm, reseau: reseau.id })}
                          className={`p-3 rounded-xl border-2 flex items-center gap-3 transition ${
                            paymentForm.reseau === reseau.id
                              ? `border-green-500 ${reseau.color}/10`
                              : `${cardBorder} hover:border-green-500/50`
                          }`}
                        >
                          <span className="text-xl">{reseau.icon}</span>
                          <span className={`font-medium ${paymentForm.reseau === reseau.id ? textPrimary : textSecondary}`}>
                            {reseau.id}
                          </span>
                          {paymentForm.reseau === reseau.id && (
                            <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Numéro */}
                  <div>
                    <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                      <Phone className="w-4 h-4 inline mr-2" />
                      Numéro de dépôt
                    </label>
                    <input
                      type="text"
                      value={paymentForm.numero}
                      onChange={(e) => setPaymentForm({ ...paymentForm, numero: e.target.value })}
                      placeholder="+229 XX XX XX XX"
                      className={`w-full px-4 py-3 rounded-xl ${inputBg} ${textPrimary} border outline-none focus:border-green-500`}
                    />
                  </div>

                  {/* Nom du compte */}
                  <div>
                    <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                      <User className="w-4 h-4 inline mr-2" />
                      Nom du compte
                    </label>
                    <input
                      type="text"
                      value={paymentForm.nom}
                      onChange={(e) => setPaymentForm({ ...paymentForm, nom: e.target.value })}
                      placeholder="GigaZone SARL"
                      className={`w-full px-4 py-3 rounded-xl ${inputBg} ${textPrimary} border outline-none focus:border-green-500`}
                    />
                  </div>
                </div>
              )}

              {/* Champs Personnalisé */}
              {paymentForm.type === 'personnalise' && (
                <div className="space-y-4">
                  {/* Mode de paiement */}
                  <div>
                    <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                      Nom du mode de paiement
                    </label>
                    <input
                      type="text"
                      value={paymentForm.mode}
                      onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value })}
                      placeholder="Ex: Virement bancaire, Espèces, Western Union..."
                      className={`w-full px-4 py-3 rounded-xl ${inputBg} ${textPrimary} border outline-none focus:border-purple-500`}
                    />
                  </div>

                  {/* Détails */}
                  <div>
                    <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                      Détails et instructions
                    </label>
                    <textarea
                      value={paymentForm.details}
                      onChange={(e) => setPaymentForm({ ...paymentForm, details: e.target.value })}
                      placeholder="IBAN: BJ XX XXXX XXXX XXXX&#10;Banque: XXX&#10;Nom: GigaZone SARL&#10;&#10;Ou toute autre instruction..."
                      rows={5}
                      className={`w-full px-4 py-3 rounded-xl ${inputBg} ${textPrimary} border outline-none focus:border-purple-500`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer - fixe */}
            <div className={`flex-shrink-0 px-6 py-4 ${darkMode ? 'bg-slate-800' : 'bg-gray-50'} flex gap-3 border-t ${cardBorder}`}>
              <button
                onClick={() => setShowPaymentModal(false)}
                className={`flex-1 py-3 rounded-xl font-medium ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'} ${textPrimary} transition`}
              >
                Annuler
              </button>
              <button
                onClick={savePayment}
                className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {editingPayment !== null ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
