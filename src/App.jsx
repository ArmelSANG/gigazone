import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './components/common/Toast'
import PWAInstallPrompt from './components/PWAInstallPrompt'

// Pages existantes
import AdminDashboard from './pages/AdminDashboard'
import PublicCheck from './pages/PublicCheck'

// Nouvelles pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import InscriptionPage from './pages/InscriptionPage'
import CGUPage from './pages/CGUPage'
import OnboardingPage from './pages/OnboardingPage'
import PromoteurDashboard from './pages/PromoteurDashboard'
import NouvelleCommandePage from './pages/NouvelleCommandePage'

// Pages légales
import CGUPubliquePage from './pages/CGUPubliquePage'
import PolitiquePage from './pages/PolitiquePage'
import MentionsPage from './pages/MentionsPage'
import ResetCodePage from './pages/ResetCodePage'

// Route protégée Admin
const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  
  return isAdmin ? children : <Navigate to="/login" replace />
}

// Route protégée Promoteur
const PromoteurRoute = ({ children }) => {
  const { promoteur, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  
  if (!promoteur) {
    return <Navigate to="/login" replace />
  }
  
  // Rediriger vers CGU si pas accepté
  if (!promoteur.cgu_accepte) {
    return <Navigate to="/cgu" replace />
  }
  
  // Rediriger vers onboarding si pas terminé
  if (!promoteur.onboarding_complete) {
    return <Navigate to="/onboarding" replace />
  }
  
  return children
}

// Route CGU (nécessite connexion mais pas CGU accepté)
const CGURoute = ({ children }) => {
  const { promoteur, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  
  if (!promoteur) {
    return <Navigate to="/login" replace />
  }
  
  if (promoteur.cgu_accepte) {
    return <Navigate to="/promoteur" replace />
  }
  
  return children
}

// Route Onboarding (nécessite CGU accepté mais onboarding pas terminé)
const OnboardingRoute = ({ children }) => {
  const { promoteur, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  
  if (!promoteur) {
    return <Navigate to="/login" replace />
  }
  
  if (!promoteur.cgu_accepte) {
    return <Navigate to="/cgu" replace />
  }
  
  if (promoteur.onboarding_complete) {
    return <Navigate to="/promoteur" replace />
  }
  
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Pages publiques */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/inscription" element={<InscriptionPage />} />
      
      {/* Page publique de vérification de code WiFi */}
      <Route path="/check" element={<PublicCheck />} />
      <Route path="/verifier" element={<PublicCheck />} />
      
      {/* Page de réinitialisation de code promoteur */}
      <Route path="/reset/:token" element={<ResetCodePage />} />
      
      {/* CGU - accessible si connecté mais CGU pas accepté */}
      <Route path="/cgu" element={<CGURoute><CGUPage /></CGURoute>} />
      
      {/* Onboarding - après CGU, avant dashboard */}
      <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />
      
      {/* Dashboard Promoteur (protégé) */}
      <Route path="/promoteur" element={<PromoteurRoute><PromoteurDashboard /></PromoteurRoute>} />
      <Route path="/promoteur/nouvelle-commande" element={<PromoteurRoute><NouvelleCommandePage /></PromoteurRoute>} />
      
      {/* Dashboard Admin (gère son propre login interne) */}
      <Route path="/admin" element={<AdminDashboard />} />
      
      {/* Pages légales (publiques) */}
      <Route path="/cgu-publique" element={<CGUPubliquePage />} />
      <Route path="/politique" element={<PolitiquePage />} />
      <Route path="/mentions" element={<MentionsPage />} />
      
      {/* Anciennes routes - redirections */}
      <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
      
      {/* Redirection pour routes inconnues */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
        <PWAInstallPrompt />
      </ToastProvider>
    </AuthProvider>
  )
}
