// Barre de navigation supérieure — titre de page + infos utilisateur + toggle thème
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

// Correspondance chemin → titre de page
const PAGE_TITLES = {
  '/dashboard':    'Tableau de bord',
  '/events':       'Événements',
  '/tickets':      'Billets',
  '/live-tracker': 'Suivi en direct',
  '/report':       'Rapports',
  '/users':        'Utilisateurs',
  '/settings':     'Paramètres',
};

// Couleurs du badge selon le rôle
const ROLE_STYLES = {
  admin:   'bg-[var(--color-gold)] text-[var(--color-bg)]',
  scanner: 'bg-[var(--color-surface)] text-[var(--color-gold)] border border-[var(--color-gold)]',
};

export default function Navbar() {
  const location       = useLocation();
  const { user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Titre de la page courante (gère aussi /events/:id)
  const rawPath  = location.pathname;
  const basePath = rawPath.startsWith('/events/') ? '/events' : rawPath;
  const title    = PAGE_TITLES[basePath] ?? 'Hirrdé';

  // Initiales de l'utilisateur pour l'avatar
  const displayName = user?.displayName ?? user?.email ?? 'Admin';
  const initials    = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-6">
      {/* Titre de la page courante */}
      <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>

      {/* Infos utilisateur à droite */}
      <div className="flex items-center gap-3">

        {/* Toggle thème dark / light */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
          aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Badge de rôle */}
        {role && (
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              ROLE_STYLES[role] ?? ROLE_STYLES.scanner
            }`}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        )}

        {/* Nom de l'utilisateur */}
        <span className="text-sm text-[var(--color-muted)] hidden sm:block">
          {displayName}
        </span>

        {/* Avatar avec initiales */}
        <div className="w-9 h-9 rounded-full bg-[var(--color-gold)] flex items-center justify-center text-[var(--color-bg)] text-sm font-semibold">
          {initials}
        </div>
      </div>
    </header>
  );
}
