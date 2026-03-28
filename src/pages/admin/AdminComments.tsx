import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Trash2, Flag } from 'lucide-react';
import { toast } from 'sonner';

const AdminComments = () => {
  const { t, lang } = useI18n();
  const [comments, setComments] = useState<any[]>([]);

  const fetchComments = async () => {
    const { data } = await supabase.from('comments').select('*, profiles:user_id(username)').order('created_at', { ascending: false }).limit(50);
    if (data) setComments(data);
  };
  useEffect(() => { fetchComments(); }, []);

  const deleteComment = async (id: string) => {
    await supabase.from('comments').delete().eq('id', id);
    toast.success('Deleted');
    fetchComments();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground font-cairo mb-4">{t('manageComments')}</h2>
      <div className="space-y-2">
        {comments.map(c => {
          const fallbackName = lang === 'ar' ? 'مستخدم مجهول' : 'Anonymous user';
          const displayName = c.profiles?.username || fallbackName;
          return (
            <div key={c.id} className={`flex items-start gap-3 p-3 rounded-lg bg-card/50 border ${c.is_reported ? 'border-destructive/30' : 'border-border/30'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{displayName}</span>
                  {c.is_reported && <Flag className="w-3 h-3 text-destructive" />}
                  <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-muted-foreground">{c.content}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteComment(c.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminComments;
