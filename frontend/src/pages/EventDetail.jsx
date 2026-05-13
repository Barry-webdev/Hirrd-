// Détail d'un événement — billets, génération, impression, QR code
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getEventById } from '../firebase/events';
import { createTicket } from '../firebase/tickets';
import { generateSerial } from '../utils/serialGenerator';
import { generateQrCodeData } from '../utils/qrHelper';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import {
  ArrowLeft, Plus, Printer, QrCode,
  CheckCircle, XCircle, AlertCircle, Ticket,
} from 'lucide-react';

const CATEGORIES = ['normal', 'prevente', 'vip', 'vvip'];
const CAT_VARIANTS = { normal: 'muted', prevente: 'warning', vip: 'gold', vvip: 'success' };
const CAT_COLORS   = { normal: '#6b6b6b', prevente: '#f59e0b', vip: '#c9a84c', vvip: '#22c55e' };

export default function EventDetail() {
  const { id } = useParams();

  const [event,    setEvent]    = useState(null);
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // Modal génération
  const [genOpen,     setGenOpen]     = useState(false);
  const [genCat,      setGenCat]      = useState('normal');
  const [genQty,      setGenQty]      = useState(1);
  const [generating,  setGenerating]  = useState(false);
  const [genError,    setGenError]    = useState('');

  // Modal QR code
  const [qrTicket, setQrTicket] = useState(null);

  // Filtres
  const [statusFilter, setStatusFilter] = useState('tous'); // 'tous' | 'scanned' | 'valid'

  // Modal suppression
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Ref pour l'impression
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  // Chargement initial de l'événement
  useEffect(() => {
    const loadEvent = async () => {
      try {
        const ev = await getEventById(id);
        setEvent(ev);
      } catch (err) {
        setError(err.message ?? 'Erreur de chargement');
      }
    };
    loadEvent();
  }, [id]);

  // Listener en temps réel pour les tickets
  useEffect(() => {
    const q = query(
      collection(db, 'tickets'),
      where('eventId', '==', id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Tri côté client
        tks.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setTickets(tks);
        setLoading(false);
      },
      (err) => {
        setError(err.message ?? 'Erreur de chargement des billets');
        setLoading(false);
      }
    );

    // Cleanup
    return () => unsubscribe();
  }, [id]);

  // Génération de billets
  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenError('');
    const qty = Number(genQty);
    if (!qty || qty < 1 || qty > 100) {
      setGenError('Quantité entre 1 et 100.');
      return;
    }
    setGenerating(true);
    try {
      for (let i = 0; i < qty; i++) {
        const numeroUnique = generateSerial();
        // On crée d'abord le doc pour obtenir l'ID, puis on met à jour qrCodeData
        const ref = await createTicket({
          eventId:      id,
          numeroUnique,
          categorie:    genCat,
          prix:         event?.prix?.[genCat] ?? 0,
          qrCodeData:   '', // sera mis à jour juste après
        });
        const qrCodeData = generateQrCodeData(ref.id, id, numeroUnique);
        // Mise à jour du qrCodeData avec l'ID réel
        await updateDoc(doc(db, 'tickets', ref.id), { qrCodeData });
      }
      setGenOpen(false);
      setGenQty(1);
    } catch (err) {
      setGenError(err.message ?? 'Erreur lors de la génération.');
    } finally {
      setGenerating(false);
    }
  };

  // Suppression de tous les billets
  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      const { deleteDoc } = await import('firebase/firestore');
      // Supprimer tous les tickets de cet événement
      const deletePromises = tickets.map((t) => deleteDoc(doc(db, 'tickets', t.id)));
      await Promise.all(deletePromises);
      setDeleteOpen(false);
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression des billets');
    } finally {
      setDeleting(false);
    }
  };

  // Statistiques par catégorie
  const statsByCat = CATEGORIES.map((cat) => {
    const total  = tickets.filter((t) => t.categorie === cat).length;
    const used   = tickets.filter((t) => t.categorie === cat && (t.used || t.status === 'validated')).length;
    const quota  = event?.quotas?.[cat] ?? 0;
    return { cat, total, used, quota };
  });

  // Filtrage des tickets
  const filteredTickets = tickets.filter((t) => {
    const isValidated = t.used || t.status === 'validated';
    if (statusFilter === 'scanned') return isValidated;
    if (statusFilter === 'valid') return !isValidated;
    return true; // 'tous'
  });

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
      {/* Retour + titre */}
      <div className="flex items-center gap-4">
        <Link
          to="/events"
          className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[var(--color-text)] truncate">
            {event?.nom ?? '—'}
          </h1>
          <p className="text-[var(--color-muted)] text-sm mt-0.5">
            {event?.lieu ?? ''}{event?.lieu && event?.date?.seconds ? ' · ' : ''}
            {event?.date?.seconds
              ? new Date(event.date.seconds * 1000).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })
              : ''}
          </p>
        </div>
        <Button onClick={() => setGenOpen(true)}>
          <Plus size={16} /> Générer des billets
        </Button>
      </div>

      {/* Stats par catégorie */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statsByCat.map(({ cat, total, used, quota }) => (
          <Card key={cat} className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant={CAT_VARIANTS[cat]}>{cat.toUpperCase()}</Badge>
              <span className="text-xs text-[var(--color-muted)]">
                {quota > 0 ? `quota: ${quota}` : 'sans quota'}
              </span>
            </div>
            <p className="text-2xl font-bold text-[var(--color-text)]">{total}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--color-success)] flex items-center gap-1">
                <CheckCircle size={11} /> {used} scannés
              </span>
              <span className="text-[var(--color-muted)]">
                · {total - used} restants
              </span>
            </div>
            {/* Barre de progression */}
            {total > 0 && (
              <div className="h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-gold)] rounded-full transition-all"
                  style={{ width: `${Math.round((used / total) * 100)}%` }}
                />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Recettes collectées */}
      {(() => {
        const totalCollecte    = tickets.filter((t) => t.used).reduce((s, t) => s + (t.prix ?? 0), 0);
        const recettesParCat   = CATEGORIES.map((cat) => ({
          cat,
          montant: tickets.filter((t) => t.used && t.categorie === cat).reduce((s, t) => s + (t.prix ?? 0), 0),
        })).filter((r) => r.montant > 0);

        return (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--color-text)]">
                💰 Recettes collectées
              </h3>
              <span className="text-xl font-bold text-[var(--color-gold)]">
                {totalCollecte.toLocaleString()} GNF
              </span>
            </div>
            {recettesParCat.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {recettesParCat.map(({ cat, montant }) => (
                  <div key={cat} className="bg-[var(--color-bg)] rounded-lg p-3 text-center">
                    <Badge variant={CAT_VARIANTS[cat]}>{cat.toUpperCase()}</Badge>
                    <p className="text-sm font-bold text-[var(--color-text)] mt-2">
                      {montant.toLocaleString()}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">GNF</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">Aucun billet scanné pour l'instant.</p>
            )}
          </Card>
        );
      })()}

      {/* Tableau des billets */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h3 className="font-semibold text-[var(--color-text)]">
            Billets ({filteredTickets.length}{filteredTickets.length !== tickets.length ? ` / ${tickets.length}` : ''})
          </h3>
          <div className="flex items-center gap-2">
            {/* Filtres statut */}
            <div className="flex gap-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-1">
              {[['tous', 'Tous'], ['scanned', 'Scannés'], ['valid', 'Valides']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setStatusFilter(val)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === val
                      ? 'bg-[var(--color-gold)] text-[var(--color-bg)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {tickets.length > 0 && (
              <>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer size={14} /> Imprimer
                </Button>
                <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                  Supprimer tout
                </Button>
              </>
            )}
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-muted)]">
            <Ticket size={28} />
            <p className="text-sm">
              {tickets.length === 0 ? 'Aucun billet généré' : 'Aucun billet dans ce filtre'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['Numéro', 'Catégorie', 'Prix', 'Statut', 'QR'].map((h) => (
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
                {filteredTickets.map((t) => {
                  const isValidated = t.used || t.status === 'validated';
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)] transition-colors"
                    >
                      <td className="px-6 py-3 font-mono text-xs text-[var(--color-text)]">
                        {t.numeroUnique}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={CAT_VARIANTS[t.categorie]}>{t.categorie?.toUpperCase()}</Badge>
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
                            <XCircle size={13} /> Non utilisé
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => setQrTicket(t)}
                          className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-gold)] hover:bg-[var(--color-bg)] transition-colors"
                          aria-label="Voir QR code"
                        >
                          <QrCode size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Zone d'impression — A4 portrait, 8 tickets par page */}
      <div className="hidden">
        <div ref={printRef}>
          <style>{`
            @page { size: A4 portrait; margin: 5mm; }
            @media print { body { margin: 0; } }
          `}</style>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2mm' }}>
            {tickets.map((t) => (
              <div key={t.id} style={{
                display: 'flex', flexDirection: 'row',
                width: '200mm',
                height: '33mm',
                borderRadius: '3px', overflow: 'hidden',
                fontFamily: "'DM Sans', Arial, sans-serif",
                background: '#fff', border: '1px solid #ddd',
                pageBreakInside: 'avoid',
                boxSizing: 'border-box',
              }}>
                {/* Photo artiste */}
                <div style={{ width: '25%', flexShrink: 0, position: 'relative', overflow: 'hidden', background: '#1a1a1a' }}>
                  {event?.photoURL ? (
                    <img src={event.photoURL} alt={event?.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #c9a84c, #0a0a0a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Syne', Arial, sans-serif" }}>
                      {event?.nom?.charAt(0)?.toUpperCase() ?? 'H'}
                    </div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 55%, rgba(255,255,255,0.15))' }} />
                  <div style={{ position: 'absolute', bottom: 3, left: 3, background: CAT_COLORS[t.categorie] ?? '#888', color: '#fff', fontSize: 6, fontWeight: 700, padding: '1px 4px', borderRadius: '2px', letterSpacing: '0.4px' }}>
                    {t.categorie?.toUpperCase()}
                  </div>
                </div>

                {/* Infos */}
                <div style={{ flex: 1, padding: '2.5mm 3.5mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px dashed #ccc', overflow: 'hidden' }}>
                  <p style={{ fontFamily: "'Syne', Arial, sans-serif", fontSize: 7, fontWeight: 800, margin: 0, color: '#0a0a0a' }}>
                    Hirr<span style={{ color: '#c9a84c' }}>dé</span>
                  </p>
                  <p style={{ fontFamily: "'Syne', Arial, sans-serif", fontSize: 9, fontWeight: 900, margin: 0, color: '#0a0a0a', lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.2px' }}>
                    {event?.nom}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {event?.lieu && <p style={{ fontSize: 6, color: '#555', margin: 0 }}>📍 {event.lieu}</p>}
                    {event?.date?.seconds && (
                      <p style={{ fontSize: 6, color: '#555', margin: 0 }}>
                        📅 {new Date(event.date.seconds * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <p style={{ fontSize: 9, fontWeight: 800, color: '#c9a84c', margin: 0 }}>
                      {t.prix?.toLocaleString()} <span style={{ fontSize: 6, fontWeight: 600 }}>GNF</span>
                    </p>
                    {event?.prix?.prevente > 0 && t.categorie !== 'prevente' && (
                      <p style={{ fontSize: 6, color: '#888', margin: 0 }}>Prévente : {event.prix.prevente.toLocaleString()} GNF</p>
                    )}
                  </div>
                  <p style={{ fontSize: 5.5, fontFamily: 'monospace', color: '#bbb', margin: 0, letterSpacing: '0.3px' }}>{t.numeroUnique}</p>
                </div>

                {/* QR Code */}
                <div style={{ width: '33mm', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2mm', gap: '1px', background: '#fafafa' }}>
                  {t.qrCodeData
                    ? <QRCode value={t.qrCodeData} size={56} level="H" />
                    : <div style={{ width: 56, height: 56, background: '#eee', borderRadius: 2 }} />
                  }
                  <p style={{ fontSize: 5.5, color: '#bbb', margin: 0 }}>Scanner à l'entrée</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal génération */}
      <Modal isOpen={genOpen} onClose={() => setGenOpen(false)} title="Générer des billets">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--color-muted)]">Catégorie</label>
            <select
              value={genCat}
              onChange={(e) => setGenCat(e.target.value)}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.toUpperCase()} — {event?.prix?.[c]?.toLocaleString() ?? 0} GNF</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--color-muted)]">Quantité (max 100)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={genQty}
              onChange={(e) => setGenQty(e.target.value)}
              className={inputCls}
            />
          </div>
          {genError && (
            <p className="text-[var(--color-danger)] text-sm bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg px-3 py-2">
              {genError}
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={generating} className="flex-1 justify-center">
              {generating ? 'Génération…' : 'Générer'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setGenOpen(false)}>Annuler</Button>
          </div>
        </form>
      </Modal>

      {/* Modal QR code */}
      <Modal isOpen={!!qrTicket} onClose={() => setQrTicket(null)} title="QR Code du billet">
        {qrTicket && (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-xl">
              <QRCode value={qrTicket.qrCodeData || qrTicket.numeroUnique} size={200} />
            </div>
            <p className="font-mono text-sm text-[var(--color-text)]">{qrTicket.numeroUnique}</p>
            <Badge variant={CAT_VARIANTS[qrTicket.categorie]}>{qrTicket.categorie?.toUpperCase()}</Badge>
            {(qrTicket.used || qrTicket.status === 'validated') && (
              <p className="text-[var(--color-danger)] text-sm flex items-center gap-1">
                <CheckCircle size={14} /> Ce billet a déjà été scanné
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Modal suppression */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Supprimer tous les billets">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text)]">
            Êtes-vous sûr de vouloir supprimer <strong>tous les {tickets.length} billets</strong> de cet événement ?
          </p>
          <p className="text-sm text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg px-3 py-2">
            ⚠️ Cette action est irréversible
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="danger"
              onClick={handleDeleteAll}
              disabled={deleting}
              className="flex-1 justify-center"
            >
              {deleting ? 'Suppression…' : 'Oui, supprimer tout'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const inputCls =
  'w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-gold)] transition-colors';
