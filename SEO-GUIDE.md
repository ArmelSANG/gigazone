# 🚀 Guide SEO - GigaZone WiFi Pro

## ✅ Checklist SEO Implémentée

### 1. Meta Tags Dynamiques (usePageSEO hook)
- [x] Title unique et optimisé par route (14 routes configurées)
- [x] Meta description dynamique par route
- [x] Canonical URL dynamique par route
- [x] Robots/Googlebot directives (noindex pour pages privées)
- [x] Geo-targeting (Bénin, Zinvié, coordonnées GPS)
- [x] Language tags (fr-BJ)
- [x] Hreflang dynamique par route (fr-BJ, fr, x-default)
- [x] Keywords exhaustifs

### 2. Open Graph Dynamique (Facebook, WhatsApp, LinkedIn)
- [x] og:title dynamique par route
- [x] og:description dynamique par route
- [x] og:image avec vrai logo (1200x630px)
- [x] og:url dynamique par route
- [x] og:type, og:site_name
- [x] og:locale = fr_BJ avec alternate fr_FR
- [x] Cleanup automatique au changement de route

### 3. Twitter Cards Dynamiques
- [x] twitter:card (summary_large_image)
- [x] twitter:title dynamique
- [x] twitter:description dynamique
- [x] twitter:image avec vrai logo
- [x] @GigaZoneBenin, @IFIAAS

### 4. Structured Data (JSON-LD)
- [x] Organization schema (nom, logo, adresse, contact, areaServed)
- [x] WebApplication schema (catégorie, prix, featureList, screenshot)
- [x] FAQPage schema (13 questions complètes = toutes celles de la landing page)
- [x] LocalBusiness schema (téléphone, géo, horaires 24/7)
- [x] **PAS de aggregateRating fictif** (supprimé pour éviter pénalité Google)

### 5. Fichiers SEO
- [x] sitemap.xml (8 URLs publiques, hreflang, sans pages protégées)
- [x] robots.txt (sans regex non supporté, avec TelegramBot)
- [x] manifest.json optimisé PWA (lang fr-BJ, shortcuts, screenshots)

### 6. Images SEO avec vrai logo GigaZone
- [x] og-image.jpg (1200x630) - Logo réel + branding
- [x] og-image.svg (vectoriel backup)
- [x] screenshot-wide.png (1280x720) - Dashboard mockup avec logo
- [x] screenshot-mobile.png (750x1334) - Vue mobile avec logo
- [x] logo.jpg (640x640) - Logo officiel GigaZone WiFi Haut Débit

### 7. Noscript SEO (Critical)
- [x] Contenu HTML complet pour crawlers sans JS
- [x] H1 + H2 + H3 sémantiques
- [x] FAQ complète en texte
- [x] Forfaits, étapes, contact
- [x] Navigation vers toutes les pages publiques

### 8. Performance & Sécurité (vercel.json)
- [x] Cache-Control immutable pour assets (1 an)
- [x] Cache-Control images SEO (1 jour)
- [x] Cache-Control sitemap/robots (1 heure)
- [x] X-Content-Type-Options: nosniff
- [x] X-Frame-Options: SAMEORIGIN
- [x] X-XSS-Protection
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Permissions-Policy restrictive

### 9. Accessibilité (Aide au SEO)
- [x] aria-labels sur CTAs
- [x] aria-labelledby sur sections
- [x] aria-hidden sur éléments décoratifs
- [x] role="list" / role="listitem" sur données
- [x] Balises <strong> sur mots-clés dans le hero

### 10. Architecture SEO
- [x] Preconnect vers Google Fonts + Supabase
- [x] DNS-prefetch en double sécurité
- [x] display=swap sur fonts (pas de FOIT)
- [x] Anti-flash script pour thème (pas de FOUC)
- [x] Lien /admin retiré du footer public

---

## 📸 Images SEO (Générées avec le vrai logo)

| Image | Dimensions | Format | Usage |
|-------|-----------|--------|-------|
| og-image.jpg | 1200×630 | JPEG | Partages sociaux |
| og-image.svg | 1200×630 | SVG | Backup vectoriel |
| screenshot-wide.png | 1280×720 | PNG | PWA store (desktop) |
| screenshot-mobile.png | 750×1334 | PNG | PWA store (mobile) |
| logo.jpg | 640×640 | JPEG | Logo officiel, JSON-LD |

---

## 🔧 Actions Post-Déploiement (À FAIRE)

### 1. Google Search Console (PRIORITAIRE)
```
1. Aller sur https://search.google.com/search-console
2. Ajouter la propriété: z.ifiaas.com
3. Vérifier avec balise HTML ou DNS TXT
4. Soumettre le sitemap: https://z.ifiaas.com/sitemap.xml
5. Demander l'indexation de la page d'accueil
```

### 2. Bing Webmaster Tools
```
1. Aller sur https://www.bing.com/webmasters
2. Ajouter le site
3. Soumettre le sitemap
```

### 3. Google My Business (Local SEO)
```
1. Créer une fiche Google My Business
2. Catégorie: "Fournisseur d'accès Internet"
3. Ajouter photos, horaires, contact WhatsApp
4. Adresse: Zinvié, Bénin
```

### 4. Ajouter la balise de vérification
Après l'inscription à Search Console, ajouter dans index.html:
```html
<meta name="google-site-verification" content="VOTRE_CODE_ICI" />
```

### 5. Google Analytics
```
Installer un tag GA4 ou utiliser Vercel Analytics
```

---

## ⚠️ Limites Connues (SPA React)

### Le problème SPA
GigaZone est une SPA React. Google peut indexer le JS mais avec un délai. Le `<noscript>` fournit un fallback riche pour les crawlers qui n'exécutent pas JS.

### Solutions futures pour améliorer l'indexation
1. **react-snap** : Pre-rendering statique des pages publiques
2. **Next.js migration** : SSR/SSG natif (refonte majeure)
3. **Rendertron** : Service de pre-rendering côté serveur
4. **Cloudflare Workers** : SSR edge pour les bots

### Recommandation : react-snap
```bash
npm install react-snap
# Ajouter dans package.json:
# "postbuild": "react-snap"
# "reactSnap": { "include": ["/", "/inscription", "/login", "/check", "/cgu-publique", "/politique", "/mentions"] }
```

---

## 📊 Mots-clés Ciblés

### Principaux (High Priority)
- WiFi Bénin
- Business WiFi
- Hotspot WiFi Bénin
- Vendre WiFi
- GigaZone

### Secondaires
- Revenus passifs Bénin
- Créer hotspot
- WiFi professionnel
- ARCEP Bénin
- Tickets WiFi
- Portail captif

### Longue traîne
- Comment créer un business WiFi au Bénin
- Combien pour lancer un hotspot WiFi
- Vendre internet légalement Bénin
- Autorisation ARCEP WiFi

---

## 📈 Objectifs SEO

- Top 3 pour "WiFi Bénin" sous 6 mois
- Top 5 pour "Business WiFi Afrique" sous 12 mois
- 1000 visites organiques/mois sous 6 mois
- Indexation complète des 8 pages publiques sous 1 mois

---

## 🛠️ Outils de Validation

| Outil | Usage | Lien |
|-------|-------|------|
| Google Search Console | Indexation & performance | search.google.com |
| Schema Validator | Tester JSON-LD | validator.schema.org |
| Facebook Debugger | Tester Open Graph | developers.facebook.com/tools/debug |
| GTmetrix | Performance page | gtmetrix.com |
| PageSpeed Insights | Core Web Vitals | pagespeed.web.dev |
