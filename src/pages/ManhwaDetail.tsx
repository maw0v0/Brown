import { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Star, BookOpen, Heart, Clock, Users, Lock, ChevronDown, ChevronUp, MessageSquare, Send, ThumbsUp, ThumbsDown, Flag, Trash2, Edit2, CornerDownRight, Bell, BellOff, Eye } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const CommentItem = ({ comment, replies, allComments, user, manhwaId, lang, t, onUpdate }: any) => {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [likes, setLikes] = useState(comment.likes_count || 0);
  const [dislikes, setDislikes] = useState(comment.dislikes_count || 0);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('comment_votes').select('vote_type').eq('comment_id', comment.id).eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setMyVote(data.vote_type); });
  }, [comment.id, user]);

  const handleVote = async (type: 'like' | 'dislike') => {
    if (!user) return;
    if (isVoting) return;
    setIsVoting(true);
    const currentLikes = likes;
    const currentDislikes = dislikes;
    const currentVote = myVote;
    let nextVote: string | null = currentVote;
    let nextLikes = currentLikes;
    let nextDislikes = currentDislikes;

    try {
      if (currentVote === type) {
        nextVote = null;
        if (type === 'like') nextLikes = Math.max(0, currentLikes - 1);
        else nextDislikes = Math.max(0, currentDislikes - 1);
        await supabase.from('comment_votes').delete().eq('comment_id', comment.id).eq('user_id', user.id);
      } else {
        nextVote = type;
        if (currentVote) {
          await supabase.from('comment_votes').update({ vote_type: type }).eq('comment_id', comment.id).eq('user_id', user.id);
          if (currentVote === 'like') nextLikes = Math.max(0, currentLikes - 1);
          else nextDislikes = Math.max(0, currentDislikes - 1);
        } else {
          await supabase.from('comment_votes').insert({ comment_id: comment.id, user_id: user.id, vote_type: type });
        }
        if (type === 'like') nextLikes = nextLikes + 1;
        else nextDislikes = nextDislikes + 1;
      }

      setMyVote(nextVote);
      setLikes(nextLikes);
      setDislikes(nextDislikes);
      await supabase.from('comments').update({ likes_count: nextLikes, dislikes_count: nextDislikes }).eq('id', comment.id);
    } finally {
      setIsVoting(false);
    }
  };

  const handleReport = async () => {
    await supabase.from('comments').update({ is_reported: true }).eq('id', comment.id);
    toast.success(lang === 'ar' ? 'تم الإبلاغ' : 'Reported');
  };

  const handleDelete = async () => {
    if (!confirm(lang === 'ar' ? 'حذف التعليق؟' : 'Delete comment?')) return;
    await supabase.from('comments').delete().eq('id', comment.id);
    onUpdate();
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    await supabase.from('comments').update({ content: editText.trim() }).eq('id', comment.id);
    setEditing(false);
    onUpdate();
  };

  const submitReply = async () => {
    if (!user || !replyText.trim()) return;
    await supabase.from('comments').insert({
      manhwa_id: manhwaId,
      user_id: user.id,
      content: replyText.trim(),
      parent_id: comment.parent_id || comment.id,
    });
    setReplyText('');
    setReplyOpen(false);
    onUpdate();
  };

  const isOwner = user?.id === comment.user_id;
  const fallbackName = lang === 'ar' ? 'مستخدم مجهول' : 'Anonymous user';
  const displayName = comment.profiles?.username || fallbackName;
  const displayInitial = displayName[0]?.toUpperCase() || 'U';

  return (
    <div className="bg-card/30 rounded-xl p-4 border border-border/30">
      <div className="flex items-start gap-3">
        <Avatar className="w-9 h-9 shrink-0">
          <AvatarImage src={comment.profiles?.avatar_url || ''} />
          <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
            {displayInitial}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-foreground text-sm">{displayName}</span>
            <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
          </div>
          {editing ? (
            <div className="space-y-2">
              <Textarea value={editText} onChange={e => setEditText(e.target.value)} className="bg-secondary/50 border-border/50 min-h-[60px] text-sm" />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit} className="bg-primary hover:bg-primary/90 text-xs">{t('save')}</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-xs">{t('cancel')}</Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{comment.content}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <button disabled={isVoting} onClick={() => handleVote('like')} className={`text-xs flex items-center gap-1 transition-colors ${myVote === 'like' ? 'text-primary' : 'text-muted-foreground hover:text-primary'} ${isVoting ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <ThumbsUp className="w-3.5 h-3.5" /> {likes > 0 && likes}
            </button>
            <button disabled={isVoting} onClick={() => handleVote('dislike')} className={`text-xs flex items-center gap-1 transition-colors ${myVote === 'dislike' ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'} ${isVoting ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <ThumbsDown className="w-3.5 h-3.5" /> {dislikes > 0 && dislikes}
            </button>
            {user && (
              <button onClick={() => setReplyOpen(!replyOpen)} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <CornerDownRight className="w-3 h-3" /> {t('reply')}
              </button>
            )}
            {user && !isOwner && (
              <button onClick={handleReport} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                <Flag className="w-3 h-3" /> {t('report')}
              </button>
            )}
            {isOwner && (
              <>
                <button onClick={() => { setEditing(true); setEditText(comment.content); }} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  <Edit2 className="w-3 h-3" /> {t('edit')}
                </button>
                <button onClick={handleDelete} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> {t('delete')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {replyOpen && (
        <div className="flex gap-2 mt-3 ms-12">
          <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={t('reply')} className="bg-secondary/50 border-border/50 min-h-[60px] text-sm" />
          <Button size="sm" onClick={submitReply} className="bg-primary hover:bg-primary/90 shrink-0 self-end">
            <Send className="w-3 h-3" />
          </Button>
        </div>
      )}

      {replies.length > 0 && (
        <div className="ms-12 mt-3 space-y-3 border-s-2 border-primary/10 ps-4">
          {replies.map((reply: any) => {
            const nestedReplies = allComments.filter((c: any) => c.parent_id === reply.id);
            return (
              <CommentItem
                key={reply.id}
                comment={reply}
                replies={nestedReplies}
                allComments={allComments}
                user={user}
                manhwaId={manhwaId}
                lang={lang}
                t={t}
                onUpdate={onUpdate}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const ManhwaDetail = () => {
  const { slug } = useParams();
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [manhwa, setManhwa] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [readingHistory, setReadingHistory] = useState<any[]>([]); // حالة جديدة لسجل القراءة
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [lockedNotice, setLockedNotice] = useState<{ coinPrice: number } | null>(null);

  const fetchComments = async (manhwaId: string) => {
    const { data } = await supabase.from('comments')
      .select('*, profiles:user_id(username, avatar_url)')
      .eq('manhwa_id', manhwaId)
      .is('chapter_id', null)
      .order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  useEffect(() => {
    if (!slug) return;
    if (location.state && (location.state as any).locked) {
      const coinPrice = Number((location.state as any).coinPrice || 0);
      setLockedNotice({ coinPrice });
      navigate(location.pathname, { replace: true, state: null });
    }
    const fetchManhwa = async () => {
      const { data: m } = await supabase.from('manhwa').select('*').eq('slug', slug).maybeSingle();
      if (!m) { setLoading(false); return; }
      setManhwa(m);

      if (user) {
        await supabase.rpc('increment_unique_view', { m_id: m.id, u_id: user.id });
      } else {
        const storageKey = `v_${m.id}`;
        if (!localStorage.getItem(storageKey)) {
          await supabase.rpc('increment_manhwa_view', { p_manhwa_id: m.id });
          localStorage.setItem(storageKey, 'true');
        }
      }

      const [chapRes, genreRes, ratingRes] = await Promise.all([
        supabase.from('chapters').select('*').eq('manhwa_id', m.id).order('chapter_number', { ascending: false }),
        supabase.from('manhwa_genres').select('genre_id, genres(*)').eq('manhwa_id', m.id),
        supabase.from('ratings').select('score').eq('manhwa_id', m.id),
      ]);
      if (chapRes.data) setChapters(chapRes.data);
      if (genreRes.data) setGenres(genreRes.data.map((g: any) => g.genres).filter(Boolean));
      if (ratingRes.data && ratingRes.data.length > 0) {
        const avg = ratingRes.data.reduce((sum: number, r: any) => sum + r.score, 0) / ratingRes.data.length;
        setAvgRating(Math.round(avg * 10) / 10);
        setRatingCount(ratingRes.data.length);
      }

      await fetchComments(m.id);

      if (user) {
        const [favRes, subRes, urRes, histRes] = await Promise.all([
          supabase.from('favorites').select('id').eq('manhwa_id', m.id).eq('user_id', user.id).maybeSingle(),
          supabase.from('manhwa_subscriptions').select('id').eq('manhwa_id', m.id).eq('user_id', user.id).maybeSingle(),
          supabase.from('ratings').select('score').eq('manhwa_id', m.id).eq('user_id', user.id).maybeSingle(),
          // جلب الفصول المقروءة من هذا العمل تحديداً
          supabase.from('reading_history')
            .select('*, chapters!inner(chapter_number, title, manhwa_id)')
            .eq('user_id', user.id)
            .eq('chapters.manhwa_id', m.id)
            .order('read_at', { ascending: false })
            .limit(4)
        ]);
        setIsFavorite(!!favRes.data);
        setIsSubscribed(!!subRes.data);
        if (urRes.data) setUserRating(urRes.data.score);
        if (histRes.data) setReadingHistory(histRes.data);
      }
      setLoading(false);
    };
    fetchManhwa();
  }, [slug, user, location.state, location.pathname, navigate]);

  const toggleFavorite = async () => {
    if (!user || !manhwa) return;
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('manhwa_id', manhwa.id).eq('user_id', user.id);
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert({ manhwa_id: manhwa.id, user_id: user.id });
      setIsFavorite(true);
    }
  };

  const toggleSubscription = async () => {
    if (!user || !manhwa) return;
    if (isSubscribed) {
      await supabase.from('manhwa_subscriptions').delete().eq('manhwa_id', manhwa.id).eq('user_id', user.id);
      setIsSubscribed(false);
      toast.success(lang === 'ar' ? 'تم إلغاء الاشتراك' : 'Unsubscribed');
    } else {
      await supabase.from('manhwa_subscriptions').insert({ manhwa_id: manhwa.id, user_id: user.id });
      setIsSubscribed(true);
      toast.success(lang === 'ar' ? 'ستصلك إشعارات الفصول الجديدة' : 'You will be notified of new chapters');
    }
  };

  const handleRate = async (score: number) => {
    if (!user || !manhwa) return;
    await supabase.from('ratings').delete().match({ user_id: user.id, manhwa_id: manhwa.id });
    const { error } = await supabase.from('ratings').insert({ manhwa_id: manhwa.id, user_id: user.id, score });
    if (!error) {
      setUserRating(score);
      toast.success(lang === 'ar' ? 'تم التقييم!' : 'Rated!');
    } else {
      toast.error(error.message);
    }
  };

  const submitComment = async () => {
    if (!user || !manhwa || !commentText.trim()) return;
    const { error } = await supabase.from('comments').insert({
      manhwa_id: manhwa.id,
      user_id: user.id,
      content: commentText.trim(),
    });
    if (!error) {
      setCommentText('');
      fetchComments(manhwa.id);
    }
  };

  const statusColors: Record<string, string> = {
    ongoing: 'bg-emerald-500/15 text-emerald-400',
    completed: 'bg-sky-500/15 text-sky-400',
    hiatus: 'bg-amber-500/15 text-amber-400',
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!manhwa) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t('noResults')}</div>;

  const displayChapters = showAllChapters ? chapters : chapters.slice(0, 20);
  const topLevelComments = comments.filter((c: any) => !c.parent_id);

  return (
    <div className="min-h-screen">
      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${manhwa.banner_url || manhwa.cover_url || ''})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
      </div>

      <div className="container -mt-32 relative z-10 pb-12">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="shrink-0">
            <img src={manhwa.cover_url || `https://placehold.co/240x340/1a1a2e/7c3aed?text=${encodeURIComponent(manhwa.title)}`} alt={manhwa.title} className="w-44 md:w-56 rounded-xl border-2 border-border shadow-2xl" />
          </div>

          <div className="flex-1 pt-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[manhwa.status] || ''}`}>
                {t(manhwa.status as any)}
              </span>
              {genres.map((g: any) => (
                <Link key={g.id} to={`/genres?g=${g.slug}`}>
                  <span className="px-2.5 py-1 rounded-full text-xs bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer">
                    {lang === 'ar' ? g.name_ar : g.name}
                  </span>
                </Link>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-cairo mb-2">
              {lang === 'ar' ? (manhwa.title_ar || manhwa.title) : manhwa.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              {manhwa.author && <span>{manhwa.author}</span>}
              {manhwa.artist && manhwa.artist !== manhwa.author && <span>• {manhwa.artist}</span>}
              {manhwa.release_year && <span>• {manhwa.release_year}</span>}
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {(manhwa.views || 0).toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 fill-primary text-primary" />
                <span className="font-bold text-foreground text-lg">{avgRating || '-'}</span>
                <span className="text-muted-foreground text-sm">({ratingCount})</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <BookOpen className="w-4 h-4" />
                {chapters.length} {t('chapters')}
              </div>
            </div>

            {user && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">{t('rateThis')}:</span>
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => handleRate(s)}>
                    <Star className={`w-5 h-5 transition-colors ${s <= userRating ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary'}`} />
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              {chapters[chapters.length - 1] && (
                <Link to={`/manhwa/${manhwa.slug}/chapter/${chapters[chapters.length - 1].chapter_number}`}>
                  <Button className="bg-primary hover:bg-primary/90 shadow-glow gap-2">
                    <BookOpen className="w-4 h-4" />
                    {lang === 'ar' ? 'ابدأ القراءة' : 'Start Reading'}
                  </Button>
                </Link>
              )}
              {user && (
                <>
                  <Button variant="outline" onClick={toggleFavorite} className={`gap-2 border-border ${isFavorite ? 'text-primary border-primary/30' : ''}`}>
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-primary' : ''}`} />
                    {t('favorites')}
                  </Button>
                  <Button variant="outline" onClick={toggleSubscription} className={`gap-2 border-border ${isSubscribed ? 'text-primary border-primary/30' : ''}`}>
                    {isSubscribed ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    {isSubscribed ? (lang === 'ar' ? 'إلغاء الإشعارات' : 'Unsubscribe') : (lang === 'ar' ? 'إشعارات' : 'Notify Me')}
                  </Button>
                </>
              )}
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {lang === 'ar' ? (manhwa.description_ar || manhwa.description) : manhwa.description}
            </p>
          </div>
        </div>

        {/* --- قسم أكمل القراءة (جديد) --- */}
        {user && readingHistory.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2 font-cairo">
                <Clock className="w-5 h-5 text-primary" />
                {lang === 'ar' ? 'أكمل القراءة' : 'Continue Reading'}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {readingHistory.map((h: any) => (
                <Link key={h.id} to={`/manhwa/${manhwa.slug}/chapter/${h.chapters.chapter_number}`} className="group block">
                  <div className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-secondary border border-border/50 shadow-md">
                    <img 
                      src={manhwa.cover_url || ''} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      loading="lazy" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                    
                    <div className="absolute bottom-0 start-0 end-0 p-4">
                      <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-primary transition-colors font-cairo">
                        {lang === 'ar' ? (manhwa.title_ar || manhwa.title) : manhwa.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                         <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                           {lang === 'ar' ? 'الفصل' : 'Ch.'} {h.chapters.chapter_number}
                         </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        {/* --- نهاية قسم أكمل القراءة --- */}

        {lockedNotice && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-3">
            <span>
              {lang === 'ar' ? 'هذا الفصل مقفول ولا يمكن فتحه دون دفع' : 'This chapter is locked and cannot be opened without payment'}
            </span>
            {lockedNotice.coinPrice > 0 && (
              <span className="font-semibold">{lockedNotice.coinPrice} {t('coins')}</span>
            )}
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-xl font-bold text-foreground font-cairo mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {t('chapters')} ({chapters.length})
          </h2>
          <div className="space-y-1.5">
            {displayChapters.map((ch: any) => {
              const isTimeLocked = ch.is_locked && ch.lock_duration_days > 0 && ch.published_at;
              const unlockDate = isTimeLocked ? new Date(new Date(ch.published_at).getTime() + ch.lock_duration_days * 86400000) : null;
              const isAutoUnlocked = unlockDate && new Date() > unlockDate;
              const effectivelyLocked = ch.is_locked && !isAutoUnlocked;

              return (
                <Link
                  key={ch.id}
                  to={`/manhwa/${manhwa.slug}/chapter/${ch.chapter_number}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-card/50 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    {effectivelyLocked && <Lock className="w-4 h-4 text-primary" />}
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {lang === 'ar' ? `الفصل ${ch.chapter_number}` : `Chapter ${ch.chapter_number}`}
                    </span>
                    {ch.title && <span className="text-sm text-muted-foreground">- {lang === 'ar' ? (ch.title_ar || ch.title) : ch.title}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ch.views || 0}</span>
                    {effectivelyLocked && ch.coin_price > 0 && (
                      <span className="bg-primary/15 text-primary px-2 py-0.5 rounded-full">{ch.coin_price} {t('coins')}</span>
                    )}
                    {effectivelyLocked && unlockDate && (
                      <span className="text-primary/70 text-[10px]">
                        {lang === 'ar' ? `ينفتح ${unlockDate.toLocaleDateString()}` : `Unlocks ${unlockDate.toLocaleDateString()}`}
                      </span>
                    )}
                    <span>{new Date(ch.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              );
            })}
          </div>
          {chapters.length > 20 && (
            <Button variant="ghost" onClick={() => setShowAllChapters(!showAllChapters)} className="w-full mt-3 text-primary hover:bg-primary/10">
              {showAllChapters ? <ChevronUp className="w-4 h-4 me-2" /> : <ChevronDown className="w-4 h-4 me-2" />}
              {showAllChapters ? (lang === 'ar' ? 'إخفاء' : 'Show Less') : (lang === 'ar' ? `عرض الكل (${chapters.length})` : `Show All (${chapters.length})`)}
            </Button>
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-bold text-foreground font-cairo mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {t('comments')} ({comments.length})
          </h2>

          {user ? (
            <div className="flex gap-3 mb-6">
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                  {(user.email || '?')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder={t('addComment')}
                  className="bg-card/50 border-border/50 focus:border-primary/50 min-h-[80px]"
                />
                <Button onClick={submitComment} disabled={!commentText.trim()} className="bg-primary hover:bg-primary/90 gap-2">
                  <Send className="w-4 h-4" />
                  {lang === 'ar' ? 'نشر' : 'Post'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-xl bg-card/30 border border-border/30 text-center">
              <p className="text-muted-foreground text-sm mb-2">{lang === 'ar' ? 'سجل دخولك للتعليق' : 'Login to comment'}</p>
              <Link to="/login"><Button size="sm" className="bg-primary hover:bg-primary/90">{t('login')}</Button></Link>
            </div>
          )}

          <div className="space-y-4">
            {topLevelComments.map((comment: any) => {
              const replies = comments.filter((c: any) => c.parent_id === comment.id);
              return (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  replies={replies}
                  allComments={comments}
                  user={user}
                  manhwaId={manhwa.id}
                  lang={lang}
                  t={t}
                  onUpdate={() => fetchComments(manhwa.id)}
                />
              );
            })}
            {topLevelComments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">{lang === 'ar' ? 'لا توجد تعليقات بعد' : 'No comments yet'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManhwaDetail;
