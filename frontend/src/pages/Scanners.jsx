// Page de gestion des scanners (utilisateurs mobiles)
import { useState, useEffect } from 'react';
import { createScanner, getUsers, updateUser, deleteUser } from '../firebase/users';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

export default function Scanners() {
  const [scanners, setScanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phoneNumber: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Charger les scanners
  useEffect(() => {
    loadScanners();
  }, []);

  const loadScanners = async () => {
    try {
      const allUsers = await getUsers();
      const scannersList = allUsers.filter(u => u.role === 'scanner');
      setScanners(scannersList);
    } catch (err) {
      console.error('Erreur chargement scanners:', err);
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau scanner
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Valider le format du numéro (format international)
      if (!formData.phoneNumber.startsWith('+')) {
        setError('Le numéro doit être au format international (ex: +33612345678)');
        setSubmitting(false);
        return;
      }

      await createScanner({
        name: formData.name,
        phoneNumber: formData.phoneNumber,
      });

      // Recharger la liste
      await loadScanners();
      
      // Réinitialiser le formulaire
      setFormData({ name: '', phoneNumber: '' });
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du scanner');
    } finally {
      setSubmitting(false);
    }
  };

  // Activer/désactiver un scanner
  const toggleActive = async (scanner) => {
    try {
      await updateUser(scanner.id, { isActive: !scanner.isActive });
      await loadScanners();
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  // Supprimer un scanner
  const handleDelete = async (scannerId) => {
    if (!confirm('Supprimer ce scanner ?')) return;
    
    try {
      await deleteUser(scannerId);
      await loadScanners();
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--color-muted)]">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Scanners</h1>
          <p className="text-[var(--color-muted)] mt-1">
            Gérer les utilisateurs de l'application mobile
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          + Nouveau scanner
        </Button>
      </div>

      {/* Liste des scanners */}
      <div className="grid gap-4">
        {scanners.length === 0 ? (
          <Card>
            <p className="text-center text-[var(--color-muted)] py-8">
              Aucun scanner créé. Commence par en ajouter un !
            </p>
          </Card>
        ) : (
          scanners.map((scanner) => (
            <Card key={scanner.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-[var(--color-text)]">
                      {scanner.name}
                    </h3>
                    <Badge variant={scanner.isActive ? 'success' : 'default'}>
                      {scanner.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <p className="text-[var(--color-muted)] text-sm mt-1">
                    {scanner.phoneNumber}
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-1">
                    Créé le {scanner.createdAt?.toDate?.().toLocaleDateString('fr-FR') || 'N/A'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(scanner)}
                  >
                    {scanner.isActive ? 'Désactiver' : 'Activer'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(scanner.id)}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal de création */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setError('');
          setFormData({ name: '', phoneNumber: '' });
        }}
        title="Nouveau scanner"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Nom complet
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Jean Dupont"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-[var(--color-text)]"
            />
          </div>

          {/* Numéro de téléphone */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+33612345678"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-[var(--color-text)]"
            />
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Format international requis (ex: +33 pour la France)
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <p className="text-[var(--color-danger)] text-sm bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
