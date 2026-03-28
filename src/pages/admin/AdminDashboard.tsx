import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Shield, BookOpen, Layers, Users, MessageSquare, Coins, BarChart3, UserCog, ArrowLeft, Eye, TrendingUp, Settings, Image, FileText, Bell, Lock, Database, HardDrive, UserCheck, Zap, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AdminDashboard = () => {
  const { t, lang } = useI18n();
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({ manhwa: 0, chapters: 0, users: 0, comments: 0, views: 0, coins: 0 });
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      supabase.from('manhwa').select('id, views', { count: 'exact' }),
      supabase.from('chapters').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id, coins', { count: 'exact' }),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
    ]).then(([m, c, u, cm]) => {
      const totalViews = m.data?.reduce((sum: number, item: any) => sum + (item.views || 0), 0) || 0;
      const totalCoins = u.data?.reduce((sum: number, item: any) => sum + (item.coins || 0), 0) || 0;
      setStats({
        manhwa: m.count || 0,
        chapters: c.count || 0,
        users: u.count || 0,
        comments: cm.count || 0,
        views: totalViews,
        coins: totalCoins,
      });
    });
    if (user) {
      supabase.from('profiles').select('username, avatar_url, display_name').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setProfile(data); });
    }
  }, [isAdmin, user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{lang === 'ar' ? 'غير مصرح' : 'Unauthorized'}</div>;

  const isBase = location.pathname === '/admin';

  const sidebarSections = [
    {
      title: lang === 'ar' ? 'لوحة التحكم' : 'Dashboard',
      items: [
        { to: '/admin', label: lang === 'ar' ? 'نظرة عامة' : 'Overview', icon: <BarChart3 className="w-4 h-4" />, exact: true },
      ],
    },
    {
      title: lang === 'ar' ? 'المحتوى' : 'Content',
      items: [
        { to: '/admin/manhwa', label: lang === 'ar' ? 'السلسلات' : 'Series', icon: <BookOpen className="w-4 h-4" /> },
        { to: '/admin/genres', label: t('manageGenres'), icon: <Layers className="w-4 h-4" /> },
      ],
    },
    {
      title: lang === 'ar' ? 'المستخدمين والاقتصاد' : 'Users & Economy',
      items: [
        { to: '/admin/users', label: t('manageUsers'), icon: <UserCog className="w-4 h-4" /> },
        { to: '/admin/coins', label: t('manageCoins'), icon: <Coins className="w-4 h-4" /> },
        { to: '/admin/transactions', label: lang === 'ar' ? 'العمليات والدفع' : 'Transactions', icon: <Zap className="w-4 h-4" /> },
        { to: '/admin/reports', label: lang === 'ar' ? 'البلاغات' : 'Reports', icon: <Flag className="w-4 h-4" /> },
        { to: '/admin/comments', label: t('manageComments'), icon: <MessageSquare className="w-4 h-4" /> },
      ],
    },
    {
      title: lang === 'ar' ? 'النظام' : 'System',
      items: [
        { to: '/admin/teams', label: t('manageTeams'), icon: <Users className="w-4 h-4" /> },
        { to: '/admin/settings', label: lang === 'ar' ? 'إعدادات الموقع' : 'Site Settings', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  const isActive = (to: string, exact?: boolean) => exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-60 border-e border-border/30 bg-card/30 shrink-0">
        {/* Admin header */}
        <div className="p-4 border-b border-border/30 flex items-center gap-2">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> {lang === 'ar' ? 'العودة للموقع' : 'Back to Site'}
          </Link>
        </div>
        <div className="p-4 border-b border-border/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Brown Manga</p>
            <p className="text-[10px] text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        {/* Nav sections */}
        <div className="flex-1 overflow-y-auto py-2">
          {sidebarSections.map(section => (
            <div key={section.title} className="mb-3">
              <p className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{section.title}</p>
              {section.items.map(item => (
                <Link key={item.to} to={item.to}>
                  <div className={`flex items-center gap-2.5 px-4 py-2 mx-2 rounded-lg text-sm transition-all ${isActive(item.to, (item as any).exact) ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}>
                    {item.icon} {item.label}
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* User */}
        <div className="p-4 border-t border-border/30 flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{(profile?.username || '?')[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{profile?.display_name || profile?.username}</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-14 border-b border-border/30 bg-background/80 backdrop-blur-xl flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {/* Mobile nav */}
            <div className="lg:hidden flex flex-wrap gap-1.5">
              {sidebarSections.flatMap(s => s.items).map(item => (
                <Link key={item.to} to={item.to}>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${isActive(item.to, (item as any).exact) ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground hover:text-primary bg-secondary/30'}`}>
                    {item.icon}
                  </div>
                </Link>
              ))}
            </div>
            <h1 className="text-lg font-bold text-foreground hidden lg:block">{t('dashboard')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground"><Bell className="w-4 h-4" /></Button>
            <Avatar className="w-7 h-7 lg:hidden">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">{(profile?.username || '?')[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="p-6">
          {isBase ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground font-cairo">{t('dashboard')}</h2>
                <p className="text-sm text-muted-foreground">
                  {lang === 'ar' ? `مرحباً مجدداً، ${profile?.display_name || profile?.username || 'Admin'}. هنا ما يحدث.` : `Welcome back, ${profile?.display_name || profile?.username || 'Admin'}. Here's what's happening.`}
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: lang === 'ar' ? 'إجمالي المستخدمين' : 'Total Users', value: stats.users, icon: <Users className="w-5 h-5" />, color: 'text-sky-400 bg-sky-500/15' },
                  { label: lang === 'ar' ? 'إجمالي المانجا' : 'Total Manga', value: stats.manhwa, icon: <BookOpen className="w-5 h-5" />, color: 'text-purple-400 bg-purple-500/15' },
                  { label: t('totalChapters'), value: stats.chapters, icon: <FileText className="w-5 h-5" />, color: 'text-emerald-400 bg-emerald-500/15' },
                  { label: lang === 'ar' ? 'العملات المتداولة' : 'Coins in Circulation', value: stats.coins.toLocaleString(), icon: <Coins className="w-5 h-5" />, color: 'text-amber-400 bg-amber-500/15' },
                ].map(s => (
                  <div key={s.label} className="p-4 rounded-xl bg-card/50 border border-border/30">
                    <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}>{s.icon}</div>
                    <p className="text-xs text-muted-foreground mb-0.5">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: lang === 'ar' ? 'إجمالي المشاهدات' : 'Total Views', value: stats.views.toLocaleString(), icon: <Eye className="w-5 h-5" />, color: 'text-rose-400 bg-rose-500/15' },
                  { label: lang === 'ar' ? 'التعليقات' : 'Comments', value: stats.comments, icon: <MessageSquare className="w-5 h-5" />, color: 'text-indigo-400 bg-indigo-500/15' },
                  { label: lang === 'ar' ? 'مشتريات معلقة' : 'Pending Purchases', value: 0, icon: <Zap className="w-5 h-5" />, color: 'text-orange-400 bg-orange-500/15' },
                  { label: lang === 'ar' ? 'مشتريات مؤكدة' : 'Approved Purchases', value: 0, icon: <UserCheck className="w-5 h-5" />, color: 'text-emerald-400 bg-emerald-500/15' },
                ].map(s => (
                  <div key={s.label} className="p-4 rounded-xl bg-card/50 border border-border/30">
                    <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}>{s.icon}</div>
                    <p className="text-xs text-muted-foreground mb-0.5">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Site Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-card/50 border border-border/30">
                  <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    {lang === 'ar' ? 'المشتريات الأخيرة' : 'Recent Purchases'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'لا توجد مشتريات حديثة' : 'No recent purchases'}</p>
                </div>
                <div className="p-5 rounded-xl bg-card/50 border border-border/30">
                  <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    {lang === 'ar' ? 'حالة الموقع' : 'Site Status'}
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: lang === 'ar' ? 'قاعدة البيانات' : 'Database', status: 'Healthy' },
                      { label: lang === 'ar' ? 'التخزين' : 'Storage', status: 'Healthy' },
                      { label: lang === 'ar' ? 'المصادقة' : 'Authentication', status: 'Healthy' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{item.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
