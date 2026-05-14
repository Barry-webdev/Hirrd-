// Tableau de bord propriétaire — vue standalone responsive sans sidebar
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { signOut } from 'firebase/auth';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import {
  Ticket, CheckCircle, XCircle, Banknote,
  CalendarDays, MapPin, TrendingUp, AlertCircle, LogOut, Menu, X, Sun, Moon,
} from 'lucide-react';

const CATEGORIES = ['normal', 'prevente', 'vip', 'vvip'];
const CAT_VARIANTS = { normal: 'muted', prevente: 'warning', vip: 'gold', vvip: 'success' };

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Déconnexion
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Erreur lors de la déconnexion :', err);
    }
  };

  // Chargement des événements du propriétaire
  useEffect(() => {
    if (!user) return;

    const loadEvents = async () => {
      try {
        const userDoc = await getDocs(
          query(collection(db, 'users'), where('__name__', '==', user.uid))
        );
        const userData = userDoc.docs[0]?.data();
        const assignedEvents = userData?.eventsAssigned || [];

        if (assignedEvents.length === 0) {
          setLoading(false);
          return;
        }

        const eventsSnap = await getDocs(collection(db, 'events'));
        const allEvents = eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const myEvents = allEvents.filter((e) => assignedEvents.includes(e.id));

        setEvents(myEvents);
        if (myEvents.length > 0) {
          setSelectedEvent(myEvents[0].id);
        }
      } catch (err) {
        setError(err.message ?? 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [user]);

  // Écoute en temps réel des tickets
  useEffect(() => {
    if (!selectedEvent) return;

    const event = events.find((e) => e.id === selectedEvent);
    if (!event) return;

    const q = query(
      collection(db, 'tickets'),
      where('eventId', '==', selectedEvent)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tickets = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        const totalBillets = tickets.length;
        const scannés = tickets.filter((t) => t.used || t.status === 'validated').length;
        const nonScannés = totalBillets - scannés;
        const tauxScan = totalBillets > 0 ? Math.round((scannés / totalBillets) * 100) : 0;
        const totalCollecte = tickets
          .filter((t) => t.used || t.status === 'validated')
          .reduce((s, t) => s + (t.prix ?? 0), 0);
        const totalPotentiel = tickets.reduce((s, t) => s + (t.prix ?? 0), 0);

        const parCategorie = CATEGORIES.map((cat) => {
          const tks = tickets.filter((t) => t.categorie === cat);
          const scannésCat = tks.filter((t) => t.used || t.status === 'validated').length;
          const collecté = tks
            .filter((t) => t.used || t.status === 'validated')
            .reduce((s, t) => s + (t.prix ?? 0), 0);
          return {
            cat,
            total: tks.length,
            scannés: scannésCat,
            restants: tks.length - scannésCat,
            collecté,
            prix: event?.prix?.[cat] ?? 0,
          };
        }).filter((c) => c.total > 0);

        setStats({
          event,
          totalBillets,
          scannés,
          nonScannés,
          tauxScan,
          totalCollecte,
          totalPotentiel,
          parCategorie,
        });
      },
      (err) => {
        setError(err.message ?? 'Erreur de chargement des statistiques');
      }
    );

    return () => unsubscribe();
  }, [selectedEvent, events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
        <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] p-4 flex items-center justify-center">
        <div className="flex items-center gap-2 text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg px-4 py-3 text-sm max-w-md">
          <AlertCircle size={16} /> {error}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Header onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Card className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-muted)]">
            <CalendarDays size={28} />
            <p className="text-sm text-center">Aucun événement assigné</p>
            <p className="text-xs text-center">Contactez l'administrateur</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <HeaderWithMenu
        events={events}
        selectedEvent={selectedEvent}
        onSelectEvent={setSelectedEvent}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen(!menuOpen)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {stats && (
          <>
            <EventInfo event={stats.event} />
            <KPIGrid stats={stats} />
            <ProgressCards stats={stats} />
            <CategoryDetails stats={stats} />
            <RealtimeInfo />
          </>
        )}
      </div>
    </div>
  );
}

// Header simple
function Header({ onLogout, theme, onToggleTheme }) {
  return (
    <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">
          Hirr<span className="text-[var(--color-gold)]">dé</span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
            aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-bg)] transition-colors text-sm"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// Header avec menu
