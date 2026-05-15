// Configuration du routeur principal — React Router v6
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Pages
import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import Events         from './pages/Events';
import EventDetail    from './pages/EventDetail';
import Tickets        from './pages/Tickets';
import LiveTracker    from './pages/LiveTracker';
import Users          from './pages/Users';
import Settings       from './pages/Settings';
import Report         from './pages/Report';
import OwnerDashboard from './pages/OwnerDashboard';
// import MigrateUsers from './pages/MigrateUsers';

// Layout protégé
import Layout from './components/layout/Layout';

// Composant de route protégée — redirige vers /login si non authentifié
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Affichage d'un écran de chargement pendant la vérification de l'auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
        <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route publique */}
        <Route path="/login" element={<Login />} />

        {/* Routes protégées — enveloppées dans le Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Route index qui redirige selon le rôle (géré par Layout.jsx) */}
          <Route index element={<Dashboard />} />
          <Route path="dashboard"       element={<Dashboard />} />
          <Route path="events"          element={<Events />} />
          <Route path="events/:id"      element={<EventDetail />} />
          <Route path="tickets"         element={<Tickets />} />
          <Route path="live-tracker"    element={<LiveTracker />} />
          <Route path="users"           element={<Users />} />
          <Route path="settings"        element={<Settings />} />
          <Route path="report"          element={<Report />} />
          {/* <Route path="migrate-users" element={<MigrateUsers />} /> */}
        </Route>

        {/* Route propriétaire standalone (sans Layout/Sidebar) */}
        <Route
          path="/owner-dashboard"
          element={
            <ProtectedRoute>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Toute route inconnue redirige vers la page d'accueil */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
