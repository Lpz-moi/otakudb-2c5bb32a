import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RecommendedAnime {
  id: number;
  title: string;
  image_url: string;
  score: number;
  genres: string[];
  match_score: number;
}

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<RecommendedAnime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // 1. Fetch User History & Preferences
        const { data: userLists } = await supabase
          .from('anime_lists')
          .select('anime_id, status, score, anime_data')
          .eq('user_id', user.id);

        if (!userLists || userLists.length === 0) {
           // Cold start: Fetch popular as fallback if no history
           const { data: popular } = await supabase
             .from('animes')
             .select('*')
             .order('popularity', { ascending: false })
             .limit(12);
           
           setRecommendations(popular?.map(a => ({ ...a, match_score: 0 })) || []);
           setLoading(false);
           return;
        }

        // 2. Analyze Preferences (Weighted by score)
        const genreCounts: Record<string, number> = {};
        userLists.forEach((item: any) => {
            const genres = item.anime_data?.genres || [];
            const weight = item.score ? item.score / 5 : 1;
            genres.forEach((g: string) => {
                genreCounts[g] = (genreCounts[g] || 0) + weight;
            });
        });

        // 3. Fetch Candidates (Exclude watched)
        const viewedIds = userLists.map((i: any) => i.anime_id);
        
        const { data: candidates } = await supabase
            .from('animes')
            .select('*')
            .not('id', 'in', `(${viewedIds.join(',')})`)
            .limit(50);

        if (!candidates) {
            setRecommendations([]);
            return;
        }

        // 4. Score Candidates
        const scored = candidates.map((anime: any) => {
            let score = 0;
            const animeGenres = anime.genres || [];
            
            animeGenres.forEach((g: string) => {
                if (genreCounts[g]) score += genreCounts[g];
            });

            score += (anime.score || 0);

            return { ...anime, match_score: score };
        });

        // 5. Sort by Match Score
        const finalRecs = scored
            .sort((a: any, b: any) => b.match_score - a.match_score)
            .slice(0, 12);

        setRecommendations(finalRecs);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecommendations();
  }, []);

  return { recommendations, loading };
}