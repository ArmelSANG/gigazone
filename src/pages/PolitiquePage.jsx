import React from 'react';
import { Link } from 'react-router-dom';
import { Wifi, ArrowLeft, Shield } from 'lucide-react';
import { usePageSEO, SEO_CONFIGS } from '../hooks/usePageSEO';
import { useTheme } from '../hooks/useTheme';

export default function PolitiquePage() {
  usePageSEO(SEO_CONFIGS.politique);
  const { isDark: d } = useTheme();
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
            <Shield className="w-7 h-7 text-pink-400" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}>Politique de confidentialité</h1>
            <p className={d ? 'text-gray-400' : 'text-gray-500'}>Dernière mise à jour : Février 2026</p>
          </div>
        </div>

        <div className={`prose ${d ? 'prose-invert' : ''} max-w-none`}>
          <div className={`space-y-8 ${d ? 'text-gray-300' : 'text-gray-700'}`}>
            
            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>1. Introduction</h2>
              <p>
                GigaZone, opéré par IFIAAS SARL, s'engage à protéger la vie privée de ses utilisateurs. 
                Cette politique de confidentialité décrit comment nous collectons, utilisons et protégeons 
                vos données personnelles lorsque vous utilisez notre plateforme de vente de tickets WiFi.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>2. Données collectées</h2>
              <p>Nous collectons les données suivantes :</p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li><strong>Données d'identification :</strong> Nom complet, numéro WhatsApp</li>
                <li><strong>Données de localisation :</strong> Pays, ville, quartier</li>
                <li><strong>Données de transaction :</strong> Historique des commandes, preuves de paiement</li>
                <li><strong>Données techniques :</strong> Adresse IP, type d'appareil, navigateur</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>3. Utilisation des données</h2>
              <p>Vos données sont utilisées pour :</p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li>Gérer votre compte promoteur et vos commandes</li>
                <li>Calculer vos commissions et bénéfices</li>
                <li>Vous contacter via WhatsApp pour le support</li>
                <li>Améliorer nos services et votre expérience</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>4. Partage des données</h2>
              <p>
                Nous ne vendons jamais vos données personnelles. Elles peuvent être partagées avec :
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li>Nos prestataires techniques (hébergement, paiement)</li>
                <li>Les autorités si requis par la loi</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>5. Sécurité</h2>
              <p>
                Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données :
                chiffrement SSL, accès restreint, sauvegardes régulières. Cependant, aucune transmission 
                sur Internet n'est totalement sécurisée.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>6. Vos droits</h2>
              <p>Vous avez le droit de :</p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li>Accéder à vos données personnelles</li>
                <li>Rectifier vos données inexactes</li>
                <li>Supprimer votre compte et vos données</li>
                <li>Vous opposer au traitement de vos données</li>
              </ul>
              <p className="mt-3">
                Pour exercer ces droits, contactez-nous à <a href="mailto:contact@ifiaas.com" className="text-pink-400 hover:underline">contact@ifiaas.com</a>
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>7. Cookies</h2>
              <p>
                Notre plateforme utilise des cookies techniques essentiels au fonctionnement du service. 
                Nous n'utilisons pas de cookies publicitaires ou de tracking tiers.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>8. Contact</h2>
              <p>
                Pour toute question concernant cette politique :<br />
                <strong>Email :</strong> <a href="mailto:contact@ifiaas.com" className="text-pink-400 hover:underline">contact@ifiaas.com</a><br />
                <strong>WhatsApp :</strong> <a href="https://wa.me/2290167455462" className="text-pink-400 hover:underline">+229 01 67 45 54 62</a><br />
                <strong>Adresse :</strong> Zinvié, Bénin
              </p>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t ${d ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'} p-6 text-center text-sm`}>
        © 2026 GigaZone - IFIAAS SARL. Tous droits réservés.
      </footer>
    </div>
  );
}
