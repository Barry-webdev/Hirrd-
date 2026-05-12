// Hook pour la gestion des billets Firestore
import { useState, useEffect } from 'react';
import { getTicketsByEvent } from '../firebase/tickets';

export function useTickets(eventId) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!eventId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getTicketsByEvent(eventId);
        setTickets(data);
      } catch (err) {
        setError(err.message ?? 'Erreur lors du chargement des billets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [eventId]);

  return { tickets, loading, error };
}
