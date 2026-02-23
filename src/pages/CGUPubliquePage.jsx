import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, ArrowLeft, ScrollText } from 'lucide-react';
import { usePageSEO, SEO_CONFIGS } from '../hooks/usePageSEO';
import { useTheme } from '../hooks/useTheme';

// Config Supabase
const SB = 'https://dfflzuwyntrdfxujvsqr.supabase.co/rest/v1';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmZmx6dXd5bnRyZGZ4dWp2c3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNDE4NjMsImV4cCI6MjA4NDgxNzg2M30.tZgXgUUalq-5y7nh1fxA5mo5CsGJU2_8l_T-z1Cc-24';

export default function CGUPubliquePage() {
  usePageSEO(SEO_CONFIGS.cguPublique);
  const { isDark: d } = useTheme();
  const [cguContent, setCguContent] = useState('');
  const [cguVersion, setCguVersion] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCGU();
  }, []);

  const loadCGU = async () => {
    try {
      const res = await fetch(`${SB}/cgu_versions?actif=eq.true&select=*&limit=1`, {
        headers: {
          'apikey': SK,
          'Authorization': `Bearer ${SK}`
        }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        setCguContent(data[0].contenu);
        setCguVersion(data[0].version);
      } else {
        setCguContent(defaultCGU);
        setCguVersion('2.0');
      }
    } catch (e) {
      setCguContent(defaultCGU);
      setCguVersion('1.0');
    }
    setLoading(false);
  };

  // CGU par défaut si pas en base
  const defaultCGU = `# CONDITIONS GÉNÉRALES D'UTILISATION - GIGAZONE PROMOTEURS

**Dernière mise à jour : Février 2026**

## PRÉAMBULE

La société IFIAAS SARL, immatriculée au Registre du Commerce du Bénin, dont le siège social est situé à Cotonou, Bénin, exploite la plateforme GigaZone accessible à l'adresse z.ifiaas.com.

GigaZone est une solution technologique permettant aux promoteurs de créer et gérer des hotspots WiFi commerciaux de manière légale et rentable.

Les présentes Conditions Générales d'Utilisation (ci-après "CGU") définissent les modalités et conditions d'utilisation de la plateforme GigaZone par les promoteurs.

## 1. DÉFINITIONS

- **GigaZone** : La plateforme de gestion de hotspots WiFi exploitée par IFIAAS SARL
- **Promoteur** : Toute personne physique ou morale inscrite sur la plateforme pour exploiter un ou plusieurs hotspots WiFi
- **WifiZone** : Point d'accès WiFi commercial configuré avec le système GigaZone
- **Ticket WiFi** : Code d'accès unique permettant à un utilisateur final de se connecter à une WifiZone
- **Forfait** : Ensemble des caractéristiques d'un ticket (durée, volume de données, débit)
- **Frais de service** : Commission prélevée par GigaZone sur chaque demande de tickets
- **Filleul** : Promoteur inscrit via le code ou lien de parrainage d'un autre promoteur
- **Parrain** : Promoteur ayant parrainé un ou plusieurs filleuls

## 2. OBJET

Les présentes CGU ont pour objet de définir :
- Les conditions d'accès et d'utilisation de la plateforme GigaZone
- Les droits et obligations des promoteurs
- Les modalités de création et vente de tickets WiFi
- Le système de parrainage et de commissions
- Les conditions de suspension et résiliation

## 3. ACCEPTATION DES CGU

L'inscription sur la plateforme GigaZone implique l'acceptation pleine et entière des présentes CGU. Le promoteur reconnaît avoir pris connaissance de l'ensemble des dispositions et s'engage à les respecter.

GigaZone se réserve le droit de modifier les CGU à tout moment. Les promoteurs seront informés de toute modification et devront accepter les nouvelles conditions pour continuer à utiliser la plateforme.

## 4. CONDITIONS D'INSCRIPTION

### 4.1 Éligibilité
Pour devenir promoteur GigaZone, vous devez :
- Être une personne physique majeure (18 ans minimum) ou une personne morale légalement constituée
- Disposer d'une capacité juridique pour contracter
- Fournir des informations exactes et vérifiables
- Disposer d'un numéro WhatsApp actif pour les communications

### 4.2 Informations requises
Lors de l'inscription, le promoteur doit fournir :
- Nom complet (ou raison sociale pour une entreprise)
- Numéro de téléphone WhatsApp
- Localisation (ville, commune)
- Numéro NPI ou RAVIP (optionnel mais recommandé)

### 4.3 Code d'accès
Un code d'accès unique à 4 chiffres est attribué à chaque promoteur. Ce code est strictement personnel et confidentiel. Le promoteur est seul responsable de son utilisation et de sa protection.

## 5. AUTORISATION ARCEP

### 5.1 Obligation légale
Au Bénin, l'exploitation d'un hotspot WiFi commercial est soumise à autorisation de l'ARCEP (Autorité de Régulation des Communications Électroniques et de la Poste). Cette autorisation est OBLIGATOIRE avant toute mise en service.

### 5.2 Accompagnement GigaZone
GigaZone accompagne ses promoteurs dans l'obtention de l'autorisation ARCEP :
- Aide à la constitution du dossier
- Conseils sur les documents requis
- Suivi de la procédure

### 5.3 Responsabilité
Le promoteur reste seul responsable de l'obtention et du maintien de son autorisation ARCEP. GigaZone ne saurait être tenu responsable en cas d'exploitation sans autorisation valide.

## 6. MATÉRIEL ET INSTALLATION

### 6.1 Matériel requis
Pour exploiter une WifiZone, le promoteur doit disposer :
- D'un routeur classique recommandé par GigaZone
- D'une connexion internet (fibre, MTN, Moov, Celtiis ou autre FAI)
- Optionnellement, d'une antenne WiFi externe pour étendre la couverture

### 6.2 Installation
L'installation et la configuration du système GigaZone sont effectuées GRATUITEMENT par nos techniciens. Cette installation comprend :
- Configuration du routeur
- Intégration du système VPN GigaZone
- Test et mise en service
- Formation de base sur l'utilisation de la plateforme

### 6.3 Maintenance
La maintenance technique du système est assurée par GigaZone. Le promoteur s'engage à signaler tout dysfonctionnement via les canaux de support.

## 7. DEMANDES DE TICKETS ET PAIEMENTS

### 7.1 Procédure de commande
Pour obtenir des tickets WiFi, le promoteur doit :
- Se connecter à son espace sur la plateforme
- Sélectionner le forfait souhaité
- Indiquer la quantité de tickets
- Procéder au paiement des frais de service

### 7.2 Forfaits disponibles
Les forfaits proposés incluent notamment :

⚡ Ultra Rapide (50 Mbps) :
- 1 Heure Illimité (100 FCFA)
- 3 Heures Illimité (200 FCFA)
- 5 Heures Illimité (300 FCFA)
- 8 Heures Illimité (500 FCFA)

🌐 Navigation (5 Mbps) :
- 12 Heures Illimité (100 FCFA)
- 18 Heures Illimité (150 FCFA)
- 1 Jour Illimité (200 FCFA)
- 3 Jours Illimité (500 FCFA)
- 7 Jours Illimité (900 FCFA)
- 30 Jours Illimité (3 000 FCFA)

Les forfaits et leurs tarifs peuvent être modifiés par GigaZone à tout moment.

### 7.3 Modes de paiement
Le paiement des frais de service s'effectue exclusivement par Mobile Money :
- MTN Mobile Money
- Moov Money

### 7.4 Preuve de paiement
Une preuve de paiement (capture d'écran ou photo du reçu) doit être uploadée sur la plateforme. Toute preuve falsifiée entraînera la suspension immédiate du compte.

### 7.5 Validation et livraison
Après validation par l'administrateur, les tickets sont générés sous forme de fichier PDF téléchargeable depuis l'espace promoteur.

## 8. TARIFICATION ET FRAIS

### 8.1 Frais de service
Des frais de service sont appliqués sur chaque demande de tickets. Ces frais constituent la rémunération de GigaZone pour :
- L'utilisation de la plateforme
- La génération des tickets
- L'infrastructure technique
- Le support

### 8.2 Niveaux promoteur
Le taux de frais varie selon le niveau du promoteur :
- **Bronze** (0-50 demandes) : Frais de base
- **Silver** (51-200 demandes) : -2% sur les frais
- **Gold** (201+ demandes) : -5% sur les frais

### 8.3 Liberté tarifaire
Le promoteur est libre de fixer ses propres prix de vente auprès de ses clients. GigaZone n'impose aucun prix de revente. Le promoteur conserve 100% de la marge qu'il réalise.

## 9. SYSTÈME DE PARRAINAGE

### 9.1 Code et lien de parrainage
Chaque promoteur dispose d'un code et d'un lien de parrainage unique qu'il peut partager pour inviter de nouveaux promoteurs.

### 9.2 Commissions
Lorsqu'un filleul effectue une demande de tickets, le parrain reçoit une commission sur les frais de service payés par le filleul. Le taux de commission est défini par GigaZone.

### 9.3 Utilisation des commissions
Les commissions accumulées peuvent être utilisées pour :
- Réduire les frais de service lors des prochaines demandes
- Tout autre usage défini par GigaZone

### 9.4 Conditions
- Le parrainage est limité au premier niveau (relation directe parrain-filleul)
- Les commissions sont calculées automatiquement par le système
- GigaZone se réserve le droit de modifier le taux de commission

## 10. OBLIGATIONS DU PROMOTEUR

### 10.1 Engagements généraux
Le promoteur s'engage à :
- Fournir des informations exactes et à jour
- Respecter la réglementation en vigueur (notamment l'autorisation ARCEP)
- Utiliser la plateforme de manière loyale et légale
- Ne pas tenter de contourner les systèmes de sécurité
- Signaler tout problème ou anomalie

### 10.2 Confidentialité
Le promoteur s'engage à :
- Garder son code d'accès strictement confidentiel
- Ne pas le partager avec des tiers
- Informer GigaZone en cas de perte ou de compromission

### 10.3 Usage des tickets
Le promoteur s'engage à :
- Revendre les tickets exclusivement à des utilisateurs finaux
- Ne pas utiliser les tickets à des fins frauduleuses
- Respecter les conditions d'utilisation associées à chaque forfait

## 11. RESPONSABILITÉ

### 11.1 Responsabilité de GigaZone
GigaZone s'engage à :
- Assurer le bon fonctionnement de la plateforme
- Traiter les demandes dans les meilleurs délais
- Fournir un support technique réactif

GigaZone ne saurait être tenu responsable :
- Des interruptions de service indépendantes de sa volonté
- De l'utilisation frauduleuse du compte par un tiers
- Des dommages indirects subis par le promoteur

### 11.2 Responsabilité du promoteur
Le promoteur est seul responsable :
- De son activité commerciale
- Du respect de la réglementation applicable
- De ses relations avec ses clients
- De la sécurité de son code d'accès

## 12. SUSPENSION ET RÉSILIATION

### 12.1 Suspension par GigaZone
GigaZone peut suspendre immédiatement un compte en cas de :
- Fraude ou tentative de fraude
- Upload de preuves de paiement falsifiées
- Non-respect des présentes CGU
- Activité suspecte ou anormale
- Demande des autorités compétentes

### 12.2 Résiliation par le promoteur
Le promoteur peut demander la résiliation de son compte à tout moment en contactant le support. Les commissions non utilisées seront perdues.

### 12.3 Conséquences
En cas de suspension ou résiliation :
- L'accès au compte est immédiatement bloqué
- Les demandes en cours peuvent être annulées
- Les commissions accumulées peuvent être perdues

## 13. PROPRIÉTÉ INTELLECTUELLE

### 13.1 Droits de GigaZone
La plateforme GigaZone, son design, son logo, ses fonctionnalités et contenus sont la propriété exclusive d'IFIAAS SARL. Toute reproduction, modification ou utilisation non autorisée est interdite.

### 13.2 Licence d'utilisation
GigaZone accorde au promoteur une licence d'utilisation limitée, non exclusive et non transférable de la plateforme pour les seuls besoins de son activité de promoteur.

## 14. DONNÉES PERSONNELLES

### 14.1 Collecte et traitement
GigaZone collecte et traite les données personnelles des promoteurs conformément à sa Politique de Confidentialité et à la réglementation applicable.

### 14.2 Finalités
Les données sont utilisées pour :
- La gestion des comptes promoteurs
- Le traitement des demandes de tickets
- La communication (notifications, support)
- L'amélioration des services

### 14.3 Droits des promoteurs
Les promoteurs disposent d'un droit d'accès, de rectification et de suppression de leurs données en contactant le support.

## 15. SUPPORT ET CONTACT

### 15.1 Canaux de support
Le support GigaZone est disponible via :
- WhatsApp : +229 01 67 45 54 62
- Email : contact@ifiaas.com
- Chat intégré sur la plateforme

### 15.2 Horaires
Le support répond généralement dans un délai de 2 heures pendant les heures ouvrables.

## 16. LOI APPLICABLE ET LITIGES

### 16.1 Droit applicable
Les présentes CGU sont régies par le droit béninois.

### 16.2 Règlement des litiges
En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, le litige sera soumis aux tribunaux compétents de Cotonou, Bénin.

## 17. DISPOSITIONS DIVERSES

### 17.1 Intégralité
Les présentes CGU constituent l'intégralité de l'accord entre GigaZone et le promoteur.

### 17.2 Nullité partielle
Si une disposition des CGU est déclarée nulle, les autres dispositions restent en vigueur.

### 17.3 Renonciation
Le fait de ne pas exercer un droit prévu par les CGU ne constitue pas une renonciation à ce droit.

---

**IFIAAS SARL**
Cotonou, Bénin
contact@ifiaas.com | +229 01 67 45 54 62

*En utilisant la plateforme GigaZone, vous reconnaissez avoir lu, compris et accepté les présentes Conditions Générales d'Utilisation.*`;

  // Render markdown simple
  const renderContent = (content) => {
    const strong = d ? 'text-white' : 'text-gray-900';
    const heading = d ? 'text-white' : 'text-gray-900';
    return content.split('\n').map((line, idx) => {
      // Titres
      if (line.startsWith('# ')) {
        return <h1 key={idx} className={`text-2xl font-bold ${heading} mt-8 mb-4`}>{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-xl font-semibold text-pink-400 mt-6 mb-3">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-lg font-semibold text-purple-400 mt-5 mb-2">{line.replace('### ', '')}</h3>;
      }
      // Listes
      if (line.startsWith('- ')) {
        const content = line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, `<strong class="${strong}">$1</strong>`);
        return <li key={idx} className="ml-4 mb-1" dangerouslySetInnerHTML={{ __html: content }} />;
      }
      // Texte en gras seul sur une ligne
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={idx} className={`font-semibold ${heading} mt-4 mb-2`}>{line.replace(/\*\*/g, '')}</p>;
      }
      // Texte italique seul
      if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
        return <p key={idx} className={`italic ${d ? 'text-gray-500' : 'text-gray-400'} mt-6`}>{line.replace(/\*/g, '')}</p>;
      }
      // Ligne de séparation
      if (line.startsWith('---')) {
        return <hr key={idx} className={`${d ? 'border-gray-700' : 'border-gray-200'} my-6`} />;
      }
      // Ligne vide
      if (line.trim() === '') {
        return <br key={idx} />;
      }
      // Paragraphe normal avec support du gras inline
      const processedContent = line.replace(/\*\*(.*?)\*\*/g, `<strong class="${strong}">$1</strong>`);
      return <p key={idx} className="mb-2" dangerouslySetInnerHTML={{ __html: processedContent }} />;
    });
  };

  return (
    <div className={`min-h-screen ${d ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`border-b ${d ? 'border-gray-800' : 'border-gray-200'} p-4`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}>GigaZone</span>
          </Link>
          <Link to="/" className={`flex items-center gap-2 ${d ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition`}>
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
            <ScrollText className="w-7 h-7 text-pink-400" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}>Conditions Générales d'Utilisation</h1>
            <p className={d ? 'text-gray-400' : 'text-gray-500'}>Version {cguVersion}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className={`${d ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'} border rounded-2xl p-8`}>
            <div className={`${d ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
              {renderContent(cguContent)}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className={`${d ? 'text-gray-400' : 'text-gray-500'} mb-4`}>Vous souhaitez devenir promoteur GigaZone ?</p>
          <Link 
            to="/inscription"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #EC4899, #9333EA)' }}
          >
            S'inscrire maintenant
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t ${d ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'} p-6 text-center text-sm">
        © 2026 GigaZone - IFIAAS SARL. Tous droits réservés.
      </footer>
    </div>
  );
}
