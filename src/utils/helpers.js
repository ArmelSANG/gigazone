// =====================================================
// FORMATTERS & HELPERS
// =====================================================

// Formatage nombres
export const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);
export const formatCurrency = (num) => `${formatNumber(num)} F`;

// Formatage dates
export const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { 
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
});
export const formatDateShort = (date) => new Date(date).toLocaleDateString('fr-FR', { 
  day: '2-digit', month: 'short' 
});
export const formatDateOnly = (date) => new Date(date).toLocaleDateString('fr-FR', { 
  day: '2-digit', month: 'long', year: 'numeric'
});

// Générer code unique 6 caractères (sans caractères ambigus)
export const generateCode = (length = 6) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Règles de validation WhatsApp par pays (indicatif -> longueur du numéro local)
export const whatsappRules = {
  '+229': { length: 8, name: 'Bénin', example: '97 XX XX XX' },      // Bénin: 8 chiffres
  '+228': { length: 8, name: 'Togo', example: '90 XX XX XX' },       // Togo: 8 chiffres
  '+225': { length: 10, name: 'Côte d\'Ivoire', example: '07 XX XX XX XX' }, // CI: 10 chiffres
  '+221': { length: 9, name: 'Sénégal', example: '77 XXX XX XX' },   // Sénégal: 9 chiffres
  '+223': { length: 8, name: 'Mali', example: '76 XX XX XX' },       // Mali: 8 chiffres
  '+226': { length: 8, name: 'Burkina Faso', example: '70 XX XX XX' }, // Burkina: 8 chiffres
  '+227': { length: 8, name: 'Niger', example: '96 XX XX XX' },      // Niger: 8 chiffres
  '+224': { length: 9, name: 'Guinée', example: '622 XX XX XX' },    // Guinée: 9 chiffres
  '+237': { length: 9, name: 'Cameroun', example: '6 XX XX XX XX' }, // Cameroun: 9 chiffres
  '+241': { length: 8, name: 'Gabon', example: '07 XX XX XX' },      // Gabon: 8 chiffres (sans 0 parfois 7)
  '+242': { length: 9, name: 'Congo', example: '06 XXX XX XX' },     // Congo: 9 chiffres
  '+243': { length: 9, name: 'RD Congo', example: '99 XXX XX XX' },  // RDC: 9 chiffres
  '+233': { length: 9, name: 'Ghana', example: '24 XXX XXXX' },      // Ghana: 9 chiffres
  '+234': { length: 10, name: 'Nigeria', example: '803 XXX XXXX' },  // Nigeria: 10 chiffres
  '+212': { length: 9, name: 'Maroc', example: '6 XX XX XX XX' },    // Maroc: 9 chiffres
  '+213': { length: 9, name: 'Algérie', example: '5 XX XX XX XX' },  // Algérie: 9 chiffres
  '+216': { length: 8, name: 'Tunisie', example: '9X XXX XXX' },     // Tunisie: 8 chiffres
};

// Valider numéro WhatsApp avec règles strictes par pays
export const validateWhatsApp = (fullNumber, dialCode = null) => {
  // Nettoyer le numéro
  const cleaned = fullNumber.replace(/\D/g, '');
  
  // Si pas d'indicatif fourni, essayer de le détecter
  if (!dialCode) {
    for (const [dial, rules] of Object.entries(whatsappRules)) {
      const dialDigits = dial.replace('+', '');
      if (cleaned.startsWith(dialDigits)) {
        dialCode = dial;
        break;
      }
    }
  }
  
  // Si on a trouvé l'indicatif, valider avec les règles du pays
  if (dialCode && whatsappRules[dialCode]) {
    const dialDigits = dialCode.replace('+', '');
    const localNumber = cleaned.startsWith(dialDigits) 
      ? cleaned.slice(dialDigits.length) 
      : cleaned;
    
    // Supprimer le 0 initial si présent (certains pays)
    const localCleaned = localNumber.replace(/^0+/, '');
    
    const rule = whatsappRules[dialCode];
    return localCleaned.length === rule.length || localNumber.length === rule.length;
  }
  
  // Fallback: validation basique
  return cleaned.length >= 8 && cleaned.length <= 15;
};

// Obtenir l'erreur de validation WhatsApp
export const getWhatsAppValidationError = (number, dialCode) => {
  const rule = whatsappRules[dialCode];
  if (!rule) return null;
  
  const cleaned = number.replace(/\D/g, '').replace(/^0+/, '');
  
  if (cleaned.length < rule.length) {
    return `Le numéro doit avoir ${rule.length} chiffres pour ${rule.name} (ex: ${rule.example})`;
  }
  if (cleaned.length > rule.length) {
    return `Le numéro ne doit pas dépasser ${rule.length} chiffres pour ${rule.name}`;
  }
  return null;
};

// Normaliser un numéro WhatsApp pour la recherche
export const normalizeWhatsApp = (number) => {
  // Supprimer tout sauf les chiffres
  let cleaned = number.replace(/\D/g, '');
  
  // Si le numéro commence par 00, remplacer par rien (format international)
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }
  
  return cleaned;
};

