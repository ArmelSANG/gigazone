import { useEffect } from 'react';

/**
 * Hook SEO dynamique - Met à jour title, meta description, canonical, OG tags par route
 * Résout le problème critique : toutes les pages avaient le même title/description/canonical
 */
export function usePageSEO({
  title,
  description,
  path = '',
  noindex = false,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website'
} = {}) {
  useEffect(() => {
    const BASE_URL = 'https://z.ifiaas.com';
    const DEFAULT_OG_IMAGE = `${BASE_URL}/logo.jpg`;
    const SITE_NAME = 'GigaZone WiFi Pro';

    // --- Title ---
    if (title) {
      document.title = title.includes('GigaZone') ? title : `${title} | ${SITE_NAME}`;
    }

    // --- Meta Description ---
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      }
    }

    // --- Canonical ---
    const canonicalUrl = `${BASE_URL}${path || window.location.pathname}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalUrl);
    }

    // --- Robots ---
    let robotsMeta = document.querySelector('meta[name="robots"]');
    let googlebotMeta = document.querySelector('meta[name="googlebot"]');
    if (noindex) {
      if (robotsMeta) robotsMeta.setAttribute('content', 'noindex, nofollow');
      if (googlebotMeta) googlebotMeta.setAttribute('content', 'noindex, nofollow');
    } else {
      if (robotsMeta) robotsMeta.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
      if (googlebotMeta) googlebotMeta.setAttribute('content', 'index, follow');
    }

    // --- Hreflang (update for current path) ---
    const hreflangTags = document.querySelectorAll('link[hreflang]');
    hreflangTags.forEach(tag => {
      const currentHref = tag.getAttribute('href');
      if (currentHref && currentHref.startsWith(BASE_URL)) {
        tag.setAttribute('href', canonicalUrl);
      }
    });

    // --- Open Graph ---
    const ogTags = {
      'og:title': ogTitle || title || SITE_NAME,
      'og:description': ogDescription || description || '',
      'og:url': canonicalUrl,
      'og:image': ogImage || DEFAULT_OG_IMAGE,
      'og:type': ogType
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      if (content) {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (meta) {
          meta.setAttribute('content', content);
        }
      }
    });

    // --- Twitter ---
    const twitterTags = {
      'twitter:title': ogTitle || title || SITE_NAME,
      'twitter:description': ogDescription || description || ''
    };

    Object.entries(twitterTags).forEach(([name, content]) => {
      if (content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (meta) {
          meta.setAttribute('content', content);
        }
      }
    });

    // Cleanup : restaurer les valeurs par défaut au démontage
    return () => {
      document.title = 'GigaZone WiFi Pro | Lancez Votre WifiZone au Bénin - Moins de 50 000F';
      
      const defaultDesc = 'GigaZone transforme un routeur classique en hotspot WiFi rentable. 100% légal, installation gratuite par nos techniciens, frais bas du marché. Lancez votre WifiZone avec moins de 50 000F !';
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', defaultDesc);

      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) canonicalLink.setAttribute('href', BASE_URL + '/');

      let robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) robotsMeta.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

      let googlebotMeta = document.querySelector('meta[name="googlebot"]');
      if (googlebotMeta) googlebotMeta.setAttribute('content', 'index, follow');

      // Restaurer hreflang vers /
      const hreflangTags = document.querySelectorAll('link[hreflang]');
      hreflangTags.forEach(tag => {
        const currentHref = tag.getAttribute('href');
        if (currentHref && currentHref.startsWith(BASE_URL)) {
          tag.setAttribute('href', BASE_URL + '/');
        }
      });

      // Restaurer OG par défaut
      const defaults = {
        'og:title': 'GigaZone WiFi Pro | Lancez Votre WifiZone - Moins de 50 000F',
        'og:description': 'GigaZone transforme un routeur classique en hotspot WiFi rentable. 100% légal, installation gratuite, frais bas du marché !',
        'og:url': BASE_URL + '/',
        'og:image': DEFAULT_OG_IMAGE,
        'og:type': 'website'
      };
      Object.entries(defaults).forEach(([property, content]) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (meta) meta.setAttribute('content', content);
      });

      // Restaurer Twitter par défaut
      const twitterDefaults = {
        'twitter:title': 'GigaZone WiFi Pro | Lancez Votre WifiZone au Bénin',
        'twitter:description': 'GigaZone transforme un routeur classique en hotspot WiFi rentable. 100% légal, installation gratuite, frais bas du marché !',
        'twitter:image': DEFAULT_OG_IMAGE
      };
      Object.entries(twitterDefaults).forEach(([name, content]) => {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (meta) meta.setAttribute('content', content);
      });
    };
  }, [title, description, path, noindex, ogTitle, ogDescription, ogImage, ogType]);
}

/**
 * Configurations SEO prédéfinies pour chaque route publique
 */
export const SEO_CONFIGS = {
  landing: {
    title: 'GigaZone WiFi Pro | Lancez Votre WifiZone au Bénin - Moins de 50 000F',
    description: 'GigaZone transforme un routeur classique en hotspot WiFi rentable. 100% légal, installation gratuite par nos techniciens, frais bas du marché. Lancez votre WifiZone avec moins de 50 000F !',
    path: '/',
    ogTitle: 'GigaZone WiFi Pro | Lancez Votre WifiZone - Moins de 50 000F',
    ogDescription: 'GigaZone transforme un routeur classique en hotspot WiFi rentable. 100% légal, installation gratuite, frais bas du marché !'
  },
  inscription: {
    title: 'Inscription Promoteur WiFi | GigaZone WiFi Pro',
    description: 'Inscrivez-vous gratuitement comme promoteur GigaZone et lancez votre business WiFi au Bénin. Créez votre compte en 2 minutes et commencez à gagner.',
    path: '/inscription',
    ogTitle: 'Devenir Promoteur WiFi - Inscription Gratuite | GigaZone',
    ogDescription: 'Rejoignez le réseau GigaZone ! Inscription gratuite, installation offerte, et gardez 100% de vos ventes de tickets WiFi au Bénin.'
  },
  login: {
    title: 'Connexion Promoteur | GigaZone WiFi Pro',
    description: 'Connectez-vous à votre espace promoteur GigaZone pour gérer vos tickets WiFi, suivre vos commandes et vos commissions.',
    path: '/login',
    ogTitle: 'Espace Promoteur GigaZone - Connexion',
    ogDescription: 'Accédez à votre tableau de bord GigaZone pour gérer votre business WiFi.'
  },
  check: {
    title: 'Vérifier un Code WiFi | GigaZone WiFi Pro',
    description: 'Vérifiez la validité de votre ticket WiFi GigaZone. Entrez votre code pour voir sa durée, son statut et ses détails.',
    path: '/check',
    ogTitle: 'Vérification de Code WiFi | GigaZone',
    ogDescription: 'Vérifiez instantanément si votre ticket WiFi GigaZone est valide.'
  },
  cguPublique: {
    title: 'Conditions Générales d\'Utilisation | GigaZone WiFi Pro',
    description: 'Consultez les conditions générales d\'utilisation de la plateforme GigaZone WiFi Pro pour les promoteurs et utilisateurs.',
    path: '/cgu-publique',
    ogTitle: 'CGU - GigaZone WiFi Pro',
    ogDescription: 'Conditions générales d\'utilisation de la plateforme GigaZone pour les promoteurs WiFi au Bénin.'
  },
  politique: {
    title: 'Politique de Confidentialité | GigaZone WiFi Pro',
    description: 'Découvrez comment GigaZone protège vos données personnelles. Notre politique de confidentialité détaille la collecte et l\'utilisation de vos informations.',
    path: '/politique',
    ogTitle: 'Politique de Confidentialité - GigaZone WiFi Pro',
    ogDescription: 'Découvrez comment GigaZone protège vos données personnelles au Bénin.'
  },
  mentions: {
    title: 'Mentions Légales | GigaZone WiFi Pro',
    description: 'Mentions légales de GigaZone WiFi Pro par IFIAAS. Informations sur l\'éditeur, l\'hébergeur et les conditions d\'utilisation du site z.ifiaas.com.',
    path: '/mentions',
    ogTitle: 'Mentions Légales - GigaZone WiFi Pro',
    ogDescription: 'Informations légales sur GigaZone WiFi Pro, service de IFIAAS au Bénin.'
  },
  promoteur: {
    title: 'Mon Espace Promoteur | GigaZone WiFi Pro',
    description: 'Tableau de bord promoteur GigaZone : gérez vos commandes, suivez vos commissions et téléchargez vos tickets WiFi.',
    path: '/promoteur',
    noindex: true
  },
  admin: {
    title: 'Administration | GigaZone WiFi Pro',
    description: 'Panneau d\'administration GigaZone.',
    path: '/admin',
    noindex: true
  },
  nouvelleCommande: {
    title: 'Nouvelle Commande de Tickets | GigaZone WiFi Pro',
    description: 'Commandez vos tickets WiFi GigaZone. Choisissez votre forfait, payez et recevez vos tickets en PDF.',
    path: '/promoteur/nouvelle-commande',
    noindex: true
  },
  onboarding: {
    title: 'Bienvenue sur GigaZone | Tutoriel',
    description: 'Découvrez comment utiliser la plateforme GigaZone et maximiser vos gains en tant que promoteur WiFi.',
    path: '/onboarding',
    noindex: true
  },
  cgu: {
    title: 'Accepter les CGU | GigaZone WiFi Pro',
    description: 'Acceptez les conditions générales d\'utilisation pour accéder à votre espace promoteur GigaZone.',
    path: '/cgu',
    noindex: true
  },
  resetCode: {
    title: 'Réinitialiser votre Code | GigaZone WiFi Pro',
    description: 'Réinitialisez votre code d\'accès promoteur GigaZone via le lien de récupération envoyé par WhatsApp.',
    path: '/reset',
    noindex: true
  }
};

export default usePageSEO;
