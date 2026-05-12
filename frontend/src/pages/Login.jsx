// Page de connexion — authentification Firebase email/mot de passe
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate          = useNavigate();
  const { user, loading } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirection automatique si déjà connecté
  if (!loading && user) {
    navigate('/dashboard', { replace: true });
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
      // Import dynamique pour éviter les dépendances circulaires
      const { loginWithEmail } = await import('../firebase/auth');
      
      // Connexion avec vérification du rôle admin
      await loginWithEmail(email, password, 'admin');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err.code || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Titre */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-[var(--color-text)] mb-2">
            Hirr<span className="text-[var(--color-gold)]">dé</span>
          </h1>
          <p className="text-[var(--color-muted)] text-sm">
            Panneau d'administration
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
              placeholder="admin@hirrdé.com"
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
