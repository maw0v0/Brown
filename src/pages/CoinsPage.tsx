import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Coins, Crown, Sparkles, Clock, CreditCard, Landmark, Wallet, Apple, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const BinanceIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#F3BA2F]">
    <path d="M16.624 13.9202l-2.717 2.7154-2.717-2.7154-1.503 1.503 4.22 4.2091 4.22-4.2091-1.503-1.503zm5.49-3.9903l-2.717 2.7154-2.717-2.7154-1.503 1.503 4.22 4.2091 4.22-4.2091-1.503-1.503zm-10.98 0l-2.717 2.7154-2.717-2.7154-1.503 1.503 4.22 4.2091 4.22-4.2091-1.503-1.503zm5.49-3.9903l-2.717 2.7154-2.717-2.7154-1.503 1.503 4.22 4.2091 4.22-4.2091-1.503-1.503z" />
  </svg>
);

const CoinsPage = () => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [purchaseType, setPurchaseType] = useState<'package' | 'membership' | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // حالات الدفع الجديدة
  const [paymentMethod, setPaymentMethod] = useState<'binance' | 'stripe' | 'paypal' | null>(null);
  const [txid, setTxid] = useState('');
  const [binanceId, setBinanceId] = useState('84920485');

  const fetchData = async () => {
    if (!user) return;
    const [profileRes, pkgRes, memRes, txRes, settingsRes] = await Promise.all([
      supabase.from('profiles').select('coins').eq('user_id', user.id).single(),
      supabase.from('coin_packages').select('*').eq('is_active', true).order('coins'),
      supabase.from('memberships').select('*').eq('is_active', true),
      supabase.from('coin_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('site_settings').select('value').eq('key', 'binance_id').maybeSingle(),
    ]);
    if (profileRes.data) setProfile(profileRes.data);
    if (pkgRes.data) setPackages(pkgRes.data);
    if (memRes.data) setMemberships(memRes.data);
    if (txRes.data) setTransactions(txRes.data);
    if (settingsRes.data?.value) setBinanceId(settingsRes.data.value);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleOpenCheckout = (item: any, type: 'package' | 'membership') => {
    setSelectedItem(item);
    setPurchaseType(type);
    setPaymentMethod(null);
    setTxid('');
    setCheckoutOpen(true);
  };

  const handleProcessPurchase = async () => {
    if (!user || !selectedItem || !purchaseType || !paymentMethod) {
      toast.error(lang === 'ar' ? 'يرجى اختيار وسيلة دفع' : 'Please select a payment method');
      return;
    }

    if (paymentMethod === 'binance' && !txid.trim()) {
      toast.error(lang === 'ar' ? 'يرجى إدخال رقم المعاملة (TXID)' : 'Please enter Transaction ID (TXID)');
      return;
    }

    setIsProcessing(true);

    try {
      // إدراج معاملة قيد الانتظار للمراجعة
      const { error: txError } = await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: purchaseType === 'package' ? selectedItem.coins : 0,
        type: 'purchase',
        status: paymentMethod === 'binance' ? 'pending' : 'completed',
        description: `Purchase: ${selectedItem.name} via ${paymentMethod}`,
        metadata: { 
          txid: txid, 
          method: paymentMethod,
          item_id: selectedItem.id,
          type: purchaseType 
        }
      });

      if (txError) throw txError;

      if (paymentMethod === 'binance') {
        toast.info(lang === 'ar' 
          ? "تم إرسال الطلب! سيتم إضافة الرصيد بعد مراجعة رقم المعاملة." 
          : "Order submitted! Coins will be added after TXID verification.");
      } else {
        // محاكاة نجاح للوسائل الأخرى حالياً
        toast.success(lang === 'ar' ? "تمت العملية بنجاح!" : "Payment successful!");
      }

      setCheckoutOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Link to="/login"><Button>{t('login')}</Button></Link></div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen container py-8 max-w-4xl">
      {/* Balance Section */}
      <div className="text-center mb-10 p-8 rounded-2xl bg-card/50 border border-primary/20 glow-purple">
        <Coins className="w-12 h-12 text-primary mx-auto mb-3" />
        <p className="text-muted-foreground text-sm mb-1">{lang === 'ar' ? 'رصيدك الحالي' : 'Current Balance'}</p>
        <h1 className="text-5xl font-bold text-foreground font-orbitron">{profile?.coins || 0}</h1>
        <p className="text-primary text-sm mt-1">{t('coins')}</p>
      </div>

      {/* Packages Section */}
      <h2 className="text-xl font-bold text-foreground font-cairo mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" /> {t('buyCoins')}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
        {packages.map(pkg => (
          <div key={pkg.id} className="p-5 rounded-xl bg-card/50 border border-border/30 hover:border-primary/30 transition-all text-center group">
            <p className="text-3xl font-bold text-foreground font-orbitron mb-1">{pkg.coins}</p>
            <p className="text-sm text-muted-foreground mb-3">{lang === 'ar' ? pkg.name_ar : pkg.name}</p>
            <Button 
              onClick={() => handleOpenCheckout(pkg, 'package')}
              className="bg-primary hover:bg-primary/90 w-full glow-purple text-sm"
            >
              ${pkg.price_usd}
            </Button>
          </div>
        ))}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md bg-card border-border/50 p-0 overflow-hidden shadow-2xl">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle className="text-2xl font-orbitron text-center">
                {lang === 'ar' ? 'تأكيد الدفع' : 'Secure Checkout'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <p className="text-muted-foreground text-xs uppercase tracking-widest">{lang === 'ar' ? 'الباقة المختارة' : 'Selected Item'}</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {selectedItem && (purchaseType === 'package' 
                  ? `${selectedItem.coins} ${t('coins')}` 
                  : (lang === 'ar' ? selectedItem.name_ar : selectedItem.name))}
              </h3>
              <p className="text-primary font-orbitron text-3xl mt-2 font-black">${selectedItem?.price_usd}</p>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-sm font-bold text-muted-foreground">{lang === 'ar' ? 'اختر وسيلة الدفع:' : 'Payment Method:'}</p>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => setPaymentMethod('binance')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2 ${paymentMethod === 'binance' ? 'border-[#F3BA2F] bg-[#F3BA2F]/10' : 'border-border/50 bg-secondary/20'}`}
                >
                  <BinanceIcon />
                  <span className="text-[10px] font-bold">Binance</span>
                </button>
              </div>
            </div>

            {/* Binance Instructions */}
            {paymentMethod === 'binance' && (
              <div className="mt-4 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-yellow-500">
                  <Info className="w-4 h-4" />
                  <p className="text-[11px] font-bold uppercase">{lang === 'ar' ? 'تعليمات بايننس' : 'Binance Instructions'}</p>
                </div>
                <div className="bg-background/50 p-2 rounded border border-yellow-500/10 select-all">
                  <p className="text-[10px] text-muted-foreground mb-1">{lang === 'ar' ? 'أرسل المبلغ إلى Binance ID:' : 'Send amount to Binance ID:'}</p>
                  <p className="text-sm font-mono font-bold text-center">{binanceId}</p>
                </div>
                <Input 
                  placeholder="Transaction ID (TXID)" 
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                  className="h-9 text-xs border-yellow-500/30 focus:ring-yellow-500"
                />
              </div>
            )}
          </div>

          <div className="p-6 mt-6 border-t border-border/30 bg-secondary/10">
            <Button 
              onClick={handleProcessPurchase} 
              disabled={isProcessing || !paymentMethod}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-bold glow-purple disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                </div>
              ) : (
                lang === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transactions History */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-foreground font-cairo mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" /> {lang === 'ar' ? 'سجل العمليات' : 'Transaction History'}
        </h2>
        <div className="space-y-2">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-card/30 border border-border/20">
              <div>
                <p className="text-sm font-medium">{tx.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                    tx.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                    'bg-emerald-500/20 text-emerald-500'
                  }`}>
                    {tx.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <span className={`font-bold font-orbitron ${tx.amount > 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoinsPage;