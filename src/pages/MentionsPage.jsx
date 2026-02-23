import React from 'react';
import { Link } from 'react-router-dom';
import { Wifi, ArrowLeft, FileText } from 'lucide-react';
import { usePageSEO, SEO_CONFIGS } from '../hooks/usePageSEO';
import { useTheme } from '../hooks/useTheme';

export default function MentionsPage() {
  usePageSEO(SEO_CONFIGS.mentions);
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
            <FileText className="w-7 h-7 text-pink-400" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}>Mentions légales</h1>
            <p className={d ? 'text-gray-400' : 'text-gray-500'}>Informations légales sur GigaZone</p>
          </div>
        </div>

        <div className={`prose ${d ? 'prose-invert' : ''} max-w-none`}>
          <div className={`space-y-8 ${d ? 'text-gray-300' : 'text-gray-700'}`}>
            
            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>1. Éditeur du site</h2>
              <div className={`${d ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100 border-gray-200'} rounded-xl p-5 border`}>
                <p><strong>Raison sociale :</strong> IFIAAS SARL</p>
                <p><strong>Nom commercial :</strong> GigaZone</p>
                <p><strong>Siège social :</strong> Zinvié, Bénin</p>
                <p><strong>Email :</strong> <a href="mailto:contact@ifiaas.com" className="text-pink-400 hover:underline">contact@ifiaas.com</a></p>
                <p><strong>Téléphone :</strong> <a href="tel:+2290167455462" className="text-pink-400 hover:underline">+229 01 67 45 54 62</a></p>
              </div>
            </section>

            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>2. Directeur de la publication</h2>
              <p>Le directeur de la publication est le représentant légal de IFIAAS SARL.</p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>3. Hébergement</h2>
              <div className={`${d ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100 border-gray-200'} rounded-xl p-5 border`}>
                <p><strong>Hébergeur :</strong> Vercel Inc.</p>
                <p><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
                <p><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" className="text-pink-400 hover:underline">vercel.com</a></p>
              </div>
            </section>

            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>4. Propriété intellectuelle</h2>
              <p>
                L'ensemble du contenu de ce site (textes, images, logos, icônes, etc.) est la propriété 
                exclusive de IFIAAS SARL ou de ses partenaires. Toute reproduction, même partielle, 
                est interdite sans autorisation préalable écrite.
              </p>
              <p className="mt-3">
                La marque "GigaZone" et le logo associé sont des marques déposées par IFIAAS SARL.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>5. Activité</h2>
              <p>
                GigaZone est une plateforme de vente en gros de tickets d'accès WiFi destinée aux 
                promoteurs et revendeurs. La plateforme permet aux promoteurs enregistrés d'acheter 
                des tickets à prix réduit pour les revendre au prix public.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>6. Données personnelles</h2>
              <p>
                Conformément à la réglementation en vigueur, vous disposez d'un droit d'accès, 
                de rectification et de suppression de vos données personnelles. Pour plus 
                d'informations, consultez notre <Link to="/politique" className="text-pink-400 hover:underline">Politique de confidentialité</Link>.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>7. Cookies</h2>
              <p>
                Ce site utilise des cookies techniques nécessaires à son bon fonctionnement. 
                Pour plus d'informations, consultez notre <Link to="/politique" className="text-pink-400 hover:underline">Politique de confidentialité</Link>.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>8. Droit applicable</h2>
              <p>
                Le présent site et ses mentions légales sont régis par le droit béninois. 
                En cas de litige, et après échec de toute tentative de recherche d'une solution 
                amiable, les tribunaux béninois seront seuls compétents.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>9. Contact</h2>
              <p>
                Pour toute question ou réclamation :<br />
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
