# 🏗️ Architecture du Dashboard GigaZone

## 📁 Structure des fichiers

```
dashboard/
├── index.html              # Point d'entrée HTML (PWA, meta tags, fonts)
├── package.json            # Dépendances React/Vite
├── vite.config.js          # Config build Vite
├── tailwind.config.js      # Config Tailwind CSS
├── vercel.json             # Config déploiement Vercel
├── public/
│   └── manifest.json       # PWA manifest
└── src/
    ├── main.jsx            # Point d'entrée React + BrowserRouter
    ├── App.jsx             # Router principal (3 routes)
    ├── index.css           # Styles globaux Tailwind
    └── pages/
        ├── AdminDashboard.jsx   # Dashboard admin (3398 lignes)
        └── PublicCheck.jsx      # Page vérification code (380 lignes)
```

---

## 🔧 Configuration Supabase

```javascript
const SUPABASE_URL = 'https://dfflzuwyntrdfxujvsqr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIs...'; // anon key
```

**Helpers API :**
- `supabaseFetch(endpoint)` - GET avec headers
- `supabaseDelete(endpoint)` - DELETE
- `supabasePatch(endpoint, data)` - PATCH avec return=representation

---

## 🚪 Routes (App.jsx)

| Route | Composant | Description |
|-------|-----------|-------------|
| `/` | `AdminDashboard` | Dashboard admin (protégé par mot de passe) |
| `/check` | `PublicCheck` | Vérification code WiFi (public) |
| `/verifier` | `PublicCheck` | Alias de /check |
| `*` | Redirect → `/` | Routes inconnues |

---

## 🔐 Authentification Admin

**Mot de passe :** `GZ_ifi2025`

**Hash SHA-256 :**
```javascript
const ADMIN_HASH = 'e9a76a89516e3c0cd657b9ece6dd180e89b4c782f42905b6fe892840f49969a3';
```

**Stockage :** `sessionStorage.setItem('gz_admin', 'ok')`

---

## 📊 AdminDashboard.jsx - Structure détaillée

### États (useState)

```javascript
// Auth
isAuth, loginPwd, loginError, loginLoading, dataReady

// UI
darkMode, sidebarOpen, activeTab, loading

// Data
users[], connections[], packages[], devices[]

// Modals
deviceModal, userDrawer, editModal, editForm, editSaving

// Chat
conversations[], chatMessages[], selectedConversation, newMessage

// Stats
stats: {
  totalUsers, todayConnections, todayRevenue, uniqueToday,
  weekRevenue, monthRevenue, todayUsers, yesterdayUsers,
  yesterdayConnections, yesterdayRevenue, yesterdayUnique,
  weekConnections, monthConnections, retentionRate,
  avgConnectionsPerUser, categoryStats[], selectedPeriod*
}

// Filtres
dashboardPeriod ('today'|'yesterday'|'week'|'month'|'custom')
customDate, userSearch, connectionSearch, dateFilter, categoryFilter
userSort: { key, dir }
```

### Données calculées (useMemo)

```javascript
enrichedUsers     // users + _conns, _devCount, _totalSpent, _connCount, _lastSeen
filteredUsers     // enrichedUsers filtrés + triés
filteredConnections // connections filtrées par date/catégorie
packageStats      // packages + sales, revenue
chartData         // Graphique 7 jours (date, connections, revenue)
enhancedChartData // + newUsers, uniqueUsers
periodStats       // Stats période sélectionnée + variations %
comparisonData    // Aujourd'hui vs Hier
```

### Onglets (activeTab)

| ID | Label | Lignes | Description |
|----|-------|--------|-------------|
| `dashboard` | Dashboard | 807-1218 | KPIs, graphiques, comparaisons |
| `users` | Utilisateurs | 1219-1366 | Table triable, recherche, actions |
| `connections` | Connexions | 1367-1472 | Historique connexions, filtres |
| `packages` | Forfaits | 1473-1517 | Cartes forfaits avec stats ventes |
| `promo` | Codes Promo | 1518-1526 | → PromoCodesSection |
| `notifications` | Notifications | 1527-1535 | → NotificationsSection |
| `chat` | Chat Support | 1536-1549 | → ChatSupportSection |

### Sous-composants

#### 1. ChatSupportSection (lignes 1790-2390)
```javascript
Props: darkMode, cardClass, inputClass, conversations, setConversations,
       chatMessages, setChatMessages, selectedConversation, setSelectedConversation,
       supabaseFetch

États: newMessage, loading, mobileView, unreadCounts, showActions
Refs: inputRef, messagesEndRef, lastMessageCountRef, audioContextRef

Fonctions:
- playNotificationSound() // Son oscillateur 880-1100Hz
- playSendSound()         // Son 600Hz court
- fetchConversations()    // Charge conversations Supabase
- fetchMessages(convId)   // Charge messages d'une conversation
- sendMessage()           // Envoie message admin → Supabase
- markAsRead(convId)      // Marque comme lu
- archiveConversation()   // Archive conversation
- deleteConversation()    // Supprime conversation

Realtime: Polling toutes les 5 secondes
```

