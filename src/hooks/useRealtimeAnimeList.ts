import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAnimeListStore } from '@/stores/animeListStore';
import { supabase } from '@/integrations/supabase/client';

/**
 * 📡 Hook Real-time Supabase
 * 
 * Charge les données initiales et écoute les changements en temps réel
 * Mise à jour INSTANTANÉE sur tous les devices
 * 
 * ✅ DISCORD-FIRST: Données viennent 100% du serveur
 * ❌ ZÉRO stockage local
 */
export const useRealtimeAnimeList = () => {
  const { user } = useAuth();
  const { setItems, clearItems } = useAnimeListStore();

  // Charger données initiales
  const loadInitialData = useCallback(async () => {
    if (!user?.id) {
      console.log('⚠️ Pas d\'utilisateur connecté');
      clearItems();
      return;
    }

    try {
      console.log(`📥 Chargement initial de la liste pour ${user.id}`);
      
      const { data, error } = await supabase
        .from('anime_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('date_added', { ascending: false });

      if (error) {
        console.error('❌ Erreur chargement initial:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.log('📭 Aucun anime trouvé, liste vide');
        setItems([]);
        return;
      }

      console.log(`✅ ${data.length} anime(s) chargé(s)`);
      setItems(data as any[]);
    } catch (err) {
      console.error('❌ Erreur chargement:', err);
    }
  }, [user?.id, setItems, clearItems]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) {
      console.log('🔓 Utilisateur déconnecté');
      clearItems();
      return;
    }

    console.log(`📡 Activation real-time sync pour ${user.id}`);

    // Charger données initiales
    loadInitialData();

    // S'abonner aux changements
    const subscription = supabase
      .channel(`anime_list_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'anime_lists',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log(`📦 ${payload.eventType}`);

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            console.log(`✅ Item updated/added`);
            loadInitialData(); // Reload all data
          } else if (payload.eventType === 'DELETE') {
            console.log(`🗑️ Item deleted`);
            loadInitialData(); // Reload all data
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Unsubscribing from real-time');
      supabase.removeChannel(subscription);
    };
  }, [user?.id, loadInitialData, clearItems]);
};