// Chercher un numéro WhatsApp dans différents formats possibles
export const generateWhatsAppSearchPatterns = (input) => {
  const cleaned = input.replace(/\D/g, '');
  const patterns = [];
  
  // Format tel quel
  patterns.push(cleaned);
  
  // Avec + au début si pas déjà
  if (!cleaned.startsWith('+')) {
    patterns.push('+' + cleaned);
  }
  
  // Essayer avec indicatifs courants si numéro court (8-10 chiffres)
  if (cleaned.length >= 8 && cleaned.length <= 10) {
    // Ajouter les indicatifs les plus courants
    ['229', '228', '225', '221', '237', '234'].forEach(dial => {
      if (!cleaned.startsWith(dial)) {
        patterns.push('+' + dial + cleaned);
        patterns.push('+' + dial + cleaned.replace(/^0+/, '')); // Sans le 0 initial
      }
    });
  }
  
  // Supprimer le 0 initial
  if (cleaned.startsWith('0')) {
    patterns.push(cleaned.slice(1));
  }
  
  return [...new Set(patterns)]; // Supprimer doublons
};

// Formater numéro WhatsApp pour lien
export const formatWhatsAppLink = (number, message = '') => {
  const cleaned = number.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}${message ? `?text=${encoded}` : ''}`;
};

// Indicatifs téléphoniques pays africains
export const countryDialCodes = [
  { code: 'BJ', name: 'Bénin', dial: '+229', flag: '🇧🇯' },
  { code: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬' },
  { code: 'CI', name: 'Côte d\'Ivoire', dial: '+225', flag: '🇨🇮' },
  { code: 'SN', name: 'Sénégal', dial: '+221', flag: '🇸🇳' },
  { code: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', dial: '+226', flag: '🇧🇫' },
  { code: 'NE', name: 'Niger', dial: '+227', flag: '🇳🇪' },
  { code: 'GN', name: 'Guinée', dial: '+224', flag: '🇬🇳' },
  { code: 'CM', name: 'Cameroun', dial: '+237', flag: '🇨🇲' },
  { code: 'GA', name: 'Gabon', dial: '+241', flag: '🇬🇦' },
  { code: 'CG', name: 'Congo', dial: '+242', flag: '🇨🇬' },
  { code: 'CD', name: 'RD Congo', dial: '+243', flag: '🇨🇩' },
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'MA', name: 'Maroc', dial: '+212', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algérie', dial: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisie', dial: '+216', flag: '🇹🇳' },
];

// Détecter pays par géolocalisation (simplifié)
export const detectCountry = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code || 'BJ';
  } catch {
    return 'BJ'; // Défaut: Bénin
  }
};

// Calculs financiers commande
export const calculateOrder = ({
  quantite,
  prixUnitaire,
  tauxRemise, // Maintenant c'est le taux de frais de service
  bonusNiveau = 0,
  soldeCommission = 0,
  commissionAUtiliser = 0
}) => {
  // Valeur totale des tickets (pour info)
  const valeurTickets = quantite * prixUnitaire;
  
  // Le taux effectif = taux de frais de service (bonus niveau réduit les frais)
  const tauxEffectif = Math.max(0, tauxRemise - bonusNiveau);
  
  // Frais de service = valeur × taux
  const fraisService = Math.round(valeurTickets * tauxEffectif / 100);
  
  // Commission utilisable (ne peut pas dépasser les frais)
  const commissionUtilisee = Math.min(commissionAUtiliser, soldeCommission, fraisService);
  
  // Net à payer = frais - commission
  const netAPayer = Math.max(0, fraisService - commissionUtilisee);

  return {
    totalBrut: valeurTickets,     // Valeur des tickets (pour affichage)
    valeurTickets,                 // Alias
    tauxEffectif,                  // Taux de frais appliqué
    tauxFrais: tauxEffectif,       // Alias
    montantRemise: fraisService,   // Compatibilité ancien code
    fraisService,                  // Nouveau nom
    netAvantCommission: fraisService,
    commissionUtilisee,
    netAPayer
  };
};

// Obtenir le taux de frais effectif d'un promoteur
// Le bonus niveau RÉDUIT les frais (au lieu d'augmenter la remise)
export const getTauxEffectif = (promoteur, tauxGlobal) => {
  const tauxBase = promoteur?.taux_remise !== null && promoteur?.taux_remise !== undefined 
    ? parseFloat(promoteur.taux_remise) 
    : parseFloat(tauxGlobal);
  const bonusNiveau = getNiveauBonus(promoteur?.niveau);
  return {
    tauxBase,
    bonusNiveau,
    tauxEffectif: Math.max(0, tauxBase - bonusNiveau), // Frais réduits avec le niveau
    estPersonnalise: promoteur?.taux_remise !== null && promoteur?.taux_remise !== undefined
  };
};

// Bonus par niveau
export const getNiveauBonus = (niveau) => {
  switch (niveau) {
    case 'silver': return 2;
    case 'gold': return 5;
    default: return 0;
  }
};

// Infos niveau
export const getNiveauInfo = (niveau) => {
  switch (niveau) {
    case 'gold':
      return { label: 'Gold', icon: '🥇', color: 'text-yellow-500', bg: 'bg-yellow-500/10', bonus: '+5%' };
    case 'silver':
      return { label: 'Silver', icon: '🥈', color: 'text-gray-400', bg: 'bg-gray-400/10', bonus: '+2%' };
    default:
      return { label: 'Bronze', icon: '🥉', color: 'text-orange-600', bg: 'bg-orange-500/10', bonus: '' };
  }
};

// Statuts commande
export const statutColors = {
  en_attente: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'En attente' },
  validee: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Validée' },
  refusee: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Refusée' },
  annulee: { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'Annulée' }
};

// Générer QR Code URL (via API externe gratuite)
export const generateQRCodeURL = (data, size = 200) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
};

// Copier dans le presse-papier
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback pour vieux navigateurs
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
};

// Télécharger fichier
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Tronquer texte
export const truncate = (text, length = 50) => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Délai (pour animations)
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Debounce
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