#### 2. NotificationsSection (lignes 2391-2877)
```javascript
Props: darkMode, cardClass, inputClass

États: notifications[], loading, sending, showForm, formData

formData: {
  title, message, type, icon, priority, target,
  action_url, action_text, duration, play_sound
}

NOTIFICATION_TYPES: info, promo, alert, maintenance, success, urgent
TARGETS: all, login, status, alogin

Fonctions:
- fetchNotifications()
- sendNotification()      // POST vers Supabase
- toggleNotification(id)  // Active/désactive
- deleteNotification(id)  // Supprime
```

#### 3. PromoCodesSection (lignes 2878-3398)
```javascript
Props: darkMode, cardClass, inputClass

États: promoCodes[], loading, showForm, saving, editingId, formData

formData: {
  code, description, discount_type, discount_value,
  min_amount, max_uses, valid_until
}

Fonctions:
- fetchPromoCodes()
- generateCode()          // Génère "GZ" + 6 chars aléatoires
- savePromoCode()         // POST ou PATCH selon editingId
- togglePromoCode(id)     // Active/désactive
- deletePromoCode(id)     // Supprime
- editPromoCode(promo)    // Ouvre formulaire édition
```

### Modals

1. **Device Modal** (lignes 1550-1610)
   - Affiche appareils d'un utilisateur
   - Props: deviceModal.userName, deviceModal.devices[]

2. **User Detail Drawer** (lignes 1611-1789)
   - Slide-in depuis la droite
   - Fiche complète utilisateur
   - Actions: Modifier, Supprimer, Copier code

3. **Edit Modal** (dans User Drawer)
   - Formulaire édition: full_name, whatsapp, npi_ravip, link_code

### Helpers

```javascript
formatNumber(num)        // "1 234"
formatCurrency(num)      // "1 234 F"
formatDate(date)         // "14 févr. 2026, 10:30"
formatDateShort(date)    // "14 févr."
hashPassword(pwd)        // SHA-256
timeAgo(date)            // "5min", "2h", "3j"
copyToClip(text)         // Clipboard API
getUserBadge(connCount)  // VIP (50+), Régulier (10+), Nouveau
```

---

## 🌐 PublicCheck.jsx

Page publique accessible sur `/check` ou `/verifier`.

### Fonctionnalités
- Recherche par code WiFi (link_code)
- Affiche: appareils, total dépensé, dernière connexion
- Historique des 10 dernières connexions
- Utilisateurs associés au code
- Modal détails appareils
- Mode sombre/clair automatique

### API calls
1. GET `/connections?username=eq.{code}` - Connexions du code
2. GET `/users?link_code=eq.{code}` - Utilisateur par code
3. GET `/users?or=(mac_address.eq.X,...)` - Utilisateurs par MAC

---

## 🎨 Styles

### Classes réutilisables
```javascript
bgClass    // bg-slate-950 | bg-gray-50
cardClass  // bg-slate-900/50 border-slate-800 | bg-white border-gray-200
inputClass // bg-slate-800 border-slate-700 | bg-white border-gray-200
```

### Gradients
```css
from-pink-500 to-purple-600    /* Principal */
from-pink-500 to-rose-500      /* Users */
from-cyan-500 to-blue-500      /* Connexions */
from-green-500 to-emerald-500  /* Revenus */
from-orange-500 to-amber-500   /* Unique */
```

---

## 📱 Tables Supabase utilisées

| Table | Description |
|-------|-------------|
| `users` | Utilisateurs inscrits |
| `devices` | Appareils (MAC) liés aux users |
| `connections` | Historique connexions hotspot |
| `packages` | Forfaits disponibles |
| `promo_codes` | Codes promotionnels |
| `promo_code_uses` | Utilisations des codes |
| `notifications` | Notifications push |
| `notification_reads` | Lectures notifications |
| `chat_conversations` | Conversations support |
| `chat_messages` | Messages chat |

---

## 🚀 Fonctionnalités à ajouter

### Priorité haute
- [ ] **Realtime Supabase** - Remplacer polling par subscriptions
- [ ] **Aro IA dans dashboard** - Chat support assisté par IA
- [ ] **Export PDF** - Rapports téléchargeables
- [ ] **Graphiques interactifs** - Recharts ou Chart.js

### Priorité moyenne
- [ ] **Multi-admin** - Système de rôles
- [ ] **Logs d'audit** - Traçabilité actions admin
- [ ] **Statistiques avancées** - Cohort analysis, LTV
- [ ] **API MikroTik** - Gestion directe routeur

### Priorité basse
- [ ] **PWA offline** - Service worker
- [ ] **i18n** - Support anglais
- [ ] **Thèmes** - Personnalisation couleurs

---

## 📝 Notes développeur

1. **Tous les hooks avant les returns conditionnels** - React rules
2. **useMemo pour calculs coûteux** - Évite re-renders
3. **Pas de localStorage** - Utiliser sessionStorage ou state
4. **Dark mode auto** - Basé sur l'heure (6h-18h = light)
5. **Responsive** - Mobile-first avec breakpoints sm/lg

---

*Document généré le 14 février 2026*
*GigaZone Dashboard v5.1 — IFIAAS*