function HeaderWithMenu({ events, selectedEvent, onSelectEvent, menuOpen, onToggleMenu, onLogout, theme, onToggleTheme }) {
  return (
    <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">
            Hirr<span className="text-[var(--color-gold)]">dé</span>
          </h1>

          <div className="hidden md:flex items-center gap-3">
            {events.length > 1 && (
              <select
                value={selectedEvent}
                onChange={(e) => onSelectEvent(e.target.value)}
                className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-gold)]"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.nom}</option>
                ))}
              </select>
            )}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
              aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-bg)] transition-colors text-sm"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>

          <button
            onClick={onToggleMenu}
            className="md:hidden p-2 rounded-lg text-[var(--color-text)] hover:bg-[var(--color-bg)]"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-[var(--color-border)] space-y-3">
            {events.length > 1 && (
              <select
                value={selectedEvent}
                onChange={(e) => {
                  onSelectEvent(e.target.value);
                  onToggleMenu();
                }}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-text)]"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.nom}</option>
                ))}
              </select>
            )}
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[var(--color-text)] bg-[var(--color-bg)] hover:bg-[var(--color-border)] transition-colors text-sm font-medium"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[var(--color-danger)] bg-[var(--color-danger)]/10 hover:bg-[var(--color-danger)]/20 text-sm font-medium"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// Infos événement
function EventInfo({ event }) {
  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text)] truncate">
            {event?.nom}
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-[var(--color-muted)]">
            {event?.lieu && (
              <span className="flex items-center gap-1">
                <MapPin size={13} /> {event.lieu}
              </span>
            )}
            {event?.date?.seconds && (
              <span className="flex items-center gap-1">
                <CalendarDays size={13} />
                {new Date(event.date.seconds * 1000).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>
        <Badge
          variant={
            event?.status === 'active'
              ? 'success'
              : event?.status === 'closed'
              ? 'danger'
              : 'muted'
          }
        >
          {event?.status === 'active'
            ? 'Actif'
            : event?.status === 'closed'
            ? 'Clôturé'
            : 'Brouillon'}
        </Badge>
      </div>
    </Card>
  );
}

// KPIs Grid
function KPIGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        icon={Ticket}
        label="Billets émis"
        value={stats.totalBillets}
        color="gold"
      />
      <KpiCard
        icon={CheckCircle}
        label="Scannés"
        value={stats.scannés}
        color="success"
      />
      <KpiCard
        icon={XCircle}
        label="Non utilisés"
        value={stats.nonScannés}
        color="muted"
      />
      <KpiCard
        icon={Banknote}
        label="Recettes"
        value={`${(stats.totalCollecte / 1000).toFixed(0)}k`}
        subtitle={`${stats.totalCollecte.toLocaleString()} GNF`}
        color="gold"
      />
    </div>
  );
}

