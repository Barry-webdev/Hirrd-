// Page Billets — vue globale tous événements, filtres, recherche
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { deleteTicket } from '../firebase/tickets';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Search, CheckCircle, XCircle, AlertCircle, Ticket, ExternalLink, Trash2 } from 'lucide-react';

const CATEGORIES = ['tous', 'normal', 'prevente', 'vip', 'vvip'];
const CAT_VARIANTS = { normal: 'muted', prevente: 'warning', vip: 'gold', vvip: 'success' };

export default function Tickets() {
  const [tickets,  setTickets]  = useState([]);
  const [events,   setEvents]   = useState({});   // map id → nom
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // Filtres
  const [search,   setSearch]   = useState('');
  const [catFilter, setCatFilter] = useState('tous');
  const [usedFilter, setUsedFilter] = useState('tous'); // 'tous' | 'used' | 'unused'
  const [deleting, setDeleting] = useState(null); // ID du ticket en cours de suppression

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsSnap = await getDocs(collection(db, 'events'));
        const evMap = {};
        eventsSnap.docs.forEach((d) => { evMap[d.id] = d.data().nom ?? 'Sans nom'; });
        setEvents(evMap);
      } catch (err) {
        console.error('Erreur chargement événements:', err);
      }
    };

    loadEvents();

    // Listener en temps réel pour les tickets
    const unsubscribe = onSnapshot(
      collection(db, 'tickets'),
      (snapshot) => {
        const tks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Tri côté client
        tks.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setTickets(tks);
        setLoading(false);
      },
      (err) => {
        setError(err.message ?? 'Erreur de chargement');
        setLoading(false);
      }
    );

    // Cleanup
    return () => unsubscribe();
  }, []);

  // Filtrage
  const filtered = tickets.filter((t) => {
    const matchSearch = !search ||
      t.numeroUnique?.toLowerCase().includes(search.toLowerCase()) ||
      events[t.eventId]?.toLowerCase().includes(search.toLowerCase());
    const matchCat  = catFilter === 'tous' || t.categorie === catFilter;
    const matchUsed = usedFilter === 'tous'
      ? true
      : usedFilter === 'used' ? (t.used || t.status === 'validated') : (!t.used && t.status !== 'validated');
    return matchSearch && matchCat && matchUsed;
  });

  // Compteurs
  const total  = tickets.length;
  const used   = tickets.filter((t) => t.used || t.status === 'validated').length;
  const unused = total - used;

  // Fonction de suppression d'un ticket
  const handleDeleteTicket = async (ticketId, ticketNumber) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le billet ${ticketNumber} ?\n\nCette action est irréversible.`)) {
      return;
    }

    setDeleting(ticketId);
    try {
      await deleteTicket(ticketId);
      // Le listener onSnapshot mettra à jour la liste automatiquement
    } catch (err) {
      console.error('Erreur suppression ticket:', err);
      alert('Erreur lors de la suppression du billet.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg px-4 py-3 text-sm">
        <AlertCircle size={16} /> {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Billets</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">
          {total} billet{total !== 1 ? 's' : ''} au total
        </p>
      </div>

      {/* Compteurs rapides */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-[var(--color-text)]">{total}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1 flex items-center justify-center gap-1">
            <Ticket size={12} /> Total
          </p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-[var(--color-success)]">{used}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1 flex items-center justify-center gap-1">
            <CheckCircle size={12} /> Scannés
          </p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-[var(--color-gold)]">{unused}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1 flex items-center justify-center gap-1">
            <XCircle size={12} /> Non utilisés
          </p>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            type="text"
            placeholder="Rechercher par numéro ou événement…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>

        {/* Filtre catégorie */}
        <div className="flex gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                catFilter === c
                  ? 'bg-[var(--color-gold)] text-[var(--color-bg)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {c === 'tous' ? 'Tous' : c.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Filtre statut */}
        <div className="flex gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1">
          {[['tous', 'Tous'], ['used', 'Scannés'], ['unused', 'Valides']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setUsedFilter(val)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                usedFilter === val
                  ? 'bg-[var(--color-gold)] text-[var(--color-bg)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-muted)]">
            <Ticket size={28} />
            <p className="text-sm">Aucun billet trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['Numéro', 'Événement', 'Catégorie', 'Prix', 'Statut', 'Actions'].map((h) => (
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
                {filtered.map((t) => {
                  const isValidated = t.used || t.status === 'validated';
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)] transition-colors"
                    >
                      <td className="px-6 py-3 font-mono text-xs text-[var(--color-text)]">
                        {t.numeroUnique}
                      </td>
                      <td className="px-6 py-3 text-[var(--color-muted)] text-xs max-w-[160px] truncate">
                        {events[t.eventId] ?? t.eventId}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={CAT_VARIANTS[t.categorie] ?? 'muted'}>
                          {t.categorie?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-[var(--color-text)]">
                        {t.prix ? `${t.prix.toLocaleString()} GNF` : '—'}
                      </td>
                      <td className="px-6 py-3">
                        {isValidated ? (
                          <span className="flex items-center gap-1 text-[var(--color-success)] text-xs">
                            <CheckCircle size={13} /> Scanné
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[var(--color-muted)] text-xs">
                            <XCircle size={13} /> Valide
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/events/${t.eventId}`}
                            className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-gold)] hover:bg-[var(--color-bg)] transition-colors inline-flex"
                            aria-label="Voir l'événement"
                          >
                            <ExternalLink size={14} />
                          </Link>
                          <button
                            onClick={() => handleDeleteTicket(t.id, t.numeroUnique)}
                            disabled={deleting === t.id}
                            className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors inline-flex disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Supprimer le billet"
                          >
                            {deleting === t.id ? (
                              <div className="w-3.5 h-3.5 border border-[var(--color-danger)] border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Résultat du filtre */}
      {filtered.length !== total && (
        <p className="text-xs text-[var(--color-muted)] text-center">
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} sur {total}
        </p>
      )}
    </div>
  );
}
