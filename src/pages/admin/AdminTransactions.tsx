import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdminTransactions = () => {
  const { lang } = useI18n();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    // Fetch pending transactions first, then others, ordered by date
    const { data: txData, error: txError } = await supabase
      .from('coin_transactions')
      .select('*, profiles(username, display_name)')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (txData) setTransactions(txData);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleApprove = async (tx: any) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من تأكيد هذه العملية وإضافة الرصيد؟' : 'Are you sure you want to approve this transaction and add coins?')) return;
    
    try {
      // 1. Mark as completed
      const { error: txError } = await supabase
        .from('coin_transactions')
        .update({ status: 'completed' } as any)
        .eq('id', tx.id);
      if (txError) throw txError;

      // 2. Add coins to user if it's a purchase
      if (tx.amount > 0 && tx.type === 'purchase') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins')
          .eq('user_id', tx.user_id)
          .single();
          
        const currentCoins = profile?.coins || 0;
        const { error: pError } = await supabase
          .from('profiles')
          .update({ coins: currentCoins + tx.amount })
          .eq('user_id', tx.user_id);
          
        if (pError) throw pError;
      }

      toast.success(lang === 'ar' ? 'تمت الموافقة وتم إضافة الرصيد.' : 'Approved and coins added.');
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReject = async (tx: any) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من رفض هذه العملية؟' : 'Are you sure you want to reject this transaction?')) return;
    
    try {
      const { error: txError } = await supabase
        .from('coin_transactions')
        .update({ status: 'rejected' } as any)
        .eq('id', tx.id);
      
      if (txError) throw txError;

      toast.success(lang === 'ar' ? 'تم الرفض.' : 'Rejected successfully.');
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground font-cairo mb-6">
        {lang === 'ar' ? 'إدارة العمليات والدفع' : 'Manage Transactions & Payments'}
      </h2>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-8 text-center bg-card/50 rounded-xl border border-border/30 text-muted-foreground">
          {lang === 'ar' ? 'لا توجد عمليات حالياً' : 'No transactions found'}
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="p-4 rounded-xl bg-card/50 border border-border/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-foreground">
                    {tx.profiles?.display_name || tx.profiles?.username || 'Unknown User'}
                  </span>
                  <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
                    @{tx.profiles?.username || 'unknown'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 
                    tx.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' : 
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {tx.status}
                  </span>
                </div>
                
                <p className="text-sm font-medium text-muted-foreground">{tx.description}</p>
                
                {tx.metadata && tx.metadata.txid && (
                  <div className="mt-2 p-2 bg-background/50 rounded text-xs font-mono select-all flex items-center gap-2 border border-border/50">
                    <span className="text-muted-foreground">TXID:</span>
                    <span className="text-yellow-500 font-bold">{tx.metadata.txid}</span>
                  </div>
                )}
                
                <p className="text-[10px] text-muted-foreground mt-2">
                  {new Date(tx.created_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className={`block text-xl font-bold font-orbitron ${tx.amount > 0 ? 'text-emerald-400' : 'text-foreground'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase">{lang === 'ar' ? 'عملة' : 'Coins'}</span>
                </div>

                {tx.status === 'pending' && (
                  <div className="flex items-center gap-2 border-l border-border/30 pl-4 ms-2">
                    <Button 
                      size="icon" 
                      variant="outline" 
                      onClick={() => handleApprove(tx)}
                      className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400 bg-emerald-500/5 transition-colors"
                      title={lang === 'ar' ? 'موافقة' : 'Approve'}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      onClick={() => handleReject(tx)}
                      className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400 bg-red-500/5 transition-colors"
                      title={lang === 'ar' ? 'رفض' : 'Reject'}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
