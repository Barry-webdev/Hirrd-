// Page de connexion — authentification Firebase email/mot de passe
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate          = useNavigate();
  const { user, loading, role } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirection automatique si déjà connecté
  if (!loading && user && role) {
    // Redirection selon le rôle
    if (role === 'owner') {
      navigate('/owner-dashboard', { replace: true });
    } else if (role === 'scanner') {
      navigate('/settings', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
    return null;
  }

  // Traduction des codes d'erreur Firebase en messages lisibles
  const getErrorMessage = (code) => {
    const messages = {
      'auth/user-not-found':      'Aucun compte trouvé avec cet email.',
      'auth/wrong-password':      'Mot de passe incorrect.',
      'auth/invalid-email':       'Adresse email invalide.',
      'auth/too-many-requests':   'Trop de tentatives. Réessaie plus tard.',
      'auth/invalid-credential':  'Identifiants incorrects.',
      'ACCESS_DENIED_ADMIN':      'Accès refusé. Ce compte n\'est pas un compte administrateur.',
    };
    return messages[code] ?? 'Une erreur est survenue. Réessaie.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Connexion simple sans vérification de rôle
      await signInWithEmailAndPassword(auth, email, password);
      
      // Récupérer le rôle de l'utilisateur
      const { getUserById } = await import('../firebase/users');
      const userProfile = await getUserById(auth.currentUser.uid);
      
      // Redirection selon le rôle
      if (userProfile.role === 'owner') {
        navigate('/owner-dashboard', { replace: true });
      } else if (userProfile.role === 'scanner') {
        navigate('/settings', { replace: true });
      } else {
        // admin ou autre
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err.code || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img src="/images/logo.png" alt="Hirrdé" className="h-30 w-62 mb-4" />
          <p className="text-[var(--color-muted)] text-sm">
            Connexion au système
          </p>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 space-y-5"
        >
          {/* Champ Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--color-text)]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-gold)] transition-colors"
            />
          </div>

          {/* Champ Mot de passe */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--color-text)]"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-gold)] transition-colors"
            />
          </div>

          {/* Message d'erreur */}
          {error && (
            <p className="text-[var(--color-danger)] text-sm bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {/* Bouton de connexion */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[var(--color-gold)] hover:bg-[var(--color-gold-soft)] text-[var(--color-bg)] font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
