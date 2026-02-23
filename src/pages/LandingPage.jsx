import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wifi, TrendingUp, Users, Gift, Shield, Zap, ChevronRight, 
  Check, ArrowRight, Star, Phone, Mail, MapPin, Moon, Sun,
  DollarSign, Package, Clock, Award, HelpCircle, ChevronDown, MessageSquare,
  Monitor, BarChart3, Headphones, Globe
} from 'lucide-react';
import ChatWidget from '../components/chat/ChatWidget';
import { supabaseGet } from '../config/supabase';
import { useTheme } from '../hooks/useTheme';
import { usePageSEO, SEO_CONFIGS } from '../hooks/usePageSEO';

export default function LandingPage() {
  // SEO dynamique
  usePageSEO(SEO_CONFIGS.landing);
  
  // Thème unifié
  const { isDark: darkMode, toggle: toggleTheme } = useTheme();
  
  const [faqOpen, setFaqOpen] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [stats, setStats] = useState({ promoteurs: 0, commandes: 0, benefices: 0 });

  // FAQ par défaut (fallback si Supabase vide, même ordre que en base)
  const defaultFaqs = [
    // Bloc 1: Comprendre GigaZone (conversion)
    { id: 1, question: "C'est quoi GigaZone exactement ?", reponse: "GigaZone est un service de tarification et création de tickets WiFi. Grâce à notre système de VPN intégré, GigaZone transforme un routeur normal en point d'accès WiFi rentable et professionnel. Notre solution vous permet de lancer votre propre business de WiFi avec un budget minimum, tout en restant 100% légal en République du Bénin grâce à l'autorisation de l'ARCEP." },
    { id: 2, question: "Combien faut-il pour démarrer ?", reponse: "Vous pouvez lancer votre WifiZone avec moins de 50 000 FCFA ! Ce budget comprend votre routeur et la configuration initiale. L'installation par nos techniciens est 100% gratuite." },
    { id: 3, question: "Est-ce légal ?", reponse: "Oui, 100% légal ! Pour exercer légalement, vous devez obtenir une autorisation auprès de l'ARCEP (Autorité de Régulation des Communications Électroniques et de la Poste). GigaZone vous accompagne dans cette démarche." },
    { id: 4, question: "Comment obtenir l'autorisation ARCEP ?", reponse: "L'autorisation ARCEP est obligatoire pour exploiter légalement une WifiZone au Bénin. Notre équipe vous accompagne dans toutes les démarches : constitution du dossier, dépôt auprès de l'ARCEP et suivi jusqu'à l'obtention de votre autorisation. Contactez-nous pour démarrer la procédure !" },
    { id: 5, question: "De quel matériel ai-je besoin pour commencer ?", reponse: "Pour lancer votre WifiZone, vous avez besoin de : 1) Routeur classique recommandé par GigaZone (obligatoire), 2) Connexion internet (fibre, MTN, Moov, Celtiis), 3) Antenne WiFi externe (facultatif). Le tout pour moins de 50 000 FCFA !" },
    { id: 6, question: "Y a-t-il des frais cachés ?", reponse: "Aucun frais caché ! Zéro frais d'installation, zéro frais de maintenance. Vous payez uniquement les frais de service GigaZone lors de la création de vos tickets." },
    // Bloc 2: Comment ça marche (utilisation)
    { id: 7, question: "Comment devenir promoteur ?", reponse: "Pour devenir promoteur GigaZone, inscrivez-vous gratuitement sur notre plateforme en renseignant vos informations personnelles et votre numéro WhatsApp. Après validation de votre compte, vous aurez accès à votre espace promoteur pour commander des tickets WiFi." },
    { id: 8, question: "Quelles sont les étapes pour commencer ?", reponse: "1) Obtenez votre autorisation ARCEP, 2) Nos techniciens installent votre routeur gratuitement, 3) Intégration du système GigaZone sur votre routeur, 4) Inscrivez-vous sur la plateforme, 5) Créez vos tickets, 6) Vendez et encaissez 100% !" },
    { id: 9, question: "Comment fonctionne la tarification ?", reponse: "Vous créez vos tickets via notre plateforme et vous les vendez à vos clients au prix que vous souhaitez. GigaZone prélève uniquement des frais de service sur chaque demande de tickets. Vous gardez le contrôle total de votre business et 100% de vos ventes." },
    { id: 10, question: "Comment passer une commande ?", reponse: "Depuis votre espace promoteur, cliquez sur \"Nouvelle commande\", choisissez le forfait souhaité (1h, 24h, 7 jours...), indiquez la quantité de tickets et effectuez le paiement. Vos tickets seront générés après validation." },
    { id: 11, question: "Comment sont livrés les tickets WiFi ?", reponse: "Après validation de votre demande, vous recevez vos tickets sous forme de fichier PDF téléchargeable depuis votre espace promoteur. Chaque ticket contient un code unique que vos clients utilisent pour se connecter." },
    { id: 12, question: "Quand reçois-je mes tickets ?", reponse: "Les tickets sont générés rapidement après validation de votre paiement par notre équipe. Le délai moyen est de quelques heures. Vous recevez une notification dès que vos tickets sont prêts à télécharger." },
    // Bloc 3: Parrainage & commissions
    { id: 13, question: "Comment fonctionne le parrainage ?", reponse: "Partagez votre code ou votre lien de parrainage unique. Quand un filleul s'inscrit via votre lien (ou avec votre code) et fait des demandes de tickets, vous recevez automatiquement une commission sur chacune de ses commandes. Ces commissions sont utilisables pour réduire vos futurs frais de service." },
    { id: 14, question: "Comment utiliser mes commissions ?", reponse: "Vos commissions de parrainage sont créditées automatiquement sur votre solde. Lors de votre prochaine commande, le montant est déduit de vos frais de service. Vous pouvez suivre votre solde de commissions depuis votre tableau de bord." },
    // Bloc 4: Support & récupération
    { id: 15, question: "Comment récupérer mon code d'accès ?", reponse: "Si vous avez perdu votre code d'accès promoteur, rendez-vous sur la page de connexion et cliquez sur \"Code oublié ?\". Vous recevrez un lien de réinitialisation par WhatsApp." },
    { id: 16, question: "Quelle est votre zone de couverture ?", reponse: "GigaZone couvre toute l'Afrique, avec une présence particulièrement forte au Bénin où nos techniciens peuvent se déplacer pour l'installation. Si vous êtes dans un autre pays africain, contactez-nous pour organiser votre démarrage !" },
    { id: 17, question: "Comment contacter le support ?", reponse: "Notre équipe est disponible via WhatsApp au +229 01 67 45 54 62, par email à contact@ifiaas.com, ou directement via le chat intégré sur la plateforme. Nous répondons généralement en moins de 2 heures." }
  ];

  useEffect(() => {
    // Charger FAQs
    const loadFaqs = async () => {
      const data = await supabaseGet('faq?actif=eq.true&order=ordre.asc');
      if (data && data.length > 0) {
        setFaqs(data);
      } else {
        setFaqs(defaultFaqs);
      }
    };
    loadFaqs();

    // Stats simulées (à remplacer par vraies stats)
    setStats({ promoteurs: 127, demandes: 2450, wifizones: 89 });
  }, []);

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "100% Légal",
      description: "Autorisé par l'ARCEP, exercez en toute légalité au Bénin"
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Budget Minimum",
      description: "Lancez votre WifiZone avec moins de 50 000 FCFA"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Moins de 25% de frais",
      description: "Frais bas du marché"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Installation Gratuite",
      description: "Nos techniciens installent votre WifiZone gratuitement"
    },
    {
      icon: <Gift className="w-8 h-8" />,
      title: "Parrainage Rentable",
      description: "Gagnez des commissions sur les demandes de vos filleuls"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Couverture Totale",
      description: "Disponible dans toute l'Afrique, avec une présence forte au Bénin"
    }
  ];

  const steps = [
    { step: "01", title: "Autorisation ARCEP", desc: "Obtenez votre autorisation légale" },
    { step: "02", title: "Installation routeur", desc: "Nos techniciens installent votre routeur gratuitement" },
    { step: "03", title: "Intégration GigaZone", desc: "Configuration du système VPN sur votre routeur" },
    { step: "04", title: "Inscription", desc: "Créez votre compte promoteur sur la plateforme" },
    { step: "05", title: "Création tickets", desc: "Générez vos tickets WiFi en quelques clics" },
    { step: "06", title: "Vendez & Encaissez", desc: "Vendez à vos clients et gardez 100% des ventes" }
  ];

  const forfaits = [
    { name: "1H Illimité", prix: 100, detail: "50 Mbps • Ultra Rapide", frais: 20, cat: "rapide", popular: true },
    { name: "3H Illimité", prix: 200, detail: "50 Mbps • Ultra Rapide", frais: 40, cat: "rapide" },
    { name: "5H Illimité", prix: 300, detail: "50 Mbps • Ultra Rapide", frais: 60, cat: "rapide", best: true },
    { name: "8H Illimité", prix: 500, detail: "50 Mbps • Ultra Rapide", frais: 100, cat: "rapide", premium: true },
    { name: "12H Illimité", prix: 100, detail: "5 Mbps • Navigation", frais: 20, cat: "navigation" },
    { name: "18H Illimité", prix: 150, detail: "5 Mbps • Navigation", frais: 30, cat: "navigation", popular: true },
    { name: "1 Jour Illimité", prix: 200, detail: "5 Mbps • Navigation", frais: 40, cat: "navigation", best: true },
    { name: "3 Jours Illimité", prix: 500, detail: "5 Mbps • Navigation", frais: 100, cat: "navigation" },
    { name: "7 Jours Illimité", prix: 900, detail: "5 Mbps • Navigation", frais: 180, cat: "navigation", best: true },
    { name: "30 Jours Illimité", prix: 3000, detail: "5 Mbps • Navigation", frais: 600, cat: "navigation", premium: true }
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${darkMode ? 'bg-gray-950/80' : 'bg-white/80'} backdrop-blur-lg border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              GigaZone
            </span>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} transition`}
              title={darkMode ? 'Mode clair' : 'Mode sombre'}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
            <Link
              to="/login"
              className="px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/30 transition"
            >
              Connexion
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - SEO Optimized */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 relative overflow-hidden" aria-labelledby="hero-title">
        {/* Background effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" aria-hidden="true" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 mb-6">
              <Star className="w-4 h-4 text-pink-400" aria-hidden="true" />
              <span className="text-sm text-pink-400">+{stats.promoteurs} promoteurs actifs au Bénin</span>
            </div>
            
            <h1 id="hero-title" className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Lancez votre WifiZone
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent"> avec moins de 50 000F</span>
            </h1>
            
            <p className={`text-lg sm:text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-8 max-w-2xl mx-auto px-4`}>
              <strong>GigaZone</strong> transforme un routeur classique en <strong>hotspot WiFi rentable</strong>. 
              <strong>100% légal</strong>, installation <strong>gratuite</strong> par nos techniciens, 
              <strong>frais bas</strong> du marché.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link
                to="/inscription"
                className="group px-6 sm:px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-xl hover:shadow-pink-500/30 transition flex items-center justify-center gap-2"
                aria-label="S'inscrire comme promoteur GigaZone"
              >
                Devenir promoteur WiFi
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" aria-hidden="true" />
              </Link>
              <a
                href="#cest-quoi"
                className={`px-6 sm:px-8 py-4 rounded-xl font-semibold ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100 border border-gray-200'} transition flex items-center justify-center gap-2`}
                aria-label="En savoir plus sur GigaZone"
              >
                Découvrir GigaZone
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>

            {/* Stats - SEO keywords */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12 sm:mt-16 max-w-2xl mx-auto px-4" role="list" aria-label="Statistiques GigaZone">
              <div className="text-center" role="listitem">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  {stats.promoteurs}+
                </div>
                <div className={`text-xs sm:text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Promoteurs WiFi</div>
              </div>
              <div className="text-center" role="listitem">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  {stats.demandes}+
                </div>
                <div className={`text-xs sm:text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Tickets créés</div>
              </div>
              <div className="text-center" role="listitem">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  {stats.wifizones}+
                </div>
                <div className={`text-xs sm:text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Hotspots actifs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* C'est quoi GigaZone Section - PREMIUM */}
      <section id="cest-quoi" className={`relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-20 -left-40 w-80 h-80 rounded-full ${darkMode ? 'bg-pink-500/10' : 'bg-pink-200/40'} blur-3xl`} />
          <div className={`absolute bottom-20 -right-40 w-80 h-80 rounded-full ${darkMode ? 'bg-purple-500/10' : 'bg-purple-200/40'} blur-3xl`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full ${darkMode ? 'bg-gradient-to-r from-pink-500/5 to-purple-500/5' : 'bg-gradient-to-r from-pink-100/50 to-purple-100/50'} blur-3xl`} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 mb-6">
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              <span className="text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                Système complet de hotspot WiFi
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              C'est quoi{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  GigaZone
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 10C50 4 150 4 198 10" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="200" y2="0">
                      <stop stopColor="#ec4899"/>
                      <stop offset="1" stopColor="#a855f7"/>
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              {' '}?
            </h2>
            <p className={`text-lg sm:text-xl max-w-3xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              La solution tout-en-un pour transformer votre routeur en 
              <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}> business WiFi rentable</span>
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Description */}
            <div className="space-y-8">
              {/* Main Description Card */}
              <div className={`relative p-6 sm:p-8 rounded-3xl ${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700/50' : 'bg-white/80 backdrop-blur-xl border border-gray-200 shadow-xl shadow-gray-200/50'}`}>
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-white" />
                </div>
                <p className={`text-base sm:text-lg leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  GigaZone est un <span className="font-semibold text-pink-500">service de tarification et création de tickets WiFi</span>. 
                  Grâce à notre système de VPN intégré, nous transformons un routeur normal en point d'accès WiFi rentable et professionnel.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <DollarSign className="w-5 h-5" />, title: '< 50 000F', desc: 'Budget de départ', color: 'from-green-500 to-emerald-600' },
                  { icon: <Zap className="w-5 h-5" />, title: 'Gratuit', desc: 'Installation', color: 'from-yellow-500 to-orange-500' },
                  { icon: <Shield className="w-5 h-5" />, title: '100%', desc: 'Légal ARCEP', color: 'from-blue-500 to-cyan-500' },
                  { icon: <TrendingUp className="w-5 h-5" />, title: '< 25%', desc: 'Frais de service', color: 'from-pink-500 to-purple-600' },
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`group relative p-4 sm:p-5 rounded-2xl transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/50' : 'bg-white hover:bg-gray-50 border border-gray-100 shadow-lg shadow-gray-100/50'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <div className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</div>
                  </div>
                ))}
              </div>

              {/* Legal Badge */}
              <div className={`flex items-center gap-4 p-4 rounded-2xl ${darkMode ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'}`}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className={`font-semibold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>100% Légal au Bénin</div>
                  <div className={`text-sm ${darkMode ? 'text-green-400/70' : 'text-green-600'}`}>Autorisé par l'ARCEP</div>
                </div>
              </div>
            </div>

            {/* Right: Visual Card */}
            <div className="relative">
              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 opacity-20 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 opacity-20 blur-2xl" />
              
              {/* Main Card */}
              <div className={`relative p-6 sm:p-8 rounded-3xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-2xl'}`}>
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl blur-xl opacity-50" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto">
                      <Wifi className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className={`text-2xl font-bold mt-4 mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Votre WifiZone</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Un hotspot WiFi professionnel
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  {[
                    { icon: <Monitor className="w-4 h-4" />, text: 'Page de connexion personnalisée' },
                    { icon: <Users className="w-4 h-4" />, text: 'Gestion des utilisateurs en temps réel' },
                    { icon: <BarChart3 className="w-4 h-4" />, text: 'Statistiques de ventes détaillées' },
                    { icon: <Headphones className="w-4 h-4" />, text: 'Support technique 24/7' },
                    { icon: <Globe className="w-4 h-4" />, text: 'Disponible dans tout le Bénin' }
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl transition-all duration-200 ${darkMode ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-pink-500 flex-shrink-0">
                        {item.icon}
                      </div>
                      <span className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.text}</span>
                      <Check className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  to="/inscription"
                  className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-300 hover:scale-[1.02]"
                >
                  Lancer mon Business
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-12 sm:py-20 px-4 sm:px-6 ${darkMode ? 'bg-gray-900/50' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Pourquoi devenir promoteur ?
            </h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} max-w-2xl mx-auto text-sm sm:text-base`}>
              Rejoignez notre réseau de promoteurs et profitez d'avantages exclusifs
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl ${darkMode ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition group`}
              >
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 flex items-center justify-center text-pink-500 mb-3 sm:mb-4 group-hover:scale-110 transition">
                  {feature.icon}
                </div>
                <h3 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2">{feature.title}</h3>
                <p className={`text-xs sm:text-base ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="fonctionnement" className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Comment devenir promoteur ?
            </h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} max-w-2xl mx-auto text-sm sm:text-base`}>
              Lancez votre business WiFi en 6 étapes
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {steps.map((step, idx) => (
              <div key={idx} className="text-center relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-base sm:text-lg font-bold mx-auto mb-2 sm:mb-3 relative z-10">
                  {step.step}
                </div>
                <h3 className="text-xs sm:text-sm font-semibold mb-1">{step.title}</h3>
                <p className={`text-[10px] sm:text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} leading-tight`}>{step.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8 sm:mt-12">
            <Link
              to="/inscription"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-xl hover:shadow-pink-500/30 transition"
            >
              Commencer maintenant
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Forfaits */}
      <section className={`py-20 px-6 ${darkMode ? 'bg-gray-900/50' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Forfaits disponibles
            </h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} max-w-2xl mx-auto`}>
              Créez vos tickets WiFi avec les frais de service bas du marché
            </p>
          </div>

          {['rapide', 'navigation'].map(cat => (
            <div key={cat} className="mb-8">
              <h3 className={`text-lg font-bold text-center mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {cat === 'rapide' ? '⚡ Ultra Rapide — 50 Mbps' : '🌐 Navigation — 5 Mbps'}
              </h3>
              <p className={`text-sm text-center mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {cat === 'rapide' ? 'Téléchargez films, séries et gros fichiers rapidement' : 'Naviguez, chattez, regardez des vidéos sur les réseaux sociaux'}
              </p>
              <div className={`grid grid-cols-2 ${cat === 'navigation' ? 'sm:grid-cols-3' : 'sm:grid-cols-2 md:grid-cols-4'} gap-3 max-w-4xl mx-auto`}>
                {forfaits.filter(f => f.cat === cat).map((forfait, idx) => (
                  <div
                    key={idx}
                    className={`relative p-4 rounded-2xl ${
                      forfait.popular 
                        ? 'bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-2 border-pink-500' 
                        : forfait.premium
                          ? `bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500`
                          : forfait.best
                            ? `bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500`
                            : `${darkMode ? 'bg-gray-800' : 'bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`
                    }`}
                  >
                    {forfait.popular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-white text-[10px] font-semibold whitespace-nowrap">
                        ⭐ Populaire
                      </div>
                    )}
                    {forfait.best && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-white text-[10px] font-semibold whitespace-nowrap">
                        🏆 Meilleur
                      </div>
                    )}
                    {forfait.premium && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full text-white text-[10px] font-semibold whitespace-nowrap">
                        💎 Premium
                      </div>
                    )}
                    <div className="text-center">
                      <h4 className="text-sm font-bold mb-1">{forfait.name}</h4>
                      <div className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-1">
                        {forfait.prix.toLocaleString('fr-FR')} <span className="text-xs">FCFA</span>
                      </div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                        {forfait.detail}
                      </p>
                      <div className="text-xs text-pink-500 font-semibold">
                        🎯 Frais: {forfait.frais} F/ticket
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="text-center mt-8">
            <Link
              to="/inscription"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-xl hover:shadow-pink-500/30 transition"
            >
              Créer mes tickets
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={faq.id || idx}
                className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'} overflow-hidden`}
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 transition ${faqOpen === idx ? 'rotate-180' : ''}`} />
                </button>
                {faqOpen === idx && (
                  <div className={`px-6 pb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {faq.reponse}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className={`py-20 px-6 ${darkMode ? 'bg-gray-900/50' : 'bg-gray-100'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prêt à gagner de l'argent ?
          </h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-8 max-w-2xl mx-auto`}>
            Rejoignez les {stats.promoteurs}+ promoteurs qui gagnent déjà avec GigaZone
          </p>
          <Link
            to="/inscription"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-xl hover:shadow-pink-500/30 transition text-lg"
          >
            Créer mon compte gratuit
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 px-4 sm:px-6 ${darkMode ? 'bg-gray-950 border-t border-gray-800' : 'bg-white border-t border-gray-200'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">GigaZone</span>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Service de création de tickets WiFi et gestion de hotspots au Bénin
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Liens utiles</h4>
              <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <li><Link to="/login" className="hover:text-pink-500 transition">Connexion</Link></li>
                <li><Link to="/inscription" className="hover:text-pink-500 transition">Inscription</Link></li>
                <li><Link to="/check" className="hover:text-pink-500 transition">Vérifier un code</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <li>
                  <a href="tel:+2290167455462" className="flex items-center gap-2 hover:text-pink-500 transition">
                    <Phone className="w-4 h-4" /> +229 01 67 45 54 62
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/2290167455462" target="_blank" className="flex items-center gap-2 hover:text-green-500 transition">
                    <MessageSquare className="w-4 h-4" /> WhatsApp
                  </a>
                </li>
                <li>
                  <a href="mailto:contact@ifiaas.com" className="flex items-center gap-2 hover:text-pink-500 transition">
                    <Mail className="w-4 h-4" /> contact@ifiaas.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Zinvié, Bénin
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <li><Link to="/cgu-publique" className="hover:text-pink-500 transition">Conditions générales</Link></li>
                <li><Link to="/politique" className="hover:text-pink-500 transition">Politique de confidentialité</Link></li>
                <li><Link to="/mentions" className="hover:text-pink-500 transition">Mentions légales</Link></li>
              </ul>
            </div>
          </div>
          
          <div className={`pt-8 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            © 2026 GigaZone. Tous droits réservés.
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
