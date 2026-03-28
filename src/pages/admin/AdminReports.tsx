import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Check, Trash2, Flag, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdminReports = () => {
  const { lang } = useI18n();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    // Assuming table 'reports' exists. We will provide SQL to the user.
    const { data } = await supabase
      .from('reports')
      .select('*, profiles:user_id(username, display_name)')
      .order('created_at', { ascending: false });
    if (data) setReports(data);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const handleResolve = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل تم حل هذه المشكلة؟' : 'Mark as resolved?')) return;
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', id);
    toast.success(lang === 'ar' ? 'تم الحل!' : 'Resolved!');
    fetchReports();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'حذف البلاغ؟' : 'Delete report?')) return;
    await supabase.from('reports').delete().eq('id', id);
    toast.success(lang === 'ar' ? 'تم الحذف!' : 'Deleted!');
    fetchReports();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground font-cairo mb-6 flex items-center gap-2">
        <Flag className="w-5 h-5 text-primary" />
        {lang === 'ar' ? 'إدارة البلاغات والشكاوى' : 'User Reports'}
      </h2>
      
      {loading ? (
        <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : reports.length === 0 ? (
        <div className="p-8 text-center bg-card/50 rounded-xl border border-border/30 text-muted-foreground">
          {lang === 'ar' ? 'لا توجد بلاغات حالياً' : 'No reports found'}
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r: any) => (
            <div key={r.id} className="p-4 rounded-xl bg-card/50 border border-border/30 flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    r.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-destructive/20 text-destructive'
                  }`}>
                    {r.status === 'resolved' ? 'تم الحل' : 'في الانتظار'}
                  </span>
                  <span className="font-bold text-foreground text-sm">
                    {r.profiles?.display_name || r.profiles?.username || 'مستخدم مجهول'}
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 mb-2">
                  <span className="px-2 py-1 bg-secondary rounded text-xs text-muted-foreground font-medium border border-border/50">
                    نوع البلاغ: {r.type === 'bug' ? 'خطأ تقني' : r.type === 'payment' ? 'مشكلة شراء' : 'اقتراح / أخرى'}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground whitespace-pre-wrap mt-2 p-3 bg-secondary/30 rounded-lg border border-border/30">
                  {r.message}
                </p>
              </div>

              <div className="flex items-center gap-2 border-border/30 pt-2 md:pt-0">
                {r.status !== 'resolved' && (
                  <Button size="sm" variant="outline" onClick={() => handleResolve(r.id)} className="text-emerald-500 hover:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10">
                    <Check className="w-4 h-4 me-1" /> {lang === 'ar' ? 'تحديد كمحلول' : 'Resolve'}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => handleDelete(r.id)} className="text-destructive hover:text-red-400 border-destructive/30 hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default AdminReports;
