-- =====================================================
-- GIGAZONE - MISE À JOUR FAQs SUPABASE
-- Exécuter dans : Supabase > SQL Editor
-- =====================================================

-- 1. D'abord, désactiver toutes les FAQs actuelles
UPDATE faq SET actif = false;

-- 2. Insérer les nouvelles FAQs (les 7 manquantes + mettre à jour l'ordre)
-- Réordonnées pour un parcours de conversion optimal :
-- D'abord comprendre → puis budget → puis légalité → puis technique → puis utilisation

-- === BLOC 1 : Comprendre GigaZone (conversion) ===

INSERT INTO faq (question, reponse, ordre, actif) VALUES
(
  'C''est quoi GigaZone exactement ?',
  'GigaZone est un service de tarification et création de tickets WiFi. Grâce à notre système de VPN intégré, GigaZone transforme un routeur normal en point d''accès WiFi rentable et professionnel. Notre solution vous permet de lancer votre propre business de WiFi avec un budget minimum, tout en restant 100% légal en République du Bénin grâce à l''autorisation de l''ARCEP.',
  1, true
),
(
  'Combien faut-il pour démarrer ?',
  'Vous pouvez lancer votre WifiZone avec moins de 50 000 FCFA ! Ce budget comprend votre routeur et la configuration initiale. L''installation par nos techniciens est 100% gratuite.',
  2, true
),
(
  'Est-ce légal ?',
  'Oui, 100% légal ! Pour exercer légalement, vous devez obtenir une autorisation auprès de l''ARCEP (Autorité de Régulation des Communications Électroniques et de la Poste). GigaZone vous accompagne dans cette démarche.',
  3, true
),
(
  'Comment obtenir l''autorisation ARCEP ?',
  'L''autorisation ARCEP est obligatoire pour exploiter légalement une WifiZone au Bénin. Notre équipe vous accompagne dans toutes les démarches : constitution du dossier, dépôt auprès de l''ARCEP et suivi jusqu''à l''obtention de votre autorisation. Contactez-nous pour démarrer la procédure !',
  4, true
),
(
  'De quel matériel ai-je besoin pour commencer ?',
  'Pour lancer votre WifiZone, vous avez besoin de : 1) Routeur classique recommandé par GigaZone (obligatoire), 2) Connexion internet (fibre, MTN, Moov, Celtiis), 3) Antenne WiFi externe (facultatif). Le tout pour moins de 50 000 FCFA !',
  5, true
),
(
  'Y a-t-il des frais cachés ?',
  'Aucun frais caché ! Zéro frais d''installation, zéro frais de maintenance. Vous payez uniquement les frais de service GigaZone lors de la création de vos tickets.',
  6, true
);

-- === BLOC 2 : Comment ça marche (utilisation) ===

INSERT INTO faq (question, reponse, ordre, actif) VALUES
(
  'Comment devenir promoteur ?',
  'Pour devenir promoteur GigaZone, inscrivez-vous gratuitement sur notre plateforme en renseignant vos informations personnelles et votre numéro WhatsApp. Après validation de votre compte, vous aurez accès à votre espace promoteur pour commander des tickets WiFi.',
  7, true
),
(
  'Quelles sont les étapes pour commencer ?',
  '1) Obtenez votre autorisation ARCEP, 2) Nos techniciens installent votre routeur gratuitement, 3) Intégration du système GigaZone sur votre routeur, 4) Inscrivez-vous sur la plateforme, 5) Créez vos tickets, 6) Vendez et encaissez 100% !',
  8, true
),
(
  'Comment fonctionne la tarification ?',
  'Vous créez vos tickets via notre plateforme et vous les vendez à vos clients au prix que vous souhaitez. GigaZone prélève uniquement des frais de service sur chaque demande de tickets. Vous gardez le contrôle total de votre business et 100% de vos ventes.',
  9, true
),

(
  'Comment passer une commande ?',
  'Depuis votre espace promoteur, cliquez sur "Nouvelle commande", choisissez le forfait souhaité (1h, 24h, 7 jours...), indiquez la quantité de tickets et effectuez le paiement. Vos tickets seront générés après validation.',
  10, true
),
(
  'Comment sont livrés les tickets WiFi ?',
  'Après validation de votre demande, vous recevez vos tickets sous forme de fichier PDF téléchargeable depuis votre espace promoteur. Chaque ticket contient un code unique que vos clients utilisent pour se connecter.',
  11, true
),
(
  'Quand reçois-je mes tickets ?',
  'Les tickets sont générés rapidement après validation de votre paiement par notre équipe. Le délai moyen est de quelques heures. Vous recevez une notification dès que vos tickets sont prêts à télécharger.',
  12, true
);

-- === BLOC 3 : Parrainage & commissions ===

INSERT INTO faq (question, reponse, ordre, actif) VALUES
(
  'Comment fonctionne le parrainage ?',
  'Partagez votre code ou votre lien de parrainage unique. Quand un filleul s''inscrit via votre lien (ou avec votre code) et fait des demandes de tickets, vous recevez automatiquement une commission sur chacune de ses commandes. Ces commissions sont utilisables pour réduire vos futurs frais de service.',
  13, true
),
(
  'Comment utiliser mes commissions ?',
  'Vos commissions de parrainage sont créditées automatiquement sur votre solde. Lors de votre prochaine commande, le montant est déduit de vos frais de service. Vous pouvez suivre votre solde de commissions depuis votre tableau de bord.',
  14, true
);

-- === BLOC 4 : Support & récupération ===

INSERT INTO faq (question, reponse, ordre, actif) VALUES
(
  'Comment récupérer mon code d''accès ?',
  'Si vous avez perdu votre code d''accès promoteur, rendez-vous sur la page de connexion et cliquez sur "Code oublié ?". Vous recevrez un lien de réinitialisation par WhatsApp.',
  15, true
),
(
  'Quelle est votre zone de couverture ?',
  'GigaZone couvre toute l''Afrique, avec une présence particulièrement forte au Bénin où nos techniciens peuvent se déplacer pour l''installation. Si vous êtes dans un autre pays africain, contactez-nous pour organiser votre démarrage !',
  16, true
),
(
  'Comment contacter le support ?',
  'Notre équipe est disponible via WhatsApp au +229 01 67 45 54 62, par email à contact@ifiaas.com, ou directement via le chat intégré sur la plateforme. Nous répondons généralement en moins de 2 heures.',
  17, true
);

-- 3. Supprimer les anciennes FAQs désactivées (optionnel)
-- DELETE FROM faq WHERE actif = false;

-- 4. Vérification
SELECT ordre, question, actif FROM faq WHERE actif = true ORDER BY ordre;

-- =====================================================
-- MIGRATION: Ajouter type 'demande_reinitialisation'
-- à la table notifications_admin
-- =====================================================

-- Supprimer l'ancienne contrainte CHECK
ALTER TABLE notifications_admin DROP CONSTRAINT IF EXISTS notifications_admin_type_check;

-- Recréer avec le nouveau type
ALTER TABLE notifications_admin ADD CONSTRAINT notifications_admin_type_check 
  CHECK (type IN (
    'nouvelle_commande',
    'nouveau_promoteur', 
    'preuve_uploadee',
    'message_promoteur',
    'demande_retrait',
    'demande_reinitialisation'
  ));


-- =====================================================
-- MIGRATION: Ajouter 'demande_reinitialisation' au type
-- =====================================================
-- Exécuter AUSSI ce SQL si la table notifications_admin existe déjà :

ALTER TABLE notifications_admin 
DROP CONSTRAINT IF EXISTS notifications_admin_type_check;

ALTER TABLE notifications_admin 
ADD CONSTRAINT notifications_admin_type_check 
CHECK (type IN (
    'nouvelle_commande',
    'nouveau_promoteur', 
    'preuve_uploadee',
    'message_promoteur',
    'demande_retrait',
    'demande_reinitialisation'
));
