// Page de connexion mobile (pour les scanners)
// Cette page est un exemple pour l'app web, mais le même flow sera utilisé sur React Native
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendSMSCode, verifySMSCode } from '../firebase/mobileAuth';

export default function MobileLogin() {
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const [step, setStep] = useState(1); // 1: numéro, 2: code
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Étape 1 : Envoyer le code SMS
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await sendSMSCode(phoneNumber, recaptchaRef.current);
      setConfirmationResult(result.confirmationResult);
      setStep(2);
    } catch (err) {
      const messages = {
        'PHONE_NOT_REGISTERED': 'Ce numéro n\'est pas enregistré. Contacte un administrateur.',
        'ACCOUNT_DISABLED': 'Ton compte a été désactivé.',
      };
      setError(messages[err.message] || 'Erreur lors de l\'envoi du code.');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : Vérifier le code SMS
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifySMSCode(confirmationResult, code);
      // Redirection vers l'interface de scan
      navigate('/scan', { replace: true });
    } catch (err) {
      const messages = {
        'INVALID_CODE': 'Code incorrect. Vérifie et réessaie.',
        'SCANNER_NOT_FOUND': 'Profil scanner introuvable.',
      };
      setError(messages[err.message] || 'Erreur lors de la vérification.');
    } finally {
      setLoading(false);
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
            Scanner de tickets
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8">
          {step === 1 ? (
            // Étape 1 : Numéro de téléphone
            <form onSubmit={handleSendCode} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--color-text)]">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+33612345678"
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-text)] placeholder-[var(--color-muted)]"
                />
                <p className="text-xs text-[var(--color-muted)]">
                  Format international (ex: +33 pour la France)
                </p>
              </div>

              {error && (
                <p className="text-[var(--color-danger)] text-sm bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--color-gold)] hover:bg-[var(--color-gold-soft)] text-[var(--color-bg)] font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Envoi...' : 'Recevoir le code'}
              </button>

              {/* Container pour reCAPTCHA (invisible) */}
              <div ref={recaptchaRef} id="recaptcha-container"></div>
            </form>
          ) : (
            // Étape 2 : Code de vérification
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--color-text)]">
                  Code de vérification
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-text)] text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-[var(--color-muted)] text-center">
                  Code envoyé au {phoneNumber}
                </p>
              </div>

              {error && (
                <p className="text-[var(--color-danger)] text-sm bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-[var(--color-gold)] hover:bg-[var(--color-gold-soft)] text-[var(--color-bg)] font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Vérification...' : 'Vérifier'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setCode('');
                    setError('');
                  }}
                  className="w-full text-[var(--color-muted)] text-sm hover:text-[var(--color-text)] transition-colors"
                >
                  Changer de numéro
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
