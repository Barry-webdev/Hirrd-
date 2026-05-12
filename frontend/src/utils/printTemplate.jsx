// Template d'impression pour les billets Hirrdé
import { QRCodeSVG as QRCode } from 'qrcode.react';

/**
 * Composant de billet imprimable
 * À utiliser avec react-to-print via une ref
 */
export default function PrintTemplate({ ticket, event }) {
  if (!ticket || !event) return null;

  return (
    <div
      style={{
        width: '80mm',
        padding: '16px',
        fontFamily: "'DM Sans', sans-serif",
        color: '#0a0a0a',
        background: '#fff',
      }}
    >
      {/* En-tête */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', margin: 0 }}>
          Hirr<span style={{ color: '#c9a84c' }}>dé</span>
        </h1>
        <p style={{ fontSize: '14px', fontWeight: 600, margin: '4px 0 0' }}>
          {event.nom}
        </p>
        <p style={{ fontSize: '11px', color: '#6b6b6b', margin: '2px 0 0' }}>
          {event.lieu}
        </p>
      </div>

      {/* QR Code centré */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
        <QRCode value={ticket.qrCodeData} size={120} />
      </div>

      {/* Infos billet */}
      <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '10px', fontSize: '11px' }}>
        <p style={{ margin: '2px 0' }}>
          <strong>N° :</strong> {ticket.numeroUnique}
        </p>
        <p style={{ margin: '2px 0' }}>
          <strong>Catégorie :</strong> {ticket.categorie.toUpperCase()}
        </p>
        <p style={{ margin: '2px 0' }}>
          <strong>Prix :</strong> {ticket.prix} FCFA
        </p>
      </div>
    </div>
  );
}
