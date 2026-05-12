// Suivi en direct — scan QR code, validation billets en temps réel
import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { markTicketAsUsed } from '../firebase/tickets';
import { parseQrCodeData } from '../utils/qrHelper';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import {
  Radio, CheckCircle, XCircle, AlertCircle,
  ScanLine, Clock, Ticket,
} from 'lucide-react';

const CAT_VARIANTS = { normal: 'muted', prevente: 'warning', vip: 'gold', vvip: 'success' };

export default function LiveTracker() {
  const { user, role } = useAuth();

  const [events,       setEvents]       = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [scanInput,    setScanInput]    = useState('');
  const [scanning,     setScanning]     = useState(false);
  const [scanResult,   setScanResult]   = useState(null); // { ok, message, ticket }
  const [recentScans,  setRecentScans]  = useState([]);
  const [liveStats,    setLiveStats]    = useState({ total: 0, used: 0 });

  const inputRef = useRef(null);

  // Chargement des événements
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'events'));
        const evs  = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Un scanner ne voit que son événement assigné
        if (role === 'scanner' && user) {
          const userSnap = await getDocs(
            query(collection(db, 'users'), where('__name__', '==', user.uid))
          );
          const assigned = userSnap.docs[0]?.data()?.eventAssigned ?? null;
          setEvents(evs.filter((e) => e.id === assigned));
          setSelectedEvent(assigned ?? '');
        } else {
          const active = evs.filter((e) => e.status === 'active');
          setEvents(active.length > 0 ? active : evs);
          if (active.length > 0) setSelectedEvent(active[0].id);
        }
      } catch (err) {
        console.error('Erreur chargement événements :', err);
      }
    };
    load();
  }, [role, user]);

  // Listener temps réel sur les billets de l'événement sélectionné
  useEffect(() => {
    if (!selectedEvent) return;

    const q = query(
      collection(db, 'tickets'),
      where('eventId', '==', selectedEvent),
    );

    const unsub = onSnapshot(q, (snap) => {
      const tks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const used = tks.filter((t) => t.used).length;
      setLiveStats({ total: tks.length, used });

      // 10 derniers scans
      const scanned = tks
        .filter((t) => t.used && t.usedAt)
        .sort((a, b) => (b.usedAt?.seconds ?? 0) - (a.usedAt?.seconds ?? 0))
        .slice(0, 10);
      setRecentScans(scanned);
    });

    return () => unsub();
  }, [selectedEvent]);

  // Focus automatique sur le champ de scan
  useEffect(() => {
    if (selectedEvent) inputRef.current?.focus();
  }, [selectedEvent]);

  // Traitement du scan
  const handleScan = async (e) => {
    e.preventDefault();
    const raw = scanInput.trim();
    if (!raw) return;

    setScanInput('');
    setScanning(true);
    setScanResult(null);

    try {
      // Tenter de parser le QR code
      const parsed = parseQrCodeData(raw);
      const ticketId = parsed?.ticketId ?? raw; // fallback : raw = ticketId direct

      await markTicketAsUsed(ticketId, user?.email ?? 'scanner');

      // Récupérer les infos du billet pour l'affichage
      const { getTicketById } = await import('../firebase/tickets');
      const ticket = await getTicketById(ticketId);

      setScanResult({
        ok: true,
        message: 'Billet valide — accès autorisé',
        ticket,
      });
    } catch (err) {
      setScanResult({
        ok: false,
        message: err.message ?? 'Billet invalide',
        ticket: null,
      });
    } finally {
      setScanning(false);
      // Effacer le résultat après 4 secondes
      setTimeout(() => setScanResult(null), 4000);
      inputRef.current?.focus();
    }
  };

  const scanRate = liveStats.total > 0
    ? Math.round((liveStats.used / liveStats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center">
          <Radio size={18} className="text-[var(--color-success)] animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Suivi en direct</h1>
          <p className="text-[var(--color-muted)] text-sm">Scan et validation des billets</p>
        </div>
      </div>

      {/* Sélection de l'événement */}
      {events.length > 1 && (
        <Card>
          <label className="block text-xs font-medium text-[var(--color-muted)] mb-2">
            Événement actif
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          >
            <option value="">— Sélectionner un événement —</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.nom}</option>
            ))}
          </select>
        </Card>
      )}

      {selectedEvent ? (
        <>
          {/* Stats live */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center py-4">
              <p className="text-3xl font-bold text-[var(--color-text)]">{liveStats.total}</p>
              <p className="text-xs text-[var(--color-muted)] mt-1 flex items-center justify-center gap-1">
                <Ticket size={12} /> Total
              </p>
            </Card>
            <Card className="text-center py-4">
              <p className="text-3xl font-bold text-[var(--color-success)]">{liveStats.used}</p>
              <p className="text-xs text-[var(--color-muted)] mt-1 flex items-center justify-center gap-1">
                <CheckCircle size={12} /> Scannés
              </p>
            </Card>
            <Card className="text-center py-4">
              <p className="text-3xl font-bold text-[var(--color-gold)]">{scanRate}%</p>
              <p className="text-xs text-[var(--color-muted)] mt-1">Taux d'entrée</p>
              {/* Barre de progression */}
              <div className="h-1 bg-[var(--color-border)] rounded-full overflow-hidden mt-2 mx-4">
                <div
                  className="h-full bg-[var(--color-gold)] rounded-full transition-all duration-500"
                  style={{ width: `${scanRate}%` }}
                />
              </div>
            </Card>
          </div>

          {/* Zone de scan */}
          <Card>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
              <ScanLine size={16} className="text-[var(--color-gold)]" />
              Scanner un billet
            </h3>

            <form onSubmit={handleScan} className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scanner le QR code ou saisir l'ID du billet…"
                className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-gold)] transition-colors font-mono"
                autoComplete="off"
                disabled={scanning}
              />
              <Button type="submit" disabled={scanning || !scanInput.trim()}>
                {scanning ? 'Vérification…' : 'Valider'}
              </Button>
            </form>

            {/* Résultat du scan */}
            {scanResult && (
              <div
                className={`mt-4 flex items-start gap-3 rounded-xl px-4 py-4 border transition-all ${
                  scanResult.ok
                    ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)]'
                    : 'bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30 text-[var(--color-danger)]'
                }`}
              >
                {scanResult.ok
                  ? <CheckCircle size={22} className="shrink-0 mt-0.5" />
                  : <XCircle size={22} className="shrink-0 mt-0.5" />
                }
                <div>
                  <p className="font-semibold">{scanResult.message}</p>
                  {scanResult.ticket && (
                    <div className="mt-1 space-y-0.5 text-sm opacity-80">
                      <p className="font-mono">{scanResult.ticket.numeroUnique}</p>
                      <p>
                        {scanResult.ticket.categorie?.toUpperCase()} —{' '}
                        {scanResult.ticket.prix?.toLocaleString()} GNF
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Derniers scans */}
          <Card>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
              <Clock size={16} className="text-[var(--color-muted)]" />
              Derniers scans
            </h3>

            {recentScans.length === 0 ? (
              <p className="text-[var(--color-muted)] text-sm text-center py-6">
                Aucun scan pour l'instant
              </p>
            ) : (
              <div className="space-y-2">
                {recentScans.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[var(--color-bg)]"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle size={15} className="text-[var(--color-success)] shrink-0" />
                      <div>
                        <p className="font-mono text-xs text-[var(--color-text)]">
                          {t.numeroUnique}
                        </p>
                        <p className="text-xs text-[var(--color-muted)] mt-0.5">
                          {t.scannedBy ?? 'scanner'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={CAT_VARIANTS[t.categorie] ?? 'muted'}>
                        {t.categorie?.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-[var(--color-muted)]">
                        {t.usedAt?.seconds
                          ? new Date(t.usedAt.seconds * 1000).toLocaleTimeString('fr-FR', {
                              hour: '2-digit', minute: '2-digit', second: '2-digit',
                            })
                          : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      ) : (
        <Card className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-muted)]">
          <AlertCircle size={28} />
          <p className="text-sm">Sélectionne un événement pour commencer le scan</p>
        </Card>
      )}
    </div>
  );
}
