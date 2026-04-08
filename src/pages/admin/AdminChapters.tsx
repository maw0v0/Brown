import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit2, Image, Upload, Eye, FileArchive, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import JSZip from 'jszip'; 

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
  
  // حالات الحذف
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const MAX_SLICE_HEIGHT = 2500;

  const fetchChapters = async () => {
    if (!manhwaId) return;
    const { data: m } = await supabase.from('manhwa').select('*').eq('id', manhwaId).single();
    if (m) setManhwa(m);
    const { data } = await supabase.from('chapters').select('*').eq('manhwa_id', manhwaId).order('chapter_number', { ascending: false });
    if (data) setChapters(data);
  };

  useEffect(() => { fetchChapters(); }, [manhwaId]);

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

    allImages.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    
    return allImages.map(item => item.file as File);
  };

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
    if (selectedFiles.length === 0 && !editing) { toast.error("يرجى اختيار ملفات"); return; }
    if (!form.chapter_number) { toast.error("يرجى إدخال رقم الفصل"); return; }
    
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

    if (selectedFiles.length > 0) {
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
    }

    setUploading(false);
    setDialogOpen(false);
    setSelectedFiles([]);
    fetchChapters();
    toast.success(editing ? "تم تعديل الفصل بنجاح!" : "تم رفع الفصل وترتيبه بنجاح!");
  };

  // دالة الحذف الشامل (الصور + قاعدة البيانات)
  const handleDelete = async () => {
    if (!chapterToDelete) return;
    setIsDeleting(true);

    try {
      // 1. جلب مسارات كل الصور التابعة لهذا الفصل
      const { data: pagesData } = await supabase
        .from('chapter_pages')
        .select('image_url')
        .eq('chapter_id', chapterToDelete.id);

      if (pagesData && pagesData.length > 0) {
        // استخراج اسم الملف من الرابط ومسحه من Storage
        const filePaths = pagesData.map(p => {
          const parts = p.image_url.split('/');
          const fileName = parts[parts.length - 1];
          return `chapters/${chapterToDelete.id}/${fileName}`;
        });

        const { error: storageError } = await supabase.storage
          .from('avatars')
          .remove(filePaths);

        if (storageError) {
          console.error("خطأ في حذف الصور من التخزين:", storageError);
          // لا نوقف العملية، نستمر بحذف الفصل من قاعدة البيانات
        }
      }

      // 2. حذف الفصل من قاعدة البيانات (سيتم حذف الصفحات التابعة له تلقائياً إذا كان هناك CASCADE، وإلا نحذفها يدوياً)
      await supabase.from('chapter_pages').delete().eq('chapter_id', chapterToDelete.id);
      const { error: dbError } = await supabase.from('chapters').delete().eq('id', chapterToDelete.id);

      if (dbError) throw dbError;

      toast.success("تم حذف الفصل وصوره نهائياً!");
      fetchChapters();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setChapterToDelete(null);
    }
  };

  const confirmDelete = (chapter: any) => {
    setChapterToDelete(chapter);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="p-4 font-cairo">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">{manhwa?.title} - الفصول</h2>
        <Button onClick={() => { setEditing(null); setForm({ chapter_number: '', title: '', title_ar: '', is_locked: false, coin_price: '0', lock_duration_days: '0' }); setSelectedFiles([]); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> نشر فصل جديد
        </Button>
      </div>

      <div className="grid gap-3">
        {chapters.map(ch => (
          <div key={ch.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
            <span className="font-bold text-lg">الفصل {ch.chapter_number}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => { setSelectedChapter(ch); setPagesDialog(true); }}><Image className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => { setEditing(ch); setForm({...ch}); setDialogOpen(true); }}><Edit2 className="w-4 h-4" /></Button>
              {/* زر الحذف مفعل الآن */}
              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => confirmDelete(ch)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      {/* نافذة التأكيد على الحذف */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card">
          <DialogHeader>
            <DialogTitle className="text-destructive">تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد أنك تريد حذف الفصل {chapterToDelete?.chapter_number}؟ 
              سيتم مسح هذا الفصل وجميع صوره من الخادم بشكل نهائي ولا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> جاري الحذف...</> : 'حذف نهائي'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة الرفع */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl bg-card border-border/50">
          <DialogHeader><DialogTitle>{editing ? 'تعديل الفصل' : 'نشر فصل (دعم ZIP + ترتيب تلقائي)'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>رقم الفصل</Label><Input type="number" value={form.chapter_number} onChange={e => setForm({...form, chapter_number: e.target.value})} className="bg-secondary/50" /></div>
              <div><Label>العنوان (اختياري)</Label><Input value={form.title_ar} onChange={e => setForm({...form, title_ar: e.target.value})} className="bg-secondary/50" /></div>
            </div>

            <div className="border-2 border-dashed border-border/50 p-8 rounded-2xl text-center hover:border-primary/50 hover:bg-primary/5 transition-all bg-secondary/20">
              <input type="file" multiple accept="image/*,.zip" className="hidden" id="file-upload" 
                onChange={e => e.target.files && setSelectedFiles(Array.from(e.target.files))} />
              <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
                <FileArchive className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <p className="font-bold text-foreground">اسحب الملفات هنا أو اضغط للاختيار</p>
                <p className="text-xs text-muted-foreground">يمكنك رفع صور متعددة أو ملفات ZIP (سيتم ترتيبها أبجدياً)</p>
              </label>
            </div>

            {selectedFiles.length > 0 && <div className="text-sm text-primary font-medium text-center bg-primary/10 py-2 rounded-lg">تم اختيار {selectedFiles.length} ملفات جاهزة للمعالجة</div>}
            
            {uploading && (
              <div className="space-y-2 bg-secondary/50 p-4 rounded-xl border border-border/50">
                <div className="flex justify-between text-xs mb-1">
                  <span>جاري المعالجة والرفع...</span>
                  <span className="font-bold text-primary">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <Button onClick={handleSave} disabled={uploading} className="w-full h-12 text-lg font-bold shadow-glow">
              {uploading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> جاري العمل...</> : (editing ? 'حفظ التعديلات' : 'بدء الرفع والقص')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminChapters;
