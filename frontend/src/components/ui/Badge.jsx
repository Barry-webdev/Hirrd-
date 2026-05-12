// Composant Badge — étiquette de statut colorée
const VARIANTS = {
  gold:    'bg-[var(--color-gold)] text-[var(--color-bg)]',
  success: 'bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/30',
  danger:  'bg-[var(--color-danger)]/20 text-[var(--color-danger)] border border-[var(--color-danger)]/30',
  warning: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)] border border-[var(--color-warning)]/30',
  muted:   'bg-[var(--color-border)] text-[var(--color-muted)]',
};

export default function Badge({ children, variant = 'muted', className = '' }) {
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${VARIANTS[variant] ?? VARIANTS.muted} ${className}`}
    >
      {children}
    </span>
  );
}
