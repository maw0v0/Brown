import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminCoins = () => {
  const { t, lang } = useI18n();
  const [packages, setPackages] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', name_ar: '', coins: '', price_usd: '' });

  const fetchPkgs = async () => {
    const { data } = await supabase.from('coin_packages').select('*').order('coins');
    if (data) setPackages(data);
  };
  useEffect(() => { fetchPkgs(); }, []);

  const addPackage = async () => {
    if (!form.name || !form.coins || !form.price_usd) return;
    const { error } = await supabase.from('coin_packages').insert({ name: form.name, name_ar: form.name_ar || form.name, coins: Number(form.coins), price_usd: Number(form.price_usd) });
    if (error) toast.error(error.message);
    else { toast.success('Added!'); setForm({ name: '', name_ar: '', coins: '', price_usd: '' }); fetchPkgs(); }
  };

  const deletePkg = async (id: string) => {
    await supabase.from('coin_packages').delete().eq('id', id);
    fetchPkgs();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground font-cairo mb-4">{t('manageCoins')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary/50 border-border/50" />
        <Input placeholder="الاسم" value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} className="bg-secondary/50 border-border/50" />
        <Input placeholder="Coins" type="number" value={form.coins} onChange={e => setForm(f => ({ ...f, coins: e.target.value }))} className="bg-secondary/50 border-border/50" />
        <div className="flex gap-2">
          <Input placeholder="Price $" type="number" value={form.price_usd} onChange={e => setForm(f => ({ ...f, price_usd: e.target.value }))} className="bg-secondary/50 border-border/50" />
          <Button onClick={addPackage} className="bg-primary hover:bg-primary/90 shrink-0"><Plus className="w-4 h-4" /></Button>
        </div>
      </div>
      <div className="space-y-2">
        {packages.map(p => (
          <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30">
            <div>
              <span className="font-medium text-foreground">{lang === 'ar' ? p.name_ar : p.name}</span>
              <span className="text-sm text-muted-foreground ms-3">{p.coins} coins = ${p.price_usd}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => deletePkg(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCoins;
