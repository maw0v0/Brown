import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Link, useSearchParams } from 'react-router-dom';
import { Star, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Browse = () => {
  const { t, lang } = useI18n();
  const [searchParams] = useSearchParams();
  const [manhwaList, setManhwaList] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [sortBy, setSortBy] = useState('views');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: g } = await supabase.from('genres').select('*').order('name');
      if (g) setGenres(g);

      let query = supabase.from('manhwa').select('*, manhwa_genres(genre_id)');
      if (statusFilter !== 'all') query = query.eq('status', statusFilter as 'ongoing' | 'completed' | 'hiatus');
      if (sortBy === 'views') query = query.order('views', { ascending: false });
      else if (sortBy === 'latest') query = query.order('created_at', { ascending: false });
      else if (sortBy === 'title') query = query.order('title');

      const { data } = await query;
      let filtered = data || [];
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((m: any) => m.title.toLowerCase().includes(q) || m.title_ar?.toLowerCase().includes(q));
      }
      if (genreFilter !== 'all') {
        filtered = filtered.filter((m: any) => m.manhwa_genres?.some((mg: any) => mg.genre_id === genreFilter));
      }
      setManhwaList(filtered);
      setLoading(false);
    };
    fetchData();
  }, [statusFilter, genreFilter, sortBy, searchQuery]);

  return (
    <div className="min-h-screen container py-8">
      <h1 className="text-3xl font-bold text-foreground font-cairo mb-6">
        {lang === 'ar' ? 'تصفح المانهوا' : 'Browse Manhwa'}
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('search')} className="ps-9 bg-card/50 border-border/50" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-card/50 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === 'ar' ? 'كل الحالات' : 'All Status'}</SelectItem>
            <SelectItem value="ongoing">{t('ongoing')}</SelectItem>
            <SelectItem value="completed">{t('completed')}</SelectItem>
            <SelectItem value="hiatus">{t('hiatus')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="w-[160px] bg-card/50 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === 'ar' ? 'كل التصنيفات' : 'All Genres'}</SelectItem>
            {genres.map(g => <SelectItem key={g.id} value={g.id}>{lang === 'ar' ? g.name_ar : g.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px] bg-card/50 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="views">{lang === 'ar' ? 'الأكثر مشاهدة' : 'Most Views'}</SelectItem>
            <SelectItem value="latest">{lang === 'ar' ? 'الأحدث' : 'Latest'}</SelectItem>
            <SelectItem value="title">{lang === 'ar' ? 'الاسم' : 'Title'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-[5/7] rounded-lg bg-secondary animate-pulse" />)}
        </div>
      ) : manhwaList.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {manhwaList.map((m: any) => (
            <Link key={m.id} to={`/manhwa/${m.slug}`} className="group relative block">
              <div className="relative overflow-hidden rounded-lg aspect-[5/7] bg-secondary">
                <img src={m.cover_url || `https://placehold.co/400x560/1a1a2e/7c3aed?text=${encodeURIComponent(m.title)}`} alt={lang === 'ar' ? (m.title_ar || m.title) : m.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-primary/30 rounded-lg" />
                <div className="absolute top-2 start-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${m.status === 'ongoing' ? 'bg-emerald-500/80 text-white' : m.status === 'completed' ? 'bg-sky-500/80 text-white' : 'bg-amber-500/80 text-white'}`}>
                    {t(m.status)}
                  </span>
                </div>
                <div className="absolute bottom-0 start-0 end-0 p-3">
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

export default Browse;
