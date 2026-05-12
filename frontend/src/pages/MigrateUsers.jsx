// Page temporaire pour migrer les utilisateurs Firebase Auth vers Firestore
import { useState } from 'react';
import { migrateUser } from '../utils/migrateUsers';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function MigrateUsers() {
  const [form, setForm] = useState({ uid: '', nom: '', email: '', role: 'admin' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await migrateUser(form.uid, {
        nom: form.nom,
        email: form.email,
        role: form.role,
      });

      setMessage({
        type: 'success',
        text: `✅ Profil créé avec succès pour ${form.email} (${form.role})`
      });

      // Réinitialiser le formulaire
      setForm({ uid: '', nom: '', email: '', role: 'admin' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Erreur : ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text)]">
          Migration des utilisateurs
        </h1>
        <p className="text-[var(--color-muted)] mt-2">
          Crée les profils Firestore pour les utilisateurs déjà créés dans Firebase Auth
        </p>
      </div>

      <Card className="bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20">
        <div className="space-y-2">
          <h3 className="font-semibold text-[var(--color-text)]">
            📋 Comment récupérer l'UID ?
          </h3>
          <ol className="text-sm text-[var(--color-muted)] space-y-1 list-decimal list-inside">
            <li>Va dans Firebase Console</li>
            <li>Clique sur <strong>Authentication</strong></li>
            <li>Clique sur l'utilisateur</li>
            <li>Copie l'<strong>UID</strong> (User UID)</li>
          </ol>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* UID */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              UID Firebase Auth *
            </label>
            <input
              type="text"
              required
              value={form.uid}
              onChange={(e) => setForm({ ...form, uid: e.target.value })}
              placeholder="abc123xyz789..."
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-[var(--color-text)]"
            />
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Récupère l'UID depuis Firebase Console &gt; Authentication
            </p>
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Nom complet *
            </label>
            <input
              type="text"
              required
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Jean Dupont"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-[var(--color-text)]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@hirrdé.com"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-[var(--color-text)]"
            />
          </div>

          {/* Rôle */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Rôle *
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-[var(--color-text)]"
            >
              <option value="admin">Admin</option>
              <option value="scanner">Scanner</option>
            </select>
          </div>

          {/* Message */}
          {message.text && (
            <div
              className={`text-sm rounded-lg px-4 py-3 ${
                message.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                  : 'bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)]'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Bouton */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full justify-center"
          >
            {loading ? 'Migration en cours...' : 'Créer le profil Firestore'}
          </Button>
        </form>
      </Card>

      <Card className="bg-[var(--color-muted)]/5">
        <div className="space-y-2">
          <h3 className="font-semibold text-[var(--color-text)]">
            ℹ️ Après la migration
          </h3>
          <p className="text-sm text-[var(--color-muted)]">
            Une fois tous tes utilisateurs migrés, tu peux supprimer cette page et le fichier <code>migrateUsers.js</code>.
            Les nouveaux utilisateurs seront créés directement avec leur profil via la page "Utilisateurs".
          </p>
        </div>
      </Card>
    </div>
  );
}
