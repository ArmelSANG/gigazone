import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseGet, supabasePatch } from '../config/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Helper: lire depuis localStorage OU sessionStorage (migration)
const getStoredValue = (key) => {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

// Helper: sauvegarder dans localStorage (+ cleanup sessionStorage)
const setStoredValue = (key, value) => {
  localStorage.setItem(key, value);
  sessionStorage.removeItem(key); // cleanup ancien format
};

// Helper: supprimer des deux storages
const removeStoredValue = (key) => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

export const AuthProvider = ({ children }) => {
  const [promoteur, setPromoteur] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin hash (SHA-256 de "gigazone2024")
  const ADMIN_HASH = 'e9a76a89516e3c0cd657b9ece6dd180e89b4c782f42905b6fe892840f49969a3';

  // Vérifier session au chargement
  useEffect(() => {
    const checkSession = async () => {
      // Vérifier admin
      if (getStoredValue('gz_admin') === 'ok') {
        setStoredValue('gz_admin', 'ok'); // migrer vers localStorage
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Vérifier promoteur
      const savedCode = getStoredValue('gz_promoteur_code');
      if (savedCode) {
        setStoredValue('gz_promoteur_code', savedCode); // migrer vers localStorage

        try {
          const data = await supabaseGet(`promoteurs?code_unique=eq.${savedCode}&select=*`);
          
          if (data && data.length > 0 && data[0].actif) {
            setPromoteur(data[0]);
            // Mettre à jour last_login (non bloquant)
            supabasePatch(`promoteurs?id=eq.${data[0].id}`, { last_login: new Date().toISOString() }).catch(() => {});
          } else if (data && data.length === 0) {
            // Code invalide (supprimé de la base) → déconnecter
            removeStoredValue('gz_promoteur_code');
          } else if (data && data.length > 0 && !data[0].actif) {
            // Compte désactivé → déconnecter
            removeStoredValue('gz_promoteur_code');
          }
          // Si data est null (erreur réseau), on ne supprime PAS le code
        } catch (err) {
          console.warn('Erreur vérification session, on garde la session:', err);
          // Ne PAS supprimer le code en cas d erreur réseau
        }
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  // Login promoteur avec code unique
  const loginPromoteur = async (code) => {
    const cleanCode = code.trim().toUpperCase();
    const data = await supabaseGet(`promoteurs?code_unique=eq.${cleanCode}&select=*`);
    
    if (!data || data.length === 0) {
      return { success: false, error: 'Code invalide' };
    }
    
    const prom = data[0];
    
    if (!prom.actif) {
      return { success: false, error: 'Compte suspendu. Contactez le support.' };
    }
    
    if (!prom.cgu_accepte) {
      setStoredValue('gz_promoteur_code', cleanCode);
      setPromoteur(prom);
      return { success: true, needsCGU: true };
    }
    
    // Mettre à jour last_login
    await supabasePatch(`promoteurs?id=eq.${prom.id}`, { last_login: new Date().toISOString() });
    
    setStoredValue('gz_promoteur_code', cleanCode);
    setPromoteur(prom);
    return { success: true };
  };

  // Login admin avec mot de passe
  const loginAdmin = async (password) => {
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (hash === ADMIN_HASH) {
      setStoredValue('gz_admin', 'ok');
      setIsAdmin(true);
      return { success: true };
    }
    return { success: false, error: 'Mot de passe incorrect' };
  };

  // Logout
  const logout = () => {
    removeStoredValue('gz_promoteur_code');
    removeStoredValue('gz_admin');
    setPromoteur(null);
    setIsAdmin(false);
  };

  // Accepter CGU
  const acceptCGU = async (version) => {
    if (!promoteur) return false;
    
    const result = await supabasePatch(`promoteurs?id=eq.${promoteur.id}`, {
      cgu_accepte: true,
      cgu_version: version,
      cgu_accepte_at: new Date().toISOString()
    });
    
    if (result) {
      setPromoteur({ ...promoteur, cgu_accepte: true, cgu_version: version });
      return true;
    }
    return false;
  };

  // Refresh promoteur data
  const refreshPromoteur = async () => {
    if (!promoteur) return;
    const data = await supabaseGet(`promoteurs?id=eq.${promoteur.id}&select=*`);
    if (data && data.length > 0) {
      setPromoteur(data[0]);
    }
  };

  const value = {
    promoteur,
    isAdmin,
    loading,
    isAuthenticated: !!promoteur || isAdmin,
    loginPromoteur,
    loginAdmin,
    logout,
    acceptCGU,
    refreshPromoteur
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
