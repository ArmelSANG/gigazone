import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wifi, ArrowRight, Key, Phone, AlertCircle, CheckCircle, Moon, Sun, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseGet, supabasePost } from '../config/supabase';
import { countryDialCodes, whatsappRules, getWhatsAppValidationError } from '../utils/helpers';
import ChatWidget from '../components/chat/ChatWidget';
import { usePageSEO, SEO_CONFIGS } from '../hooks/usePageSEO';
import { useTheme } from '../hooks/useTheme';

export default function LoginPage() {
  usePageSEO(SEO_CONFIGS.login);
  const navigate = useNavigate();
  const { loginPromoteur, loginAdmin, promoteur, loading: authLoading } = useAuth();
  
  const { isDark: darkMode, toggle: toggleTheme } = useTheme();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Mode récupération
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [dialCode, setDialCode] = useState('+229');
  const [recoverySent, setRecoverySent] = useState(false);
  
  // Mode admin (caché)
  const [adminMode, setAdminMode] = useState(false);
  const [adminPwd, setAdminPwd] = useState('');

  // Rediriger si déjà connecté
  useEffect(() => {
    if (!authLoading && promoteur) {
      if (!promoteur.cgu_accepte) {
        navigate('/cgu');
      } else if (!promoteur.onboarding_complete) {
        navigate('/onboarding');
      } else {
        navigate('/promoteur');
      }
    }
  }, [promoteur, authLoading, navigate]);

  // Connexion promoteur
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await loginPromoteur(code);
    
    if (result.success) {
      if (result.needsCGU) {
        navigate('/cgu');
      } else {
        navigate('/promoteur');
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // Demande de récupération
  const handleRecovery = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation du numéro
    const cleanNumber = whatsapp.replace(/\D/g, '').replace(/^0+/, '');
    const validationError = getWhatsAppValidationError(cleanNumber, dialCode);
    
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    // Construire le numéro complet
    const fullWhatsapp = dialCode + cleanNumber;
    
    // Chercher avec le format exact
    let promoteurs = await supabaseGet(`promoteurs?whatsapp=eq.${encodeURIComponent(fullWhatsapp)}&select=id,nom_complet`);
    
    // Si pas trouvé, essayer avec le 0 initial
    if (!promoteurs || promoteurs.length === 0) {
      const withZero = dialCode + '0' + cleanNumber;
      promoteurs = await supabaseGet(`promoteurs?whatsapp=eq.${encodeURIComponent(withZero)}&select=id,nom_complet`);
    }
    
    // Si toujours pas trouvé, chercher avec une recherche plus large
    if (!promoteurs || promoteurs.length === 0) {
      // Chercher les 8 derniers chiffres
      const last8 = cleanNumber.slice(-8);
      promoteurs = await supabaseGet(`promoteurs?whatsapp=ilike.%${last8}&select=id,nom_complet`);
    }
    
    if (!promoteurs || promoteurs.length === 0) {
      setError('Aucun compte trouvé avec ce numéro WhatsApp. Vérifiez le numéro et l\'indicatif pays.');
      setLoading(false);
      return;
    }

    // Créer demande de récupération (table optionnelle)
    try {
      await supabasePost('demandes_recuperation', {
        whatsapp: fullWhatsapp,
        promoteur_id: promoteurs[0].id
      });
    } catch (e) {
      console.warn('Table demandes_recuperation non disponible:', e);
    }

    // Notification admin - TOUJOURS envoyée
    let notifResult = await supabasePost('notifications_admin', {
      type: 'demande_reinitialisation',
      titre: `🔑 Demande de réinitialisation de code`,
      message: `${promoteurs[0].nom_complet} (${fullWhatsapp}) demande un nouveau code d'accès. Allez dans Promoteurs > Réinitialiser son code.`,
      promoteur_id: promoteurs[0].id,
      data: { whatsapp: fullWhatsapp, nom: promoteurs[0].nom_complet, action: 'reset_code' }
    });
    
    // Fallback si le type demande_reinitialisation n'existe pas dans le CHECK
    if (!notifResult) {
      notifResult = await supabasePost('notifications_admin', {
        type: 'message_promoteur',
        titre: `🔑 Demande de réinitialisation de code`,
        message: `${promoteurs[0].nom_complet} (${fullWhatsapp}) demande un nouveau code d'accès. Allez dans Promoteurs > Réinitialiser son code.`,
        promoteur_id: promoteurs[0].id,
        data: { whatsapp: fullWhatsapp, nom: promoteurs[0].nom_complet, action: 'reset_code' }
      });
    }
    
    // Dernier fallback sans le champ data (au cas où la colonne n'existe pas)
    if (!notifResult) {
      notifResult = await supabasePost('notifications_admin', {
        type: 'message_promoteur',
        titre: `🔑 Demande réinit. code`,
        message: `${promoteurs[0].nom_complet} (${fullWhatsapp}) demande un nouveau code d'accès.`,
        promoteur_id: promoteurs[0].id
      });
    }
    
    if (notifResult) {
      setRecoverySent(true);
      setSuccess(`Demande envoyée ! L'administrateur vous contactera sur WhatsApp pour vous communiquer votre code.`);
    } else {
      setError('Erreur lors de l\'envoi. Contactez directement le +229 01 67 45 54 62.');
    }
    
    setLoading(false);
  };

  // Connexion admin
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await loginAdmin(adminPwd);
    
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // Double-clic sur logo pour mode admin
  const handleLogoDoubleClick = () => {
    setAdminMode(true);
  };

  const bgClass = darkMode ? 'bg-gray-950' : 'bg-gray-50';
  const cardClass = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const inputClass = darkMode 
    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-pink-500' 
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-pink-500';

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col overflow-x-hidden`}>
      
      {/* Header */}
      <header className={`p-4 flex items-center justify-between ${darkMode ? 'border-b border-gray-800' : 'border-b border-gray-200'}`}>
        <Link to="/" className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center cursor-pointer"
            onDoubleClick={handleLogoDoubleClick}
          >
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>GigaZone</span>
        </Link>
        
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} transition`}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className={`w-full max-w-md p-5 sm:p-8 rounded-2xl border ${cardClass} shadow-xl`}>
          
          {/* Mode Admin caché */}
          {adminMode ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-white" />
                </div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Admin</h1>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input
                  type="password"
                  value={adminPwd}
                  onChange={(e) => setAdminPwd(e.target.value)}
                  placeholder="Mot de passe admin"
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} outline-none transition`}
                />
                
                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !adminPwd}
                  className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/30 transition disabled:opacity-50"
                >
                  {loading ? 'Connexion...' : 'Connexion Admin'}
                </button>

                <button
                  type="button"
                  onClick={() => setAdminMode(false)}
                  className={`w-full py-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} hover:text-pink-500 transition`}
                >
                  ← Retour connexion promoteur
                </button>
              </form>
            </>
          ) : recoveryMode ? (
            /* Mode récupération */
            <>
              <button
                onClick={() => { setRecoveryMode(false); setRecoverySent(false); setError(''); }}
                className={`flex items-center gap-2 mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'} hover:text-pink-500 transition`}
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Code oublié ?
                </h1>
                <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Entrez votre numéro WhatsApp pour récupérer votre code
                </p>
              </div>

              {recoverySent ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {success}
                  </p>
                  <p className={`mt-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Un administrateur vous enverra votre code sur WhatsApp dans les plus brefs délais.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRecovery} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Numéro WhatsApp
                    </label>
                    <div className="flex gap-2">
                      {/* Sélecteur indicatif pays */}
                      <select
                        value={dialCode}
                        onChange={(e) => setDialCode(e.target.value)}
                        className={`w-24 sm:w-28 shrink-0 px-2 py-3 rounded-xl border text-sm ${inputClass} outline-none`}
                      >
                        {countryDialCodes.map(c => (
                          <option key={c.code} value={c.dial}>
                            {c.flag} {c.dial}
                          </option>
                        ))}
                      </select>
                      
                      {/* Champ numéro */}
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value.replace(/[^\d\s]/g, ''))}
                        placeholder={whatsappRules[dialCode]?.example || 'XX XX XX XX'}
                        className={`flex-1 min-w-0 px-3 sm:px-4 py-3 rounded-xl border ${inputClass} outline-none transition`}
                      />
                    </div>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {whatsappRules[dialCode]?.length} chiffres requis pour {whatsappRules[dialCode]?.name}
                    </p>
                  </div>
                  
                  {error && (
                    <div className="flex items-start gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-xl">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !whatsapp}
                    className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Envoi...' : 'Envoyer la demande'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              )}
            </>
          ) : (
            /* Mode connexion normal */
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-white" />
                </div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Espace Promoteur
                </h1>
                <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Connectez-vous avec votre code unique
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Code d'accès
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="VOTRE CODE"
                    maxLength={6}
                    className={`w-full px-4 py-3 rounded-xl border ${inputClass} outline-none transition text-center text-2xl font-mono tracking-widest uppercase placeholder:text-base placeholder:tracking-normal placeholder:font-sans`}
                  />
                </div>
                
                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              <div className="mt-6 text-center space-y-3">
                <button
                  onClick={() => setRecoveryMode(true)}
                  className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} hover:text-pink-500 transition`}
                >
                  Code oublié ?
                </button>
                
                <div className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} pt-4`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Pas encore de compte ?
                  </p>
                  <Link
                    to="/inscription"
                    className="text-pink-500 font-medium hover:text-pink-400 transition"
                  >
                    Devenir promoteur →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={`p-4 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
        © 2026 GigaZone • <Link to="/" className="hover:text-pink-500">Accueil</Link>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
