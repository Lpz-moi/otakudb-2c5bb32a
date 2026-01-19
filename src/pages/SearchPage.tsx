import { useState, useEffect } from 'react';
import { Search as SearchIcon, Filter, TrendingUp } from 'lucide-react';
import { searchAnime, getTopAnime, type Anime } from '@/services/jikanApi';
import { SearchBar } from '@/components/search/SearchBar';
import { AnimeGrid } from '@/components/anime/AnimeGrid';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [trending, setTrending] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load trending on mount
  useEffect(() => {
    const loadTrending = async () => {
      try {
        const res = await getTopAnime(1, 'airing');
        setTrending(res.data.slice(0, 18));
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };
    loadTrending();
  }, []);

  // Search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const res = await searchAnime(query);
        setResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const showTrending = !query.trim() && !loading;

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <SearchIcon className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold">Recherche</h1>
        </div>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Naruto, One Piece, Attack on Titan..."
          autoFocus
        />
      </div>

      {/* Results or Trending */}
      {query.trim() ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">
              {loading ? 'Recherche...' : `${results.length} résultat${results.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <AnimeGrid 
            animes={results} 
            loading={loading} 
            emptyMessage="Aucun anime trouvé pour cette recherche"
          />
        </section>
      ) : (
        <section>
          <h2 className="section-title flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            En cours de diffusion
          </h2>
          <AnimeGrid animes={trending} loading={initialLoading} />
        </section>
      )}
    </div>
  );
};

export default SearchPage;
