// Page Rapport — résumé complet par événement
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getTicketsByEvent } from '../firebase/tickets';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import {
  Ticket, CheckCircle, XCircle, Banknote,
  CalendarDays, MapPin, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';

const CATEGORIES  = ['normal', 'prevente', 'vip', 'vvip'];
const CAT_COLORS  = { normal: '#6b6b6b', prevente: '#f59e0b', vip: '#c9a84c', vvip: '#22c55e' };
const CAT_VARIANTS = { normal: 'muted', prevente: 'warning', vip: 'gold', vvip: 'success' };

// Tooltip recharts personnalisé
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs">
      <p className="text-[var(--color-muted)] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill ?? p.color }}>
          {p.name} : {p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function Report() {
  const [events,   setEvents]   = useState([]);
  const [selected, setSelected] = useState('');
  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error,    setError]    = useState(null);

  // Chargement de la liste des événements
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'events'));
        const evs  = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        evs.sort((a, b) => (b.date?.seconds ?? 0) - (a.date?.seconds ?? 0));
        setEvents(evs);
        if (evs.length > 0) setSelected(evs[0].id);
      } catch (err) {
        setError(err.message ?? 'Erreur de chargement');
      } finally {
        setLoadingEvents(false);
      }
    };
    load();
  }, []);

  // Génération du rapport quand l'événement sélectionné change
  useEffect(() => {
    if (!selected) return;
    const generate = async () => {
      setLoading(true);
      setError(null);
      try {
        const event   = events.find((e) => e.id === selected);
        const tickets = await getTicketsByEvent(selected);

        // Stats globales
        const totalBillets  = tickets.length;
        const scannés       = tickets.filter((t) => t.used).length;
        const nonScannés    = totalBillets - scannés;
        const tauxScan      = totalBillets > 0 ? Math.round((scannés / totalBillets) * 100) : 0;
        const totalCollecte = tickets.filter((t) => t.used).reduce((s, t) => s + (t.prix ?? 0), 0);
        const totalEmis     = tickets.reduce((s, t) => s + (t.prix ?? 0), 0);

        // Stats par catégorie
        const parCategorie = CATEGORIES.map((cat) => {
          const tks        = tickets.filter((t) => t.categorie === cat);
          const scannésCat = tks.filter((t) => t.used).length;
          const collecté   = tks.filter((t) => t.used).reduce((s, t) => s + (t.prix ?? 0), 0);
          return {
            cat,
            total:    tks.length,
            scannés:  scannésCat,
            restants: tks.length - scannésCat,
            collecté,
            quota:    event?.quotas?.[cat] ?? 0,
            prix:     event?.prix?.[cat] ?? 0,
          };
        });

        // Données graphique barres — billets par catégorie
        const barData = parCategorie
          .filter((c) => c.total > 0)
          .map((c) => ({
            name:    c.cat.toUpperCase(),
            Émis:    c.total,
            Scannés: c.scannés,
          }));

        // Données graphique camembert — répartition des recettes
        const pieData = parCategorie
          .filter((c) => c.collecté > 0)
          .map((c) => ({ name: c.cat.toUpperCase(), value: c.collecté, fill: CAT_COLORS[c.cat] }));

        // Historique des scans (10 derniers)
        const dernierScans = tickets
          .filter((t) => t.used && t.usedAt)
          .sort((a, b) => (b.usedAt?.seconds ?? 0) - (a.usedAt?.seconds ?? 0))
          .slice(0, 10);

        setReport({ event, totalBillets, scannés, nonScannés, tauxScan, totalCollecte, totalEmis, parCategorie, barData, pieData, dernierScans });
      } catch (err) {
        setError(err.message ?? 'Erreur lors de la génération du rapport');
      } finally {
        setLoading(false);
      }
    };
    generate();
  }, [selected, events]);

  if (loadingEvents) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Rapport</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">Résumé complet par événement</p>
        </div>

        {/* Sélecteur d'événement */}
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-gold)] transition-colors min-w-[240px]"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.nom}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {report && !loading && (
        <>
          {/* Infos événement */}
          <Card>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text)]">{report.event?.nom}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-[var(--color-muted)]">
                  {report.event?.lieu && (
                    <span className="flex items-center gap-1"><MapPin size={13} /> {report.event.lieu}</span>
                  )}
                  {report.event?.date?.seconds && (
                    <span className="flex items-center gap-1">
                      <CalendarDays size={13} />
                      {new Date(report.event.date.seconds * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <Badge variant={report.event?.status === 'active' ? 'success' : report.event?.status === 'closed' ? 'danger' : 'muted'}>
                {report.event?.status === 'active' ? 'Actif' : report.event?.status === 'closed' ? 'Clôturé' : 'Brouillon'}
              </Badge>
            </div>
          </Card>

          {/* KPIs principaux */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard icon={Ticket}      label="Billets émis"       value={report.totalBillets}                         color="gold" />
            <KpiCard icon={CheckCircle} label="Billets scannés"    value={report.scannés}                              color="success" />
            <KpiCard icon={XCircle}     label="Non utilisés"       value={report.nonScannés}                           color="muted" />
            <KpiCard icon={Banknote}    label="Recettes collectées" value={`${report.totalCollecte.toLocaleString()} GNF`} color="gold" />
          </div>

          {/* Taux de scan + recettes potentielles */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-3">Taux de scan</p>
              <div className="flex items-end gap-3 mb-3">
                <p className="text-4xl font-bold text-[var(--color-gold)]">{report.tauxScan}%</p>
                <p className="text-sm text-[var(--color-muted)] mb-1">{report.scannés} / {report.totalBillets} billets</p>
              </div>
              <div className="h-3 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-gold)] rounded-full transition-all" style={{ width: `${report.tauxScan}%` }} />
              </div>
            </Card>
            <Card>
              <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-3">Recettes</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-muted)]">Collectées</span>
                  <span className="font-bold text-[var(--color-success)]">{report.totalCollecte.toLocaleString()} GNF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-muted)]">Potentiel total</span>
                  <span className="font-bold text-[var(--color-text)]">{report.totalEmis.toLocaleString()} GNF</span>
                </div>
                <div className="flex justify-between text-sm border-t border-[var(--color-border)] pt-2">
                  <span className="text-[var(--color-muted)]">Manque à gagner</span>
                  <span className="font-bold text-[var(--color-danger)]">{(report.totalEmis - report.totalCollecte).toLocaleString()} GNF</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Barres — billets émis vs scannés par catégorie */}
            <Card>
              <p className="text-sm font-semibold text-[var(--color-text)] mb-4">Billets par catégorie</p>
              {report.barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={report.barData} barSize={20}>
                    <XAxis dataKey="name" tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,168,76,0.05)' }} />
                    <Bar dataKey="Émis"    fill="var(--color-border)"  radius={[3,3,0,0]} />
                    <Bar dataKey="Scannés" fill="var(--color-gold)"    radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-[var(--color-muted)] text-center py-8">Aucun billet</p>
              )}
            </Card>

            {/* Camembert — répartition des recettes */}
            <Card>
              <p className="text-sm font-semibold text-[var(--color-text)] mb-4">Répartition des recettes</p>
              {report.pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={report.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false} fontSize={10}>
                      {report.pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v.toLocaleString()} GNF`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-[var(--color-muted)] text-center py-8">Aucune recette collectée</p>
              )}
            </Card>
          </div>

          {/* Tableau détaillé par catégorie */}
          <Card className="overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-[var(--color-border)]">
              <h3 className="font-semibold text-[var(--color-text)]">Détail par catégorie</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {['Catégorie', 'Prix unitaire', 'Quota', 'Émis', 'Scannés', 'Restants', 'Taux', 'Recettes'].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.parCategorie.map(({ cat, prix, quota, total, scannés, restants, collecté }) => (
                    <tr key={cat} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)] transition-colors">
                      <td className="px-6 py-3"><Badge variant={CAT_VARIANTS[cat]}>{cat.toUpperCase()}</Badge></td>
                      <td className="px-6 py-3 text-[var(--color-muted)]">{prix > 0 ? `${prix.toLocaleString()} GNF` : '—'}</td>
                      <td className="px-6 py-3 text-[var(--color-muted)]">{quota > 0 ? quota : '—'}</td>
                      <td className="px-6 py-3 font-medium text-[var(--color-text)]">{total}</td>
                      <td className="px-6 py-3 text-[var(--color-success)]">{scannés}</td>
                      <td className="px-6 py-3 text-[var(--color-muted)]">{restants}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-[var(--color-border)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--color-gold)] rounded-full" style={{ width: `${total > 0 ? Math.round((scannés / total) * 100) : 0}%` }} />
                          </div>
                          <span className="text-xs text-[var(--color-muted)]">
                            {total > 0 ? Math.round((scannés / total) * 100) : 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 font-semibold text-[var(--color-gold)]">
                        {collecté > 0 ? `${collecté.toLocaleString()} GNF` : '—'}
                      </td>
                    </tr>
                  ))}
                  {/* Ligne total */}
                  <tr className="bg-[var(--color-bg)] border-t-2 border-[var(--color-border)]">
                    <td className="px-6 py-3 font-bold text-[var(--color-text)]" colSpan={3}>TOTAL</td>
                    <td className="px-6 py-3 font-bold text-[var(--color-text)]">{report.totalBillets}</td>
                    <td className="px-6 py-3 font-bold text-[var(--color-success)]">{report.scannés}</td>
                    <td className="px-6 py-3 font-bold text-[var(--color-muted)]">{report.nonScannés}</td>
                    <td className="px-6 py-3 font-bold text-[var(--color-gold)]">{report.tauxScan}%</td>
                    <td className="px-6 py-3 font-bold text-[var(--color-gold)]">{report.totalCollecte.toLocaleString()} GNF</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* 10 derniers scans */}
          {report.dernierScans.length > 0 && (
            <Card>
              <h3 className="font-semibold text-[var(--color-text)] mb-4">10 derniers scans</h3>
              <div className="space-y-2">
                {report.dernierScans.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-bg)]">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={14} className="text-[var(--color-success)] shrink-0" />
                      <div>
                        <p className="font-mono text-xs text-[var(--color-text)]">{t.numeroUnique}</p>
                        <p className="text-xs text-[var(--color-muted)]">{t.scannedBy ?? '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={CAT_VARIANTS[t.categorie] ?? 'muted'}>{t.categorie?.toUpperCase()}</Badge>
                      <span className="text-xs text-[var(--color-muted)]">
                        {t.usedAt?.seconds
                          ? new Date(t.usedAt.seconds * 1000).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// Carte KPI
function KpiCard({ icon: Icon, label, value, color }) {
  const colors = {
    gold:    'text-[var(--color-gold)] bg-[var(--color-gold)]/10',
    success: 'text-[var(--color-success)] bg-[var(--color-success)]/10',
    muted:   'text-[var(--color-muted)] bg-[var(--color-border)]',
    danger:  'text-[var(--color-danger)] bg-[var(--color-danger)]/10',
  };
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
    </Card>
  );
}
