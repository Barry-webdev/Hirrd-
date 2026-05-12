// Page Paramètres — profil, sécurité, infos de l'application
import { useState } from 'react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../firebase/config';
import { updateUser } from '../firebase/users';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { User, Lock, Info, CheckCircle, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { user, role } = useAuth();

  // Formulaire nom
  const [nom,        setNom]        = useState(user?.displayName ?? '');
  const [savingNom,  setSavingNom]  = useState(false);
  const [nomMsg,     setNomMsg]     = useState(null); // { ok, text }

  // Formulaire mot de passe
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [savingPwd,  setSavingPwd]  = useState(false);
  const [pwdMsg,     setPwdMsg]     = useState(null);

  // Mise à jour du nom dans Firestore
  const handleSaveNom = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return;
    setSavingNom(true);
    setNomMsg(null);
    try {
      if (user?.uid) {
        await updateUser(user.uid, { nom: nom.trim() });
      }
      setNomMsg({ ok: true, text: 'Nom mis à jour.' });
    } catch (err) {
      setNomMsg({ ok: false, text: err.message ?? 'Erreur lors de la mise à jour.' });
    } finally {
      setSavingNom(false);
    }
  };

  // Changement de mot de passe
  const handleChangePwd = async (e) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPwd.length < 6) {
      setPwdMsg({ ok: false, text: 'Le nouveau mot de passe doit faire au moins 6 caractères.' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ ok: false, text: 'Les mots de passe ne correspondent pas.' });
      return;
    }

    setSavingPwd(true);
    try {
      // Ré-authentification requise avant changement de mot de passe
      const credential = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPwd);
      setPwdMsg({ ok: true, text: 'Mot de passe mis à jour.' });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      const msgs = {
        'auth/wrong-password':          'Mot de passe actuel incorrect.',
        'auth/too-many-requests':       'Trop de tentatives. Réessaie plus tard.',
        'auth/requires-recent-login':   'Session expirée. Reconnecte-toi.',
      };
      setPwdMsg({ ok: false, text: msgs[err.code] ?? err.message ?? 'Erreur.' });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Paramètres</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">Gère ton profil et ta sécurité</p>
      </div>

      {/* Profil */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <User size={18} className="text-[var(--color-gold)]" />
          <h3 className="font-semibold text-[var(--color-text)]">Profil</h3>
        </div>

        {/* Avatar + infos */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--color-border)]">
          <div className="w-14 h-14 rounded-full bg-[var(--color-gold)] flex items-center justify-center text-[var(--color-bg)] text-xl font-bold">
            {(user?.displayName ?? user?.email ?? 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-[var(--color-text)]">
              {user?.displayName ?? user?.email ?? '—'}
            </p>
            <p className="text-sm text-[var(--color-muted)]">{user?.email}</p>
            <div className="mt-1">
              <Badge variant={role === 'admin' ? 'gold' : 'muted'}>{role ?? '—'}</Badge>
            </div>
          </div>
        </div>

        {/* Formulaire nom */}
        <form onSubmit={handleSaveNom} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--color-muted)]">
              Nom d'affichage
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ton nom"
              className={inputCls}
            />
          </div>

          {nomMsg && (
            <Feedback ok={nomMsg.ok} text={nomMsg.text} />
          )}

          <Button type="submit" disabled={savingNom || !nom.trim()}>
            {savingNom ? 'Enregistrement…' : 'Sauvegarder'}
          </Button>
        </form>
      </Card>

      {/* Sécurité */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <Lock size={18} className="text-[var(--color-gold)]" />
          <h3 className="font-semibold text-[var(--color-text)]">Sécurité</h3>
        </div>

        <form onSubmit={handleChangePwd} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--color-muted)]">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--color-muted)]">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="6 caractères minimum"
              className={inputCls}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--color-muted)]">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
              required
            />
          </div>

          {pwdMsg && <Feedback ok={pwdMsg.ok} text={pwdMsg.text} />}

          <Button type="submit" disabled={savingPwd}>
            {savingPwd ? 'Mise à jour…' : 'Changer le mot de passe'}
          </Button>
        </form>
      </Card>

      {/* Infos application */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Info size={18} className="text-[var(--color-gold)]" />
          <h3 className="font-semibold text-[var(--color-text)]">Application</h3>
        </div>
        <div className="space-y-2 text-sm">
          {[
            ['Projet',    'Hirrdé Admin'],
            ['Version',   '1.0.0'],
            ['Stack',     'React · Firebase · Tailwind CSS v4'],
            ['Environnement', import.meta.env.MODE],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
              <span className="text-[var(--color-muted)]">{label}</span>
              <span className="text-[var(--color-text)] font-medium">{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Composant feedback inline
function Feedback({ ok, text }) {
  return (
    <div
      className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border ${
        ok
          ? 'text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20'
          : 'text-[var(--color-danger)] bg-[var(--color-danger)]/10 border-[var(--color-danger)]/20'
      }`}
    >
      {ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
      {text}
    </div>
  );
}

const inputCls =
  'w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-gold)] transition-colors';
