import { useEffect, useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Upload, Image, Star } from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings = () => {
  const { lang } = useI18n();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [manhwaList, setManhwaList] = useState<any[]>([]);
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const [settingsRes, manhwaRes] = await Promise.all([
        supabase.from('site_settings').select('*'),
        supabase.from('manhwa').select('id, title, title_ar, cover_url, slug').order('title'),
      ]);
      const s: Record<string, string> = {};
      settingsRes.data?.forEach((r: any) => { s[r.key] = r.value; });
      setSettings(s);
      if (s.featured_manhwa_ids) {
        try { setFeaturedIds(JSON.parse(s.featured_manhwa_ids)); } catch {}
      }
      if (manhwaRes.data) setManhwaList(manhwaRes.data);
      setLoading(false);
    };
    fetch();
  }, []);

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase.from('site_settings').upsert({ key, value }, { onConflict: 'key' });
    if (error) {
      toast.error(error.message);
      return false;
    }
    setSettings(prev => ({ ...prev, [key]: value }));
    return true;
  };

  const handleSaveName = async () => {
    const ok = await updateSetting('site_name', settings.site_name || 'RealmScans');
    if (ok) toast.success(lang === 'ar' ? 'تم الحفظ!' : 'Saved!');
  };

  const handleUpload = async (file: File, key: string) => {
    const ext = file.name.split('.').pop();
    const path = `site/${key}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const settingKey = key === 'logo' ? 'site_logo_url' : 'favicon_url';
    const ok = await updateSetting(settingKey, data.publicUrl);
    if (ok) toast.success(lang === 'ar' ? 'تم الرفع!' : 'Uploaded!');
  };

  const toggleFeatured = async (manhwaId: string) => {
    const newIds = featuredIds.includes(manhwaId)
      ? featuredIds.filter(id => id !== manhwaId)
      : [...featuredIds, manhwaId];
    setFeaturedIds(newIds);
    await updateSetting('featured_manhwa_ids', JSON.stringify(newIds));
  };

  const handleSaveText = async (key: string) => {
    const ok = await updateSetting(key, settings[key] || '');
    if (ok) toast.success(lang === 'ar' ? 'تم الحفظ!' : 'Saved!');
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-foreground font-cairo flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        {lang === 'ar' ? 'إعدادات الموقع' : 'Site Settings'}
      </h2>

      {/* Site Name */}
      <div className="p-5 rounded-xl bg-card/50 border border-border/30 space-y-3">
        <h3 className="font-bold text-foreground">{lang === 'ar' ? 'اسم الموقع' : 'Site Name'}</h3>
        <div className="flex gap-3">
          <Input value={settings.site_name || ''} onChange={e => setSettings(s => ({ ...s, site_name: e.target.value }))} className="bg-secondary/50 border-border/50 max-w-sm" />
          <Button onClick={handleSaveName} className="bg-primary hover:bg-primary/90">{lang === 'ar' ? 'حفظ' : 'Save'}</Button>
        </div>
      </div>

      {/* Binance Settings */}
      <div className="p-5 rounded-xl bg-card/50 border border-border/30 space-y-3">
        <h3 className="font-bold text-foreground">{lang === 'ar' ? 'رقم حساب باينانس (Binance ID)' : 'Binance ID'}</h3>
        <div className="flex gap-3">
          <Input value={settings.binance_id || ''} onChange={e => setSettings(s => ({ ...s, binance_id: e.target.value }))} className="bg-secondary/50 border-border/50 max-w-sm" />
          <Button onClick={() => handleSaveText('binance_id')} className="bg-primary hover:bg-primary/90">{lang === 'ar' ? 'حفظ' : 'Save'}</Button>
        </div>
      </div>

      {/* Discord URL */}
      <div className="p-5 rounded-xl bg-card/50 border border-border/30 space-y-3">
        <h3 className="font-bold text-foreground">{lang === 'ar' ? 'رابط خادم الديسكورد (Discord URL)' : 'Discord URL'}</h3>
        <div className="flex gap-3">
          <Input value={settings.discord_url || ''} onChange={e => setSettings(s => ({ ...s, discord_url: e.target.value }))} className="bg-secondary/50 border-border/50 max-w-sm" placeholder="https://discord.gg/..." />
          <Button onClick={() => handleSaveText('discord_url')} className="bg-primary hover:bg-primary/90">{lang === 'ar' ? 'حفظ' : 'Save'}</Button>
        </div>
      </div>

      {/* Logo */}
      <div className="p-5 rounded-xl bg-card/50 border border-border/30 space-y-3">
        <h3 className="font-bold text-foreground">{lang === 'ar' ? 'شعار الموقع' : 'Site Logo'}</h3>
        <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'يظهر في النافبار والفوتر' : 'Shown in Navbar and Footer'}</p>
        <div className="flex items-center gap-4">
          {settings.site_logo_url && (
            <img src={settings.site_logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-lg border border-border/30" />
          )}
          <Button variant="outline" onClick={() => logoInputRef.current?.click()} className="gap-2">
            <Upload className="w-4 h-4" /> {lang === 'ar' ? 'رفع شعار' : 'Upload Logo'}
          </Button>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'logo'); }} />
        </div>
      </div>

      {/* Favicon */}
      <div className="p-5 rounded-xl bg-card/50 border border-border/30 space-y-3">
        <h3 className="font-bold text-foreground">{lang === 'ar' ? 'أيقونة الموقع (Favicon)' : 'Favicon'}</h3>
        <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'الأيقونة التي تظهر في تبويب المتصفح' : 'The icon shown in browser tab'}</p>
        <div className="flex items-center gap-4">
          {settings.favicon_url && (
            <img src={settings.favicon_url} alt="Favicon" className="w-8 h-8 object-contain rounded border border-border/30" />
          )}
          <Button variant="outline" onClick={() => faviconInputRef.current?.click()} className="gap-2">
            <Image className="w-4 h-4" /> {lang === 'ar' ? 'رفع أيقونة' : 'Upload Favicon'}
          </Button>
          <input ref={faviconInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'favicon'); }} />
        </div>
      </div>

      {/* Colors */}
      <div className="p-5 rounded-xl bg-card/50 border border-border/30 space-y-3">
        <h3 className="font-bold text-foreground">{lang === 'ar' ? 'ألوان الموقع' : 'Site Colors'}</h3>
        <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'تخصيص الألوان الرئيسية للموقع' : 'Customize the main colors for the site'}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{lang === 'ar' ? 'اللون الأساسي (Primary)' : 'Primary Color'}</label>
            <div className="flex gap-3">
              <input 
                type="color" 
                value={settings.color_primary || '#8b5cf6'} 
                onChange={e => setSettings(s => ({ ...s, color_primary: e.target.value }))} 
                className="w-12 h-10 p-0.5 rounded cursor-pointer bg-secondary/50 border border-border/50" 
              />
              <Button onClick={() => handleSaveText('color_primary')} className="bg-primary hover:bg-primary/90">{lang === 'ar' ? 'حفظ' : 'Save'}</Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{lang === 'ar' ? 'لون الخلفية (Background)' : 'Background Color'}</label>
            <div className="flex gap-3">
              <input 
                type="color" 
                value={settings.color_background || '#090514'} 
                onChange={e => setSettings(s => ({ ...s, color_background: e.target.value }))} 
                className="w-12 h-10 p-0.5 rounded cursor-pointer bg-secondary/50 border border-border/50" 
              />
              <Button onClick={() => handleSaveText('color_background')} className="bg-primary hover:bg-primary/90">{lang === 'ar' ? 'حفظ' : 'Save'}</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Manhwa */}
      <div className="p-5 rounded-xl bg-card/50 border border-border/30 space-y-3">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          {lang === 'ar' ? 'المانهوات المميزة (تظهر في الصفحة الرئيسية)' : 'Featured Manhwa (shown on homepage)'}
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {manhwaList.map(m => (
            <div key={m.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${featuredIds.includes(m.id) ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/30 hover:bg-secondary/50'}`} onClick={() => toggleFeatured(m.id)}>
              <img src={m.cover_url || ''} alt="" className="w-10 h-14 object-cover rounded" />
              <span className="text-sm text-foreground flex-1">{lang === 'ar' ? (m.title_ar || m.title) : m.title}</span>
              {featuredIds.includes(m.id) && <Star className="w-4 h-4 text-primary fill-primary" />}
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Policy */}
      <div className="p-5 rounded-xl bg-card/50 border border-border/30 space-y-3">
        <h3 className="font-bold text-foreground">{lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</h3>
        <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'يدعم HTML' : 'Supports HTML'}</p>
        <Textarea
          value={settings.privacy_policy || ''}
          onChange={e => setSettings(s => ({ ...s, privacy_policy: e.target.value }))}
          className="bg-secondary/50 border-border/50 min-h-[150px] font-mono text-xs"
        />
        <Button onClick={() => handleSaveText('privacy_policy')} className="bg-primary hover:bg-primary/90">
          {lang === 'ar' ? 'حفظ' : 'Save'}
        </Button>
      </div>

      {/* Terms of Service */}
      <div className="p-5 rounded-xl bg-card/50 border border-border/30 space-y-3">
        <h3 className="font-bold text-foreground">{lang === 'ar' ? 'الشروط والأحكام' : 'Terms of Service'}</h3>
        <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'يدعم HTML' : 'Supports HTML'}</p>
        <Textarea
          value={settings.terms_of_service || ''}
          onChange={e => setSettings(s => ({ ...s, terms_of_service: e.target.value }))}
          className="bg-secondary/50 border-border/50 min-h-[150px] font-mono text-xs"
        />
        <Button onClick={() => handleSaveText('terms_of_service')} className="bg-primary hover:bg-primary/90">
          {lang === 'ar' ? 'حفظ' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
