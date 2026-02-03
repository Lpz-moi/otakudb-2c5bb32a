import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  anime_id: number;
  anime_title: string;
  anime_image: string | null;
  activity_type: 'added' | 'completed' | 'rated' | 'favorited' | 'started_watching';
  details?: Record<string, unknown> | null;
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

      // Use the 'activities' table which exists in the schema
      const { data, error: err } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (err) {
        console.error('❌ Erreur chargement activités:', err);
        setError('Impossible de charger l\'activité');
        return;
      }

      // Transform activities data to match our interface
      const transformedData: ActivityLogEntry[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        anime_id: item.anime_id,
        anime_title: item.anime_title,
        anime_image: item.anime_image,
        activity_type: item.activity_type as ActivityLogEntry['activity_type'],
        details: item.details as Record<string, unknown> | null,
        created_at: item.created_at,
      }));

      setActivities(transformedData);
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
          table: 'activities',
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
