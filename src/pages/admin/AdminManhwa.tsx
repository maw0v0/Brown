import { useEffect, useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, BookOpen, Upload, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const AdminManhwa = () => {
  const { t, lang } = useI18n();
  const [manhwaList, setManhwaList] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', title_ar: '', slug: '', description: '', description_ar: '', cover_url: '', banner_url: '', author: '', artist: '', status: 'ongoing', team_id: '', release_year: '' });
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [coverUploading, setCoverUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const coverRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    const [mRes, gRes, tRes] = await Promise.all([
      supabase.from('manhwa').select('*').order('created_at', { ascending: false }),
      supabase.from('genres').select('*').order('name'),
      supabase.from('teams').select('id, name'),
    ]);
    if (mRes.data) setManhwaList(mRes.data);
    if (gRes.data) setGenres(gRes.data);
    if (tRes.data) setTeams(tRes.data);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', title_ar: '', slug: '', description: '', description_ar: '', cover_url: '', banner_url: '', author: '', artist: '', status: 'ongoing', team_id: '', release_year: '' });
    setSelectedGenres([]);
    setDialogOpen(true);
  };

  const openEdit = async (m: any) => {
    setEditing(m);
    setForm({ title: m.title, title_ar: m.title_ar || '', slug: m.slug, description: m.description || '', description_ar: m.description_ar || '', cover_url: m.cover_url || '', banner_url: m.banner_url || '', author: m.author || '', artist: m.artist || '', status: m.status, team_id: m.team_id || '', release_year: m.release_year?.toString() || '' });
    const { data: mg } = await supabase.from('manhwa_genres').select('genre_id').eq('manhwa_id', m.id);
    setSelectedGenres(mg?.map((g: any) => g.genre_id) || []);
    setDialogOpen(true);
  };

  const uploadCover = async (file: File) => {
    setCoverUploading(true);
    const ext = file.name.split('.').pop();
    const path = `covers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setCoverUploading(false); return; }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    setForm(f => ({ ...f, cover_url: urlData.publicUrl }));
    setCoverUploading(false);
    toast.success(lang === 'ar' ? 'تم رفع الغلاف!' : 'Cover uploaded!');
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const slug = form.slug || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const payload: any = {
      title: form.title,
      title_ar: form.title_ar || null,
      slug,
      description: form.description || null,
      description_ar: form.description_ar || null,
      cover_url: form.cover_url || null,
      banner_url: form.banner_url || null,
      author: form.author || null,
      artist: form.artist || null,
      status: form.status as 'ongoing' | 'completed' | 'hiatus',
      team_id: form.team_id || null,
      release_year: form.release_year ? Number(form.release_year) : null,
    };

    if (editing) {
      const { error } = await supabase.from('manhwa').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      await supabase.from('manhwa_genres').delete().eq('manhwa_id', editing.id);
      if (selectedGenres.length > 0) {
        await supabase.from('manhwa_genres').insert(selectedGenres.map(gid => ({ manhwa_id: editing.id, genre_id: gid })));
      }
      toast.success(lang === 'ar' ? 'تم التحديث!' : 'Updated!');
    } else {
      const { data, error } = await supabase.from('manhwa').insert(payload).select().single();
      if (error) { toast.error(error.message); return; }
      if (selectedGenres.length > 0 && data) {
        await supabase.from('manhwa_genres').insert(selectedGenres.map(gid => ({ manhwa_id: data.id, genre_id: gid })));
      }
      toast.success(lang === 'ar' ? 'تمت الإضافة!' : 'Added!');
    }
    setDialogOpen(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
    await supabase.from('manhwa_genres').delete().eq('manhwa_id', id);
    await supabase.from('manhwa').delete().eq('id', id);
    toast.success(lang === 'ar' ? 'تم الحذف!' : 'Deleted!');
    fetchAll();
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-foreground font-cairo">{lang === 'ar' ? 'إدارة السلسلات' : 'Manage Series'}</h2>
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث عن عمل...' : 'Search series...'}
              className="pl-10 bg-secondary/30 border-border/50 focus:border-primary/50 transition-all font-cairo"
            />
          </div>
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 gap-2 shrink-0"><Plus className="w-4 h-4" /> {t('addManhwa')}</Button>
        </div>
      </div>

      <div className="space-y-2">
        {manhwaList
          .filter(m => 
            m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (m.title_ar && m.title_ar.includes(searchQuery))
          )
          .map(m => (
          <div key={m.id} className="flex items-center gap-4 p-3 rounded-lg bg-card/50 border border-border/30">
            <img src={m.cover_url || `https://placehold.co/48x67/1a1a2e/7c3aed`} alt="" className="w-12 h-[67px] rounded object-cover bg-secondary" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">{lang === 'ar' && m.title_ar ? m.title_ar : m.title}</h3>
              <span className="text-xs text-muted-foreground">{m.status} • {m.views} {lang === 'ar' ? 'مشاهدة' : 'views'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Link to={`/admin/manhwa/${m.id}/chapters`}>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary"><BookOpen className="w-4 h-4" /></Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => openEdit(m)} className="text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {manhwaList.filter(m => 
            m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (m.title_ar && m.title_ar.includes(searchQuery))
          ).length === 0 && <div className="text-center py-12 text-muted-foreground font-cairo">{t('noResults')}</div>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="font-cairo">{editing ? t('editManhwa') : t('addManhwa')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Title (EN)</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
              <div><Label>Title (AR)</Label><Input value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
            </div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" className="bg-secondary/50 border-border/50" /></div>

            {/* Cover upload or URL */}
            <div>
              <Label>Cover</Label>
              <div className="flex gap-2 mt-1">
                <Input value={form.cover_url} onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))} placeholder="URL or upload" className="bg-secondary/50 border-border/50 flex-1" />
                <Button variant="outline" onClick={() => coverRef.current?.click()} disabled={coverUploading} className="shrink-0 gap-1">
                  <Upload className="w-3 h-3" /> {coverUploading ? '...' : (lang === 'ar' ? 'رفع' : 'Upload')}
                </Button>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadCover(e.target.files[0]); }} />
              </div>
              {form.cover_url && <img src={form.cover_url} alt="" className="w-20 h-28 object-cover rounded mt-2 bg-secondary" />}
            </div>

            <div><Label>Banner URL</Label><Input value={form.banner_url} onChange={e => setForm(f => ({ ...f, banner_url: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Author</Label><Input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
              <div><Label>Artist</Label><Input value={form.artist} onChange={e => setForm(f => ({ ...f, artist: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ongoing">Ongoing</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="hiatus">Hiatus</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Release Year</Label><Input type="number" value={form.release_year} onChange={e => setForm(f => ({ ...f, release_year: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
            </div>
            <div>
              <Label>Team</Label>
              <Select value={form.team_id} onValueChange={v => setForm(f => ({ ...f, team_id: v }))}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {teams.map(tm => <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Description (EN)</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
            <div><Label>Description (AR)</Label><Textarea value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
            <div>
              <Label>{t('genres')}</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {genres.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGenres(prev => prev.includes(g.id) ? prev.filter(id => id !== g.id) : [...prev, g.id])}
                    className={`px-3 py-1 rounded-full text-xs transition-all ${selectedGenres.includes(g.id) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-primary/10'}`}
                  >
                    {lang === 'ar' ? g.name_ar : g.name}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManhwa;
