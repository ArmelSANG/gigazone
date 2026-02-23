import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Package, Calculator, CreditCard, Upload,
  Check, AlertCircle, Wifi, ChevronDown, Image, X, CheckCircle,
  DollarSign, Gift, Percent, Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseGet, supabasePost, supabaseUpload } from '../config/supabase';
import { 
  formatCurrency, calculateOrder, getNiveauBonus, getNiveauInfo, getTauxEffectif 
} from '../utils/helpers';
import { usePageSEO, SEO_CONFIGS } from '../hooks/usePageSEO';
import { useTheme } from '../hooks/useTheme';

export default function NouvelleCommandePage() {
  usePageSEO(SEO_CONFIGS.nouvelleCommande);
  const { isDark: d } = useTheme();
  const navigate = useNavigate();
  const { promoteur, refreshPromoteur } = useAuth();
  
  // États
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Données
  const [forfaits, setForfaits] = useState([]);
  const [tauxGlobal, setTauxGlobal] = useState(70);
  const [moyensPaiementV2, setMoyensPaiementV2] = useState([]);
  const [settings, setSettings] = useState({
    tauxRemise: 70,
    tauxCommission: 5
  });
  
  // Sélections
  const [selectedForfait, setSelectedForfait] = useState(null);
  const [quantite, setQuantite] = useState(10);
  const [useCommission, setUseCommission] = useState(true);
  const [commissionAmount, setCommissionAmount] = useState(0);
  const [selectedMoyen, setSelectedMoyen] = useState(null);
  const [preuvePaiement, setPreuvePaiement] = useState(null);
  const [preuvePreview, setPreuvePreview] = useState('');

  // Charger données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    const pkgData = await supabaseGet('packages?select=*&order=price.asc');
    if (pkgData) {
      setForfaits(pkgData.map(p => ({
        id: p.id,
        nom: p.name,
        prix: p.price,
        duree: p.duration || '1 jour',
        data: p.data_limit || 'Illimité',
        vitesse: p.speed || '30 Mbps'
      })));
    }
    
    const settingsData = await supabaseGet('settings_global?select=*');
    if (settingsData) {
      const s = {};
      settingsData.forEach(item => {
        if (item.cle === 'taux_remise_global') {
          s.tauxRemise = parseFloat(item.valeur);
          setTauxGlobal(parseFloat(item.valeur));
        }
        if (item.cle === 'taux_commission_parrainage') s.tauxCommission = parseFloat(item.valeur);
        if (item.cle === 'moyens_paiement_v2') {
          try {
            setMoyensPaiementV2(JSON.parse(item.valeur));
          } catch {
            setMoyensPaiementV2([]);
          }
        }
      });
      setSettings(prev => ({ ...prev, ...s }));
    }
    
    setLoading(false);
  };

  // Calcul du taux effectif du promoteur
  const tauxInfo = useMemo(() => {
    return getTauxEffectif(promoteur, tauxGlobal);
  }, [promoteur, tauxGlobal]);

  // Calcul demande - NOUVEAU MODÈLE : Frais de service
  const calculation = useMemo(() => {
    if (!selectedForfait || !promoteur) return null;
    
    // Valeur totale des tickets (pour info)
    const valeurTickets = selectedForfait.prix * quantite;
    
    // Frais de service = valeur × taux (le bonus niveau RÉDUIT les frais)
    const fraisService = Math.round(valeurTickets * tauxInfo.tauxEffectif / 100);
    
    // Commission utilisable (ne peut pas dépasser les frais)
    const commissionUtilisee = useCommission ? Math.min(commissionAmount, fraisService, promoteur.solde_commission || 0) : 0;
    
    // Net à payer = frais - commission
    const netAPayer = Math.max(0, fraisService - commissionUtilisee);
    
    return {
      valeurTickets,
      totalBrut: valeurTickets, // Compatibilité
      tauxBase: tauxInfo.tauxBase,
      bonusNiveau: tauxInfo.bonusNiveau,
      tauxEffectif: tauxInfo.tauxEffectif,
      estPersonnalise: tauxInfo.estPersonnalise,
      fraisService,
      montantRemise: fraisService, // Compatibilité
      netAvantCommission: fraisService,
      commissionUtilisee,
      netAPayer
    };
  }, [selectedForfait, quantite, tauxInfo, promoteur, useCommission, commissionAmount]);

  // Gestion fichier
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Fichier trop volumineux (max 5 Mo)');
        return;
      }
      setPreuvePaiement(file);
      setPreuvePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleRemoveFile = () => {
    setPreuvePaiement(null);
    setPreuvePreview('');
  };

  // Soumission
  const handleSubmit = async () => {
    if (!selectedForfait || !preuvePaiement || !selectedMoyen || !calculation) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      // Upload preuve
      const fileName = `${promoteur.id}_${Date.now()}_${preuvePaiement.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      console.log('Uploading proof:', fileName, preuvePaiement.type, preuvePaiement.size);
      
      const preuveUrl = await supabaseUpload('commandes', fileName, preuvePaiement);
      
      // Nom du moyen de paiement pour la commande
      const moyenPaiementNom = selectedMoyen.type === 'mobile' 
        ? `${selectedMoyen.reseau} Mobile Money` 
        : selectedMoyen.mode;
      
      // Créer demande
      const commandeData = {
        promoteur_id: promoteur.id,
        forfait_id: selectedForfait.id,
        forfait_nom: selectedForfait.nom,
        prix_unitaire: selectedForfait.prix,
        quantite: quantite,
        total_brut: calculation.valeurTickets,
        taux_remise: calculation.tauxEffectif, // C'est maintenant le taux de frais
        montant_remise: calculation.fraisService, // C'est les frais de service
        net_avant_commission: calculation.fraisService,
        commission_utilisee: calculation.commissionUtilisee,
        net_a_payer: calculation.netAPayer,
        benefice_promoteur: 0, // Plus de bénéfice dans ce modèle
        parrain_id: promoteur.parrain_id,
        moyen_paiement: moyenPaiementNom,
        preuve_paiement_url: preuveUrl,
        statut: 'en_attente'
      };
      
      const result = await supabasePost('commandes_promoteurs', commandeData);
      
      if (!result) {
        throw new Error('Erreur création demande');
      }
      
      // Notification admin - nouvelle demande
      await supabasePost('notifications_admin', {
        type: 'nouvelle_commande',
        titre: `📝 Nouvelle demande de ${promoteur.nom_complet}`,
        message: `${quantite} tickets ${selectedForfait.nom} - Frais: ${formatCurrency(calculation.netAPayer)}`,
        promoteur_id: promoteur.id,
        commande_id: result[0].id,
        data: {
          forfait: selectedForfait.nom,
          quantite: quantite,
          frais: calculation.netAPayer,
          code_promoteur: promoteur.code_unique
        }
      });
      
      // Commission utilisée
      if (calculation.commissionUtilisee > 0) {
        await supabasePost('commissions_historique', {
          promoteur_id: promoteur.id,
          type: 'utilisee',
          montant: calculation.commissionUtilisee,
          commande_id: result[0].id,
          description: `Utilisée sur commande ${selectedForfait.nom}`,
          solde_apres: promoteur.solde_commission - calculation.commissionUtilisee
        });
      }
      
      await refreshPromoteur();
      setSuccess(true);
      
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Erreur lors de la soumission');
    }
    
    setSubmitting(false);
  };

  // Navigation étapes
  const canGoNext = () => {
    if (step === 1) return selectedForfait !== null;
    if (step === 2) return quantite >= 1;
    if (step === 3) return selectedMoyen !== null;
    if (step === 4) return preuvePaiement !== null;
    return false;
  };

  // Helper pour les couleurs des réseaux
  const getReseauStyle = (reseau) => {
    switch (reseau) {
      case 'MTN': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '🟡' };
      case 'Moov': return { bg: 'bg-blue-500/20', text: 'text-amber-400', icon: '🔵' };
      case 'Celtiis': return { bg: 'bg-green-500/20', text: 'text-green-400', icon: '🟢' };
      default: return { bg: 'bg-gray-500/20', text: 'd ? "text-gray-400" : "text-gray-500"', icon: '⚪' };
    }
  };

  const niveauInfo = getNiveauInfo(promoteur?.niveau);

  // Loading
  if (loading) {
    return (
      <div className={`min-h-screen ${d ? 'bg-gray-950' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div className={`min-h-screen ${d ? 'bg-gray-950' : 'bg-gray-50'} flex items-center justify-center p-4`}>
        <div className={`max-w-md w-full ${d ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-2xl p-6 sm:p-8 text-center`}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
          </div>
          <h2 className={`text-xl sm:text-2xl font-bold ${d ? 'text-white' : 'text-gray-900'} mb-2`}>Demande envoyée ! 🎉</h2>
          <p className={`${d ? 'text-gray-400' : 'text-gray-500'} mb-6 text-sm sm:text-base`}>
            Votre demande de tickets est en attente de validation. Vous recevrez une notification dès qu'elle sera traitée.
          </p>
          
          <div className={`${d ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl p-4 mb-6 text-left space-y-2`}>
            <div className="flex justify-between text-sm">
              <span className={d ? 'text-gray-400' : 'text-gray-500'}>Forfait</span>
              <span className={d ? 'text-white' : 'text-gray-900'}>{selectedForfait?.nom}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={d ? 'text-gray-400' : 'text-gray-500'}>Tickets à créer</span>
              <span className={d ? 'text-white' : 'text-gray-900'}>{quantite} tickets</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={d ? 'text-gray-400' : 'text-gray-500'}>Frais de service payés</span>
              <span className="text-pink-400 font-semibold">{formatCurrency(calculation?.netAPayer)}</span>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/promoteur')}
            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${d ? 'bg-gray-950' : 'bg-gray-50'} overflow-x-hidden`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 ${d ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-200'} backdrop-blur-lg border-b px-4 py-4`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/promoteur')}
            className={`flex items-center gap-2 ${d ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">{step > 1 ? 'Retour' : 'Annuler'}</span>
          </button>
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-pink-500" />
            <span className={`font-semibold ${d ? 'text-white' : 'text-gray-900'} text-sm sm:text-base`}>Nouvelle demande</span>
          </div>
          <div className="w-8 sm:w-16" />
        </div>
      </header>

      {/* Progress Steps */}
      <div className="w-full px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            {[
              { num: 1, label: 'Forfait', icon: Package },
              { num: 2, label: 'Quantité', icon: Calculator },
              { num: 3, label: 'Paiement', icon: CreditCard },
              { num: 4, label: 'Confirmation', icon: Upload }
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-1 transition ${
                    step >= s.num 
                      ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white' 
                      : d ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s.num ? <Check className="w-5 h-5" /> : <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium ${step >= s.num ? d ? 'text-white' : 'text-gray-900' : d ? 'text-gray-500' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded ${step > s.num ? 'bg-pink-500' : d ? 'bg-gray-800' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Contenu étapes */}
          <div className={`${d ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-2xl p-4 sm:p-6`}>
            
            {/* ÉTAPE 1 */}
            {step === 1 && (
              <div>
                <h2 className={`text-lg sm:text-xl font-bold ${d ? 'text-white' : 'text-gray-900'} mb-2`}>Choisissez un forfait</h2>
                <p className={`${d ? 'text-gray-400' : 'text-gray-500'} text-sm mb-6`}>Sélectionnez le forfait WiFi à acheter</p>
                
                <div className="grid gap-3">
                  {forfaits.map(forfait => (
                    <button
                      key={forfait.id}
                      onClick={() => setSelectedForfait(forfait)}
                      className={`p-4 rounded-xl border-2 text-left transition ${
                        selectedForfait?.id === forfait.id
                          ? 'border-pink-500 bg-pink-500/10'
                          : d ? d ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600' : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`${d ? 'text-white' : 'text-gray-900'} font-medium`}>{forfait.nom}</div>
                          <div className={`text-xs sm:text-sm ${d ? 'text-gray-400' : 'text-gray-500'}`}>{forfait.duree} • {forfait.data}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-pink-400 font-bold">{formatCurrency(forfait.prix)}</div>
                          {selectedForfait?.id === forfait.id && (
                            <CheckCircle className="w-5 h-5 text-pink-400 ml-auto mt-1" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ÉTAPE 2 */}
            {step === 2 && selectedForfait && (
              <div>
                <h2 className={`text-lg sm:text-xl font-bold ${d ? 'text-white' : 'text-gray-900'} mb-2`}>Quantité et calcul</h2>
                <p className={`${d ? 'text-gray-400' : 'text-gray-500'} text-sm mb-6`}>Définissez le nombre de tickets</p>
                
                {/* Forfait sélectionné */}
                <div className={`${d ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl p-3 mb-6 flex items-center justify-between`}>
                  <div>
                    <div className={`${d ? 'text-white' : 'text-gray-900'} font-medium text-sm`}>{selectedForfait.nom}</div>
                    <div className={`text-xs ${d ? 'text-gray-400' : 'text-gray-500'}`}>{selectedForfait.duree}</div>
                  </div>
                  <div className="text-pink-400 font-bold text-sm">{formatCurrency(selectedForfait.prix)}/ticket</div>
                </div>

                {/* Quantité */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium ${d ? 'text-gray-300' : 'text-gray-500'} mb-3`}>Nombre de tickets</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantite(Math.max(1, quantite - 10))}
                      className={`w-10 h-10 rounded-xl ${d ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} font-bold text-xl transition flex-shrink-0`}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantite}
                      onChange={(e) => setQuantite(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      className={`flex-1 min-w-0 text-center text-2xl font-bold ${d ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border rounded-xl py-2 outline-none focus:border-pink-500`}
                    />
                    <button
                      onClick={() => setQuantite(quantite + 10)}
                      className={`w-10 h-10 rounded-xl ${d ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} font-bold text-xl transition flex-shrink-0`}
                    >
                      +
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {[10, 25, 50, 100].map(q => (
                      <button
                        key={q}
                        onClick={() => setQuantite(q)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                          quantite === q ? 'bg-pink-500 text-white' : d ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Commission - toujours visible */}
                <div className={`mb-6 p-4 rounded-xl ${promoteur.solde_commission > 0 ? 'bg-amber-500/10 border border-amber-500/20' : d ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className={`w-5 h-5 ${promoteur.solde_commission > 0 ? 'text-amber-400' : d ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`font-medium text-sm ${promoteur.solde_commission > 0 ? d ? 'text-white' : 'text-gray-900' : d ? 'text-gray-400' : 'text-gray-500'}`}>
                        Commission de parrainage
                      </span>
                    </div>
                    <span className={`font-semibold ${promoteur.solde_commission > 0 ? 'text-amber-400' : d ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formatCurrency(promoteur.solde_commission || 0)}
                    </span>
                  </div>
                  
                  {promoteur.solde_commission > 0 ? (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm ${d ? 'text-gray-400' : 'text-gray-500'}`}>Utiliser mes commissions</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useCommission}
                            onChange={(e) => {
                              setUseCommission(e.target.checked);
                              if (e.target.checked && calculation) {
                                const maxUtilisable = Math.min(promoteur.solde_commission, calculation.netAvantCommission);
                                setCommissionAmount(maxUtilisable);
                              }
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-pink-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                      </div>
                      {useCommission && calculation && (
                        <div>
                          <div className={`text-sm ${d ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                            Montant à utiliser (max: {formatCurrency(Math.min(promoteur.solde_commission, calculation.netAvantCommission))})
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={Math.min(promoteur.solde_commission, calculation.netAvantCommission)}
                            value={commissionAmount}
                            onChange={(e) => setCommissionAmount(parseInt(e.target.value))}
                            className="w-full accent-pink-500"
                          />
                          <div className="flex justify-between items-center mt-2">
                            <button
                              onClick={() => setCommissionAmount(0)}
                              className={`text-xs ${d ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                              Minimum
                            </button>
                            <span className="text-lg font-bold text-blue-400">
                              -{formatCurrency(commissionAmount)}
                            </span>
                            <button
                              onClick={() => setCommissionAmount(Math.min(promoteur.solde_commission, calculation.netAvantCommission))}
                              className={`text-xs ${d ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                              Maximum
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className={`text-xs ${d ? 'text-gray-500' : 'text-gray-400'} mt-2`}>
                      Parrainez des promoteurs pour gagner des commissions utilisables sur vos commandes.
                    </p>
                  )}
                </div>

                {/* Récapitulatif */}
                {calculation && (
                  <div className={`${d ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl p-4 space-y-3`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="w-5 h-5 text-pink-400" />
                      <span className={`font-semibold ${d ? 'text-white' : 'text-gray-900'} text-sm`}>Récapitulatif</span>
                      <span className={`ml-auto px-2 py-1 rounded-lg text-xs ${niveauInfo.bg} ${niveauInfo.color}`}>
                        {niveauInfo.icon} {niveauInfo.label}
                      </span>
                    </div>
                    
                    {/* Valeur des tickets */}
                    <div className={`flex justify-between text-sm ${d ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span>{quantite} tickets × {formatCurrency(selectedForfait.prix)}</span>
                      <span className={d ? 'text-white' : 'text-gray-900'}>{formatCurrency(calculation.valeurTickets)}</span>
                    </div>
                    
                    {/* Frais de service */}
                    <div className="flex justify-between text-sm text-pink-400">
                      <span className="flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        Frais de service ({calculation.tauxBase}%{calculation.bonusNiveau > 0 ? ` - ${calculation.bonusNiveau}%` : ''})
                        {calculation.estPersonnalise && <span className="text-xs text-yellow-400">(perso)</span>}
                      </span>
                      <span>{formatCurrency(calculation.fraisService)}</span>
                    </div>
                    
                    {/* Commission - toujours afficher si le promoteur en a */}
                    {promoteur.solde_commission > 0 && (
                      <div className={`flex justify-between text-sm ${calculation.commissionUtilisee > 0 ? 'text-amber-400' : d ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span className="flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          Commission {calculation.commissionUtilisee > 0 ? 'utilisée' : 'disponible'}
                        </span>
                        <span>
                          {calculation.commissionUtilisee > 0 
                            ? `-${formatCurrency(calculation.commissionUtilisee)}`
                            : `${formatCurrency(promoteur.solde_commission)} dispo`
                          }
                        </span>
                      </div>
                    )}
                    
                    {/* Net à payer */}
                    <div className={`border-t ${d ? 'border-gray-700' : 'border-gray-200'} pt-3 mt-3`}>
                      <div className="flex justify-between">
                        <span className={`font-semibold ${d ? 'text-white' : 'text-gray-900'}`}>Total à payer</span>
                        <span className="font-bold text-pink-400 text-lg">{formatCurrency(calculation.netAPayer)}</span>
                      </div>
                      <div className={`text-xs ${d ? 'text-gray-500' : 'text-gray-400'} mt-1 text-center`}>
                        Vous recevrez {quantite} tickets à vendre à vos clients
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ÉTAPE 3 */}
            {step === 3 && calculation && (
              <div>
                <h2 className={`text-lg sm:text-xl font-bold ${d ? 'text-white' : 'text-gray-900'} mb-2`}>Moyen de paiement</h2>
                <p className={`${d ? 'text-gray-400' : 'text-gray-500'} text-sm mb-6`}>Choisissez comment payer</p>
                
                {/* Montant */}
                <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-xl p-4 mb-6 text-center">
                  <div className={`${d ? 'text-gray-400' : 'text-gray-500'} text-sm mb-1`}>Montant à payer</div>
                  <div className={`text-3xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(calculation.netAPayer)}</div>
                </div>

                {/* Liste moyens de paiement */}
                {moyensPaiementV2.length === 0 ? (
                  <div className={`text-center py-8 ${d ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100 border-gray-200'} rounded-xl border`}>
                    <CreditCard className={`w-10 h-10 mx-auto mb-3 ${d ? 'text-gray-500' : 'text-gray-400'}`} />
                    <p className={d ? 'text-gray-400' : 'text-gray-500'}>Aucun moyen de paiement configuré</p>
                    <p className={`text-sm ${d ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Contactez l'administrateur</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {moyensPaiementV2.map((moyen, idx) => {
                      const isMobile = moyen.type === 'mobile';
                      const reseauStyle = isMobile ? getReseauStyle(moyen.reseau) : null;
                      const isSelected = selectedMoyen?.id === moyen.id;
                      
                      return (
                        <button
                          key={moyen.id || idx}
                          onClick={() => setSelectedMoyen(moyen)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition ${
                            isSelected
                              ? 'border-pink-500 bg-pink-500/10'
                              : d ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600' : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              isMobile ? reseauStyle.bg : 'bg-purple-500/20'
                            }`}>
                              {isMobile ? (
                                <span className="text-2xl">{reseauStyle.icon}</span>
                              ) : (
                                <CreditCard className="w-6 h-6 text-purple-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className={`${d ? 'text-white' : 'text-gray-900'} font-medium`}>
                                {isMobile ? `${moyen.reseau} Mobile Money` : moyen.mode}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {isMobile ? `${moyen.numero} • ${moyen.nom}` : 'Mode personnalisé'}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-6 h-6 text-pink-400" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Instructions de paiement */}
                {selectedMoyen && (
                  <div className={`mt-6 p-4 rounded-xl ${d ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border`}>
                    <h4 className={`${d ? 'text-white' : 'text-gray-900'} font-medium mb-3 flex items-center gap-2`}>
                      <AlertCircle className="w-4 h-4 text-pink-400" />
                      Instructions de paiement
                    </h4>
                    
                    {selectedMoyen.type === 'mobile' ? (
                      <div className="space-y-3">
                        <p className={`text-sm ${d ? 'text-gray-400' : 'text-gray-500'}`}>
                          Envoyez <span className="text-pink-400 font-semibold">{formatCurrency(calculation.netAPayer)}</span> via {selectedMoyen.reseau} Mobile Money :
                        </p>
                        <div className={`${d ? 'bg-gray-900' : 'bg-gray-100'} p-4 rounded-xl`}>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{getReseauStyle(selectedMoyen.reseau).icon}</span>
                            <div>
                              <div className={`${d ? 'text-white' : 'text-gray-900'} font-mono text-lg`}>{selectedMoyen.numero}</div>
                              <div className={`text-sm ${d ? 'text-gray-400' : 'text-gray-500'}`}>{selectedMoyen.nom}</div>
                            </div>
                          </div>
                        </div>
                        <div className={`text-sm ${d ? 'text-gray-400' : 'text-gray-500'} space-y-1`}>
                          <p>1. Ouvrez votre application {selectedMoyen.reseau} Mobile Money</p>
                          <p>2. Envoyez le montant au numéro ci-dessus</p>
                          <p>3. Capturez la confirmation de transaction</p>
                          <p>4. Uploadez la capture à l'étape suivante</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className={`text-sm ${d ? 'text-gray-400' : 'text-gray-500'}`}>
                          Montant à payer : <span className="text-pink-400 font-semibold">{formatCurrency(calculation.netAPayer)}</span>
                        </p>
                        <div className={`${d ? 'bg-gray-900' : 'bg-gray-100'} p-4 rounded-xl`}>
                          <div className={`${d ? 'text-white' : 'text-gray-900'} whitespace-pre-wrap text-sm`}>
                            {selectedMoyen.details}
                          </div>
                        </div>
                        <div className={`text-sm ${d ? 'text-gray-400' : 'text-gray-500'} space-y-1`}>
                          <p>1. Suivez les instructions ci-dessus</p>
                          <p>2. Effectuez le paiement</p>
                          <p>3. Capturez/photographiez la preuve de paiement</p>
                          <p>4. Uploadez la preuve à l'étape suivante</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ÉTAPE 4 */}
            {step === 4 && calculation && (
              <div>
                <h2 className={`text-lg sm:text-xl font-bold ${d ? 'text-white' : 'text-gray-900'} mb-2`}>Confirmation</h2>
                <p className={`${d ? 'text-gray-400' : 'text-gray-500'} text-sm mb-6`}>Uploadez votre preuve de paiement</p>

                {/* Récap */}
                <div className={`${d ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl p-4 mb-6 space-y-2 text-sm`}>
                  <div className="flex justify-between">
                    <span className={d ? 'text-gray-400' : 'text-gray-500'}>Forfait</span>
                    <span className={d ? 'text-white' : 'text-gray-900'}>{selectedForfait?.nom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={d ? 'text-gray-400' : 'text-gray-500'}>Quantité</span>
                    <span className={d ? 'text-white' : 'text-gray-900'}>{quantite} tickets</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={d ? 'text-gray-400' : 'text-gray-500'}>Paiement</span>
                    <span className={d ? 'text-white' : 'text-gray-900'}>
                      {selectedMoyen?.type === 'mobile' 
                        ? `${selectedMoyen.reseau} Mobile Money` 
                        : selectedMoyen?.mode}
                    </span>
                  </div>
                  <div className={`flex justify-between border-t ${d ? 'border-gray-700' : 'border-gray-200'} pt-2 mt-2`}>
                    <span className={d ? 'text-gray-400' : 'text-gray-500'}>Montant payé</span>
                    <span className="text-pink-400 font-bold">{formatCurrency(calculation.netAPayer)}</span>
                  </div>
                </div>

                {/* Upload */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium ${d ? 'text-gray-300' : 'text-gray-500'} mb-3`}>
                    Preuve de paiement *
                  </label>
                  
                  {!preuvePreview ? (
                    <label className={`flex flex-col items-center justify-center w-full h-40 border-2 ${d ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'} border-dashed rounded-xl cursor-pointer hover:border-pink-500 transition`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className={`w-10 h-10 ${d ? 'text-gray-500' : 'text-gray-400'} mb-3`} />
                        <p className={`text-sm ${d ? 'text-gray-400' : 'text-gray-500'}`}>Cliquez pour uploader</p>
                        <p className={`text-xs ${d ? 'text-gray-500' : 'text-gray-400'} mt-1`}>PNG, JPG (max 5 Mo)</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  ) : (
                    <div className="relative">
                      <img src={preuvePreview} alt="Preuve" className={`w-full h-48 object-contain rounded-xl ${d ? 'bg-gray-800' : 'bg-gray-100'}`} />
                      <button
                        onClick={handleRemoveFile}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Alerte */}
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-400">
                      Votre commande sera vérifiée par l'administrateur. Vous recevrez une notification dès validation.
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className={`flex-1 py-3 rounded-xl font-medium ${d ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} transition flex items-center justify-center gap-2`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">Retour</span>
                </button>
              )}
              
              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canGoNext()}
                  className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continuer
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canGoNext() || submitting}
                  className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirmer
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
