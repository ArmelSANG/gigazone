import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wifi, ArrowRight, ArrowLeft, ShoppingCart, TrendingUp, Gift, 
  FileText, Bell, CheckCircle, Sparkles, Users, DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabasePatch } from '../config/supabase';
import { usePageSEO, SEO_CONFIGS } from '../hooks/usePageSEO';
import { useTheme } from '../hooks/useTheme';

export default function OnboardingPage() {
  usePageSEO(SEO_CONFIGS.onboarding);
  const { isDark: d } = useTheme();
  const navigate = useNavigate();
  const { promoteur, refreshPromoteur } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Sparkles,
      title: "Bienvenue sur GigaZone ! 🎉",
      description: "Félicitations pour votre inscription ! Ce tutoriel rapide vous explique comment utiliser la plateforme et maximiser vos gains.",
      image: "👋",
      color: "from-pink-500 to-purple-600"
    },
    {
      icon: ShoppingCart,
      title: "Créez vos tickets",
      description: "Faites une demande de tickets WiFi sur la plateforme. Payez uniquement les frais de service, parmi les plus bas du marché.",
      tips: [
        "Choisissez un forfait parmi ceux disponibles",
        "Définissez la quantité de tickets à créer",
        "Payez les frais de service via Mobile Money",
        "Recevez vos tickets après validation"
      ],
      image: "📦",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: TrendingUp,
      title: "Vendez et encaissez 100%",
      description: "Vendez vos tickets à vos clients au prix que vous souhaitez. Vous gardez 100% de vos ventes !",
      tips: [
        "Bronze : Frais de base",
        "Silver : Frais réduits (51+ demandes)",
        "Gold : Frais minimum (201+ demandes)"
      ],
      image: "💰",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: Gift,
      title: "Parrainez et gagnez plus",
      description: "Partagez votre code ou lien de parrainage. Quand vos filleuls font des demandes, vous recevez une commission automatique !",
      tips: [
        "Partagez votre code, lien ou QR code",
        "Gagnez une commission sur chaque demande filleul",
        "Les commissions réduisent vos futurs frais de service"
      ],
      image: "🎁",
      color: "from-orange-500 to-amber-600"
    },
    {
      icon: FileText,
      title: "Téléchargez vos tickets",
      description: "Une fois votre commande validée, téléchargez le PDF contenant tous vos tickets WiFi prêts à être distribués.",
      tips: [
        "Notification dès que votre commande est validée",
        "PDF téléchargeable dans 'Mes fichiers'",
        "Chaque ticket a un code unique"
      ],
      image: "📄",
      color: "from-purple-500 to-indigo-600"
    },
    {
      icon: CheckCircle,
      title: "Vous êtes prêt ! 🚀",
      description: "Vous connaissez maintenant les bases. N'hésitez pas à contacter notre support via le chat si vous avez des questions.",
      tips: [
        "Assistant IA Aro disponible 24/7",
        "Support humain pour les questions complexes",
        "FAQ accessible dans votre profil"
      ],
      image: "✅",
      color: "from-pink-500 to-purple-600"
    }
  ];

  const handleFinish = async () => {
    // Marquer onboarding comme terminé
    if (promoteur) {
      await supabasePatch(`promoteurs?id=eq.${promoteur.id}`, {
        onboarding_complete: true
      });
      await refreshPromoteur();
    }
    navigate('/promoteur');
  };

  const handleSkip = async () => {
    if (promoteur) {
      await supabasePatch(`promoteurs?id=eq.${promoteur.id}`, {
        onboarding_complete: true
      });
      await refreshPromoteur();
    }
    navigate('/promoteur');
  };

  const currentStepData = steps[currentStep];

  return (
    <div className={`min-h-screen ${d ? 'bg-gray-950' : 'bg-gray-50'} flex flex-col`}>
      {/* Header */}
      <header className={`p-4 flex items-center justify-between border-b ${d ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <span className={`text-xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}>GigaZone</span>
        </div>
        <button
          onClick={handleSkip}
          className={`${d ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition text-sm`}
        >
          Passer le tutoriel →
        </button>
      </header>

      {/* Progress */}
      <div className="px-6 py-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          {steps.map((_, idx) => (
            <div 
              key={idx}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                idx <= currentStep ? 'bg-pink-500' : d ? 'bg-gray-800' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className={`${d ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-2xl p-8 text-center`}>
            {/* Icône */}
            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${currentStepData.color} flex items-center justify-center mx-auto mb-6 text-5xl`}>
              {currentStepData.image}
            </div>

            {/* Titre */}
            <h1 className={`text-2xl md:text-3xl font-bold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>
              {currentStepData.title}
            </h1>

            {/* Description */}
            <p className={`${d ? 'text-gray-400' : 'text-gray-500'} text-lg mb-6 max-w-lg mx-auto`}>
              {currentStepData.description}
            </p>

            {/* Tips */}
            {currentStepData.tips && (
              <div className={`${d ? 'bg-gray-800/50' : 'bg-gray-100'} rounded-xl p-6 text-left mb-8`}>
                <ul className="space-y-3">
                  {currentStepData.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-pink-400" />
                      </div>
                      <span className={d ? 'text-gray-300' : 'text-gray-700'}>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Code parrainage (étape parrainage) */}
            {currentStep === 3 && promoteur && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-8">
                <div className="text-sm text-orange-400 mb-2">Votre code de parrainage</div>
                <div className={`text-3xl font-mono font-bold ${d ? 'text-white' : 'text-gray-900'} tracking-widest`}>
                  {promoteur.code_parrainage}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-4">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className={`flex-1 py-3 rounded-xl font-medium ${d ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} transition flex items-center justify-center gap-2`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Précédent
                </button>
              )}
              
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className={`flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r ${currentStepData.color} text-white hover:shadow-lg transition flex items-center justify-center gap-2`}
                >
                  Suivant
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/30 transition flex items-center justify-center gap-2"
                >
                  Commencer à gagner
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Step indicator */}
          <div className={`text-center mt-6 ${d ? 'text-gray-500' : 'text-gray-400'} text-sm`}>
            Étape {currentStep + 1} sur {steps.length}
          </div>
        </div>
      </main>
    </div>
  );
}
