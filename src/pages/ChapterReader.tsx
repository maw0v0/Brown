import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Home, BookOpen, Columns, Rows3, Lock, MessageSquare, Star, Send, Eye } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import AdBanner from '@/components/AdBanner';
import { useInView } from 'react-intersection-observer';

const LazyImage = ({ src, alt, onLoad }: { src: string; alt: string; onLoad?: () => void }) => {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '400px 0px' });
  return (
    <div ref={ref} className="w-full min-h-[300px] flex items-center justify-center bg-secondary/10">
      {inView ? (
        <img src={src} alt={alt} className="w-full h-auto object-contain" loading="lazy" onLoad={onLoad} />
      ) : (
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
};

const ChapterReader = () => {
  const { slug, chapterNum } = useParams();
  const { t, lang } = useI18n();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [manhwa, setManhwa] = useState<any>(null);
  const [chapter, setChapter] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [prevChapter, setPrevChapter] = useState<any>(null);
  const [nextChapter, setNextChapter] = useState<any>(null);
  
  // استرجاع وضع القراءة المفضل من الذاكرة أو تعيينه للعمودي
  const [viewMode, setViewMode] = useState<'vertical' | 'page'>(() => {
    return (localStorage.getItem('preferred_view_mode') as 'vertical' | 'page') || 'vertical';
  });
  
  const [currentPage, setCurrentPage] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [isModerator, setIsModerator] = useState(false);
  
  const readerRef = useRef<HTMLDivElement>(null);
  const [imagesLoadedCount, setImagesLoadedCount] = useState(0);

  // مفاتيح الذاكرة المحلية
  const getScrollKey = (chId: string) => `scroll_pos_${chId}`;
  const getPageKey = (chId: string) => `page_pos_${chId}`;

  const fetchPages = async (chapterId: string) => {
    const { data } = await supabase.from('chapter_pages').select('*').eq('chapter_id', chapterId).order('page_number');
    setPages(data || []);
    
    // استرجاع رقم الصفحة المحفوظ إذا كنا في وضع الصفحات
    const savedPage = localStorage.getItem(getPageKey(chapterId));
    if (savedPage) {
      setCurrentPage(Number(savedPage));
    } else {
      setCurrentPage(0);
    }
  };

  useEffect(() => {
    if (!slug || !chapterNum) return;
    const fetchChapter = async () => {
      setLoading(true);

      if (user) {
        const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
        if (roleData?.role === 'moderator') setIsModerator(true);
      }

      const { data: m } = await supabase.from('manhwa').select('*').eq('slug', slug).single();
      if (!m) { setLoading(false); return; }
      setManhwa(m);

      const { data: ch } = await supabase.from('chapters').select('*').eq('manhwa_id', m.id).eq('chapter_number', Number(chapterNum)).single();
      if (!ch) { setLoading(false); return; }
      setChapter(ch);

      const viewedKey = `viewed_chapter_${ch.id}`;
      if (!localStorage.getItem(viewedKey)) {
        (supabase.rpc as any)('increment_chapter_view', { p_chapter_id: ch.id }).then(() => {
          localStorage.setItem(viewedKey, 'true');
        });
      }
      
      const [prevRes, nextRes, commentsRes] = await Promise.all([
        supabase.from('chapters').select('chapter_number').eq('manhwa_id', m.id).lt('chapter_number', ch.chapter_number).order('chapter_number', { ascending: false }).limit(1),
        supabase.from('chapters').select('chapter_number').eq('manhwa_id', m.id).gt('chapter_number', ch.chapter_number).order('chapter_number').limit(1),
        supabase.from('comments').select('*, profiles:user_id(username, avatar_url)').eq('chapter_id', ch.id).order('created_at', { ascending: false }),
      ]);

      setPrevChapter(prevRes.data?.[0] || null);
      setNextChapter(nextRes.data?.[0] || null);
      if (commentsRes.data) setComments(commentsRes.data);

      let effectivelyLocked = ch.is_locked;
      if (isAdmin || isModerator) {
         effectivelyLocked = false;
      } else if (ch.is_locked && ch.lock_duration_days > 0 && ch.published_at) {
         const unlockDate = new Date(new Date(ch.published_at).getTime() + ch.lock_duration_days * 86400000);
         if (new Date() > unlockDate) effectivelyLocked = false;
      }

      let allowed = !effectivelyLocked;
      if (!effectivelyLocked) {
        setIsUnlocked(true);
        await fetchPages(ch.id);
      } else if (user) {
        const { data: unlock } = await supabase.from('chapter_unlocks').select('id').eq('chapter_id', ch.id).eq('user_id', user.id).maybeSingle();
        allowed = !!unlock;
        setIsUnlocked(allowed);
        if (allowed) {
          await fetchPages(ch.id);
        } else {
          setPages([]);
        }
      } else {
        setIsUnlocked(false);
        setPages([]);
      }

      if (user) {
        const { data: ur } = await supabase.from('ratings').select('score').eq('chapter_id', ch.id).eq('user_id', user.id).maybeSingle();
        if (ur) setUserRating(ur.score);
      }

      // حفظ سجل القراءة بطريقة آمنة 100%
      if (user && allowed) {
        const { data: existingHistory } = await supabase.from('reading_history')
          .select('id')
          .eq('user_id', user.id)
          .eq('chapter_id', ch.id)
          .maybeSingle();

        if (existingHistory) {
          await supabase.from('reading_history')
            .update({ read_at: new Date().toISOString() })
            .eq('id', existingHistory.id);
        } else {
          await supabase.from('reading_history')
            .insert({ user_id: user.id, chapter_id: ch.id, read_at: new Date().toISOString() });
        }
      }
      setLoading(false);
    };
    fetchChapter();
  }, [slug, chapterNum, user, isAdmin, isModerator]);

  // حفظ التمرير (Scroll) تلقائياً أثناء القراءة
  useEffect(() => {
    if (viewMode !== 'vertical' || !chapter || !isUnlocked) return;

    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // نحفظ المكان كل نصف ثانية من توقف النزول
        const scrollPosition = window.scrollY;
        if (scrollPosition > 100) { // نحفظ فقط إذا نزل عن بداية الصفحة
            localStorage.setItem(getScrollKey(chapter.id), scrollPosition.toString());
        }
      }, 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [viewMode, chapter, isUnlocked]);

  // الاسترجاع التلقائي لمكان القراءة (Auto-scroll) عند تحميل الصور الأولى
  useEffect(() => {
    if (viewMode === 'vertical' && chapter && imagesLoadedCount > 0 && imagesLoadedCount <= 2) {
      const savedScroll = localStorage.getItem(getScrollKey(chapter.id));
      if (savedScroll) {
        setTimeout(() => {
            window.scrollTo({
                top: Number(savedScroll),
                behavior: 'smooth'
            });
        }, 500); // نعطي المتصفح نصف ثانية لترتيب الصور قبل النزول
      }
    }
  }, [imagesLoadedCount, viewMode, chapter]);

  // حفظ وضع القراءة وتغيير الصفحة
  const handleViewModeChange = () => {
    const newMode = viewMode === 'vertical' ? 'page' : 'vertical';
    setViewMode(newMode);
    localStorage.setItem('preferred_view_mode', newMode);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (chapter) {
        localStorage.setItem(getPageKey(chapter.id), newPage.toString());
    }
  };

  const handleUnlock = async () => {
    if (!user || !chapter) return;
    try {
      const { data, error } = await (supabase.rpc as any)('unlock_chapter', {
        p_user_id: user.id,
        p_chapter_id: chapter.id,
        p_coin_price: chapter.coin_price
      });
      if (error) throw error;
      if (!data) throw new Error(lang === 'ar' ? 'عملات غير كافية' : 'Not enough coins');

      setIsUnlocked(true);
      await fetchPages(chapter.id);
      await supabase.from('reading_history').upsert(
        { user_id: user.id, chapter_id: chapter.id, read_at: new Date().toISOString() },
        { onConflict: 'user_id,chapter_id' }
      );
      toast.success(lang === 'ar' ? 'تم فتح الفصل!' : 'Chapter unlocked!');
    } catch (err: any) {
      toast.error(err.message);
      if (err.message.includes('coins')) navigate('/coins');
    }
  };

  const handleRate = async (score: number) => {
    if (!user || !chapter) return;
    await supabase.from('ratings').delete().match({ user_id: user.id, chapter_id: chapter.id });
    const { error } = await supabase.from('ratings').insert({ chapter_id: chapter.id, user_id: user.id, score, manhwa_id: manhwa?.id });
    if (!error) {
      setUserRating(score);
      toast.success(lang === 'ar' ? 'تم التقييم!' : 'Rated!');
    } else {
      toast.error(error.message);
    }
  };

  const submitComment = async () => {
    if (!user || !chapter || !commentText.trim()) return;
    const chapterId = chapter.id;
    if (!chapterId) {
      toast.error(lang === 'ar' ? 'تعذر تحديد الفصل' : 'Chapter not found');
      return;
    }
    const { data, error } = await supabase.from('comments').insert({
      chapter_id: chapterId,
      manhwa_id: manhwa?.id,
      user_id: user.id,
      content: commentText.trim(),
    }).select('*, profiles:user_id(username, avatar_url)').single();
    if (!error && data) {
      setComments(prev => [data, ...prev]);
      setCommentText('');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!manhwa || !chapter) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t('noResults')}</div>;

  const effectivelyLocked = (() => {
    if (isAdmin || isModerator) return false;
    if (!chapter.is_locked) return false;
    if (chapter.lock_duration_days > 0 && chapter.published_at) {
      const unlockDate = new Date(new Date(chapter.published_at).getTime() + chapter.lock_duration_days * 86400000);
      if (new Date() > unlockDate) return false;
    }
    return true;
  })();

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="sticky top-14 z-40 border-b border-border glass">
        <div className="container flex items-center justify-between py-2 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={manhwa.cover_url || ''} alt="" className="w-8 h-8 rounded object-cover hidden sm:block" />
            <nav className="flex items-center gap-1.5 text-sm min-w-0">
              <Link to="/" className="text-muted-foreground hover:text-primary"><Home className="w-3.5 h-3.5" /></Link>
              <span className="text-muted-foreground">/</span>
              <Link to={`/manhwa/${manhwa.slug}`} className="text-muted-foreground hover:text-primary truncate max-w-[120px]">
                {lang === 'ar' ? (manhwa.title_ar || manhwa.title) : manhwa.title}
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="text-primary font-medium">{lang === 'ar' ? `ف${chapter.chapter_number}` : `Ch.${chapter.chapter_number}`}</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" /> {chapter.views || 0}</span>
            {effectivelyLocked && !isUnlocked && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/20">
                {lang === 'ar' ? 'مقفول' : 'Locked'}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={handleViewModeChange} className="text-muted-foreground hover:text-primary">
              {viewMode === 'vertical' ? <Columns className="w-4 h-4" /> : <Rows3 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Chapter content */}
      {effectivelyLocked && !isUnlocked && (
        <div className="container pt-6">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <span className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'هذا الفصل مقفول ويتطلب فتحه' : 'This chapter is locked and requires unlock'}
            </span>
            {chapter.coin_price > 0 && (
              <span className="font-semibold">{chapter.coin_price} {t('coins')}</span>
            )}
          </div>
        </div>
      )}
      
      {effectivelyLocked && !isUnlocked ? (
        <div className="max-w-3xl mx-auto px-4">
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-full rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
              <Lock className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2 font-cairo">{t('locked')}</h2>
              <p className="text-muted-foreground mb-6">
                {chapter.lock_duration_days > 0 ? (
                  lang === 'ar'
                    ? `ينفتح بعد ${chapter.lock_duration_days} يوم أو ادفع ${chapter.coin_price} عملة`
                    : `Unlocks after ${chapter.lock_duration_days} days or pay ${chapter.coin_price} coins`
                ) : (
                  lang === 'ar' ? `يلزم ${chapter.coin_price} عملة لفتح هذا الفصل` : `${chapter.coin_price} coins required to unlock`
                )}
              </p>
              {user ? (
                <Button onClick={handleUnlock} className="bg-primary hover:bg-primary/90 shadow-glow gap-2">
                  <Lock className="w-4 h-4" /> {t('unlock')} ({chapter.coin_price} {t('coins')})
                </Button>
              ) : (
                <Link to="/login"><Button className="bg-primary hover:bg-primary/90">{t('login')}</Button></Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto" ref={readerRef}>
          <AdBanner slotId="top-reader" className="mb-6" />
          {viewMode === 'vertical' ? (
            <div className="reader-vertical flex flex-col gap-0">
              {pages.map((page, index) => (
                <LazyImage 
                   key={page.id} 
                   src={page.image_url} 
                   alt={`Page ${page.page_number || index + 1}`} 
                   onLoad={() => setImagesLoadedCount(c => c + 1)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              {pages[currentPage] && (
                <img src={pages[currentPage].image_url} alt={`Page ${currentPage + 1}`} className="max-h-[85vh] object-contain" />
              )}
              <div className="flex items-center gap-4 mt-4">
                <Button variant="outline" disabled={currentPage === 0} onClick={() => handlePageChange(currentPage - 1)} size="sm">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{currentPage + 1} / {pages.length}</span>
                <Button variant="outline" disabled={currentPage >= pages.length - 1} onClick={() => handlePageChange(currentPage + 1)} size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          <AdBanner slotId="bottom-reader" className="mt-8" />
        </div>
      )}

      {/* Navigation + Rating + Comments */}
      <div className="container py-8 max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-3">
          {prevChapter ? (
            <Link to={`/manhwa/${manhwa.slug}/chapter/${prevChapter.chapter_number}`}>
              <Button variant="outline" className="gap-2 border-border hover:border-primary/30 hover:text-primary">
                <ChevronLeft className="w-4 h-4" /> {t('previousChapter')}
              </Button>
            </Link>
          ) : <div />}
          <Link to={`/manhwa/${manhwa.slug}`}>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
              <BookOpen className="w-4 h-4 me-1" /> {lang === 'ar' ? 'قائمة الفصول' : 'Chapter List'}
            </Button>
          </Link>
          {nextChapter ? (
            <Link to={`/manhwa/${manhwa.slug}/chapter/${nextChapter.chapter_number}`}>
              <Button variant="outline" className="gap-2 border-border hover:border-primary/30 hover:text-primary">
                {t('nextChapter')} <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : <div />}
        </div>

        {user && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">{t('chapterRating')}</p>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => handleRate(s)}>
                  <Star className={`w-6 h-6 transition-colors ${s <= userRating ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary'}`} />
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-bold text-foreground font-cairo mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> {t('comments')}
          </h3>
          {user ? (
            <div className="flex gap-3 mb-4">
              <Textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder={t('addComment')} className="bg-card/50 border-border/50 min-h-[70px]" />
              <Button onClick={submitComment} disabled={!commentText.trim()} className="bg-primary hover:bg-primary/90 shadow-glow shrink-0 self-end"><Send className="w-4 h-4" /></Button>
            </div>
          ) : (
            <div className="mb-4 p-4 rounded-xl bg-card/30 border border-border/30 text-center">
              <p className="text-muted-foreground text-sm mb-2">{lang === 'ar' ? 'سجل دخولك للتعليق' : 'Login to comment'}</p>
              <Link to="/login"><Button size="sm" className="bg-primary hover:bg-primary/90">{t('login')}</Button></Link>
            </div>
          )}
          <div className="space-y-3">
            {comments.map((c: any) => (
              <div key={c.id} className="bg-card/30 rounded-lg p-3 border border-border/30">
                {(() => {
                  const fallbackName = lang === 'ar' ? 'مستخدم مجهول' : 'Anonymous user';
                  const displayName = c.profiles?.username || fallbackName;
                  const initial = displayName[0]?.toUpperCase() || 'U';
                  return (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-xs font-bold">{initial}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{displayName}</span>
                  <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                  );
                })()}
                <p className="text-sm text-muted-foreground ms-9">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterReader;
