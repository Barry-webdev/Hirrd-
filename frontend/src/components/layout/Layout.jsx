// Layout principal — enveloppe toutes les pages protégées
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from './Sidebar';
import Navbar  from './Navbar';

export default function Layout() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirection selon le rôle
  useEffect(() => {
    if (loading || !role) return;

    const currentPath = location.pathname;

    // Propriétaire : rediriger vers owner-dashboard si sur une page non autorisée
    if (role === 'owner') {
      const allowedPaths = ['/owner-dashboard', '/settings'];
      if (!allowedPaths.some(path => currentPath.startsWith(path))) {
        navigate('/owner-dashboard', { replace: true });
      }
    }

    // Scanner : rediriger vers settings si sur une page non autorisée
    if (role === 'scanner') {
      const allowedPaths = ['/settings'];
      if (!allowedPaths.some(path => currentPath.startsWith(path))) {
        navigate('/settings', { replace: true });
      }
    }

    // Redirection de la page d'accueil selon le rôle
    if (currentPath === '/' || currentPath === '/dashboard') {
      if (role === 'owner') {
        navigate('/owner-dashboard', { replace: true });
      } else if (role === 'scanner') {
        navigate('/settings', { replace: true });
      }
    }
  }, [role, loading, location.pathname, navigate]);

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      {/* Sidebar fixe à gauche */}
      <Sidebar />

      {/* Zone de contenu principale — décalée de la largeur de la sidebar */}
      <div className="flex flex-col flex-1 ml-64">
        {/* Barre de navigation supérieure */}
        <Navbar />

        {/* Contenu de la page courante */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
