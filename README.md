# 🖥️ GigaZone Admin Dashboard

Dashboard d'administration pour GigaZone WiFi - React + Vite + Tailwind CSS

## ✨ Fonctionnalités

- 📊 **Dashboard** - Statistiques en temps réel
- 👥 **Utilisateurs** - Gestion des comptes
- 📶 **Connexions** - Suivi des sessions actives
- 💳 **Forfaits** - Liste et stats des forfaits
- 🎟️ **Codes Promo** - Création et gestion
- 🔔 **Notifications** - Push notifications aux utilisateurs
- 💬 **Chat Support** - Réponses en temps réel

## 🚀 Déploiement GitHub + Vercel

### 1. Push vers GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/VOTRE_USER/gigazone-admin.git
git push -u origin main
```

### 2. Connecter à Vercel
1. Aller sur vercel.com
2. "New Project" → Import depuis GitHub
3. Sélectionner le repo gigazone-admin
4. Framework: Vite
5. Deploy

### 3. Variables d'environnement (optionnel)
Dans Vercel → Settings → Environment Variables:
```
VITE_SUPABASE_URL=https://dfflzuwyntrdfxujvsqr.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIs...
```

## 📁 Structure

```
src/
├── pages/
│   ├── AdminDashboard.jsx   # Dashboard principal
│   └── PublicCheck.jsx      # Vérification publique
├── App.jsx                  # Router
├── main.jsx                 # Entry point
└── index.css                # Styles Tailwind
```

## 🛠️ Développement local

```bash
npm install
npm run dev
```

## ⚙️ Configuration

Les clés Supabase sont dans `src/pages/AdminDashboard.jsx` ligne 13-14.

## 🔗 URLs

- Production: https://z.ifiaas.com
- Vérification: https://z.ifiaas.com/check

© 2025 IFIAAS - GigaZone
