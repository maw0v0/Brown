import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const { t, lang } = useI18n();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary glow-purple flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-cairo">{t('forgotPassword')}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {lang === 'ar' ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور' : 'Enter your email and we\'ll send you a reset link'}
          </p>
        </div>

        {sent ? (
          <div className="text-center p-6 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-foreground font-medium">{lang === 'ar' ? 'تم إرسال رابط إعادة التعيين!' : 'Reset link sent!'}</p>
            <p className="text-sm text-muted-foreground mt-2">{lang === 'ar' ? 'تحقق من بريدك الإلكتروني' : 'Check your email inbox'}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-secondary border-none" />
            </div>
            <Button type="submit" className="w-full bg-primary" disabled={loading}>
              {loading ? t('loading') : (lang === 'ar' ? 'إرسال الرابط' : 'Send Reset Link')}
            </Button>
          </form>
        )}

        <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> {t('login')}
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
