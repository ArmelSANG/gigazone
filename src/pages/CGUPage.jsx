import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, FileText, CheckCircle, AlertCircle, ArrowRight, ScrollText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseGet } from '../config/supabase';
import { usePageSEO, SEO_CONFIGS } from '../hooks/usePageSEO';
import { useTheme } from '../hooks/useTheme';

export default function CGUPage() {
  usePageSEO(SEO_CONFIGS.cgu);
  const { isDark: dk } = useTheme();
  const navigate = useNavigate();
  const { promoteur, acceptCGU, logout } = useAuth();
  const contentRef = useRef(null);
  
  // darkMode fourni par useTheme (alias dk)
  const [cguContent, setCguContent] = useState('');
  const [cguVersion, setCguVersion] = useState('');
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  
  // États pour le scroll
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Charger CGU active
  useEffect(() => {
    const loadCGU = async () => {
      const data = await supabaseGet('cgu_versions?actif=eq.true&select=*&limit=1');
      if (data && data.length > 0) {
        setCguContent(data[0].contenu);
        setCguVersion(data[0].version);
      } else {
        setCguContent('Conditions générales non disponibles.');
      }
      setLoading(false);
    };
    loadCGU();
  }, []);

  // Rediriger si pas de promoteur ou déjà accepté
  useEffect(() => {
    if (!promoteur) {
      navigate('/login');
    } else if (promoteur.cgu_accepte) {
      navigate('/promoteur');
    }
  }, [promoteur, navigate]);

  // Gérer le scroll
  const handleScroll = () => {
    if (!contentRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const progress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    setScrollProgress(Math.min(progress, 100));
    
    // Considérer comme lu si scrollé à 90%+
    if (progress >= 90) {
      setHasScrolledToEnd(true);
    }
  };

  // Accepter les CGU
  const handleAccept = async () => {
    if (!isChecked || !hasScrolledToEnd) return;
    
    setAccepting(true);
    setError('');
    
    const success = await acceptCGU(cguVersion);
    
    if (success) {
      navigate('/promoteur');
    } else {
      setError('Erreur lors de l\'acceptation. Réessayez.');
    }
    
    setAccepting(false);
  };

  // Refuser (déconnexion)
  const handleRefuse = () => {
    logout();
    navigate('/');
  };

  const bgClass = dk ? 'bg-gray-950' : 'bg-gray-50';
  const cardClass = dk ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col`}>
      
      {/* Header */}
      <header className={`p-4 flex items-center justify-center ${dk ? 'border-b border-gray-800' : 'border-b border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <span className={`text-xl font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>GigaZone</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className={`w-full max-w-2xl rounded-2xl border ${cardClass} shadow-xl overflow-hidden`}>
          
          {/* Header Card */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <ScrollText className="w-8 h-8 text-white" />
            </div>
            <h1 className={`text-2xl font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Conditions Générales d'Utilisation</h1>
            <p className={`${dk ? 'text-white/80' : 'text-gray-500'} mt-2`}>Version {cguVersion}</p>
          </div>

          {/* Barre de progression */}
          <div className={`px-6 py-3 ${dk ? 'bg-gray-800' : 'bg-gray-100'} flex items-center gap-4`}>
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${scrollProgress >= 90 ? 'text-green-400' : dk ? 'text-gray-400' : 'text-gray-500'}`}>
              {scrollProgress}%
            </span>
            {hasScrolledToEnd && (
              <CheckCircle className="w-5 h-5 text-green-400" />
            )}
          </div>

          {/* Contenu CGU */}
          <div 
            ref={contentRef}
            onScroll={handleScroll}
            className={`p-6 h-80 overflow-y-auto ${dk ? 'text-gray-300' : 'text-gray-700'} prose prose-sm max-w-none`}
            style={{ 
              scrollBehavior: 'smooth',
              lineHeight: '1.7'
            }}
          >
            {/* Rendu Markdown simplifié */}
            {cguContent.split('\n').map((line, idx) => {
              // Titres
              if (line.startsWith('# ')) {
                return <h1 key={idx} className={`text-xl font-bold mt-6 mb-3 ${dk ? 'text-white' : 'text-gray-900'}`}>{line.replace('# ', '')}</h1>;
              }
              if (line.startsWith('## ')) {
                return <h2 key={idx} className="text-lg font-semibold mt-5 mb-2 text-pink-400">{line.replace('## ', '')}</h2>;
              }
              if (line.startsWith('### ')) {
                return <h3 key={idx} className="text-base font-semibold mt-4 mb-2 text-purple-400">{line.replace('### ', '')}</h3>;
              }
              // Listes
              if (line.startsWith('- ')) {
                const content = line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, `<strong class="${dk ? 'text-white' : 'text-gray-900'}">$1</strong>`);
                return <li key={idx} className="ml-4 mb-1" dangerouslySetInnerHTML={{ __html: content }} />;
              }
              // Texte en gras seul sur une ligne
              if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={idx} className={`font-semibold ${dk ? 'text-white' : 'text-gray-900'} mt-4 mb-2`}>{line.replace(/\*\*/g, '')}</p>;
              }
              // Texte italique seul
              if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
                return <p key={idx} className={`italic ${dk ? 'text-gray-500' : 'text-gray-400'} mt-4`}>{line.replace(/\*/g, '')}</p>;
              }
              // Ligne de séparation
              if (line.startsWith('---')) {
                return <hr key={idx} className={`${dk ? 'border-gray-700' : 'border-gray-200'} my-6`} />;
              }
              // Ligne vide
              if (line.trim() === '') {
                return <br key={idx} />;
              }
              // Paragraphe normal avec support du gras inline
              const content = line.replace(/\*\*(.*?)\*\*/g, `<strong class="${dk ? 'text-white' : 'text-gray-900'}">$1</strong>`);
              return <p key={idx} className="mb-2" dangerouslySetInnerHTML={{ __html: content }} />;
            })}
          </div>

          {/* Message si pas scrollé */}
          {!hasScrolledToEnd && (
            <div className={`px-6 py-3 ${dk ? 'bg-yellow-500/10 border-t border-yellow-500/20' : 'bg-yellow-50 border-t border-yellow-200'}`}>
              <p className={`text-sm flex items-center gap-2 ${dk ? 'text-yellow-400' : 'text-yellow-700'}`}>
                <AlertCircle className="w-4 h-4" />
                Veuillez lire l'intégralité des conditions (scrollez jusqu'en bas)
              </p>
            </div>
          )}

          {/* Actions */}
          <div className={`p-6 ${dk ? 'bg-gray-800 border-t border-gray-700' : 'bg-gray-50 border-t border-gray-200'}`}>
            
            {/* Checkbox */}
            <label className={`flex items-start gap-3 mb-6 cursor-pointer ${!hasScrolledToEnd ? 'opacity-50 pointer-events-none' : ''}`}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                disabled={!hasScrolledToEnd}
                className="mt-1 w-5 h-5 rounded border-gray-600 text-pink-500 focus:ring-pink-500 focus:ring-offset-0 bg-gray-700"
              />
              <span className={`text-sm ${dk ? 'text-gray-300' : 'text-gray-700'}`}>
                J'ai lu et j'accepte les Conditions Générales d'Utilisation de la plateforme GigaZone Promoteurs.
                Je comprends mes droits et obligations en tant que promoteur.
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm mb-4 p-3 rounded-lg bg-red-500/10">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-4">
              <button
                onClick={handleRefuse}
                className={`flex-1 py-3 rounded-xl font-medium ${dk ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} transition`}
              >
                Refuser et quitter
              </button>
              <button
                onClick={handleAccept}
                disabled={!hasScrolledToEnd || !isChecked || accepting}
                className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {accepting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Validation...
                  </>
                ) : (
                  <>
                    Accepter et continuer
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`p-4 text-center text-sm ${dk ? 'text-gray-500' : 'text-gray-500'}`}>
        © 2026 GigaZone • Tous droits réservés
      </footer>
    </div>
  );
}
