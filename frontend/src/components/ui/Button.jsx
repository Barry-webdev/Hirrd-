// Composant Button — bouton réutilisable avec variantes
const VARIANTS = {
  primary:  'bg-[var(--color-gold)] hover:bg-[var(--color-gold-soft)] text-[var(--color-bg)]',
  ghost:    'bg-transparent hover:bg-[var(--color-border)] text-[var(--color-text)]',
  danger:   'bg-[var(--color-danger)]/20 hover:bg-[var(--color-danger)]/30 text-[var(--color-danger)] border border-[var(--color-danger)]/30',
  outline:  'bg-transparent border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]',
};

export default function Button({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant] ?? VARIANTS.primary} ${className}`}
    >
      {children}
    </button>
  );
}
