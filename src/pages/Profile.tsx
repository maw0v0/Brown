import { useEffect, useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { User, Heart, Clock, Coins, Save, Camera, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Profile = () => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [profileRes, favRes, histRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('favorites').select('*, manhwa(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('reading_history').select('*, chapters(chapter_number, manhwa_id, manhwa:manhwa_id(title, title_ar, slug, cover_url))').eq('user_id', user.id).order('read_at', { ascending: false }).limit(20),
      ]);
      if (profileRes.data) {
        setProfile(profileRes.data);
        setDisplayName(profileRes.data.display_name || '');
        setBio(profileRes.data.bio || '');
      }
      if (favRes.data) setFavorites(favRes.data);
      if (histRes.data) setHistory(histRes.data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const uploadImage = async (file: File, type: 'avatar' | 'banner') => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${type}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = urlData.publicUrl + '?t=' + Date.now();
    const updateField = type === 'avatar' ? { avatar_url: url } : { banner_url: url };
    await supabase.from('profiles').update(updateField).eq('user_id', user.id);
    setProfile((p: any) => ({ ...p, ...updateField }));
    toast.success(lang === 'ar' ? 'تم الرفع!' : 'Uploaded!');
    setUploading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ display_name: displayName, bio }).eq('user_id', user.id);
    if (!error) toast.success(lang === 'ar' ? 'تم الحفظ!' : 'Saved!');
    else toast.error(error.message);
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Link to="/login"><Button>{t('login')}</Button></Link></div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative h-44 md:h-56 bg-gradient-to-r from-primary/20 via-background to-primary/10 overflow-hidden">
        {profile?.banner_url && <img src={profile.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <button onClick={() => bannerRef.current?.click()} className="absolute top-4 end-4 p-2 rounded-lg bg-background/50 hover:bg-background/80 text-muted-foreground hover:text-primary transition-all" disabled={uploading}>
          <ImageIcon className="w-4 h-4" />
        </button>
        <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'banner'); }} />
      </div>

      <div className="container max-w-3xl -mt-16 relative z-10 pb-8">
        {/* Profile header */}
        <div className="flex items-end gap-5 mb-8">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-background">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">{(profile?.username || '?')[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <button onClick={() => avatarRef.current?.click()} className="absolute -bottom-1 -end-1 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" disabled={uploading}>
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'avatar'); }} />
          </div>
          <div className="pb-1">
            <h1 className="text-2xl font-bold text-foreground font-cairo">{profile?.display_name || profile?.username}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-primary" /> {profile?.coins || 0} {t('coins')}</span>
              <span>@{profile?.username}</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="bg-secondary/50 border border-border/30">
            <TabsTrigger value="info" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">{t('profile')}</TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">{t('favorites')}</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">{t('readingHistory')}</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="space-y-2">
              <Label>{lang === 'ar' ? 'الاسم المعروض' : 'Display Name'}</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-card/50 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label>{t('bio')}</Label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} className="bg-card/50 border-border/50 min-h-[100px]" />
            </div>
            <Button onClick={saveProfile} className="bg-primary hover:bg-primary/90 gap-2"><Save className="w-4 h-4" /> {t('save')}</Button>
          </TabsContent>

          <TabsContent value="favorites">
            {favorites.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {favorites.map((f: any) => f.manhwa && (
                  <Link key={f.id} to={`/manhwa/${f.manhwa.slug}`} className="group block">
                    <div className="relative overflow-hidden rounded-lg aspect-[5/7] bg-secondary">
                      <img src={f.manhwa.cover_url || ''} alt={f.manhwa.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                      <div className="absolute bottom-0 p-2">
                        <h3 className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {lang === 'ar' ? (f.manhwa.title_ar || f.manhwa.title) : f.manhwa.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">{t('noResults')}</div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {history.length > 0 ? (
              <div className="space-y-2">
                {history.map((h: any) => {
                  const m = h.chapters?.manhwa;
                  return m ? (
                    <Link key={h.id} to={`/manhwa/${m.slug}/chapter/${h.chapters.chapter_number}`} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group">
                      <img src={m.cover_url || ''} alt="" className="w-10 h-14 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{lang === 'ar' ? (m.title_ar || m.title) : m.title}</h3>
                        <p className="text-xs text-muted-foreground">{lang === 'ar' ? `الفصل ${h.chapters.chapter_number}` : `Chapter ${h.chapters.chapter_number}`}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(h.read_at).toLocaleDateString()}</span>
                    </Link>
                  ) : null;
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">{t('noResults')}</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
