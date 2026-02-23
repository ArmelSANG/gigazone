import React, { useState, useEffect, useRef } from 'react';

// =====================================================
// CONFIGURATION SUPABASE - IDENTIQUE À LOGIN.HTML
// =====================================================
const SB = 'https://dfflzuwyntrdfxujvsqr.supabase.co/rest/v1';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmZmx6dXd5bnRyZGZ4dWp2c3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNDE4NjMsImV4cCI6MjA4NDgxNzg2M30.tZgXgUUalq-5y7nh1fxA5mo5CsGJU2_8l_T-z1Cc-24';
const ARO_API = SB.replace('/rest/v1', '/functions/v1/aro-chat');

// =====================================================
// CHAT WIDGET - STYLE IDENTIQUE À LOGIN.HTML
// =====================================================

export default function ChatWidget({ userId, userName, userType = 'promoteur' }) {
  // États
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' ou 'live'
  const [unread, setUnread] = useState(0);
  
  // Aro
  const [aroMsgs, setAroMsgs] = useState([]);
  const [aroHistory, setAroHistory] = useState([]);
  const [aroInput, setAroInput] = useState('');
  const [aroTyping, setAroTyping] = useState(false);
  
  // Support
  const [liveMsgs, setLiveMsgs] = useState([]);
  const [liveInput, setLiveInput] = useState('');
  const [convId, setConvId] = useState(null);
  const [chatStarted, setChatStarted] = useState(false);
  const [liveTyping, setLiveTyping] = useState(false);
  
  // Refs
  const aroRef = useRef(null);
  const liveRef = useRef(null);
  const pollRef = useRef(null);
  
  // Visitor ID
  const visId = useRef(userId || 'promo_' + Date.now() + '_' + Math.random().toString(36).substr(2,9));
  const visName = userName || 'Promoteur';

  // Init Aro
  useEffect(() => {
    if (aroMsgs.length === 0) {
      addAro('bot', "👋 Salut ! Je suis **Aro**, ton assistant business GigaZone.\n\nJe suis là pour t'aider à développer ton activité WiFi ! Pose-moi tes questions sur :\n• 📦 Comment créer une demande de tickets\n• 💰 Les frais de service et réductions\n• 🎁 Le parrainage et les commissions\n• 🏆 Les niveaux Bronze, Silver, Gold\n• 📊 Comment utiliser ton dashboard\n• Et tout ce qui peut booster ton business !");
    }
  }, []);

  // Scroll auto
  useEffect(() => {
    if (aroRef.current) aroRef.current.scrollTop = aroRef.current.scrollHeight;
  }, [aroMsgs]);
  
  useEffect(() => {
    if (liveRef.current) liveRef.current.scrollTop = liveRef.current.scrollHeight;
  }, [liveMsgs]);

  // Polling support
  useEffect(() => {
    if (convId && isOpen && activeTab === 'live' && chatStarted) {
      pollRef.current = setInterval(pollLive, 3000);
      return () => clearInterval(pollRef.current);
    }
  }, [convId, isOpen, activeTab, chatStarted]);

  // === HELPERS SUPABASE (fetch API) ===
  
  const sbGet = async (endpoint, cb) => {
    try {
      const res = await fetch(SB + '/' + endpoint, {
        headers: {
          'apikey': SK,
          'Authorization': 'Bearer ' + SK,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        console.error('sbGet error:', res.status, endpoint);
        cb(new Error('HTTP ' + res.status), null);
        return;
      }
      const data = await res.json();
      cb(null, data);
    } catch(e) {
      console.error('sbGet exception:', e, endpoint);
      cb(e, null);
    }
  };

  const sbPost = async (table, data, cb) => {
    try {
      const res = await fetch(SB + '/' + table, {
        method: 'POST',
        headers: {
          'apikey': SK,
          'Authorization': 'Bearer ' + SK,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('sbPost error:', res.status, table, errText);
        cb(new Error('HTTP ' + res.status), null);
        return;
      }
      const result = await res.json();
      cb(null, result);
    } catch(e) {
      console.error('sbPost exception:', e, table);
      cb(e, null);
    }
  };

  // === FONCTIONS ARO ===
  
  const addAro = (type, msg) => {
    setAroMsgs(prev => [...prev, { id: Date.now() + Math.random(), t: type, m: msg }]);
  };

  // =====================================================
  // BASE DE CONNAISSANCES ARO - TOUT SUR GIGAZONE
  // =====================================================
  
  const aroKnowledge = {
    // C'est quoi GigaZone
    gigazone: `🌐 **GigaZone** est un service de tarification et création de tickets WiFi.

Grâce à notre système de VPN intégré, GigaZone transforme un routeur classique en point d'accès WiFi rentable et professionnel.

✨ **En résumé** : Tu deviens propriétaire d'un hotspot WiFi et tu vends l'accès internet à tes clients !`,

    // Comment ça marche
    fonctionnement: `⚙️ **Comment fonctionne GigaZone ?**

1️⃣ Tu fais une demande de tickets sur la plateforme
2️⃣ Tu paies les frais de service (moins de 25%)
3️⃣ Tu reçois tes tickets WiFi en PDF
4️⃣ Tu vends les tickets à tes clients au prix que tu veux
5️⃣ Tu gardes 100% de tes ventes !

C'est toi qui fixes ton prix de vente. Plus tu vends cher, plus tu gagnes !`,

    // Les 6 étapes pour devenir promoteur
    etapes: `📋 **6 étapes pour devenir promoteur :**

1️⃣ **Autorisation ARCEP** - Obtiens ton autorisation légale
2️⃣ **Installation routeur** - Nos techniciens installent gratuitement
3️⃣ **Intégration GigaZone** - Configuration du système VPN
4️⃣ **Inscription** - Crée ton compte sur la plateforme
5️⃣ **Création tickets** - Génère tes tickets WiFi
6️⃣ **Vends & Encaisse** - Garde 100% de tes ventes !`,

    // Forfaits disponibles
    forfaits: `📦 **Forfaits disponibles :**

⚡ **Ultra Rapide (50 Mbps)** — Téléchargements rapides:
• **1H Illimité** → 100 FCFA ⭐ Populaire — Frais: 20F
• **3H Illimité** → 200 FCFA — Frais: 40F
• **5H Illimité** → 300 FCFA 🏆 Meilleur — Frais: 60F
• **8H Illimité** → 500 FCFA 💎 Premium — Frais: 100F

🌐 **Navigation (5 Mbps)** — Réseaux sociaux, appels, vidéos:
• **12H Illimité** → 100 FCFA — Frais: 20F
• **18H Illimité** → 150 FCFA ⭐ Populaire — Frais: 30F
• **1 Jour Illimité** → 200 FCFA 🏆 Meilleur — Frais: 40F
• **3 Jours Illimité** → 500 FCFA — Frais: 100F
• **7 Jours Illimité** → 900 FCFA 🏆 Meilleur — Frais: 180F
• **30 Jours Illimité** → 3 000 FCFA 💎 Premium — Frais: 600F

Tu peux vendre ces tickets au prix que tu veux !`,

    // Frais de service
    frais: `💰 **Frais de service GigaZone :**

• Tu paies uniquement les frais de service (moins de 25%)
• Exemple: Pour un ticket à 100F, tu paies ~20F de frais
• Tu reçois le ticket et tu le vends au prix que tu veux
• Tu gardes 100% de la vente !

📈 **Plus tu fais de demandes, plus tes frais baissent !**
• Bronze: frais de base
• Silver: -2% sur les frais
• Gold: -5% sur les frais`,

    // Niveaux promoteur
    niveaux: `🏆 **Les niveaux promoteur :**

🥉 **Bronze** (0-50 demandes)
→ Frais de service de base

🥈 **Silver** (51-200 demandes)
→ -2% de réduction sur les frais

🥇 **Gold** (201+ demandes)
→ -5% de réduction sur les frais

Plus tu fais de demandes, plus tu économises !`,

    // Parrainage
    parrainage: `🎁 **Le système de parrainage :**

1️⃣ Partage ton code de parrainage unique
2️⃣ Quand un filleul s'inscrit avec ton code et fait des demandes
3️⃣ Tu reçois automatiquement une commission sur chaque demande
4️⃣ Les commissions réduisent tes futurs frais de service !

💡 C'est gagnant-gagnant : tu aides quelqu'un à se lancer et tu gagnes des commissions !`,

    // Installation
    installation: `🛠️ **Installation de ta WifiZone :**

✅ Installation 100% GRATUITE par nos techniciens
✅ Configuration du routeur
✅ Intégration du système VPN GigaZone
✅ Test et mise en service
✅ Formation sur l'utilisation de la plateforme

📍 Disponible dans toute l'Afrique !`,

    // ARCEP et légalité
    legal: `📜 **Autorisation ARCEP :**

L'autorisation ARCEP est **obligatoire** pour exploiter légalement une WifiZone au Bénin.

🏛️ **ARCEP** = Autorité de Régulation des Communications Électroniques et de la Poste

📋 **Notre accompagnement :**
• Constitution de ton dossier
• Dépôt auprès de l'ARCEP
• Suivi jusqu'à obtention

Contacte notre équipe pour démarrer la procédure !

✅ Autorisation ARCEP = Business 100% légal et tranquille !`,

    // Matériel nécessaire
    materiel: `🛠️ **Matériel nécessaire pour commencer :**

1️⃣ **Routeur classique** (obligatoire)
   → Recommandé par GigaZone

2️⃣ **Connexion Internet** (obligatoire)
   → Fibre, MTN, Moov ou Celtiis

3️⃣ **Antenne WiFi externe** (facultatif)
   → Pour étendre ta zone de couverture

💰 **Budget total : moins de 50 000 FCFA !**

🎁 Installation GRATUITE par nos techniciens !`,

    // Budget de départ
    budget: `💵 **Budget de départ :**

Tu peux lancer ta WifiZone avec **moins de 50 000 FCFA** !

Ce budget comprend :
• Ton routeur classique
• La configuration initiale

🎁 **GRATUIT** : L'installation par nos techniciens !

C'est l'un des business les plus accessibles en Afrique.`,

    // Comment créer des tickets
    tickets: `🎫 **Comment créer des tickets WiFi :**

1️⃣ Connecte-toi à ton dashboard GigaZone
2️⃣ Va dans "Nouvelle demande"
3️⃣ Choisis le forfait (1J 5Go, 1J Illimité, 2J Illimité)
4️⃣ Indique la quantité de tickets
5️⃣ Paie les frais de service via Mobile Money (MTN ou Moov)
6️⃣ Upload ta preuve de paiement
7️⃣ Attends la validation (généralement rapide)
8️⃣ Télécharge tes tickets en PDF !

Chaque ticket a un code unique que tes clients utilisent pour se connecter.`,

    // Paiement
    paiement: `💳 **Modes de paiement :**

Tu peux payer les frais de service via :
• MTN Mobile Money
• Moov Money

Après le paiement, upload ta preuve de transaction dans la plateforme. La validation est rapide !`,

    // Support et contact
    support: `📞 **Besoin d'aide ?**

• **WhatsApp** : +229 01 67 45 54 62
• **Email** : contact@ifiaas.com
• **Chat Support** : Utilise l'onglet "Support" ici même

Notre équipe répond généralement en moins de 2 heures pendant les heures ouvrables.

Tu peux aussi me poser tes questions, je suis là 24/7 ! 😊`,

    // Dashboard
    dashboard: `📊 **Ton Dashboard GigaZone :**

• **Accueil** : Vue d'ensemble de tes stats
• **Mes Demandes** : Historique de tes tickets
• **Statistiques** : Graphiques de tes ventes
• **Parrainage** : Ton code et tes filleuls
• **Mes fichiers** : Télécharge tes tickets PDF
• **Notifications** : Alertes et infos
• **Mon profil** : Tes informations personnelles`,

    // Routeur
    routeur: `📡 **Quel routeur utiliser ?**

GigaZone fonctionne avec les routeurs classiques recommandés par notre équipe.

Nos techniciens peuvent te conseiller sur le modèle adapté à :
• La taille de ta zone de couverture
• Le nombre de clients attendus
• Ton budget

L'installation et la configuration sont incluses gratuitement !`,

    // Avantages
    avantages: `✨ **Pourquoi choisir GigaZone ?**

✅ Budget minimum : moins de 50 000 FCFA
✅ Installation gratuite par nos techniciens
✅ 100% légal avec autorisation ARCEP
✅ Frais de service les plus bas du marché
✅ Tu gardes 100% de tes ventes
✅ Système de parrainage rentable
✅ Support technique 24/7
✅ Dashboard facile à utiliser
✅ Disponible dans tout le Bénin`
  };

  // Réponses intelligentes basées sur les mots-clés
  const aiReply = (q) => {
    const ql = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Salutations
    if (/^(salut|bonjour|hello|coucou|hey|bonsoir|hi|yo|wesh)/i.test(ql)) {
      return "👋 Salut ! Je suis **Aro**, ton assistant GigaZone.\n\nComment puis-je t'aider aujourd'hui ? Tu peux me demander :\n• C'est quoi GigaZone ?\n• Comment devenir promoteur ?\n• Quels sont les forfaits ?\n• Comment ça marche ?";
    }
    
    // C'est quoi GigaZone
    if (ql.includes('quoi') && ql.includes('gigazone') || ql.includes('c\'est quoi') || ql.includes('qu\'est-ce')) {
      return aroKnowledge.gigazone;
    }
    
    // Comment ça marche / fonctionnement
    if ((ql.includes('comment') && (ql.includes('marche') || ql.includes('fonctionne'))) || ql.includes('fonctionnement')) {
      return aroKnowledge.fonctionnement;
    }
    
    // Étapes pour devenir promoteur
    if ((ql.includes('etape') || ql.includes('devenir')) && (ql.includes('promoteur') || ql.includes('commencer') || ql.includes('demarrer'))) {
      return aroKnowledge.etapes;
    }
    
    // Forfaits
    if (ql.includes('forfait') || ql.includes('offre') || ql.includes('formule') || (ql.includes('quoi') && ql.includes('vend'))) {
      return aroKnowledge.forfaits;
    }
    
    // Prix / Tarifs / Frais
    if (ql.includes('frais') || ql.includes('tarif') || ql.includes('cout') || (ql.includes('combien') && (ql.includes('paie') || ql.includes('paye')))) {
      return aroKnowledge.frais;
    }
    
    // Prix de départ / Budget
    if ((ql.includes('combien') && (ql.includes('lancer') || ql.includes('commencer') || ql.includes('demarrer') || ql.includes('faut'))) || ql.includes('budget') || ql.includes('investissement') || ql.includes('capital')) {
      return aroKnowledge.budget;
    }
    
    // Niveaux
    if (ql.includes('niveau') || ql.includes('bronze') || ql.includes('silver') || ql.includes('gold') || ql.includes('or') || ql.includes('argent')) {
      return aroKnowledge.niveaux;
    }
    
    // Parrainage
    if (ql.includes('parrain') || ql.includes('filleul') || ql.includes('commission') || ql.includes('code')) {
      return aroKnowledge.parrainage;
    }
    
    // Installation
    if (ql.includes('install') || ql.includes('technicien') || ql.includes('configuration') || ql.includes('configurer')) {
      return aroKnowledge.installation;
    }
    
    // Légalité / ARCEP
    if (ql.includes('legal') || ql.includes('arcep') || ql.includes('autorisation') || ql.includes('loi') || ql.includes('licence')) {
      return aroKnowledge.legal;
    }
    
    // Tickets / Demande / Commander
    if (ql.includes('ticket') || ql.includes('demande') || ql.includes('commander') || ql.includes('creer') || ql.includes('generer')) {
      return aroKnowledge.tickets;
    }
    
    // Paiement
    if (ql.includes('paiement') || ql.includes('payer') || ql.includes('momo') || ql.includes('mobile money') || ql.includes('mtn') || ql.includes('moov')) {
      return aroKnowledge.paiement;
    }
    
    // Support / Aide / Contact
    if (ql.includes('aide') || ql.includes('help') || ql.includes('support') || ql.includes('contact') || ql.includes('telephone') || ql.includes('whatsapp') || ql.includes('email')) {
      return aroKnowledge.support;
    }
    
    // Dashboard
    if (ql.includes('dashboard') || ql.includes('tableau de bord') || ql.includes('interface') || ql.includes('plateforme')) {
      return aroKnowledge.dashboard;
    }
    
    // Routeur
    if (ql.includes('routeur') || ql.includes('mikrotik') || ql.includes('materiel') || ql.includes('equipement') || ql.includes('besoin') && ql.includes('commencer')) {
      return aroKnowledge.materiel;
    }
    
    // Avantages / Pourquoi
    if (ql.includes('avantage') || ql.includes('pourquoi') || ql.includes('benefice') || ql.includes('interet')) {
      return aroKnowledge.avantages;
    }
    
    // Bénin / Disponibilité
    if (ql.includes('benin') || ql.includes('disponible') || ql.includes('zone') || ql.includes('couverture') || ql.includes('afrique') || ql.includes('pays')) {
      return "🌍 **Zone de couverture GigaZone :**\n\nGigaZone couvre **toute l'Afrique** avec une présence particulièrement forte au **Bénin** où nos techniciens peuvent se déplacer pour l'installation.\n\n🇧🇯 Bénin : Installation sur place\n🌍 Autres pays africains : Contacte-nous !\n\nOù que tu sois en Afrique, on peut t'accompagner pour lancer ta WifiZone !";
    }
    
    // Merci
    if (ql.includes('merci') || ql.includes('thanks')) {
      return "🙏 Avec plaisir ! N'hésite pas si tu as d'autres questions.\n\nBonne continuation avec GigaZone ! 🚀";
    }
    
    // Au revoir
    if (ql.includes('bye') || ql.includes('revoir') || ql.includes('ciao') || ql.includes('a plus') || ql.includes('bonne journee') || ql.includes('bonne soiree')) {
      return "👋 À bientôt ! Si tu as d'autres questions, je suis toujours là.\n\nBonne chance avec ton business WiFi ! 💪";
    }
    
    // Question non reconnue - suggestions
    return `🤔 Je ne suis pas sûr de comprendre ta question.

Essaie de me demander :
• **"C'est quoi GigaZone ?"** - Pour comprendre le service
• **"Comment devenir promoteur ?"** - Les étapes
• **"Quels sont les forfaits ?"** - Les prix
• **"Comment créer des tickets ?"** - Le processus
• **"Parle-moi du parrainage"** - Gagner des commissions
• **"Quels sont les frais ?"** - Les coûts
• **"Comment contacter le support ?"** - Obtenir de l'aide

Tu peux aussi utiliser l'onglet **Support** pour parler à un humain ! 😊`;
  };

  const sendAro = async () => {
    if (!aroInput.trim() || aroTyping) return;
    
    const q = aroInput.trim();
    setAroInput('');
    addAro('user', q);
    
    // Ajouter à l'historique
    const newHist = [...aroHistory, { role: 'user', content: q }];
    if (newHist.length > 10) newHist.splice(0, newHist.length - 10);
    setAroHistory(newHist);
    
    setAroTyping(true);
    
    // Appel API Aro (fetch)
    try {
      const histCopy = newHist.slice(0, -1);
      const res = await fetch(ARO_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SK,
          'Authorization': 'Bearer ' + SK
        },
        body: JSON.stringify({ 
          message: q, 
          history: histCopy,
          context: 'promoteur'
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        const reply = data.response || '';
        if (reply) {
          setAroHistory(prev => [...prev, { role: 'assistant', content: reply }]);
          addAro('bot', reply);
        } else {
          console.warn('Aro: empty response, using fallback');
          addAro('bot', aiReply(q));
        }
      } else {
        console.error('Aro API error:', res.status, await res.text().catch(() => ''));
        addAro('bot', aiReply(q));
      }
    } catch(e) {
      console.error('Aro network error:', e);
      addAro('bot', aiReply(q));
    } finally {
      setAroTyping(false);
    }
  };

  // === FONCTIONS SUPPORT ===
  
  const addLive = (type, msg, name) => {
    setLiveMsgs(prev => [...prev, { id: Date.now() + Math.random(), t: type, m: msg, n: name }]);
  };

  const startLive = () => {
    setLiveTyping(true);
    
    // Vérifier conversation existante
    sbGet('chat_conversations?visitor_id=eq.' + encodeURIComponent(visId.current) + '&status=eq.open&order=created_at.desc&limit=1', (err, ex) => {
      if (!err && ex && ex.length > 0) {
        setConvId(ex[0].id);
        // Charger messages
        sbGet('chat_messages?conversation_id=eq.' + ex[0].id + '&order=created_at.asc', (err2, msgs) => {
          if (!err2 && msgs) {
            setLiveMsgs(msgs.filter(m => m.sender_type !== 'system').map(m => ({
              id: m.id,
              t: m.sender_type === 'admin' ? 'admin' : 'user',
              m: m.message,
              n: m.sender_name
            })));
          }
          setChatStarted(true);
          setLiveTyping(false);
        });
      } else {
        // Créer nouvelle conversation
        sbPost('chat_conversations', {
          visitor_id: visId.current,
          visitor_name: visName,
          page_url: window.location.pathname,
          status: 'open'
        }, (err, r) => {
          if (!err && r && r.length > 0) {
            setConvId(r[0].id);
            // Message système
            sbPost('chat_messages', {
              conversation_id: r[0].id,
              sender_type: 'system',
              sender_name: 'Système',
              message: visName + ' a démarré un chat depuis ' + window.location.pathname,
              message_type: 'text'
            }, () => {});
          } else {
            console.error('startLive: failed to create conversation', err);
            addLive('admin', '⚠️ Impossible de démarrer le chat. Veuillez réessayer ou contactez-nous sur WhatsApp.', 'Système');
          }
          setChatStarted(true);
          setLiveTyping(false);
        });
      }
    });
  };

  const pollLive = () => {
    if (!convId) return;
    sbGet('chat_messages?conversation_id=eq.' + convId + '&order=created_at.asc', (err, msgs) => {
      if (!err && msgs) {
        setLiveMsgs(msgs.filter(m => m.sender_type !== 'system').map(m => ({
          id: m.id,
          t: m.sender_type === 'admin' ? 'admin' : 'user',
          m: m.message,
          n: m.sender_name
        })));
      }
    });
  };

  const sendLive = () => {
    if (!liveInput.trim() || liveTyping || !convId) {
      if (!convId) console.warn('sendLive: no convId — chat not started');
      return;
    }
    
    const msg = liveInput.trim();
    setLiveInput('');
    addLive('user', msg, visName);
    
    sbPost('chat_messages', {
      conversation_id: convId,
      sender_type: 'visitor',
      sender_name: visName,
      message: msg,
      message_type: 'text'
    }, (err) => {
      if (err) console.error('sendLive failed:', err);
    });
  };

  const handleKey = (e, fn) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      fn();
    }
  };

  // === RENDU ===
  
  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105"
        style={{
          background: isOpen ? '#374151' : 'linear-gradient(135deg, #EC4899, #9333EA)',
          boxShadow: isOpen ? 'none' : '0 4px 20px rgba(236,72,153,0.4)'
        }}
      >
        {isOpen ? (
          <span className="text-gray-500 dark:text-white text-2xl">✕</span>
        ) : (
          <>
            <span className="text-2xl">✨</span>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </>
        )}
      </button>

      {/* Panel Chat */}
      {isOpen && (
        <div 
          className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
          style={{ 
            height: '500px',
            maxHeight: 'calc(100vh - 120px)',
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div 
            className="p-4 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #EC4899, #9333EA)' }}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
              {activeTab === 'ai' ? '🤖' : '💬'}
            </div>
            <div className="flex-1">
              <div className="text-gray-900 dark:text-white font-bold">{activeTab === 'ai' ? 'Aro' : 'Support'}</div>
              <div className="text-gray-500 dark:text-white/70 text-xs">{activeTab === 'ai' ? 'Assistant IA' : 'Chat en direct'}</div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-3 text-sm font-medium transition ${
                activeTab === 'ai' 
                  ? 'text-pink-400 border-b-2 border-pink-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              🤖 Aro
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 py-3 text-sm font-medium transition ${
                activeTab === 'live' 
                  ? 'text-green-400 border-b-2 border-green-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              💬 Support
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={activeTab === 'ai' ? aroRef : liveRef}
            className="overflow-y-auto p-4 space-y-3"
            style={{ height: 'calc(100% - 180px)' }}
          >
            {activeTab === 'ai' ? (
              // Messages Aro
              <>
                {aroMsgs.map(msg => (
                  <div key={msg.id} className={`flex ${msg.t === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[85%] px-4 py-2.5 ${
                        msg.t === 'user'
                          ? 'rounded-2xl rounded-br-sm text-white'
                          : 'rounded-2xl rounded-bl-sm text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                      }`}
                      style={msg.t === 'user' ? { background: 'linear-gradient(135deg, #EC4899, #9333EA)' } : {}}
                    >
                      {msg.t === 'bot' && <div className="text-pink-400 text-xs font-semibold mb-1">🤖 Aro</div>}
                      <div 
                        className="text-sm whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ 
                          __html: msg.m
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-pink-300 font-semibold">$1</strong>')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                    </div>
                  </div>
                ))}
                {aroTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Support
              <>
                {!chatStarted ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="text-5xl mb-4">💬</div>
                    <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Chat Support</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Discutez en direct avec un agent GigaZone.</p>
                    <button
                      onClick={startLive}
                      disabled={liveTyping}
                      className="px-6 py-3 rounded-xl font-medium text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #22C55E, #10B981)' }}
                    >
                      {liveTyping ? 'Connexion...' : 'Démarrer le chat'}
                    </button>
                  </div>
                ) : (
                  <>
                    {liveMsgs.length === 0 && (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                        Chat démarré ! Un agent vous répondra bientôt.
                      </div>
                    )}
                    {liveMsgs.map(msg => (
                      <div key={msg.id} className={`flex ${msg.t === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className={`max-w-[85%] px-4 py-2.5 ${
                            msg.t === 'user'
                              ? 'rounded-2xl rounded-br-sm text-white'
                              : 'rounded-2xl rounded-bl-sm text-gray-100 bg-green-500/10 border border-green-500/30'
                          }`}
                          style={msg.t === 'user' ? { background: 'linear-gradient(135deg, #EC4899, #9333EA)' } : {}}
                        >
                          {msg.t === 'admin' && <div className="text-green-400 text-xs font-semibold mb-1">👨‍💼 {msg.n || 'Support'}</div>}
                          <div className="text-sm whitespace-pre-wrap">{msg.m}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* Input */}
          {(activeTab === 'ai' || chatStarted) && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={activeTab === 'ai' ? aroInput : liveInput}
                  onChange={(e) => activeTab === 'ai' ? setAroInput(e.target.value) : setLiveInput(e.target.value)}
                  onKeyDown={(e) => handleKey(e, activeTab === 'ai' ? sendAro : sendLive)}
                  placeholder={activeTab === 'ai' ? "Posez votre question..." : "Écris ton message..."}
                  className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
                <button
                  onClick={activeTab === 'ai' ? sendAro : sendLive}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg, #EC4899, #9333EA)' }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
