import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';

const Search = () => {
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const search = async () => {
      const { data } = await supabase.from('manhwa').select('*').or(`title.ilike.%${q}%,title_ar.ilike.%${q}%`).limit(30);
      setResults(data || []);
      setLoading(false);
    };
    search();
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  return (
    <div className="min-h-screen container py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground font-cairo mb-6">
        {t('search')}
      </h1>
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <SearchIcon className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder={lang === 'ar' ? 'ابحث عن مانهوا...' : 'Search for manhwa...'} className="ps-12 py-6 text-lg bg-card/50 border-border/50 focus:border-primary/50" autoFocus />
        </div>
      </form>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-lg bg-secondary animate-pulse" />)}</div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          {results.map((m: any) => (
            <Link key={m.id} to={`/manhwa/${m.slug}`} className="flex items-center gap-4 p-3 rounded-xl bg-card/50 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group">
              <img src={m.cover_url || `https://placehold.co/60x84/1a1a2e/7c3aed`} alt="" className="w-14 h-20 object-cover rounded-lg" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                  {lang === 'ar' ? (m.title_ar || m.title) : m.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{lang === 'ar' ? (m.description_ar || m.description) : m.description}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${m.status === 'ongoing' ? 'bg-emerald-500/15 text-emerald-400' : m.status === 'completed' ? 'bg-sky-500/15 text-sky-400' : 'bg-amber-500/15 text-amber-400'}`}>{t(m.status)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : q.trim() ? (
        <div className="text-center py-16 text-muted-foreground">{t('noResults')}</div>
      ) : null}
    </div>
  );
};

export default Search;
