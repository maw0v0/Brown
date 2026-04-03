import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';

const Footer = () => {
  const { t, lang } = useI18n();
  const [siteName, setSiteName] = useState('Brown Manga');
  const [siteLogo, setSiteLogo] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('*').then(({ data }) => {
      data?.forEach((r: any) => {
        if (r.key === 'site_name' && r.value) setSiteName(r.value);
        if (r.key === 'site_logo_url' && r.value) setSiteLogo(r.value);
      });
    });
  }, []);

  return (
    <footer className="border-t border-border/50 mt-16 bg-background/50 backdrop-blur-sm">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="w-8 h-8 rounded-lg object-contain transition-transform group-hover:scale-110" />
              ) : (
                // تم استبدال glow-purple بـ shadow-glow ليتبع لون قاعدة البيانات
                <div className="w-8 h-8 rounded-lg bg-primary shadow-glow flex items-center justify-center transition-transform group-hover:scale-110">
                  <span className="text-primary-foreground font-orbitron font-bold">{siteName[0]}</span>
                </div>
              )}
              <span className="font-orbitron font-bold text-foreground tracking-tight">{siteName}</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {lang === 'ar' ? 'أفضل موقع عربي لقراءة المانهوا والمانجا مترجمة بجودة عالية.' : 'The best Arabic site for reading translated manhwa and manga in high quality.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">{lang === 'ar' ? 'روابط سريعة' : 'Quick Links'}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">{t('home')}</Link></li>
              <li><Link to="/browse" className="text-muted-foreground hover:text-primary transition-colors">{lang === 'ar' ? 'تصفح' : 'Browse'}</Link></li>
              <li><Link to="/genres" className="text-muted-foreground hover:text-primary transition-colors">{t('genres')}</Link></li>
              <li><Link to="/teams" className="text-muted-foreground hover:text-primary transition-colors">{t('teams')}</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">{lang === 'ar' ? 'الحساب' : 'Account'}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/profile" className="text-muted-foreground hover:text-primary transition-colors">{t('profile')}</Link></li>
              <li><Link to="/coins" className="text-muted-foreground hover:text-primary transition-colors">{t('coins')}</Link></li>
              <li><Link to="/settings" className="text-muted-foreground hover:text-primary transition-colors">{t('settings')}</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">{lang === 'ar' ? 'المجتمع' : 'Community'}</h4>
            <div className="flex gap-3">
              {/* زر ديسكورد */}
              <a href="https://discord.gg/qFGmWUZ7w5" target="_blank" rel="noopener noreferrer" 
                 className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all shadow-sm">
                <span className="font-bold text-xs">Discord</span>
              </a>

              {/* زر تيك توك */}
              <a href="https://www.tiktok.com/@brown.manga0" target="_blank" rel="noopener noreferrer" 
                 className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all shadow-sm">
                <span className="font-bold text-xs">TikTok</span>
              </a>

              {/* زر تيليجرام */}
              <a href="https://t.me/brownmanga" target="_blank" rel="noopener noreferrer" 
                 className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all shadow-sm">
                <span className="font-bold text-xs">TG</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 {siteName}. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          <div className="flex gap-6 text-xs font-medium">
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">{lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">{lang === 'ar' ? 'الشروط والأحكام' : 'Terms of Service'}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
