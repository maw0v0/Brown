import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Users } from 'lucide-react';
import { toast } from 'sonner';

const AdminTeams = () => {
  const { t, lang } = useI18n();
  const [teams, setTeams] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', description_ar: '', logo_url: '', discord_url: '', twitter_url: '', instagram_url: '', telegram_url: '', website_url: '' });

  const [requests, setRequests] = useState<any[]>([]);

  const fetchTeams = async () => {
    const { data } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
    if (data) setTeams(data);

    const { data: reqData } = await supabase.from('join_requests').select('*, profiles:user_id(username, display_name), teams:team_id(name)').order('created_at', { ascending: false }).limit(50);
    if (reqData) setRequests(reqData);
  };
  useEffect(() => { fetchTeams(); }, []);

  const handleApproveRequest = async (req: any) => {
    await supabase.from('team_members').insert({ team_id: req.team_id, user_id: req.user_id, role: 'member' });
    await supabase.from('join_requests').delete().eq('id', req.id);
    toast.success('Approved and added to team');
    fetchTeams();
  };

  const handleRejectRequest = async (id: string) => {
    await supabase.from('join_requests').delete().eq('id', id);
    toast.success('Request rejected');
    fetchTeams();
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', description_ar: '', logo_url: '', discord_url: '', twitter_url: '', instagram_url: '', telegram_url: '', website_url: '' });
    setDialogOpen(true);
  };

  const openEdit = (team: any) => {
    setEditing(team);
    setForm({ name: team.name, description: team.description || '', description_ar: team.description_ar || '', logo_url: team.logo_url || '', discord_url: team.discord_url || '', twitter_url: team.twitter_url || '', instagram_url: team.instagram_url || '', telegram_url: team.telegram_url || '', website_url: team.website_url || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...form };
    if (editing) {
      const { error } = await supabase.from('teams').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from('teams').insert(payload);
      if (error) { toast.error(error.message); return; }
    }
    toast.success('Saved!');
    setDialogOpen(false);
    fetchTeams();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    await supabase.from('teams').delete().eq('id', id);
    fetchTeams();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground font-cairo">{t('manageTeams')}</h2>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 gap-2"><Plus className="w-4 h-4" /> Add Team</Button>
      </div>
      <div className="space-y-2">
        {teams.map(team => (
          <div key={team.id} className="flex items-center gap-4 p-3 rounded-lg bg-card/50 border border-border/30">
            {team.logo_url ? <img src={team.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center"><Users className="w-4 h-4 text-primary" /></div>}
            <span className="font-medium text-foreground flex-1">{team.name}</span>
            <Button variant="ghost" size="icon" onClick={() => openEdit(team)} className="text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(team.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold text-foreground font-cairo mb-4">{lang === 'ar' ? 'طلبات الانضمام' : 'Join Requests'}</h2>
        <div className="space-y-2">
          {requests.map(req => (
            <div key={req.id} className="p-4 rounded-lg bg-card/50 border border-border/30 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">
                  {req.profiles?.display_name || req.profiles?.username || 'Unknown User'} 
                  <span className="text-muted-foreground mx-2">{'->'}</span> 
                  <span className="text-primary">{req.teams?.name}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{req.message || 'No message'}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApproveRequest(req)} className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 w-8 h-8 p-0"><Plus className="w-4 h-4" /></Button>
                <Button size="sm" onClick={() => handleRejectRequest(req.id)} className="bg-destructive/10 text-destructive hover:bg-destructive/20 w-8 h-8 p-0"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <p className="text-muted-foreground text-sm flex items-center justify-center p-8 bg-card/30 rounded-lg">{lang === 'ar' ? 'لا توجد طلبات' : 'No requests'}</p>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto glass border-border/50">
          <DialogHeader><DialogTitle className="font-cairo">{editing ? 'Edit Team' : 'Add Team'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
            <div><Label>Logo URL</Label><Input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
            <div><Label>الوصف (AR)</Label><Textarea value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Discord</Label><Input value={form.discord_url} onChange={e => setForm(f => ({ ...f, discord_url: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
              <div><Label>Twitter/X</Label><Input value={form.twitter_url} onChange={e => setForm(f => ({ ...f, twitter_url: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
              <div><Label>Instagram</Label><Input value={form.instagram_url} onChange={e => setForm(f => ({ ...f, instagram_url: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
              <div><Label>Telegram</Label><Input value={form.telegram_url} onChange={e => setForm(f => ({ ...f, telegram_url: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
            </div>
            <div><Label>Website</Label><Input value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
            <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTeams;