// Carte KPI
function KpiCard({ icon: Icon, label, value, subtitle, color }) {
  const colors = {
    gold: 'text-[var(--color-gold)] bg-[var(--color-gold)]/10',
    success: 'text-[var(--color-success)] bg-[var(--color-success)]/10',
    muted: 'text-[var(--color-muted)] bg-[var(--color-border)]',
  };
  return (
    <Card className="flex flex-col gap-2 sm:gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider truncate pr-2">
          {label}
        </span>
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${colors[color]}`}>
          <Icon size={14} className="sm:w-4 sm:h-4" />
        </div>
      </div>
      <div>
        <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] truncate">{value}</p>
        {subtitle && (
          <p className="text-xs text-[var(--color-muted)] mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}

// Cartes de progression
function ProgressCards({ stats }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-3">
          Taux de scan
        </p>
        <div className="flex items-end gap-3 mb-3">
          <p className="text-3xl sm:text-4xl font-bold text-[var(--color-gold)]">{stats.tauxScan}%</p>
          <p className="text-sm text-[var(--color-muted)] mb-1">
            {stats.scannés} / {stats.totalBillets}
          </p>
        </div>
        <div className="h-3 bg-[var(--color-border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-gold)] rounded-full transition-all"
            style={{ width: `${stats.tauxScan}%` }}
          />
        </div>
      </Card>

      <Card>
        <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-3">
          Recettes
        </p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">Collectées</span>
            <span className="font-bold text-[var(--color-success)]">
              {stats.totalCollecte.toLocaleString()} GNF
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">Potentiel</span>
            <span className="font-bold text-[var(--color-text)]">
              {stats.totalPotentiel.toLocaleString()} GNF
            </span>
          </div>
          <div className="flex justify-between text-sm border-t border-[var(--color-border)] pt-2">
            <span className="text-[var(--color-muted)]">Manque</span>
            <span className="font-bold text-[var(--color-danger)]">
              {(stats.totalPotentiel - stats.totalCollecte).toLocaleString()} GNF
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Détail par catégorie
function CategoryDetails({ stats }) {
  if (stats.parCategorie.length === 0) {
    return (
      <Card className="overflow-hidden p-0">
        <div className="px-4 sm:px-6 py-4 border-b border-[var(--color-border)]">
          <h3 className="font-semibold text-[var(--color-text)] text-sm sm:text-base">
            Détail par catégorie
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-muted)]">
          <Ticket size={28} />
          <p className="text-sm">Aucun billet généré</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="px-4 sm:px-6 py-4 border-b border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-text)] text-sm sm:text-base">
          Détail par catégorie
        </h3>
      </div>

      {/* Version desktop - Tableau */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {['Catégorie', 'Prix', 'Total', 'Scannés', 'Restants', 'Taux', 'Recettes'].map((h) => (
                <th
                  key={h}
                  className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.parCategorie.map(({ cat, prix, total, scannés, restants, collecté }) => {
              const taux = total > 0 ? Math.round((scannés / total) * 100) : 0;
              return (
                <tr
                  key={cat}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)] transition-colors"
                >
                  <td className="px-6 py-3">
                    <Badge variant={CAT_VARIANTS[cat]}>{cat.toUpperCase()}</Badge>
                  </td>
                  <td className="px-6 py-3 text-[var(--color-muted)]">
                    {prix > 0 ? `${prix.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-6 py-3 font-medium text-[var(--color-text)]">{total}</td>
                  <td className="px-6 py-3 text-[var(--color-success)]">{scannés}</td>
                  <td className="px-6 py-3 text-[var(--color-muted)]">{restants}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-[var(--color-border)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-gold)] rounded-full"
                          style={{ width: `${taux}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--color-muted)]">{taux}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 font-semibold text-[var(--color-gold)]">
                    {collecté > 0 ? `${collecté.toLocaleString()}` : '—'}
                  </td>
                </tr>
              );
            })}
            {/* Ligne total */}
            <tr className="bg-[var(--color-bg)] border-t-2 border-[var(--color-border)]">
              <td className="px-6 py-3 font-bold text-[var(--color-text)]" colSpan={2}>
                TOTAL
              </td>
              <td className="px-6 py-3 font-bold text-[var(--color-text)]">
                {stats.totalBillets}
              </td>
              <td className="px-6 py-3 font-bold text-[var(--color-success)]">
                {stats.scannés}
              </td>
              <td className="px-6 py-3 font-bold text-[var(--color-muted)]">
                {stats.nonScannés}
              </td>
              <td className="px-6 py-3 font-bold text-[var(--color-gold)]">
                {stats.tauxScan}%
              </td>
              <td className="px-6 py-3 font-bold text-[var(--color-gold)]">
                {stats.totalCollecte.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Version mobile - Cards */}
      <div className="md:hidden divide-y divide-[var(--color-border)]">
        {stats.parCategorie.map(({ cat, prix, total, scannés, restants, collecté }) => {
          const taux = total > 0 ? Math.round((scannés / total) * 100) : 0;
          return (
            <div key={cat} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={CAT_VARIANTS[cat]}>{cat.toUpperCase()}</Badge>
                <span className="text-xs text-[var(--color-muted)]">
                  {prix > 0 ? `${prix.toLocaleString()} GNF` : '—'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-[var(--color-muted)] mb-1">Total</p>
                  <p className="text-lg font-bold text-[var(--color-text)]">{total}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted)] mb-1">Scannés</p>
                  <p className="text-lg font-bold text-[var(--color-success)]">{scannés}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted)] mb-1">Restants</p>
                  <p className="text-lg font-bold text-[var(--color-muted)]">{restants}</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-[var(--color-muted)] mb-1">
                  <span>Taux</span>
                  <span>{taux}%</span>
                </div>
                <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-gold)] rounded-full"
                    style={{ width: `${taux}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-muted)]">Recettes</span>
                <span className="text-sm font-bold text-[var(--color-gold)]">
                  {collecté > 0 ? `${collecté.toLocaleString()} GNF` : '—'}
                </span>
              </div>
            </div>
          );
        })}

        {/* Total mobile */}
        <div className="p-4 bg-[var(--color-bg)] space-y-3">
          <p className="text-sm font-bold text-[var(--color-text)]">TOTAL</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-[var(--color-muted)] mb-1">Total</p>
              <p className="text-lg font-bold text-[var(--color-text)]">{stats.totalBillets}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)] mb-1">Scannés</p>
              <p className="text-lg font-bold text-[var(--color-success)]">{stats.scannés}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)] mb-1">Taux</p>
              <p className="text-lg font-bold text-[var(--color-gold)]">{stats.tauxScan}%</p>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-muted)]">Recettes totales</span>
            <span className="text-base font-bold text-[var(--color-gold)]">
              {stats.totalCollecte.toLocaleString()} GNF
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Info temps réel
function RealtimeInfo() {
  return (
    <Card className="bg-[var(--color-success)]/10 border-[var(--color-success)]/20">
      <div className="flex items-start gap-3">
        <TrendingUp size={18} className="text-[var(--color-success)] shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-[var(--color-text)]">
          <strong>Mise à jour en temps réel</strong> — Les statistiques se mettent à jour
          automatiquement à chaque scan de billet.
        </p>
      </div>
    </Card>
  );
}
