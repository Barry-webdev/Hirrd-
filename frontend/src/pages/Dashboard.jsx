// Tableau de bord — statistiques globales en temps réel
import { useState, useEffect } from 'react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import {
  CalendarDays, Ticket, Users, CheckCircle,
  TrendingUp, Clock, AlertCircle, Banknote,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

// Tooltip personnalisé pour le graphique
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
      <p className="text-[var(--color-muted)] mb-1">{label}</p>
      <p className="text-[var(--color-gold)] font-semibold">{payload[0].value} billets</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats]     = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalTickets: 0,
    usedTickets: 0,
    totalUsers: 0,
    scanners: 0,
    totalCollecte: 0,
  });
  const [events, setEvents] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [eventsMap, setEventsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const snap = await getDocs(collection(db, 'events'));
        const evs  = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEvents(evs);
        // Map id → nom pour afficher le nom de l'événement dans les scans
        const map = {};
        evs.forEach((e) => { map[e.id] = e.nom ?? 'Sans nom'; });
        setEventsMap(map);
      } catch (err) {
        console.error('Erreur chargement événements:', err);
      }
    };

    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const usrs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setStats((prev) => ({
          ...prev,
          totalUsers: usrs.length,
          scanners: usrs.filter((u) => u.role === 'scanner').length,
        }));
      } catch (err) {
        console.error('Erreur chargement utilisateurs:', err);
      }
    };

    fetchEvents();
    fetchUsers();

    // Listener en temps réel pour les tickets
    const unsubscribe = onSnapshot(
      collection(db, 'tickets'),
      (snapshot) => {
        const tickets = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        
        // Calcul des statistiques
        const usedTickets = tickets.filter((t) => t.used || t.status === 'validated').length;
        const totalCollecte = tickets
          .filter((t) => (t.used || t.status === 'validated') && t.prix)
          .reduce((sum, t) => sum + (t.prix ?? 0), 0);

        setStats((prev) => ({
          ...prev,
          totalTickets: tickets.length,
          usedTickets,
          totalCollecte,
        }));

        // 15 derniers scans triés par heure de scan
        const scans = tickets
          .filter((t) => (t.used || t.status === 'validated') && t.usedAt)
          .sort((a, b) => (b.usedAt?.seconds ?? 0) - (a.usedAt?.seconds ?? 0))
          .slice(0, 15);
        setRecentScans(scans);

        // Données du graphique — billets par événement (top 6)
        const ticketsByEvent = {};
        tickets.forEach((t) => {
          ticketsByEvent[t.eventId] = (ticketsByEvent[t.eventId] || 0) + 1;
        });

        // On attend que events soit chargé
        setChartData((prevChart) => {
          if (events.length === 0) return prevChart;
          return events
            .slice(0, 6)
            .map((e) => ({
              nom:     e.nom?.length > 14 ? e.nom.slice(0, 14) + '…' : (e.nom ?? 'Sans nom'),
              billets: ticketsByEvent[e.id] ?? 0,
            }));
        });

        setLoading(false);
      },
      (err) => {
        console.error('Erreur listener tickets:', err);
        setLoading(false);
      }
    );

    // Cleanup
    return () => unsubscribe();
  }, [events.length]);

  // Chargement des événements récents
  useEffect(() => {
    if (events.length === 0) return;
    
    const activeEvents = events.filter((e) => e.status === 'active').length;
    setStats((prev) => ({
      ...prev,
      totalEvents: events.length,
      activeEvents,
    }));

    // 4 événements les plus récents
    const sorted = [...events].sort((a, b) => {
      const da = a.date?.seconds ?? 0;
      const db_ = b.date?.seconds ?? 0;
      return db_ - da;
    });
    setRecentEvents(sorted.slice(0, 4));
  }, [events]);

  // Taux de scan
  const scanRate = stats.totalTickets > 0
    ? Math.round((stats.usedTickets / stats.totalTickets) * 100)
    : 0;

  // Badge couleur selon statut
  const statusBadge = (status) => {
    const map = { active: 'success', draft: 'muted', closed: 'danger' };
    const labels = { active: 'Actif', draft: 'Brouillon', closed: 'Clôturé' };
    return <Badge variant={map[status] ?? 'muted'}>{labels[status] ?? status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Bonjour 👋
        </h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">
          Voici un aperçu de l'activité Hirrdé
        </p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          icon={CalendarDays}
          label="Événements"
          value={stats.totalEvents}
          sub={`${stats.activeEvents} actif${stats.activeEvents > 1 ? 's' : ''}`}
          subVariant="success"
        />
        <StatCard
          icon={Ticket}
          label="Billets émis"
          value={stats.totalTickets}
          sub={`${stats.usedTickets} scannés`}
          subVariant="gold"
        />
        <StatCard
          icon={TrendingUp}
          label="Taux de scan"
          value={`${scanRate}%`}
          sub={`${stats.totalTickets - stats.usedTickets} restants`}
          subVariant="warning"
        />
        <StatCard
          icon={Banknote}
          label="Recettes collectées"
          value={`${stats.totalCollecte.toLocaleString()} GNF`}
          sub={`sur ${stats.usedTickets} billets scannés`}
          subVariant="success"
        />
        <StatCard
          icon={Users}
          label="Utilisateurs"
          value={stats.totalUsers}
          sub={`${stats.scanners} scanner${stats.scanners > 1 ? 's' : ''}`}
          subVariant="muted"
        />
      </div>

      {/* Graphique + événements récents */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Graphique billets par événement */}
        <Card className="xl:col-span-3">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">
            Billets par événement
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={28}>
                <XAxis
                  dataKey="nom"
                  tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,168,76,0.06)' }} />
                <Bar dataKey="billets" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === 0 ? 'var(--color-gold)' : 'var(--color-border)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-[var(--color-muted)] text-sm">
              Aucun événement à afficher
            </div>
          )}
        </Card>

        {/* Événements récents */}
        <Card className="xl:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">
            Événements récents
          </h3>
          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--color-text)] truncate font-medium">
                      {ev.nom ?? 'Sans nom'}
                    </p>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5 flex items-center gap-1">
                      <Clock size={11} />
                      {ev.date?.seconds
                        ? new Date(ev.date.seconds * 1000).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0">{statusBadge(ev.status)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-[var(--color-muted)] text-sm gap-2">
              <AlertCircle size={20} />
              Aucun événement
            </div>
          )}
        </Card>
      </div>
      {/* Derniers scans en temps réel */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
            <CheckCircle size={15} className="text-[var(--color-success)]" />
            Derniers scans
          </h3>
          <span className="text-xs text-[var(--color-muted)]">
            {recentScans.length} affiché{recentScans.length > 1 ? 's' : ''}
          </span>
        </div>
        {recentScans.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] text-center py-6">Aucun scan pour l'instant</p>
        ) : (
          <div className="space-y-2">
            {recentScans.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[var(--color-bg)]">
                <div className="flex items-center gap-3">
                  <CheckCircle size={14} className="text-[var(--color-success)] shrink-0" />
                  <div>
                    <p className="font-mono text-xs text-[var(--color-text)]">{t.numeroUnique}</p>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      {eventsMap[t.eventId] ?? '—'} · {t.scannedBy ?? 'scanner'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={{ normal: 'muted', prevente: 'warning', vip: 'gold', vvip: 'success' }[t.categorie] ?? 'muted'}>
                    {t.categorie?.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-[var(--color-gold)] font-medium">
                    {t.prix?.toLocaleString()} GNF
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">
                    {t.usedAt?.seconds
                      ? new Date(t.usedAt.seconds * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
}

// Composant carte de stat réutilisable
function StatCard({ icon: Icon, label, value, sub, subVariant }) {
  const subColors = {
    success: 'text-[var(--color-success)]',
    gold:    'text-[var(--color-gold)]',
    warning: 'text-[var(--color-warning)]',
    muted:   'text-[var(--color-muted)]',
    danger:  'text-[var(--color-danger)]',
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg bg-[var(--color-gold)]/10 flex items-center justify-center">
          <Icon size={16} className="text-[var(--color-gold)]" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-[var(--color-text)]">{value}</p>
        <p className={`text-xs mt-1 ${subColors[subVariant] ?? subColors.muted}`}>{sub}</p>
      </div>
    </Card>
  );
}
