import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit2, Image, Upload, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const AdminChapters = () => {
  const { manhwaId } = useParams();
  const { t, lang } = useI18n();
  const [manhwa, setManhwa] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pagesDialog, setPagesDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ chapter_number: '', title: '', title_ar: '', is_locked: false, coin_price: '0', lock_duration_days: '0' });
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [newPageUrls, setNewPageUrls] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chapterFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [chapterUrls, setChapterUrls] = useState('');

  const fetchChapters = async () => {
    if (!manhwaId) return;
    const { data: m } = await supabase.from('manhwa').select('*').eq('id', manhwaId).single();
    if (m) setManhwa(m);
    const { data } = await supabase.from('chapters').select('*').eq('manhwa_id', manhwaId).order('chapter_number', { ascending: false });
    if (data) setChapters(data);
  };

  useEffect(() => { fetchChapters(); }, [manhwaId]);

  const openCreate = () => {
    setEditing(null);
    const nextNum = chapters.length > 0 ? Math.max(...chapters.map(c => c.chapter_number)) + 1 : 1;
    setForm({ chapter_number: nextNum.toString(), title: '', title_ar: '', is_locked: false, coin_price: '0', lock_duration_days: '0' });
    setSelectedFiles([]);
    setChapterUrls('');
    setDialogOpen(true);
  };

  const openEdit = (ch: any) => {
    setEditing(ch);
    setForm({
      chapter_number: ch.chapter_number.toString(),
      title: ch.title || '',
      title_ar: ch.title_ar || '',
      is_locked: ch.is_locked,
      coin_price: ch.coin_price.toString(),
      lock_duration_days: (ch.lock_duration_days || 0).toString(),
    });
    setSelectedFiles([]);
    setChapterUrls('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setUploading(true);
    setUploadProgress(0);

    const payload: any = {
      manhwa_id: manhwaId!,
      chapter_number: Number(form.chapter_number),
      title: form.title || null,
      title_ar: form.title_ar || null,
      is_locked: form.is_locked,
      coin_price: Number(form.coin_price) || 0,
      lock_duration_days: form.is_locked ? (Number(form.lock_duration_days) || 0) : 0,
    };
    
    let currentChapterId = editing?.id;

    if (editing) {
      const { error } = await supabase.from('chapters').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); setUploading(false); return; }
      toast.success(lang === 'ar' ? 'تم التحديث!' : 'Updated!');
    } else {
      const { data, error } = await supabase.from('chapters').insert(payload).select().single();
      if (error) { toast.error(error.message); setUploading(false); return; }
      currentChapterId = data.id;
      toast.success(lang === 'ar' ? 'تم النشر!' : 'Published!');
    }

    if (currentChapterId && (selectedFiles.length > 0 || chapterUrls.trim())) {
      let addedPagesCount = 0;
      const { data: existingPages } = await supabase.from('chapter_pages').select('page_number').eq('chapter_id', currentChapterId);
      let startNum = existingPages ? existingPages.length + 1 : 1;

      if (chapterUrls.trim()) {
        const urls = chapterUrls.split('\n').map(u => u.trim()).filter(Boolean);
        if (urls.length > 0) {
          const inserts = urls.map((url, i) => ({ chapter_id: currentChapterId, image_url: url, page_number: startNum + i }));
          const { error } = await supabase.from('chapter_pages').insert(inserts);
          if (!error) {
            startNum += urls.length;
            addedPagesCount += urls.length;
          }
        }
      }

      if (selectedFiles.length > 0) {
        const sortedFiles = Array.from(selectedFiles).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        const inserts: { chapter_id: string; image_url: string; page_number: number }[] = [];

        for (let i = 0; i < sortedFiles.length; i++) {
          const file = sortedFiles[i];
          const ext = file.name.split('.').pop();
          const path = `chapters/${currentChapterId}/page-${startNum + i}.${ext}`;

          // [تعديل قيس]: تم إلغاء كود الضغط والتصغير لرفع الجودة الأصلية
          let uploadFile: File = file;

          const { error } = await supabase.storage.from('avatars').upload(path, uploadFile, { upsert: true });
          if (error) { toast.error(`${file.name}: ${error.message}`); continue; }
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
          inserts.push({ chapter_id: currentChapterId, image_url: urlData.publicUrl, page_number: startNum + i });
          setUploadProgress(Math.round(((i + 1) / sortedFiles.length) * 100));
        }

        if (inserts.length > 0) {
          await supabase.from('chapter_pages').insert(inserts);
          addedPagesCount += inserts.length;
        }
      }

      if (addedPagesCount > 0) {
        toast.success(lang === 'ar' ? `تم إضافة ${addedPagesCount} صفحة!` : `${addedPagesCount} pages added!`);
      }
    }

    setUploading(false);
    setUploadProgress(0);
    setDialogOpen(false);
    fetchChapters();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
    await supabase.from('chapter_pages').delete().eq('chapter_id', id);
    await supabase.from('chapters').delete().eq('id', id);
    toast.success(lang === 'ar' ? 'تم الحذف!' : 'Deleted!');
    fetchChapters();
  };

  const openPages = async (ch: any) => {
    setSelectedChapter(ch);
    const { data } = await supabase.from('chapter_pages').select('*').eq('chapter_id', ch.id).order('page_number');
    setPages(data || []);
    setNewPageUrls('');
    setPagesDialog(true);
  };

  const addPages = async () => {
    if (!selectedChapter || !newPageUrls.trim()) return;
    const urls = newPageUrls.split('\n').map(u => u.trim()).filter(Boolean);
    const startNum = pages.length + 1;
    const inserts = urls.map((url, i) => ({ chapter_id: selectedChapter.id, image_url: url, page_number: startNum + i }));
    const { error } = await supabase.from('chapter_pages').insert(inserts);
    if (error) { toast.error(error.message); return; }
    toast.success(lang === 'ar' ? 'تمت الإضافة!' : 'Pages added!');
    openPages(selectedChapter);
  };

  const handleImageUpload = async (files: FileList) => {
    if (!selectedChapter || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    const startNum = pages.length + 1;
    const sortedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const inserts: { chapter_id: string; image_url: string; page_number: number }[] = [];

    for (let i = 0; i < sortedFiles.length; i++) {
      const file = sortedFiles[i];
      const ext = file.name.split('.').pop();
      const path = `chapters/${selectedChapter.id}/page-${startNum + i}.${ext}`;

      // [تعديل قيس]: تم إلغاء كود الضغط والتصغير لرفع الجودة الأصلية
      let uploadFile: File = file;

      const { error } = await supabase.storage.from('avatars').upload(path, uploadFile, { upsert: true });
      if (error) { toast.error(`${file.name}: ${error.message}`); continue; }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      inserts.push({ chapter_id: selectedChapter.id, image_url: urlData.publicUrl, page_number: startNum + i });
      setUploadProgress(Math.round(((i + 1) / sortedFiles.length) * 100));
    }

    if (inserts.length > 0) {
      await supabase.from('chapter_pages').insert(inserts);
      toast.success(lang === 'ar' ? `تم رفع ${inserts.length} صفحة!` : `${inserts.length} pages uploaded!`);
      openPages(selectedChapter);
    }
    setUploading(false);
    setUploadProgress(0);
  };

  const deletePage = async (pageId: string) => {
    await supabase.from('chapter_pages').delete().eq('id', pageId);
    if (selectedChapter) openPages(selectedChapter);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground font-cairo">
          {manhwa?.title || ''} - {t('chapters')}
        </h2>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 gap-2"><Plus className="w-4 h-4" /> {t('publishChapter')}</Button>
      </div>

      <div className="space-y-2">
        {chapters.map(ch => (
          <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30">
            <div className="flex items-center gap-3">
              <span className="font-medium text-foreground">Ch. {ch.chapter_number}</span>
              {ch.title && <span className="text-sm text-muted-foreground">- {ch.title}</span>}
              {ch.is_locked && (
                <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                  {ch.coin_price} coins
                  {ch.lock_duration_days > 0 && ` · ${ch.lock_duration_days}d`}
                  {ch.lock_duration_days === 0 && ch.is_locked && ' · ∞'}
                </span>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" /> {ch.views || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => openPages(ch)} className="text-muted-foreground hover:text-primary"><Image className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => openEdit(ch)} className="text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(ch.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {chapters.length === 0 && <div className="text-center py-12 text-muted-foreground">{t('noResults')}</div>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border/50">
          <DialogHeader><DialogTitle className="font-cairo">{editing ? (lang === 'ar' ? 'تعديل الفصل' : 'Edit Chapter') : t('publishChapter')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Chapter Number</Label><Input type="number" value={form.chapter_number} onChange={e => setForm(f => ({ ...f, chapter_number: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Title (EN)</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
              <div><Label>Title (AR)</Label><Input value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <Label>{t('locked')}</Label>
              <Switch checked={form.is_locked} onCheckedChange={v => setForm(f => ({ ...f, is_locked: v }))} />
            </div>
            {form.is_locked && (
              <>
                <div><Label>{t('price')} ({t('coins')})</Label><Input type="number" value={form.coin_price} onChange={e => setForm(f => ({ ...f, coin_price: e.target.value }))} className="bg-secondary/50 border-border/50" /></div>
                <div>
                  <Label>{lang === 'ar' ? 'مدة القفل بالأيام (0 = دائم)' : 'Lock Duration (days, 0 = permanent)'}</Label>
                  <Input type="number" min="0" value={form.lock_duration_days} onChange={e => setForm(f => ({ ...f, lock_duration_days: e.target.value }))} className="bg-secondary/50 border-border/50" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Number(form.lock_duration_days) === 0
                      ? (lang === 'ar' ? 'مقفل دائماً - يتطلب عملات للفتح' : 'Permanently locked - requires coins to unlock')
                      : (lang === 'ar' ? `ينفتح تلقائياً بعد ${form.lock_duration_days} يوم من النشر` : `Auto-unlocks ${form.lock_duration_days} days after publish`)}
                  </p>
                </div>
              </>
            )}

            <div className="border-t border-border/30 pt-4 mt-2">
              <Label>{lang === 'ar' ? 'إضافة صفحات (اختياري)' : 'Add Pages (Optional)'}</Label>
              <div className="mt-2 space-y-3">
                <div className="border-2 border-dashed border-border/50 rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-foreground font-medium mb-1">{lang === 'ar' ? 'رفع صور الصفحات' : 'Upload Page Images'}</p>
                  <p className="text-xs text-muted-foreground mb-3">{lang === 'ar' ? 'الجودة أصبحت الآن أصلية 100%' : 'Quality is now 100% original'}</p>
                  <Button variant="outline" size="sm" onClick={() => chapterFileInputRef.current?.click()} disabled={uploading} className="gap-2">
                    <Upload className="w-4 h-4" /> {lang === 'ar' ? 'اختر صور' : 'Select Images'}
                  </Button>
                  <input ref={chapterFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) setSelectedFiles(Array.from(e.target.files)); }} />
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="text-sm font-medium text-primary bg-primary/10 p-2 rounded-lg text-center">
                    {selectedFiles.length} {lang === 'ar' ? 'ملفات محددة للرفع' : 'files selected for upload'}
                  </div>
                )}

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">{uploadProgress}%</p>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-x-0 top-0 flex items-center justify-center">
                    <span className="px-3 py-0.5 text-xs text-muted-foreground bg-card">{lang === 'ar' ? 'أو أضف روابط' : 'or add URLs'}</span>
                  </div>
                  <div className="border-t border-border/30 pt-4 mt-3">
                    <Textarea value={chapterUrls} onChange={e => setChapterUrls(e.target.value)} placeholder="https://..." className="bg-secondary/50 border-border/50 min-h-[80px]" />
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={uploading} className="w-full bg-primary hover:bg-primary/90">{uploading ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pagesDialog} onOpenChange={setPagesDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-card border-border/50">
          <DialogHeader><DialogTitle className="font-cairo">Ch. {selectedChapter?.chapter_number} - Pages ({pages.length})</DialogTitle></DialogHeader>
          <div className="space-y-2 mb-4">
            {pages.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded bg-secondary/30">
                <img src={p.image_url} alt="" className="w-12 h-16 object-cover rounded" />
                <span className="text-sm text-foreground flex-1">Page {p.page_number}</span>
                <Button variant="ghost" size="icon" onClick={() => deletePage(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center hover:border-primary/30 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-foreground font-medium mb-1">{lang === 'ar' ? 'رفع صور الصفحات' : 'Upload Page Images'}</p>
              <p className="text-xs text-muted-foreground mb-3">{lang === 'ar' ? 'الجودة أصبحت الآن أصلية 100%' : 'Quality is now 100% original'}</p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
                <Upload className="w-4 h-4" /> {lang === 'ar' ? 'اختر صور' : 'Select Images'}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) handleImageUpload(e.target.files); }} />
            </div>
            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">{uploadProgress}%</p>
              </div>
            )}
            <div className="relative">
              <div className="absolute inset-x-0 top-0 flex items-center justify-center">
                <span className="px-3 py-0.5 text-xs text-muted-foreground bg-card">{lang === 'ar' ? 'أو أضف روابط' : 'or add URLs'}</span>
              </div>
              <div className="border-t border-border/30 pt-4 mt-3">
                <Textarea value={newPageUrls} onChange={e => setNewPageUrls(e.target.value)} placeholder="https://..." className="bg-secondary/50 border-border/50 min-h-[80px]" />
                <Button onClick={addPages} className="w-full mt-2 bg-primary hover:bg-primary/90 gap-2"><Plus className="w-4 h-4" /> {lang === 'ar' ? 'إضافة روابط' : 'Add URLs'}</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminChapters;
