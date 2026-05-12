// Utilitaire QR Code — génère les données encodées dans le QR d'un billet

/**
 * Génère la chaîne JSON à encoder dans le QR code d'un billet
 * @param {string} ticketId    - ID Firestore du billet
 * @param {string} eventId     - ID de l'événement associé
 * @param {string} numeroUnique - Numéro de série HRD-YYYY-XXXXXXX
 * @returns {string} JSON stringifié
 */
export function generateQrCodeData(ticketId, eventId, numeroUnique) {
  return JSON.stringify({ ticketId, eventId, numeroUnique });
}

/**
 * Parse les données d'un QR code scanné
 * @param {string} raw - Chaîne brute lue par le scanner
 * @returns {{ ticketId: string, eventId: string, numeroUnique: string } | null}
 */
export function parseQrCodeData(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.ticketId && parsed.eventId && parsed.numeroUnique) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
