import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Wifi, Key, AlertCircle, CheckCircle, Clock, Copy, ArrowRight, RefreshCw } from 'lucide-react';
import { supabaseGet, supabasePatch, supabasePost } from '../config/supabase';
import { generateCode, copyToClipboard } from '../utils/helpers';
import { usePageSEO, SEO_CONFIGS } from '../hooks/usePageSEO';
import { useTheme } from '../hooks/useTheme';

export default function ResetCodePage() {
  usePageSEO(SEO_CONFIGS.resetCode);
  const { isDark: d } = useTheme();
  const { token } = useParams();
  
  const [status, setStatus] = useState('loading'); // loading, valid, expired, used, invalid, success
  const [promoteur, setPromoteur] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [newCode, setNewCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [expiresIn, setExpiresIn] = useState('');

  // Vérifier le token au chargement
  useEffect(() => {
    checkToken();
  }, [token]);

  const checkToken = async () => {
    if (!token || token.length < 32) {
      setStatus('invalid');
      return;
    }

    try {
      // Chercher le token
      const tokens = await supabaseGet(`reset_tokens?token=eq.${token}&select=*,promoteurs(id,nom_complet,whatsapp,code_unique)`);
      
      if (!tokens || tokens.length === 0) {
        setStatus('invalid');
        return;
      }

      const tokenRecord = tokens[0];
      setTokenData(tokenRecord);
      setPromoteur(tokenRecord.promoteurs);

      // Vérifier si déjà utilisé
      if (tokenRecord.used) {
        setNewCode(tokenRecord.nouveau_code);
        setStatus('used');
        return;
      }

      // Vérifier l'expiration
      const expiresAt = new Date(tokenRecord.expires_at);
      const now = new Date();
      
      if (now > expiresAt) {
        setStatus('expired');
        return;
      }

      // Calculer le temps restant
      const diffMs = expiresAt - now;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setExpiresIn(`${diffHours}h ${diffMins}min`);

      setStatus('valid');
    } catch (error) {
      console.error('Erreur vérification token:', error);
      setStatus('invalid');
    }
  };

  // Générer un nouveau code unique
  const generateUniqueCode = async () => {
    let code = generateCode(6);
    let exists = true;
    let attempts = 0;
    
    while (exists && attempts < 10) {
      const check = await supabaseGet(`promoteurs?code_unique=eq.${code}&select=id`);
      if (!check || check.length === 0) {
        exists = false;
      } else {
        code = generateCode(6);
        attempts++;
      }
    }
    
    return code;
  };

  // Réinitialiser le code
  const handleReset = async () => {
    setLoading(true);

    try {
      // Générer nouveau code unique
      const nouveauCode = await generateUniqueCode();

      // Mettre à jour le promoteur
      const updatePromo = await supabasePatch(`promoteurs?id=eq.${promoteur.id}`, {
        code_unique: nouveauCode,
        updated_at: new Date().toISOString()
      });

      if (!updatePromo) {
        throw new Error('Erreur mise à jour promoteur');
      }

      // Marquer le token comme utilisé
      await supabasePatch(`reset_tokens?id=eq.${tokenData.id}`, {
        used: true,
        used_at: new Date().toISOString(),
        nouveau_code: nouveauCode
      });

      // Créer notification
      await supabasePost('notifications_promoteurs', {
        promoteur_id: promoteur.id,
        type: 'info',
        titre: 'Code réinitialisé',
        message: `Votre nouveau code de connexion est : ${nouveauCode}`
      });

      setNewCode(nouveauCode);
      setStatus('success');
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    }

    setLoading(false);
  };

  // Copier le code
  const handleCopyCode = async () => {
    await copyToClipboard(newCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className={`min-h-screen ${d ? 'bg-gray-950' : 'bg-gray-50'} flex flex-col`}>
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-center">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <span className={`text-xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}>GigaZone</span>
        </Link>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Loading */}
          {status === 'loading' && (
            <div className={`${d ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-2xl p-8 text-center`}>
              <RefreshCw className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
              <p className={d ? 'text-gray-400' : 'text-gray-500'}>Vérification du lien...</p>
            </div>
          )}

          {/* Token invalide */}
          {status === 'invalid' && (
            <div className={`${d ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-2xl p-8 text-center`}>
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className={`text-xl font-bold ${d ? 'text-white' : 'text-gray-900'} mb-2`}>Lien invalide</h1>
              <p className={`${d ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
                Ce lien de réinitialisation n'est pas valide ou a été mal copié.
              </p>
              <Link 
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition"
              >
                Retour à la connexion
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Token expiré */}
          {status === 'expired' && (
            <div className={`${d ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-2xl p-8 text-center`}>
              <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
              <h1 className={`text-xl font-bold ${d ? 'text-white' : 'text-gray-900'} mb-2`}>Lien expiré</h1>
              <p className={`${d ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
                Ce lien de réinitialisation a expiré. Veuillez contacter l'administrateur pour obtenir un nouveau lien.
              </p>
              <Link 
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition"
              >
                Retour à la connexion
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Token déjà utilisé */}
          {status === 'used' && (
            <div className={`${d ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-2xl p-8 text-center`}>
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
              <h1 className={`text-xl font-bold ${d ? 'text-white' : 'text-gray-900'} mb-2`}>Déjà réinitialisé</h1>
              <p className={`${d ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                Ce lien a déjà été utilisé. Votre code de connexion est :
              </p>
              
              {newCode && (
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-3">
                    <div className={`px-6 py-3 ${d ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl font-mono text-2xl tracking-widest text-pink-400`}>
                      {newCode}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className={`p-3 ${d ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} rounded-xl transition`}
                    >
                      {codeCopied ? <CheckCircle className="w-6 h-6 text-green-400" /> : <Copy className="w-6 h-6 text-gray-400" />}
                    </button>
                  </div>
                </div>
              )}

              <Link 
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition"
              >
                Se connecter
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Token valide - Formulaire */}
          {status === 'valid' && promoteur && (
            <div className={`${d ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-2xl p-8`}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-white" />
                </div>
                <h1 className={`text-xl font-bold ${d ? 'text-white' : 'text-gray-900'} mb-2`}>Réinitialisation du code</h1>
                <p className={d ? 'text-gray-400' : 'text-gray-500'}>
                  Bonjour <span className={`${d ? 'text-white' : 'text-gray-900'} font-semibold`}>{promoteur.nom_complet}</span>
                </p>
              </div>

              {/* Info expiration */}
              <div className="flex items-center gap-2 text-sm text-orange-400 bg-orange-500/10 border border-orange-500/20 px-4 py-3 rounded-xl mb-6">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>Ce lien expire dans <strong>{expiresIn}</strong></span>
              </div>

              {/* Explication */}
              <div className={`${d ? 'bg-gray-800/50' : 'bg-gray-100'} rounded-xl p-4 mb-6`}>
                <p className={`${d ? 'text-gray-300' : 'text-gray-500'} text-sm`}>
                  En cliquant sur le bouton ci-dessous, un <strong className={d ? 'text-white' : 'text-gray-900'}>nouveau code de connexion</strong> sera généré et remplacera votre ancien code.
                </p>
                <p className={`${d ? 'text-gray-400' : 'text-gray-500'} text-sm mt-2`}>
                  ⚠️ Votre ancien code ne fonctionnera plus.
                </p>
              </div>

              {/* Bouton */}
              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/30 transition disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5" />
                    Réinitialiser mon code
                  </>
                )}
              </button>
            </div>
          )}

          {/* Succès */}
          {status === 'success' && (
            <div className={`${d ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-2xl p-8 text-center`}>
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className={`text-2xl font-bold ${d ? 'text-white' : 'text-gray-900'} mb-2`}>Code réinitialisé !</h1>
              <p className={`${d ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
                Voici votre nouveau code de connexion :
              </p>
              
              <div className="mb-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="px-8 py-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-2xl font-mono text-3xl tracking-widest text-pink-400">
                    {newCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className={`p-4 ${d ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} rounded-xl transition`}
                  >
                    {codeCopied ? <CheckCircle className="w-7 h-7 text-green-400" /> : <Copy className="w-7 h-7 text-gray-400" />}
                  </button>
                </div>
                {codeCopied && (
                  <p className="text-green-400 text-sm mt-2">✓ Code copié !</p>
                )}
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
                <p className="text-yellow-400 text-sm">
                  📝 <strong>Important :</strong> Notez ce code précieusement, il ne sera plus affiché après avoir quitté cette page.
                </p>
              </div>

              <Link 
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition"
              >
                Se connecter maintenant
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center">
        <p className={`${d ? 'text-gray-500' : 'text-gray-400'} text-sm`}>
          © 2026 GigaZone - Powered by <span className="text-pink-500 font-semibold">IFIAAS</span>
        </p>
      </footer>
    </div>
  );
}
