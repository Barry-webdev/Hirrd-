// Générateur de numéros de série — format HRD-YYYY-XXXXXXX (aléatoire, non séquentiel)

/**
 * Génère un numéro de série unique au format HRD-YYYY-XXXXXXX
 * @returns {string} ex: HRD-2025-A3F7K2P
 */
export function generateSerial() {
  const year    = new Date().getFullYear();
  const chars   = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I, O, 0, 1 pour éviter la confusion
  const length  = 7;
  let suffix    = '';

  for (let i = 0; i < length; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }

  return `HRD-${year}-${suffix}`;
}
