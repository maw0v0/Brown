import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminGenres = () => {
  const { t, lang } = useI18n();
  const [genres, setGenres] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');

  const fetchGenres = async () => {
    const { data } = await supabase.from('genres').select('*').order('name');
    if (data) setGenres(data);
  };
  useEffect(() => { fetchGenres(); }, []);

  const addGenre = async () => {
    if (!name.trim() || !nameAr.trim()) return;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { error } = await supabase.from('genres').insert({ name, name_ar: nameAr, slug });
    if (error) toast.error(error.message);
    else { toast.success(lang === 'ar' ? 'تمت الإضافة!' : 'Added!'); setName(''); setNameAr(''); fetchGenres(); }
  };

  const deleteGenre = async (id: string) => {
    await supabase.from('manhwa_genres').delete().eq('genre_id', id);
    await supabase.from('genres').delete().eq('id', id);
    fetchGenres();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground font-cairo mb-4">{t('manageGenres')}</h2>
      <div className="flex gap-3 mb-6">
        <Input placeholder="Name (EN)" value={name} onChange={e => setName(e.target.value)} className="bg-secondary/50 border-border/50" />
        <Input placeholder="الاسم (AR)" value={nameAr} onChange={e => setNameAr(e.target.value)} className="bg-secondary/50 border-border/50" />
        <Button onClick={addGenre} className="bg-primary hover:bg-primary/90 shrink-0"><Plus className="w-4 h-4" /></Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {genres.map(g => (
          <div key={g.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 border border-border/30">
            <span className="text-sm text-foreground">{lang === 'ar' ? g.name_ar : g.name}</span>
            <button onClick={() => deleteGenre(g.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGenres;
