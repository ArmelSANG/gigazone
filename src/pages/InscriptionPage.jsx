import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Wifi, ArrowRight, User, Phone, MapPin, AlertCircle, 
  CheckCircle, Moon, Sun, Copy, Gift, ChevronDown
} from 'lucide-react';
import { supabaseGet, supabasePost } from '../config/supabase';
import { generateCode, countryDialCodes, detectCountry, validateWhatsApp, getWhatsAppValidationError, whatsappRules, copyToClipboard } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import ChatWidget from '../components/chat/ChatWidget';
import { usePageSEO, SEO_CONFIGS } from '../hooks/usePageSEO';
import { useTheme } from '../hooks/useTheme';

export default function InscriptionPage() {
  usePageSEO(SEO_CONFIGS.inscription);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { promoteur, loading: authLoading } = useAuth();
  
  const { isDark: darkMode, toggle: toggleTheme } = useTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Rediriger si déjà connecté
  useEffect(() => {
    if (!authLoading && promoteur) {
      navigate('/promoteur');
    }
  }, [promoteur, authLoading, navigate]);
  
  // Code généré
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeParrainage, setCodeParrainage] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  
  // Formulaire - initialiser avec le code parrain de l'URL si présent
  const [form, setForm] = useState({
    whatsapp: '',
    dialCode: '+229',
    nom_complet: '',
    pays: 'Bénin',
    ville: '',
    quartier: '',
    code_parrain: searchParams.get('parrain') || ''
  });
  
  // Parrain trouvé
  const [parrain, setParrain] = useState(null);

  // Générer le code au chargement
  useEffect(() => {
    const initCodes = async () => {
      // Générer code unique
      let code = generateCode(6);
      let exists = true;
      while (exists) {
        const check = await supabaseGet(`promoteurs?code_unique=eq.${code}&select=id`);
        if (!check || check.length === 0) {
          exists = false;
        } else {
          code = generateCode(6);
        }
      }
      setGeneratedCode(code);
      
      // Générer code parrainage
      let codeP = generateCode(6);
      exists = true;
      while (exists) {
        const check = await supabaseGet(`promoteurs?code_parrainage=eq.${codeP}&select=id`);
        if (!check || check.length === 0) {
          exists = false;
        } else {
          codeP = generateCode(6);
        }
      }
      setCodeParrainage(codeP);
      
      // Détecter pays
      const countryCode = await detectCountry();
      const country = countryDialCodes.find(c => c.code === countryCode);
      if (country) {
        setForm(f => ({ ...f, pays: country.name, dialCode: country.dial }));
      }
      
      // Vérifier le code parrain de l'URL
      const parrainFromUrl = searchParams.get('parrain');
      if (parrainFromUrl) {
        setForm(f => ({ ...f, code_parrain: parrainFromUrl.toUpperCase() }));
      }
    };
    initCodes();
  }, [searchParams]);

  // Vérifier code parrain
  const checkParrain = async () => {
    if (!form.code_parrain || form.code_parrain.length < 6) {
      setParrain(null);
      return;
    }
    
    const data = await supabaseGet(`promoteurs?code_parrainage=eq.${form.code_parrain.toUpperCase()}&select=id,nom_complet`);
    if (data && data.length > 0) {
      setParrain(data[0]);
    } else {
      setParrain(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkParrain, 500);
    return () => clearTimeout(timer);
  }, [form.code_parrain]);

  // Copier le code
  const handleCopyCode = async () => {
    await copyToClipboard(generatedCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Soumettre inscription
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Nettoyer et construire le numéro complet
    const cleanNumber = form.whatsapp.replace(/\D/g, '').replace(/^0+/, '');
    const fullWhatsapp = form.dialCode + cleanNumber;
    
    // Validation stricte du numéro WhatsApp
    const validationError = getWhatsAppValidationError(cleanNumber, form.dialCode);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    if (!validateWhatsApp(fullWhatsapp, form.dialCode)) {
      setError('Numéro WhatsApp invalide pour ' + (whatsappRules[form.dialCode]?.name || 'ce pays'));
      return;
    }
    if (!form.nom_complet.trim() || form.nom_complet.length < 3) {
      setError('Nom complet requis (min. 3 caractères)');
      return;
    }
    if (!form.ville.trim()) {
      setError('Ville requise');
      return;
    }
    
    setLoading(true);

    // Vérifier si WhatsApp existe déjà (recherche exacte)
    let existingWhatsapp = await supabaseGet(`promoteurs?whatsapp=eq.${encodeURIComponent(fullWhatsapp)}&select=id`);
    
    // Chercher aussi avec le 0 initial au cas où
    if (!existingWhatsapp || existingWhatsapp.length === 0) {
      const withZero = form.dialCode + '0' + cleanNumber;
      existingWhatsapp = await supabaseGet(`promoteurs?whatsapp=eq.${encodeURIComponent(withZero)}&select=id`);
    }
    
    // Chercher avec les 8 derniers chiffres pour éviter les doublons déguisés
    if (!existingWhatsapp || existingWhatsapp.length === 0) {
      const last8 = cleanNumber.slice(-8);
      existingWhatsapp = await supabaseGet(`promoteurs?whatsapp=ilike.%${last8}&select=id,whatsapp`);
      // Filtrer pour vérifier que c'est vraiment le même numéro
      if (existingWhatsapp && existingWhatsapp.length > 0) {
        existingWhatsapp = existingWhatsapp.filter(p => {
          const pClean = p.whatsapp.replace(/\D/g, '');
          return pClean.endsWith(cleanNumber) || cleanNumber.endsWith(pClean.slice(-8));
        });
      }
    }
    
    if (existingWhatsapp && existingWhatsapp.length > 0) {
      setError('Ce numéro WhatsApp est déjà utilisé par un autre compte');
      setLoading(false);
      return;
    }

    // Créer le promoteur
    const promoteurData = {
      code_unique: generatedCode,
      code_parrainage: codeParrainage,
      whatsapp: fullWhatsapp,
      nom_complet: form.nom_complet.trim(),
      pays: form.pays,
      ville: form.ville.trim(),
      quartier: form.quartier.trim() || null,
      parrain_id: parrain?.id || null,
      actif: true,
      cgu_accepte: false
    };

    const result = await supabasePost('promoteurs', promoteurData);

    if (result && result.length > 0) {
      // Notification au parrain
      if (parrain) {
        await supabasePost('notifications_promoteurs', {
          promoteur_id: parrain.id,
          type: 'filleul',
          titre: '🎉 Nouveau filleul !',
          message: `${form.nom_complet} vient de s'inscrire avec votre code de parrainage.`
        });
      }
      
      // Notification admin - nouveau promoteur
      await supabasePost('notifications_admin', {
        type: 'nouveau_promoteur',
        titre: `👤 Nouveau promoteur inscrit`,
        message: `${form.nom_complet} (${form.ville}, ${form.pays})${parrain ? ` — parrainé par ${parrain.nom_complet}` : ''}`,
        promoteur_id: result[0].id,
        data: { nom: form.nom_complet, ville: form.ville, pays: form.pays, parrain: parrain?.nom_complet || null }
      });
      
      // Sauvegarder en session et rediriger vers CGU
      sessionStorage.setItem('gz_promoteur_code', generatedCode);
      localStorage.setItem('gz_promoteur_code', generatedCode);
      setStep(3); // Écran de succès
    } else {
      setError('Erreur lors de l\'inscription. Réessayez.');
    }
    
    setLoading(false);
  };

  const bgClass = darkMode ? 'bg-gray-950' : 'bg-gray-50';
  const cardClass = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const inputClass = darkMode 
    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-pink-500' 
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-pink-500';
  const labelClass = darkMode ? 'text-gray-300' : 'text-gray-700';

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col overflow-x-hidden`}>
      
      {/* Header */}
      <header className={`p-4 flex items-center justify-between ${darkMode ? 'border-b border-gray-800' : 'border-b border-gray-200'}`}>
        <Link to="/" className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>GigaZone</span>
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
        <div className={`w-full max-w-lg p-5 sm:p-8 rounded-2xl border ${cardClass} shadow-xl`}>
          
          {step === 1 && (
            /* Étape 1 : Code généré */
            <>
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Votre code d'accès
                </h1>
                <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Gardez-le précieusement, c'est votre clé de connexion
                </p>
              </div>

              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} text-center mb-6`}>
                <div className="text-4xl font-mono font-bold tracking-[0.3em] bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-4">
                  {generatedCode || '------'}
                </div>
                <button
                  onClick={handleCopyCode}
                  className={`flex items-center gap-2 mx-auto px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} transition`}
                >
                  <Copy className="w-4 h-4" />
                  {codeCopied ? 'Copié !' : 'Copier le code'}
                </button>
              </div>

              <div className={`p-4 rounded-xl ${darkMode ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-200'} mb-6`}>
                <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                  ⚠️ <strong>Important :</strong> Notez ce code ! C'est votre unique moyen de connexion. 
                  Il ne sera plus affiché après cette étape.
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!generatedCode}
                className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                J'ai noté mon code, continuer
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {step === 2 && (
            /* Étape 2 : Formulaire profil */
            <>
              <div className="text-center mb-6">
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Complétez votre profil
                </h1>
                <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Ces informations sont obligatoires
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* WhatsApp */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    <Phone className="w-4 h-4 inline mr-2" />
                    Numéro WhatsApp *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={form.dialCode}
                      onChange={(e) => {
                        const newDial = e.target.value;
                        const country = countryDialCodes.find(c => c.dial === newDial);
                        setForm({ ...form, dialCode: newDial, pays: country?.name || form.pays });
                      }}
                      className={`w-24 sm:w-28 px-2 sm:px-3 py-3 rounded-xl border text-sm ${inputClass} outline-none`}
                    >
                      {countryDialCodes.map(c => (
                        <option key={c.code} value={c.dial}>
                          {c.flag} {c.dial}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/[^\d\s]/g, '') })}
                      placeholder={whatsappRules[form.dialCode]?.example || 'XX XX XX XX'}
                      className={`flex-1 min-w-0 px-3 sm:px-4 py-3 rounded-xl border ${inputClass} outline-none transition`}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {whatsappRules[form.dialCode]?.length || 8} chiffres requis pour {whatsappRules[form.dialCode]?.name || 'ce pays'}
                  </p>
                </div>

                {/* Nom complet */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    <User className="w-4 h-4 inline mr-2" />
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={form.nom_complet}
                    onChange={(e) => setForm({ ...form, nom_complet: e.target.value })}
                    placeholder="Jean Dupont"
                    className={`w-full px-4 py-3 rounded-xl border ${inputClass} outline-none transition`}
                  />
                </div>

                {/* Pays */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Pays *
                  </label>
                  <select
                    value={form.pays}
                    onChange={(e) => setForm({ ...form, pays: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border ${inputClass} outline-none`}
                  >
                    {countryDialCodes.map(c => (
                      <option key={c.code} value={c.name}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ville */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Ville *
                  </label>
                  <input
                    type="text"
                    value={form.ville}
                    onChange={(e) => setForm({ ...form, ville: e.target.value })}
                    placeholder="Cotonou"
                    className={`w-full px-4 py-3 rounded-xl border ${inputClass} outline-none transition`}
                  />
                </div>

                {/* Quartier */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Quartier
                  </label>
                  <input
                    type="text"
                    value={form.quartier}
                    onChange={(e) => setForm({ ...form, quartier: e.target.value })}
                    placeholder="Akpakpa (optionnel)"
                    className={`w-full px-4 py-3 rounded-xl border ${inputClass} outline-none transition`}
                  />
                </div>

                {/* Code parrain */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    <Gift className="w-4 h-4 inline mr-2" />
                    Code parrain (optionnel)
                  </label>
                  <input
                    type="text"
                    value={form.code_parrain}
                    onChange={(e) => setForm({ ...form, code_parrain: e.target.value.toUpperCase() })}
                    placeholder="CODE DE VOTRE PARRAIN"
                    maxLength={6}
                    className={`w-full px-4 py-3 rounded-xl border ${inputClass} outline-none transition uppercase font-mono tracking-wider`}
                  />
                  {form.code_parrain && form.code_parrain.length === 6 && (
                    <div className={`mt-2 text-sm ${parrain ? 'text-green-500' : 'text-red-500'}`}>
                      {parrain ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Parrain trouvé : {parrain.nom_complet}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Code parrain invalide
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm p-3 rounded-lg bg-red-500/10">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Inscription...' : 'Créer mon compte'}
                  <ArrowRight className="w-5 h-5" />
                </button>

                <p className={`text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  En créant un compte, vous acceptez nos{' '}
                  <Link to="/cgu-publique" className="text-pink-500 hover:underline" target="_blank">conditions d'utilisation</Link>
                </p>
              </form>
            </>
          )}

          {step === 3 && (
            /* Étape 3 : Succès */
            <>
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Inscription réussie ! 🎉
                </h1>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
                  Bienvenue dans la famille GigaZone
                </p>

                <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} mb-6`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                    Votre code de connexion :
                  </p>
                  <div className="text-3xl font-mono font-bold tracking-[0.3em] bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    {generatedCode}
                  </div>
                </div>

                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mb-6`}>
                  Vous devez accepter les conditions d'utilisation avant d'accéder à votre espace.
                </p>

                <button
                  onClick={() => navigate('/cgu')}
                  className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/30 transition flex items-center justify-center gap-2"
                >
                  Lire et accepter les CGU
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}

          {/* Lien connexion */}
          {step < 3 && (
            <div className={`mt-6 text-center border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} pt-4`}>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Déjà un compte ?
              </p>
              <Link to="/login" className="text-pink-500 font-medium hover:text-pink-400 transition">
                Se connecter →
              </Link>
            </div>
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
