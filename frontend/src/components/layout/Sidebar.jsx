// Sidebar fixe à gauche — navigation principale
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Ticket, 
  Radio, 
  Users, 
  Settings, 
  LogOut,
  FileBarChart2,
  TrendingUp,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const { role } = useAuth();

  // Déconnexion Firebase
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Erreur lors de la déconnexion :', err);
    }
  };

  // Configuration des liens de navigation selon le rôle
  const getNavLinks = () => {
    // Propriétaire : uniquement son dashboard
    if (role === 'owner') {
      return [
        { to: '/owner-dashboard', icon: TrendingUp, label: 'Mon événement' },
        { to: '/settings',        icon: Settings,   label: 'Paramètres' },
      ];
    }

    // Scanner : uniquement live tracker (mais masqué pour le moment)
    if (role === 'scanner') {
      return [
        { to: '/settings', icon: Settings, label: 'Paramètres' },
      ];
    }

    // Admin : accès complet
    return [
      { to: '/dashboard',    icon: LayoutDashboard, label: 'Tableau de bord' },
      { to: '/events',       icon: CalendarDays,    label: 'Événements' },
      { to: '/tickets',      icon: Ticket,          label: 'Billets' },
      // { to: '/live-tracker', icon: Radio,           label: 'Suivi en direct' }, // Masqué - scan via app mobile
      { to: '/report',       icon: FileBarChart2,   label: 'Rapports' },
      { to: '/users',        icon: Users,           label: 'Utilisateurs' },
      { to: '/settings',     icon: Settings,        label: 'Paramètres' },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col">
      {/* Logo en haut */}
      <div className="p-6 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="Hirrdé logo" className="h-30 w-auto" />
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 p-4 space-y-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[var(--color-gold)] text-[var(--color-bg)] font-medium'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                }`
              }
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bouton de déconnexion en bas */}
      <div className="p-4 border-t border-[var(--color-border)]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-bg)] transition-colors"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
