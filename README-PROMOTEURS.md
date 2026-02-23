# 🌐 GigaZone Plateforme Promoteurs

Plateforme SaaS B2B de vente en gros de tickets WiFi avec système de parrainage et commissions.

## 🚀 Fonctionnalités

### Pour les Promoteurs
- ✅ Inscription avec code unique généré automatiquement
- ✅ Achat de tickets WiFi en gros avec remises
- ✅ Système de niveaux (Bronze, Silver, Gold) avec bonus progressifs
- ✅ Parrainage avec commissions automatiques
- ✅ Dashboard complet (stats, commandes, bénéfices)
- ✅ Téléchargement des tickets PDF
- ✅ Notifications en temps réel
- ✅ QR Code de parrainage

### Pour les Administrateurs
- ✅ Dashboard WiFi existant (utilisateurs, connexions, forfaits)
- ✅ Gestion des promoteurs (liste, suspension, récupération code)
- ✅ Validation des commandes avec upload PDF
- ✅ Configuration des paramètres (taux, niveaux, paiements)
- ✅ Gestion des CGU
- ✅ Chat support intégré

### Fonctionnalités additionnelles
- 🤖 Assistant IA "Aro" (Groq/Llama)
- 💬 Chat support humain
- 📱 PWA installable
- 🎓 Tutoriel onboarding
- ❓ FAQ intégrée

## 🛠️ Stack technique

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Déploiement**: Vercel
- **IA**: Groq API (Llama 3.3)

## 📁 Structure du projet

```
src/
├── App.jsx                          # Router principal
├── main.jsx                         # Point d'entrée
├── index.css                        # Styles Tailwind
├── config/
│   └── supabase.js                  # Configuration Supabase
├── contexts/
│   └── AuthContext.jsx              # Gestion authentification
├── components/
│   ├── admin/
│   │   ├── AdminPromoteurs.jsx      # Gestion promoteurs
│   │   ├── AdminCommandesPromo.jsx  # Validation commandes
│   │   └── AdminSettings.jsx        # Paramètres plateforme
│   ├── chat/
│   │   └── ChatWidget.jsx           # Widget Aro + Support
│   └── common/
│       ├── Toast.jsx                # Notifications toast
│       ├── Modal.jsx                # Modal réutilisable
│       └── index.jsx                # Composants UI
├── pages/
│   ├── LandingPage.jsx              # Page d'accueil publique
│   ├── LoginPage.jsx                # Connexion promoteur
│   ├── InscriptionPage.jsx          # Inscription promoteur
│   ├── CGUPage.jsx                  # Acceptation CGU
│   ├── OnboardingPage.jsx           # Tutoriel nouveaux
│   ├── PromoteurDashboard.jsx       # Dashboard promoteur
│   ├── NouvelleCommandePage.jsx     # Processus commande
│   ├── AdminDashboard.jsx           # Dashboard admin
│   └── PublicCheck.jsx              # Vérification code WiFi
└── utils/
    └── helpers.js                   # Fonctions utilitaires
```

## 🗄️ Base de données Supabase

### Tables principales
- `promoteurs` - Profils promoteurs
- `commandes_promoteurs` - Commandes
- `commissions_historique` - Historique commissions
- `settings_global` - Paramètres admin
- `cgu_versions` - Versions CGU
- `notifications_promoteurs` - Notifications
- `faq` - Questions fréquentes

### Tables existantes (WiFi)
- `users` - Utilisateurs WiFi
- `connections` - Connexions
- `packages` - Forfaits
- `chat_conversations` / `chat_messages` - Support

## 🚀 Installation

### 1. Cloner et installer
```bash
cd gigazone/dashboard
npm install
```

### 2. Configurer Supabase
1. Exécuter `SUPABASE-PROMOTEURS.sql` dans l'éditeur SQL Supabase
2. Configurer les politiques RLS
3. Créer les buckets Storage (`commandes`)

### 3. Lancer en développement
```bash
npm run dev
```

### 4. Build production
```bash
npm run build
```

## 🔐 Authentification

### Admin
- Double-clic sur le logo → Mode admin
- Mot de passe: `gigazone2024`

### Promoteur
- Code unique 6 caractères (généré à l'inscription)
- Récupération via WhatsApp

## 💰 Système financier

### Calcul commande
```
Total brut = quantité × prix unitaire
Remise = Total brut × (taux_base + bonus_niveau)
Net avant commission = Total brut - Remise
Net à payer = Net avant commission - Commission utilisée
Bénéfice = Remise
```

### Niveaux
| Niveau | Seuil | Bonus |
|--------|-------|-------|
| Bronze | 0-50 | +0% |
| Silver | 51-200 | +2% |
| Gold | 201+ | +5% |

### Parrainage
- 1 niveau (parrain direct uniquement)
- Commission = % du net payé par le filleul
- Commissions à vie, utilisables partiellement

## 📱 Routes

| Route | Accès | Description |
|-------|-------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Connexion |
| `/inscription` | Public | Inscription |
| `/cgu` | Connecté | Acceptation CGU |
| `/onboarding` | Connecté | Tutoriel |
| `/promoteur` | Promoteur | Dashboard |
| `/promoteur/nouvelle-commande` | Promoteur | Nouvelle commande |
| `/admin` | Admin | Dashboard admin |
| `/check` | Public | Vérification code WiFi |

## 🎨 Design

- **Couleur primaire**: Pink (#E91E8C)
- **Couleur secondaire**: Purple (#9333EA)
- **Background**: Gray 950 (#0B0F19)
- **Police**: Plus Jakarta Sans / System

## 📄 License

© 2026 GigaZone - Tous droits réservés
