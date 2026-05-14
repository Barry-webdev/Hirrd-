// Page Utilisateurs — gestion des admins et scanners (admin uniquement)
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createAccount } from '../firebase/auth';
import { setUserProfile, updateUser, deleteUser } from '../firebase/users';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import {
  Plus, Users as UsersIcon, Shield, ScanLine,
  Pencil, Trash2, AlertCircle, UserCheck,
} from 'lucide-react';

const ROLE_VARIANTS = { admin: 'gold', scanner: 'muted', owner: 'success' };
const ROLE_ICONS    = { admin: Shield, scanner: ScanLine, owner: UserCheck };

const FORM_INIT = { nom: '', email: '', password: '', role: 'scanner', eventAssigned: '', eventsAssigned: [], phoneNumber: '' };

export default function Users() {
  const { role: currentRole } = useAuth();

  const [users,      setUsers]      = useState([]);
  const [events,     setEvents]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form,       setForm]       = useState(FORM_INIT);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState('');
  const [deleteId,   setDeleteId]   = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  // Chargement
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersSnap, eventsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'events')),
      ]);
      setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setEvents(eventsSnap.docs.map((d) => ({ id: d.id, nom: d.data().nom ?? 'Sans nom' })));
    } catch (err) {
      setError(err.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Ouvrir modal création
  const openCreate = () => {
    setEditTarget(null);
    setForm(FORM_INIT);
    setFormError('');
    setModalOpen(true);
  };

  // Ouvrir modal édition (pas de changement de mot de passe en édition)
  const openEdit = (u) => {
    setEditTarget(u);
    setFormError('');
    setForm({
      nom:            u.nom ?? '',
      email:          u.email ?? '',
      password:       '',
      role:           u.role ?? 'scanner',
      eventAssigned:  u.eventAssigned ?? '',
      eventsAssigned: u.eventsAssigned ?? [],
      phoneNumber:    u.phoneNumber ?? '',
    });
    setModalOpen(true);
  };

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Règle métier : seul un admin peut créer des comptes
    if (currentRole !== 'admin') {
      setFormError('Accès refusé — rôle admin requis.');
      return;
    }

    if (!form.nom.trim() || !form.email.trim()) {
      setFormError('Nom et email sont obligatoires.');
      return;
    }

    // Validation du numéro de téléphone pour les scanners
    if (form.role === 'scanner' && !form.phoneNumber.trim()) {
      setFormError('Le numéro de téléphone est obligatoire pour les scanners.');
      return;
    }

    if (form.role === 'scanner' && !form.phoneNumber.startsWith('+')) {
      setFormError('Le numéro doit être au format international (ex: +33612345678).');
      return;
    }

    // Validation des événements assignés pour les propriétaires
    if (form.role === 'owner' && form.eventsAssigned.length === 0) {
      setFormError('Vous devez assigner au moins un événement au propriétaire.');
      return;
    }

    if (!editTarget && !form.password) {
      setFormError('Le mot de passe est obligatoire pour un nouveau compte.');
      return;
    }

    setSubmitting(true);
    try {
      if (editTarget) {
        // Mise à jour du profil uniquement (pas de changement d'email/password ici)
        const updateData = {
          nom:  form.nom.trim(),
          role: form.role,
        };

        // Données spécifiques selon le rôle
        if (form.role === 'scanner') {
          updateData.eventAssigned = form.eventAssigned || null;
          updateData.phoneNumber = form.phoneNumber.trim() || null;
          updateData.eventsAssigned = null; // Nettoyer si changement de rôle
        } else if (form.role === 'owner') {
          updateData.eventsAssigned = form.eventsAssigned;
          updateData.eventAssigned = null; // Nettoyer si changement de rôle
          updateData.phoneNumber = null;
        } else {
          // Admin
          updateData.eventAssigned = null;
          updateData.eventsAssigned = null;
          updateData.phoneNumber = null;
        }

        await updateUser(editTarget.id, updateData);
      } else {
        // Création du compte Firebase Auth + profil Firestore
        const cred = await createAccount(form.email.trim(), form.password);
        const profileData = {
          nom:   form.nom.trim(),
          email: form.email.trim(),
          role:  form.role,
        };

        // Données spécifiques selon le rôle
        if (form.role === 'scanner') {
          profileData.eventAssigned = form.eventAssigned || null;
          profileData.phoneNumber = form.phoneNumber.trim() || null;
        } else if (form.role === 'owner') {
          profileData.eventsAssigned = form.eventsAssigned;
        }

        await setUserProfile(cred.user.uid, profileData);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Cet email est déjà utilisé.',
        'auth/weak-password':        'Mot de passe trop faible (6 caractères min).',
        'auth/invalid-email':        'Email invalide.',
      };
      setFormError(msgs[err.code] ?? err.message ?? 'Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  };

  // Suppression
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteUser(deleteId);
      setDeleteId(null);
      await load();
    } catch (err) {
      console.error('Erreur suppression :', err);
    } finally {
      setDeleting(false);
    }
  };

  const admins   = users.filter((u) => u.role === 'admin');
  const scanners = users.filter((u) => u.role === 'scanner');
  const owners   = users.filter((u) => u.role === 'owner');

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Utilisateurs</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            {admins.length} admin{admins.length !== 1 ? 's' : ''} · {owners.length} propriétaire{owners.length !== 1 ? 's' : ''} · {scanners.length} scanner{scanners.length !== 1 ? 's' : ''}
          </p>
        </div>
        {currentRole === 'admin' && (
          <Button onClick={openCreate}>
            <Plus size={16} /> Nouvel utilisateur
          </Button>
        )}
      </div>

      {/* Avertissement si non-admin */}
      {currentRole !== 'admin' && (
        <div className="flex items-center gap-2 text-[var(--color-warning)] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} />
          Lecture seule — seul un admin peut gérer les utilisateurs.
        </div>
      )}

      {/* Tableau */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h3 className="font-semibold text-[var(--color-text)]">
            Tous les utilisateurs ({users.length})
          </h3>
        </div>

        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-muted)]">
            <UsersIcon size={28} />
            <p className="text-sm">Aucun utilisateur</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['Nom', 'Email / Téléphone', 'Rôle', 'Événement(s) assigné(s)', ''].map((h) => (
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
                {users.map((u) => {
                  const RoleIcon = ROLE_ICONS[u.role] ?? UserCheck;
                  const assignedEvent = events.find((e) => e.id === u.eventAssigned);
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)] transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-gold)]/20 flex items-center justify-center text-[var(--color-gold)] text-xs font-semibold shrink-0">
                            {u.nom?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <span className="text-[var(--color-text)] font-medium">{u.nom ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-[var(--color-muted)] text-xs">
                        {u.role === 'scanner' && u.phoneNumber 
                          ? u.phoneNumber 
                          : (u.email ?? '—')}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={ROLE_VARIANTS[u.role] ?? 'muted'}>
                          <RoleIcon size={11} className="mr-1" />
                          {u.role === 'owner' ? 'propriétaire' : u.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-[var(--color-muted)] text-xs">
                        {u.role === 'scanner' ? (
                          assignedEvent?.nom ?? (u.eventAssigned ? u.eventAssigned : '—')
                        ) : u.role === 'owner' ? (
                          u.eventsAssigned && u.eventsAssigned.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {u.eventsAssigned.map((evId) => {
                                const ev = events.find((e) => e.id === evId);
                                return (
                                  <Badge key={evId} variant="muted" className="text-xs">
                                    {ev?.nom ?? evId}
                                  </Badge>
                                );
                              })}
                            </div>
                          ) : '—'
                        ) : (
                          <span className="text-[var(--color-border)]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {currentRole === 'admin' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(u)}
                              className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
                              aria-label="Modifier"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteId(u.id)}
                              className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-bg)] transition-colors"
                              aria-label="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal création / édition */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nom complet *">
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setField('nom', e.target.value)}
              placeholder="Prénom Nom"
              className={inputCls}
              required
            />
          </Field>

          {!editTarget && (
            <>
              <Field label="Email *">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="email@exemple.com"
                  className={inputCls}
                  required
                />
              </Field>
              <Field label="Mot de passe *">
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  placeholder="6 caractères minimum"
                  className={inputCls}
                  required
                />
              </Field>
            </>
          )}

          <Field label="Rôle">
            <select
              value={form.role}
              onChange={(e) => setField('role', e.target.value)}
              className={inputCls}
            >
              <option value="scanner">Scanner</option>
              <option value="owner">Propriétaire</option>
              <option value="admin">Admin</option>
            </select>
          </Field>

          {form.role === 'scanner' && (
            <>
              <Field label="Numéro de téléphone *">
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setField('phoneNumber', e.target.value)}
                  placeholder="+33612345678"
                  className={inputCls}
                  required
                />
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  Format international requis (ex: +33 pour la France)
                </p>
              </Field>
              
              <Field label="Événement assigné">
                <select
                  value={form.eventAssigned}
                  onChange={(e) => setField('eventAssigned', e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Aucun —</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.nom}</option>
                  ))}
                </select>
              </Field>
            </>
          )}

          {form.role === 'owner' && (
            <Field label="Événements assignés *">
              <div className="space-y-2 max-h-48 overflow-y-auto border border-[var(--color-border)] rounded-lg p-3">
                {events.length === 0 ? (
                  <p className="text-xs text-[var(--color-muted)]">Aucun événement disponible</p>
                ) : (
                  events.map((ev) => (
                    <label key={ev.id} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--color-bg)] p-2 rounded">
                      <input
                        type="checkbox"
                        checked={form.eventsAssigned.includes(ev.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setField('eventsAssigned', [...form.eventsAssigned, ev.id]);
                          } else {
                            setField('eventsAssigned', form.eventsAssigned.filter((id) => id !== ev.id));
                          }
                        }}
                        className="w-4 h-4 text-[var(--color-gold)] border-[var(--color-border)] rounded focus:ring-[var(--color-gold)]"
                      />
                      <span className="text-sm text-[var(--color-text)]">{ev.nom}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                Sélectionnez un ou plusieurs événements
              </p>
            </Field>
          )}

          {formError && (
            <p className="text-[var(--color-danger)] text-sm bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

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
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer l'utilisateur">
        <p className="text-[var(--color-muted)] text-sm mb-6">
          Le profil Firestore sera supprimé. Le compte Firebase Auth reste actif — supprime-le manuellement depuis la console Firebase si nécessaire.
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

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[var(--color-muted)]">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-gold)] transition-colors';
