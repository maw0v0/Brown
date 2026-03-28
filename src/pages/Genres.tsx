import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layers, Star } from 'lucide-react';

const Genres = () => {
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGenre = searchParams.get('g');
  const [genres, setGenres] = useState<any[]>([]);
  const [manhwaList, setManhwaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('genres').select('*').order('name').then(({ data }) => {
      if (data) setGenres(data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetchManhwa = async () => {
      if (selectedGenre) {
        const genre = genres.find(g => g.slug === selectedGenre);
        if (genre) {
          const { data } = await supabase.from('manhwa_genres').select('manhwa_id, manhwa(*)').eq('genre_id', genre.id);
          setManhwaList(data?.map((d: any) => d.manhwa).filter(Boolean) || []);
        }
      } else {
        const { data } = await supabase.from('manhwa').select('*').order('views', { ascending: false });
        setManhwaList(data || []);
      }
      setLoading(false);
    };
    if (genres.length > 0 || !selectedGenre) fetchManhwa();
  }, [selectedGenre, genres]);

  return (
    <div className="min-h-screen container py-8">
      <h1 className="text-3xl font-bold text-foreground font-cairo mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        {t('genres')}
      </h1>

      {/* Genre pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSearchParams({})}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!selectedGenre ? 'bg-primary text-primary-foreground glow-purple' : 'bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
        >
          {lang === 'ar' ? 'الكل' : 'All'}
        </button>
        {genres.map(g => (
          <button
            key={g.id}
            onClick={() => setSearchParams({ g: g.slug })}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedGenre === g.slug ? 'bg-primary text-primary-foreground glow-purple' : 'bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
          >
            {lang === 'ar' ? g.name_ar : g.name}
          </button>
        ))}
      </div>

      {/* Manhwa grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[5/7] rounded-lg bg-secondary animate-pulse" />
          ))}
        </div>
      ) : manhwaList.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {manhwaList.map((m: any) => (
            <Link key={m.id} to={`/manhwa/${m.slug}`} className="group relative block">
              <div className="relative overflow-hidden rounded-lg aspect-[5/7] bg-secondary">
                <img
                  src={m.cover_url || `https://placehold.co/400x560/1a1a2e/7c3aed?text=${encodeURIComponent(m.title)}`}
                  alt={lang === 'ar' ? (m.title_ar || m.title) : m.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-0 p-3">
                  <h3 className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {lang === 'ar' ? (m.title_ar || m.title) : m.title}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">{t('noResults')}</div>
      )}
    </div>
  );
};

export default Genres;
