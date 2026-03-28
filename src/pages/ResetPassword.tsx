import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

const ResetPassword = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error(lang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'); return; }
    if (password.length < 6) { toast.error(lang === 'ar' ? 'كلمة المرور قصيرة جداً' : 'Password too short'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success(lang === 'ar' ? 'تم تغيير كلمة المرور!' : 'Password updated!'); navigate('/'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary glow-purple flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-cairo">{t('resetPassword')}</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-secondary border-none" />
          </div>
          <div className="space-y-2">
            <Label>{t('confirmPassword')}</Label>
            <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="bg-secondary border-none" />
          </div>
          <Button type="submit" className="w-full bg-primary" disabled={loading}>
            {loading ? t('loading') : t('resetPassword')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
