import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, Globe, LogOut, Lock } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error(lang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error(lang === 'ar' ? 'كلمة المرور قصيرة جداً' : 'Password too short (min 6)'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success(lang === 'ar' ? 'تم تغيير كلمة المرور!' : 'Password changed!'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Link to="/login"><Button>{t('login')}</Button></Link></div>;

  return (
    <div className="min-h-screen container py-8 max-w-lg">
      <h1 className="text-3xl font-bold text-foreground font-cairo mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-primary" />
        </div>
        {t('settings')}
      </h1>

      <div className="space-y-4">
        {/* Language */}
        <div className="p-5 rounded-xl bg-card/50 border border-border/30">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> {t('language')}</h3>
          <div className="flex gap-3">
            <Button onClick={() => setLang('ar')} variant={lang === 'ar' ? 'default' : 'outline'} className={lang === 'ar' ? 'bg-primary glow-purple' : 'border-border'}>
              {t('arabic')}
            </Button>
            <Button onClick={() => setLang('en')} variant={lang === 'en' ? 'default' : 'outline'} className={lang === 'en' ? 'bg-primary glow-purple' : 'border-border'}>
              {t('english')}
            </Button>
          </div>
        </div>

        {/* Change Password */}
        <div className="p-5 rounded-xl bg-card/50 border border-border/30">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> {lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</h3>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm">{lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-secondary/50 border-border/50" required />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">{t('confirmPassword')}</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-secondary/50 border-border/50" required />
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? t('loading') : (lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password')}
            </Button>
          </form>
        </div>

        {/* Account */}
        <div className="p-5 rounded-xl bg-card/50 border border-border/30">
          <h3 className="font-bold text-foreground mb-3">{lang === 'ar' ? 'الحساب' : 'Account'}</h3>
          <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
          <Button onClick={signOut} variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-2">
            <LogOut className="w-4 h-4" /> {t('logout')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
