import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Star, Clock, TrendingUp, Sparkles, Flame, BookOpen, Lock, ArrowUpRight, Share2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
  </svg>
);

const groupChaptersByManhwa = (chapters: any[]) => {
  const grouped: Record<string, { manhwa: any; chapters: any[] }> = {};
  
  for (const ch of chapters) {
    const mId = ch.manhwa?.id || ch.manhwa_id;
    if (!mId || !ch.manhwa) continue;
    
    if (!grouped[mId]) {
      grouped[mId] = { manhwa: ch.manhwa, chapters: [] };
    }
    grouped[mId].chapters.push(ch);
  }
  return Object.values(grouped).map(group => ({
    ...group,
    chapters: group.chapters
      .sort((a, b) => b.chapter_number - a.chapter_number)
      .slice(0, 3)
  }));
};

const Index = () => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [manhwaList, setManhwaList] = useState<any[]>([]);
  const [latestChapters, setLatestChapters] = useState<any[]>([]);
  const [readingHistory, setReadingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [discordUrl, setDiscordUrl] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportType, setReportType] = useState('bug');

  useEffect(() => {
    const fetchData = async () => {
      const [manhwaRes, chaptersRes] = await Promise.all([
        supabase.from('manhwa').select('*').order('views', { ascending: false }).limit(12),
        supabase.from('chapters')
          .select('*, manhwa(id, title, title_ar, slug, cover_url, status)')
          .order('created_at', { ascending: false })
          .limit(30),
      ]);
      if (manhwaRes.data) setManhwaList(manhwaRes.data);
      if (chaptersRes.data) setLatestChapters(chaptersRes.data);

      if (user) {
        const { data: histData } = await supabase.from('reading_history')
          .select('*, chapters(chapter_number, title, manhwa_id, manhwa:manhwa_id(title, title_ar, slug, cover_url))')
          .eq('user_id', user.id)
          .order('read_at', { ascending: false })
          .limit(4); // جلب 4 فقط لتناسب التصميم الجديد (مثل الصورة)
        if (histData) setReadingHistory(histData);
      }
      
      const { data: settingsData } = await supabase.from('site_settings').select('key, value');
      if (settingsData) {
        const dUrl = settingsData.find((s: any) => s.key === 'discord_url')?.value;
        if (dUrl) setDiscordUrl(dUrl);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const featured = manhwaList[0];
  const groupedLatest = groupChaptersByManhwa(latestChapters);

  const timeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: false });
    } catch { return ''; }
  };

  const submitReport = async () => {
    if (!user) {
      toast.error(lang === 'ar' ? 'يجب تسجيل الدخول للإبلاغ' : 'Login required to report');
      setReportOpen(false);
      return;
    }
    if (!reportText.trim()) return;
    const { error } = await (supabase as any).from('reports').insert({
      user_id: user.id,
      type: reportType,
      message: reportText.trim(),
    });
    if (error) { toast.error(error.message); return; }
    toast.success(lang === 'ar' ? 'تم إرسال البلاغ شكراً لك!' : 'Report sent successfully!');
    setReportOpen(false);
    setReportText('');
  };

  // دالة لتنسيق رقم المشاهدات (مثل 1.2K أو 1M)
  const formatViews = (views: number) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[350px] md:h-[450px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-20 start-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[100px]" />
        {featured && (
          <div className="absolute inset-0 bg-cover bg-center opacity-15" style={{ backgroundImage: `url(${featured.banner_url || featured.cover_url || ''})` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="container relative h-full flex items-end pb-10">
          <div className="flex gap-5 items-end max-w-3xl">
            {featured && (
              <img src={featured.cover_url || ''} alt="" className="w-28 md:w-36 rounded-xl border-2 border-primary/20 shadow-2xl hidden sm:block" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-md bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">Manhwa</span>
                <span className="px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium flex items-center gap-1"><Flame className="w-3 h-3" /> Hot</span>
              </div>
              {featured ? (
                <>
                  <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2 font-cairo leading-tight">
                    {lang === 'ar' ? (featured.title_ar || featured.title) : featured.title}
                  </h1>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2 max-w-lg">
                    {lang === 'ar' ? (featured.description_ar || featured.description || '') : (featured.description || '')}
                  </p>
                  <div className="flex gap-3">
                    <Link to={`/manhwa/${featured.slug}`}>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 shadow-glow gap-2">
                        <BookOpen className="w-4 h-4" />
                        {lang === 'ar' ? 'ابدأ القراءة' : 'Start Reading'}
                      </Button>
                    </Link>
                    <Link to="/browse">
                      <Button variant="outline" className="border-border hover:border-primary/40 hover:text-primary">
                        {t('viewAll')}
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 font-orbitron">
                    Manga<span className="text-primary">Brown</span>
                  </h1>
                  <p className="text-muted-foreground text-lg mb-5">
                    {lang === 'ar' ? 'أفضل موقع عربي للمانجا والمانهوا!' : 'The best Arabic manga & manhwa site!'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8 space-y-10">
        {/* Share + Discord + Report banners */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/30">
            <div>
              <p className="font-bold text-foreground text-sm">{lang === 'ar' ? 'شارك Manga Brown' : 'Share Manga Brown'}</p>
              <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'مع أصدقائك' : 'to your friends'}</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10" onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'Manga Brown', url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success(lang === 'ar' ? 'تم نسخ الرابط' : 'Link copied');
              }
            }}>
              <Share2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'مشاركة' : 'Share'}
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/30">
            <div>
              <p className="font-bold text-foreground text-sm">{lang === 'ar' ? 'انضم لسيرفرنا' : 'Join Our Socials'}</p>
              <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'تواصل معنا' : 'Stay connected with us'}</p>
            </div>
            <a href={discordUrl || 'https://discord.com'} target="_blank" rel="noreferrer">
              <Button size="sm" className="gap-1.5 bg-[#5865F2] hover:bg-[#4752C4] text-white">
                <DiscordIcon /> Discord
              </Button>
            </a>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/30">
            <div>
              <p className="font-bold text-foreground text-sm">{lang === 'ar' ? 'تحتاج مساعدة؟' : 'Need Help or Found an Issue?'}</p>
              <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'بلّغ عن مشكلة' : 'Report bugs, payment issues'}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setReportOpen(true)} className="border-border">{lang === 'ar' ? 'بلاغ' : 'Report Issue'}</Button>
          </div>
        </div>

        {/* أكمل القراءة (Continue Reading) - تصميم فخم مطابق للصورة */}
        {user && readingHistory.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2 font-cairo">
                <Clock className="w-5 h-5 text-primary" />
                {lang === 'ar' ? 'أكمل القراءة' : 'Continue Reading'}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {readingHistory.map((h: any) => {
                const m = h.chapters?.manhwa;
                if (!m) return null;
                return (
                  <Link key={h.id} to={`/manhwa/${m.slug}/chapter/${h.chapters.chapter_number}`} className="group block">
                    <div className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-secondary border border-border/50 shadow-md">
                      <img 
                        src={m.cover_url || ''} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        loading="lazy" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                      
                      <div className="absolute bottom-0 start-0 end-0 p-4">
                        <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-primary transition-colors font-cairo">
                          {lang === 'ar' ? (m.title_ar || m.title) : m.title}
                        </h3>
                        <div className="flex items-center justify-between mt-2">
                           <span className="text-xs font-medium text-primary">
                             {lang === 'ar' ? 'الفصل' : 'Ch.'} {h.chapters.chapter_number}
                           </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Latest Releases - MangaFlow style cards */}
        <section>
          <Tabs defaultValue="hot" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2 font-cairo">
                {lang === 'ar' ? 'آخر الإصدارات' : 'Latest Releases'}
              </h2>
              <div className="flex items-center gap-3">
                <TabsList className="bg-secondary/60 border border-border/30 h-9">
                  <TabsTrigger value="hot" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary text-xs gap-1 h-7">
                    <Flame className="w-3 h-3" /> Hot
                  </TabsTrigger>
                  <TabsTrigger value="new" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary text-xs gap-1 h-7">
                    <Clock className="w-3 h-3" /> New
                  </TabsTrigger>
                </TabsList>
                <Link to="/browse" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                  {t('viewAll')} <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <TabsContent value="hot" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupedLatest.map(({ manhwa: m, chapters: chs }) => (
                  <div key={m.id} className="flex gap-4 p-4 rounded-xl bg-card/50 border border-border/20 hover:border-primary/20 transition-all">
                    <Link to={`/manhwa/${m.slug}`} className="shrink-0">
                      <img src={m.cover_url || `https://placehold.co/120x170/1a1a2e/d9ac93?text=${encodeURIComponent(m.title)}`} alt="" className="w-24 h-32 sm:w-28 sm:h-36 object-cover rounded-lg" loading="lazy" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-bold uppercase">Manhwa</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`flex items-center gap-1 ${m.status === 'completed' ? 'text-emerald-400' : 'text-sky-400'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {m.status === 'completed' ? (lang === 'ar' ? 'مكتمل' : 'Completed') : m.status === 'ongoing' ? (lang === 'ar' ? 'مستمر' : 'Ongoing') : (lang === 'ar' ? 'متوقف' : 'Hiatus')}
                          </span>
                        </div>
                      </div>
                      <Link to={`/manhwa/${m.slug}`}>
                        <h3 className="font-bold text-foreground hover:text-primary transition-colors text-sm sm:text-base truncate mb-2">
                          {lang === 'ar' ? (m.title_ar || m.title) : m.title}
                        </h3>
                      </Link>
                      <div className="space-y-1">
                        {chs.map((ch: any, idx: number) => (
                          <Link
                            key={ch.id}
                            to={`/manhwa/${m.slug}/chapter/${ch.chapter_number}`}
                            className="flex items-center justify-between py-1 group/ch"
                          >
                            <span className={`text-sm flex items-center gap-1.5 ${idx === 0 && ch.is_locked ? 'text-muted-foreground' : 'text-primary hover:text-primary/80'} transition-colors`}>
                              {ch.is_locked && <Lock className="w-3 h-3" />}
                              {lang === 'ar' ? `الفصل ${ch.chapter_number}` : `Chapter ${ch.chapter_number}`}
                            </span>
                            <span className="text-xs text-muted-foreground">{timeAgo(ch.created_at)}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {groupedLatest.length === 0 && (
                  <div className="col-span-1 md:col-span-2 text-center py-12 text-muted-foreground">{t('noResults')}</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="new" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupedLatest.map(({ manhwa: m, chapters: chs }) => (
                  <div key={m.id} className="flex gap-4 p-4 rounded-xl bg-card/50 border border-border/20 hover:border-primary/20 transition-all">
                    <Link to={`/manhwa/${m.slug}`} className="shrink-0">
                      <img src={m.cover_url || `https://placehold.co/120x170/1a1a2e/d9ac93`} alt="" className="w-24 h-32 sm:w-28 sm:h-36 object-cover rounded-lg" loading="lazy" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-bold uppercase">Manhwa</span>
                      </div>
                      <Link to={`/manhwa/${m.slug}`}>
                        <h3 className="font-bold text-foreground hover:text-primary transition-colors text-sm sm:text-base truncate mb-2">
                          {lang === 'ar' ? (m.title_ar || m.title) : m.title}
                        </h3>
                      </Link>
                      <div className="space-y-1">
                        {chs.map((ch: any) => (
                          <Link key={ch.id} to={`/manhwa/${m.slug}/chapter/${ch.chapter_number}`} className="flex items-center justify-between py-1">
                            <span className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5">
                              {ch.is_locked && <Lock className="w-3 h-3" />}
                              {lang === 'ar' ? `الفصل ${ch.chapter_number}` : `Chapter ${ch.chapter_number}`}
                            </span>
                            <span className="text-xs text-muted-foreground">{timeAgo(ch.created_at)}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Popular Today - تم إضافة أيقونة ورقم المشاهدات هنا */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 font-cairo">
              <TrendingUp className="w-5 h-5 text-primary" />
              {lang === 'ar' ? 'الأكثر شعبية اليوم' : 'Popular Today'}
            </h2>
            <Link to="/browse">
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 text-xs">
                {t('viewAll')}
                {lang === 'ar' ? <ChevronLeft className="w-4 h-4 ms-1" /> : <ChevronRight className="w-4 h-4 ms-1" />}
              </Button>
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[5/7] rounded-xl bg-secondary animate-pulse" />)}
            </div>
          ) : manhwaList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {manhwaList.slice(0, 12).map((m, index) => (
                <Link key={m.id} to={`/manhwa/${m.slug}`} className="group relative block">
                  <div className="relative overflow-hidden rounded-xl aspect-[5/7] bg-secondary border border-border/30">
                    <img
                      src={m.cover_url || `https://placehold.co/400x560/1a1a2e/d9ac93?text=${encodeURIComponent(m.title)}`}
                      alt={lang === 'ar' ? (m.title_ar || m.title) : m.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-90" />
                    
                    {/* الترتيب (1, 2, 3...) */}
                    <div className="absolute top-2 start-2 w-7 h-7 rounded-lg bg-primary/90 text-primary-foreground flex items-center justify-center font-bold text-xs shadow-md">
                      #{index + 1}
                    </div>

                    <div className="absolute bottom-0 start-0 end-0 p-3">
                      <h3 className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors font-cairo mb-1.5">
                        {lang === 'ar' ? (m.title_ar || m.title) : m.title}
                      </h3>
                      {/* إضافة المشاهدات مع الأيقونة */}
                      <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{formatViews(m.views || 0)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">{t('noResults')}</div>
          )}
        </section>
      </div>

      {/* Report Dialog */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-xl border border-border/50 shadow-2xl relative">
            <h3 className="text-lg font-bold text-foreground mb-4 font-cairo">
              {lang === 'ar' ? 'إرسال بلاغ' : 'Report an Issue'}
            </h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button size="sm" variant={reportType === 'bug' ? 'default' : 'outline'} onClick={() => setReportType('bug')} className={reportType === 'bug' ? 'bg-primary' : ''}>
                  {lang === 'ar' ? 'خطأ تقني' : 'Bug'}
                </Button>
                <Button size="sm" variant={reportType === 'payment' ? 'default' : 'outline'} onClick={() => setReportType('payment')} className={reportType === 'payment' ? 'bg-primary' : ''}>
                  {lang === 'ar' ? 'مشكلة شراء' : 'Payment Issue'}
                </Button>
              </div>
              <textarea 
                value={reportText} 
                onChange={e => setReportText(e.target.value)} 
                className="w-full bg-secondary/50 border border-border/50 rounded-lg p-3 text-sm focus:border-primary focus:outline-none min-h-[100px]"
                placeholder={lang === 'ar' ? 'اشرح المشكلة بالتفصيل...' : 'Describe the issue...'}
              />
              <div className="flex gap-3 justify-end mt-4">
                <Button variant="ghost" onClick={() => setReportOpen(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                <Button onClick={submitReport} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow">{lang === 'ar' ? 'إرسال' : 'Submit'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
