import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Search, User, Settings, LogOut, Shield, Globe, BookOpen, Users, Layers, Coins, Bell, Bookmark, Crown, HelpCircle, Upload, PlusSquare, RefreshCw, X, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
  </svg>
);

const Navbar = () => {
  const { t, lang, setLang, dir } = useI18n();
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [siteLogo, setSiteLogo] = useState('');
  const [siteName, setSiteName] = useState('Brown Manga');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('site_settings').select('*').then(({ data }) => {
      data?.forEach((r: any) => {
        if (r.key === 'site_logo_url' && r.value) setSiteLogo(r.value);
        if (r.key === 'site_name' && r.value) setSiteName(r.value);
      });
    });
  }, []);

  useEffect(() => {
    if (!user) { setProfile(null); setNotifications([]); setUnreadCount(0); return; }
    supabase.from('profiles').select('username, avatar_url, coins, display_name').eq('user_id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/', label: t('home'), icon: <BookOpen className="w-4 h-4" /> },
    { to: '/browse', label: lang === 'ar' ? 'تصفح' : 'Browse', icon: <Layers className="w-4 h-4" /> },
    { to: '/genres', label: t('genres'), icon: <Layers className="w-4 h-4" /> },
    { to: '/library', label: lang === 'ar' ? 'مكتبتي' : 'Library', icon: <Bookmark className="w-4 h-4" /> },
    { to: '/coins', label: lang === 'ar' ? 'متجر العملات' : 'Coin Shop', icon: <Coins className="w-4 h-4" /> },
    { to: '/teams', label: t('teams'), icon: <Users className="w-4 h-4" /> },
  ];

  const nameMatch = siteName.match(/^(\w+)(.*)/);
  const namePart1 = nameMatch ? nameMatch[1] : siteName;
  const namePart2 = nameMatch ? nameMatch[2] : '';

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between gap-2 px-4">
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            {siteLogo ? (
              <img src={siteLogo} alt={siteName} className="w-8 h-8 rounded-lg object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary glow-purple flex items-center justify-center">
                <span className="text-primary-foreground font-orbitron font-bold text-sm">{siteName[0]}</span>
              </div>
            )}
            <span className="font-orbitron font-bold text-foreground hidden sm:block tracking-wider text-sm">
              {namePart1}<span className="text-primary">{namePart2}</span>
            </span>
          </Link>

          <div className="flex items-center gap-0 -me-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary w-9 h-9" asChild>
              <a href="https://discord.gg/" target="_blank" rel="noopener noreferrer">
                <DiscordIcon />
              </a>
            </Button>

            {user && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary relative w-9 h-9">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align={dir === 'rtl' ? 'start' : 'end'} className="w-80 p-0 bg-card border-border/50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                    <h3 className="font-bold text-foreground text-sm">{lang === 'ar' ? 'الإشعارات' : 'Notifications'}</h3>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={fetchNotifications} className="w-7 h-7 text-muted-foreground hover:text-primary">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                      {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-primary h-7">
                          {lang === 'ar' ? 'قراءة الكل' : 'Mark all read'}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications yet'}</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-border/20 hover:bg-primary/5 cursor-pointer transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                          onClick={() => {
                            if (!n.is_read) {
                              supabase.from('notifications').update({ is_read: true }).eq('id', n.id).then(() => {
                                setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
                                setUnreadCount(c => Math.max(0, c - 1));
                              });
                            }
                            if (n.link) navigate(n.link);
                          }}
                        >
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                          <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary w-9 h-9" onClick={() => setSearchOpen(!searchOpen)}>
              {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full outline-none focus:ring-2 focus:ring-primary/50 ms-0.5 p-0 shrink-0">
                    <Avatar className="w-8 h-8 border-2 border-primary/30 hover:border-primary/60 transition-colors">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                        {(profile?.username || user.email || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-64 bg-card border-border/50 p-0">
                  <div className="px-4 py-3 border-b border-border/30">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-primary/20">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                          {(profile?.username || '?')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm truncate">{profile?.display_name || profile?.username || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/20 text-destructive uppercase tracking-wider">
                        Super Admin
                      </span>
                    )}
                  </div>
                  <div className="px-4 py-2 border-b border-border/30">
                    <DropdownMenuItem onClick={() => navigate('/coins')} className="px-0 gap-2 text-primary font-medium">
                      <Coins className="w-4 h-4" /> {profile?.coins || 0} {t('coins')}
                    </DropdownMenuItem>
                  </div>
                  <div className="py-1">
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-2 px-4"><User className="w-4 h-4" /> {t('profile')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/coins')} className="gap-2 px-4"><Crown className="w-4 h-4" /> {t('membership')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/library')} className="gap-2 px-4"><Bookmark className="w-4 h-4" /> {lang === 'ar' ? 'مكتبتي' : 'My Library'}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2 px-4"><Settings className="w-4 h-4" /> {t('settings')}</DropdownMenuItem>
                  </div>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator className="bg-border/30" />
                      <div className="py-1">
                        <DropdownMenuItem onClick={() => navigate('/admin/manhwa')} className="gap-2 px-4"><Upload className="w-4 h-4" /> {lang === 'ar' ? 'رفع فصل' : 'Chapter Uploader'}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/admin/manhwa')} className="gap-2 px-4"><PlusSquare className="w-4 h-4" /> {lang === 'ar' ? 'إنشاء سلسلة' : 'Create Series'}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2 px-4"><Shield className="w-4 h-4" /> {t('dashboard')}</DropdownMenuItem>
                      </div>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-border/30" />
                  <div className="py-1">
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2 px-4"><HelpCircle className="w-4 h-4" /> {lang === 'ar' ? 'مساعدة ودعم' : 'Help & Support'}</DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <div className="py-1 pb-2">
                    <DropdownMenuItem onClick={signOut} className="gap-2 px-4 text-destructive focus:text-destructive"><LogOut className="w-4 h-4" /> {t('logout')}</DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className="ms-1">
                <Button size="sm" className="bg-primary hover:bg-primary/90 glow-purple text-xs h-8 px-3">{t('login')}</Button>
              </Link>
            )}

            <Button variant="ghost" size="icon" className="w-9 h-9 p-0 ms-0.5" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="text-muted-foreground hover:text-primary hidden md:flex w-9 h-9">
              <Globe className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-border/30 bg-background/95 backdrop-blur-xl">
            <div className="container py-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('search')}
                  className="bg-secondary/50 border-border/50 focus:border-primary/50"
                />
                <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 shrink-0">
                  <Search className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        )}

        {menuOpen && (
          <div className="border-t border-border/30 bg-background/95 backdrop-blur-xl">
            <div className="container py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {navLinks.map(link => (
                  <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}>
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card/50 hover:bg-primary/10 border border-border/30 hover:border-primary/30 text-muted-foreground hover:text-primary transition-all text-sm">
                      {link.icon} {link.label}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/20">
                <button onClick={() => { setLang(lang === 'ar' ? 'en' : 'ar'); setMenuOpen(false); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors text-sm md:hidden">
                  <Globe className="w-4 h-4" /> {lang === 'ar' ? 'English' : 'العربية'}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
