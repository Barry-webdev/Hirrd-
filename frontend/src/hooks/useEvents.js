// Hook pour la gestion des événements Firestore
import { useState, useEffect } from 'react';
import { getEvents } from '../firebase/events';

export function useEvents() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (err) {
        setError(err.message ?? 'Erreur lors du chargement des événements');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading, error };
}
