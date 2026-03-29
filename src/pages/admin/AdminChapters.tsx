import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit2, Image, Upload, Eye, FileArchive } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import JSZip from 'jszip'; // تأكد من وجود المكتبة

const AdminChapters = () => {
  const { manhwaId } = useParams();
  const [manhwa, setManhwa] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pagesDialog, setPagesDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ chapter_number: '', title: '', title_ar: '', is_locked: false, coin_price: '0', lock_duration_days: '0' });
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const chapterFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const MAX_SLICE_HEIGHT = 2500;

  const fetchChapters = async () => {
    if (!manhwaId) return;
    const { data: m } = await supabase.from('manhwa').select('*').eq('id', manhwaId).single();
    if (m) setManhwa(m);
    const { data } = await supabase.from('chapters').select('*').eq('manhwa_id', manhwaId).order('chapter_number', { ascending: false });
    if (data) setChapters(data);
  };

  useEffect(() => { fetchChapters(); }, [manhwaId]);

  // وظيفة معالجة الملفات (صور أو ZIP) وترتيبها
  const processFiles = async (files: File[]): Promise<File[]> => {
    let allImages: { name: string; file: File | Blob }[] = [];

    for (const file of files) {
      if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        const zip = new JSZip();
        const contents = await zip.loadAsync(file);
        const zipFiles = Object.values(contents.files).filter(f => !f.dir && f.name.match(/\.(jpg|jpeg|png|webp)$/i));
        
        for (const zf of zipFiles) {
          const blob = await zf.async('blob');
          allImages.push({ name: zf.name, file: new File([blob], zf.name, { type: blob.type }) });
        }
      } else if (file.type.startsWith('image/')) {
        allImages.push({ name: file.name, file: file });
      }
    }

    // الترتيب الأبجدي الرقمي (مهم جداً لتسلسل الصفحات)
    allImages.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    
    return allImages.map(item => item.file as File);
  };

  // وظيفة القص والتحويل
  const sliceAndConvert = async (file: File): Promise<Blob[]> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = async () => {
        const { width, height } = img;
        const slices: Blob[] = [];
        const numSlices = Math.ceil(height / MAX_SLICE_HEIGHT);

        for (let i = 0; i < numSlices; i++) {
          const canvas = document.createElement('canvas');
          const sliceH = Math.min(MAX_SLICE_HEIGHT, height - i * MAX_SLICE_HEIGHT);
          canvas.width = width;
          canvas.height = sliceH;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, i * MAX_SLICE_HEIGHT, width, sliceH, 0, 0, width, sliceH);
          
          const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/webp', 1.0));
          slices.push(blob);
        }
        resolve(slices);
      };
    });
  };

  const handleSave = async () => {
    if (selectedFiles.length === 0) { toast.error("يرجى اختيار ملفات"); return; }
    setUploading(true);
    setUploadProgress(0);

    const payload = {
      manhwa_id: manhwaId!,
      chapter_number: Number(form.chapter_number),
      title: form.title || null,
      title_ar: form.title_ar || null,
      is_locked: form.is_locked,
    };

    const { data: chapter, error: chErr } = editing 
      ? await supabase.from('chapters').update(payload).eq('id', editing.id).select().single()
      : await supabase.from('chapters').insert(payload).select().single();

    if (chErr) { toast.error(chErr.message); setUploading(false); return; }

    const sortedImages = await processFiles(selectedFiles);
    let pageCounter = 1;

    for (let i = 0; i < sortedImages.length; i++) {
      const slices = await sliceAndConvert(sortedImages[i]);
      for (let s = 0; s < slices.length; s++) {
        const path = `chapters/${chapter.id}/page-${pageCounter}.webp`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, slices[s], { upsert: true });
        
        if (!upErr) {
          const { data: url } = supabase.storage.from('avatars').getPublicUrl(path);
          await supabase.from('chapter_pages').insert({
            chapter_id: chapter.id,
            image_url: url.publicUrl,
            page_number: pageCounter
          });
          pageCounter++;
        }
      }
      setUploadProgress(Math.round(((i + 1) / sortedImages.length) * 100));
    }

    setUploading(false);
    setDialogOpen(false);
    fetchChapters();
    toast.success("تم رفع الفصل وترتيبه بنجاح!");
  };

  // واجهة الاستخدام (UI)
  return (
    <div className="p-4 font-cairo">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">{manhwa?.title} - الفصول</h2>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus /> نشر فصل جديد
        </Button>
      </div>

      <div className="grid gap-3">
        {chapters.map(ch => (
          <div key={ch.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/50">
            <span className="font-bold text-lg">الفصل {ch.chapter_number}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => { setSelectedChapter(ch); setPagesDialog(true); }}><Image className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => { setEditing(ch); setForm({...ch}); setDialogOpen(true); }}><Edit2 className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      {/* نافذة الرفع */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl bg-card">
          <DialogHeader><DialogTitle>نشر فصل (دعم ZIP + ترتيب تلقائي)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>رقم الفصل</Label><Input type="number" value={form.chapter_number} onChange={e => setForm({...form, chapter_number: e.target.value})} /></div>
              <div><Label>العنوان</Label><Input value={form.title_ar} onChange={e => setForm({...form, title_ar: e.target.value})} /></div>
            </div>

            <div className="border-2 border-dashed border-border p-8 rounded-2xl text-center hover:border-primary transition-all">
              <input type="file" multiple accept="image/*,.zip" className="hidden" id="file-upload" 
                onChange={e => e.target.files && setSelectedFiles(Array.from(e.target.files))} />
              <label htmlFor="file-upload" className="cursor-pointer space-y-2">
                <FileArchive className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="font-bold">اسحب الملفات هنا أو اضغط للاختيار</p>
                <p className="text-xs text-muted-foreground">يمكنك رفع صور متعددة أو ملفات ZIP (سيتم ترتيبها أبجدياً)</p>
              </label>
            </div>

            {selectedFiles.length > 0 && <div className="text-sm text-primary text-center">تم اختيار {selectedFiles.length} ملفات</div>}
            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-center text-xs">جاري المعالجة والرفع: {uploadProgress}%</p>
              </div>
            )}

            <Button onClick={handleSave} disabled={uploading} className="w-full h-12 text-lg">
              {uploading ? 'جاري العمل...' : 'بدء الرفع والقص'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminChapters;
