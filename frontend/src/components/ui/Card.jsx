// Composant Card — conteneur de surface réutilisable
export default function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 ${className}`}
    >
      {children}
    </div>
  );
}
