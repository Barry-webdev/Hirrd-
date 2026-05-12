// Page Événements — liste, création, modification, suppression
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { useEvents } from '../hooks/useEvents';
import { createEvent, updateEvent, deleteEvent } from '../firebase/events';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Plus, CalendarDays, MapPin, ChevronRight, Pencil, Trash2, AlertCircle } from 'lucide-react';

// Statuts disponibles
const STATUTS = ['draft', 'active', 'closed'];
const STATUT_LABELS = { draft: 'Brouillon', active: 'Actif', closed: 'Clôturé' };
const STATUT_VARIANTS = { draft: 'muted', active: 'success', closed: 'danger' };

// Catégories de billets
const CATEGORIES = ['normal', 'prevente', 'vip', 'vvip'];

// Valeurs initiales du formulaire
const FORM_INIT = {
  nom: '', lieu: '', description: '', photoURL: '', status: 'draft',
  date: '',
  prix:   { normal: '', prevente: '', vip: '', vvip: '' },
  quotas: { normal: '', prevente: '', vip: '', vvip: '' },
};

export default function Events() {
  const { events, loading, error } = useEvents();

  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null); // null = création
  const [form,        setForm]        = useState(FORM_INIT);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState('');
  const [deleteId,    setDeleteId]    = useState(null);
  const [deleting,    setDeleting]    = useState(false);

  // Ouvrir modal création
  const openCreate = () => {
    setEditTarget(null);
    setForm(FORM_INIT);
    setFormError('');
    setModalOpen(true);
  };

  // Ouvrir modal édition
  const openEdit = (ev) => {
    setEditTarget(ev);
    setFormError('');
    setForm({
      nom:         ev.nom ?? '',
      lieu:        ev.lieu ?? '',
      description: ev.description ?? '',
      photoURL:    ev.photoURL ?? '',
      status:      ev.status ?? 'draft',
      date:        ev.date?.seconds
        ? new Date(ev.date.seconds * 1000).toISOString().slice(0, 16)
        : '',
      prix:   { normal: ev.prix?.normal ?? '', prevente: ev.prix?.prevente ?? '', vip: ev.prix?.vip ?? '', vvip: ev.prix?.vvip ?? '' },
      quotas: { normal: ev.quotas?.normal ?? '', prevente: ev.quotas?.prevente ?? '', vip: ev.quotas?.vip ?? '', vvip: ev.quotas?.vvip ?? '' },
    });
    setModalOpen(true);
  };

  // Mise à jour champ simple
  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Mise à jour champ imbriqué (prix / quotas)
  const setNested = (group, key, val) =>
    setForm((f) => ({ ...f, [group]: { ...f[group], [key]: val } }));

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.nom.trim() || !form.date) {
      setFormError('Le nom et la date sont obligatoires.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        nom:         form.nom.trim(),
        lieu:        form.lieu.trim(),
        description: form.description.trim(),
        photoURL:    form.photoURL.trim(),
        status:      form.status,
        date:        Timestamp.fromDate(new Date(form.date)),
        prix: {
          normal:   Number(form.prix.normal)   || 0,
          prevente: Number(form.prix.prevente) || 0,
          vip:      Number(form.prix.vip)      || 0,
          vvip:     Number(form.prix.vvip)     || 0,
        },
        quotas: {
          normal:   Number(form.quotas.normal)   || 0,
          prevente: Number(form.quotas.prevente) || 0,
          vip:      Number(form.quotas.vip)      || 0,
          vvip:     Number(form.quotas.vvip)     || 0,
        },
      };

      if (editTarget) {
        await updateEvent(editTarget.id, payload);
      } else {
        await createEvent(payload);
      }
      setModalOpen(false);
      // Rechargement simple — en prod on utiliserait un listener temps réel
      window.location.reload();
    } catch (err) {
      setFormError(err.message ?? 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  // Suppression
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteEvent(deleteId);
      setDeleteId(null);
      window.location.reload();
    } catch (err) {
      console.error('Erreur suppression :', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Événements</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            {events.length} événement{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Nouvel événement
        </Button>
      </div>

      {/* État de chargement */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Liste des événements */}
      {!loading && !error && events.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16 gap-3">
          <CalendarDays size={32} className="text-[var(--color-muted)]" />
          <p className="text-[var(--color-muted)]">Aucun événement pour l'instant</p>
          <Button onClick={openCreate} variant="outline">
            <Plus size={16} /> Créer le premier
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {events.map((ev) => (
          <EventCard
            key={ev.id}
            event={ev}
            onEdit={() => openEdit(ev)}
            onDelete={() => setDeleteId(ev.id)}
          />
        ))}
      </div>

      {/* Modal création / édition */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Modifier l\'événement' : 'Nouvel événement'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Nom */}
          <Field label="Nom de l'événement *">
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setField('nom', e.target.value)}
              placeholder="Concert de jazz…"
              className={inputCls}
              required
            />
          </Field>

          {/* Date */}
          <Field label="Date et heure *">
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
              className={inputCls}
              required
            />
          </Field>

          {/* Lieu */}
          <Field label="Lieu">
            <input
              type="text"
              value={form.lieu}
              onChange={(e) => setField('lieu', e.target.value)}
              placeholder="Palais des congrès…"
              className={inputCls}
            />
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={3}
              placeholder="Décris l'événement…"
              className={inputCls + ' resize-none'}
            />
          </Field>

          {/* Photo URL */}
          <Field label="URL de la photo">
            <input
              type="url"
              value={form.photoURL}
              onChange={(e) => setField('photoURL', e.target.value)}
              placeholder="https://…"
              className={inputCls}
            />
          </Field>

          {/* Statut */}
          <Field label="Statut">
            <select
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
              className={inputCls}
            >
              {STATUTS.map((s) => (
                <option key={s} value={s}>{STATUT_LABELS[s]}</option>
              ))}
            </select>
          </Field>

          {/* Prix par catégorie */}
          <div>
            <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-2">
              Prix (FCFA)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <Field key={cat} label={cat.toUpperCase()}>
                  <input
                    type="number"
                    min="0"
                    value={form.prix[cat]}
                    onChange={(e) => setNested('prix', cat, e.target.value)}
                    placeholder="0"
                    className={inputCls}
                  />
                </Field>
              ))}
            </div>
          </div>

          {/* Quotas par catégorie */}
          <div>
            <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-2">
              Quotas (places)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <Field key={cat} label={cat.toUpperCase()}>
                  <input
                    type="number"
                    min="0"
                    value={form.quotas[cat]}
                    onChange={(e) => setNested('quotas', cat, e.target.value)}
                    placeholder="0"
                    className={inputCls}
                  />
                </Field>
              ))}
            </div>
          </div>

          {/* Erreur formulaire */}
          {formError && (
            <p className="text-[var(--color-danger)] text-sm bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1 justify-center">
              {submitting ? 'Enregistrement…' : editTarget ? 'Mettre à jour' : 'Créer'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Supprimer l'événement"
      >
        <p className="text-[var(--color-muted)] text-sm mb-6">
          Cette action est irréversible. Tous les billets associés resteront en base mais l'événement sera supprimé.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleDelete} disabled={deleting} className="flex-1 justify-center">
            {deleting ? 'Suppression…' : 'Supprimer'}
          </Button>
          <Button variant="ghost" onClick={() => setDeleteId(null)}>Annuler</Button>
        </div>
      </Modal>
    </div>
  );
}

// Carte d'un événement
function EventCard({ event, onEdit, onDelete }) {
  const dateStr = event.date?.seconds
    ? new Date(event.date.seconds * 1000).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '—';

  return (
    <Card className="flex flex-col gap-4 hover:border-[var(--color-gold)]/40 transition-colors">
      {/* Photo */}
      {event.photoURL && (
        <div className="h-36 rounded-lg overflow-hidden -mx-6 -mt-6 mb-0">
          <img
            src={event.photoURL}
            alt={event.nom}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Infos */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-[var(--color-text)] leading-tight">
          {event.nom ?? 'Sans nom'}
        </h3>
        <Badge variant={STATUT_VARIANTS[event.status] ?? 'muted'}>
          {STATUT_LABELS[event.status] ?? event.status}
        </Badge>
      </div>

      <div className="space-y-1.5 text-sm text-[var(--color-muted)]">
        <p className="flex items-center gap-2">
          <CalendarDays size={14} className="shrink-0" />
          {dateStr}
        </p>
        {event.lieu && (
          <p className="flex items-center gap-2">
            <MapPin size={14} className="shrink-0" />
            {event.lieu}
          </p>
        )}
      </div>

      {/* Prix */}
      <div className="grid grid-cols-4 gap-1 text-center">
        {['normal', 'prevente', 'vip', 'vvip'].map((cat) => (
          <div key={cat} className="bg-[var(--color-bg)] rounded-lg py-1.5 px-1">
            <p className="text-[10px] text-[var(--color-muted)] uppercase">{cat}</p>
            <p className="text-xs font-semibold text-[var(--color-gold)]">
              {event.prix?.[cat] ? `${event.prix[cat].toLocaleString()}` : '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-border)]">
        <Link
          to={`/events/${event.id}`}
          className="flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-gold)] transition-colors flex-1"
        >
          Voir les billets <ChevronRight size={14} />
        </Link>
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
          aria-label="Modifier"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-bg)] transition-colors"
          aria-label="Supprimer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </Card>
  );
}

// Wrapper label + input
function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[var(--color-muted)]">{label}</label>
      {children}
    </div>
  );
}

// Classes communes des inputs
const inputCls =
  'w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-gold)] transition-colors';
