import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  anime_id: number;
  anime_title: string;
  anime_image: string | null;
  action_type: 'added' | 'completed' | 'status_changed' | 'rating_changed';
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

/**
 * Hook pour récupérer l'activité récente de l'utilisateur
 * Charge les 10 dernières actions avec real-time updates
 */
export const useRecentActivity = (limit: number = 10) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données initiales
  const loadActivities = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (err) {
        console.error('❌ Erreur chargement activités:', err);
        setError('Impossible de charger l\'activité');
        return;
      }

      setActivities(data || []);
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [user?.id, limit]);

  // Charger au montage
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel(`activity-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Ajouter la nouvelle activité au début
          const newActivity = payload.new as ActivityLogEntry;
          setActivities((prev) => [newActivity, ...prev.slice(0, limit - 1)]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, limit]);

  return { activities, loading, error, refetch: loadActivities };
};
