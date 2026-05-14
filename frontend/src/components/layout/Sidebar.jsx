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
          {/* Monogramme HR */}
          <svg width="36" height="36" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" rx="10" fill="#0a0a0a"/>
            <rect x="10" y="12" width="5" height="40" fill="#c9a84c"/>
            <rect x="10" y="28" width="18" height="5" fill="#c9a84c"/>
            <rect x="23" y="12" width="5" height="40" fill="#c9a84c"/>
            <path d="M28 12 Q50 12 50 24 Q50 34 38 36 L50 52 L44 52 L33 37 L28 37 L28 52 Z" fill="#c9a84c"/>
          </svg>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)] leading-none tracking-widest uppercase">
              Hirrdé
            </h1>
            <p className="text-[8px] text-[var(--color-gold)] tracking-[0.2em] uppercase mt-0.5">
              Innover · Connecter · Élever
            </p>
          </div>
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
