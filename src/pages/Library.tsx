import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { BookMarked, Clock, BookOpen, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Library = () => {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب المانجا المحفوظة
  const fetchBookmarks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // استخدام جدول favorites الحالي بدلاً من bookmarks
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          manhwa:manhwa_id (
            id,
            title,
            slug,
            cover_url,
            type,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error: any) {
      if(error.code !== '42P01') { 
          toast.error(error.message);
      } else {
        console.log("جدول Favorites غير موجود بعد.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [user]);

  const removeBookmark = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success(lang === 'ar' ? 'تم الإزالة من المكتبة' : 'Removed from library');
      setBookmarks(b => b.filter(item => item.id !== id));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <BookMarked className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold font-cairo mb-2">{lang === 'ar' ? 'مكتبتي الخاصة' : 'My Library'}</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          {lang === 'ar' ? 'يجب عليك تسجيل الدخول لتتمكن من تتبع المانجا المفضلة لديك.' : 'You need to login to track your favorite manga.'}
        </p>
        <Link to="/login">
          <Button className="bg-primary hover:bg-primary/90 glow-purple font-cairo">
            {t('login')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container min-h-[80vh] py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <BookMarked className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-cairo text-foreground">
            {lang === 'ar' ? 'مكتبتي' : 'My Library'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'ar' ? 'تتبع فصول المانجا التي تتابعها لتلقي إشعارات' : 'Track manga chapters and receive notifications'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card/30 rounded-2xl border border-border/30 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold mb-2 text-foreground font-cairo">{lang === 'ar' ? 'مكتبتك فارغة' : 'Library is empty'}</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {lang === 'ar' ? 'لم تقم بمتابعة أي أعمال حتى الآن.' : 'You are not following any series yet.'}
          </p>
          <Link to="/browse">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 font-cairo">
              {lang === 'ar' ? 'تصفح الأعمال' : 'Browse Series'}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {bookmarks.map((b) => (
            b.manhwa ? (
              <Link key={b.id} to={`/manhwa/${b.manhwa.slug}`} className="group relative block overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300">
                <div className="aspect-[2/3] relative overflow-hidden">
                  <img src={b.manhwa.cover_url} alt={b.manhwa.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
                  
                  <button 
                    onClick={(e) => removeBookmark(b.id, e)}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-red-500/80 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-sm text-foreground mb-1 truncate">{b.manhwa.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] uppercase font-bold text-primary/80 bg-primary/10 px-2 py-0.5 rounded">{b.manhwa.type}</span>
                    <span className="text-[10px] text-muted-foreground">{b.manhwa.status}</span>
                  </div>
                </div>
              </Link>
            ) : null
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
