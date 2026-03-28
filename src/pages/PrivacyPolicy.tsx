import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';

const PrivacyPolicy = () => {
  const { lang } = useI18n();
  const [content, setContent] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'privacy_policy').single()
      .then(({ data }) => { if (data?.value) setContent(data.value); });
  }, []);

  const defaultContent = lang === 'ar'
    ? `<h2>سياسة الخصوصية</h2>
<p>نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية.</p>
<h3>البيانات التي نجمعها</h3>
<p>نقوم بجمع البريد الإلكتروني واسم المستخدم عند التسجيل، بالإضافة إلى سجل القراءة والتفضيلات.</p>
<h3>كيف نستخدم بياناتك</h3>
<p>نستخدم بياناتك لتحسين تجربتك على الموقع وتقديم محتوى مخصص لك.</p>
<h3>حماية البيانات</h3>
<p>نستخدم تقنيات أمان متقدمة لحماية بياناتك من الوصول غير المصرح به.</p>
<h3>تواصل معنا</h3>
<p>إذا كان لديك أي أسئلة حول سياسة الخصوصية، يرجى التواصل معنا.</p>`
    : `<h2>Privacy Policy</h2>
<p>We respect your privacy and are committed to protecting your personal data.</p>
<h3>Data We Collect</h3>
<p>We collect your email and username upon registration, along with reading history and preferences.</p>
<h3>How We Use Your Data</h3>
<p>We use your data to improve your experience on the site and deliver personalized content.</p>
<h3>Data Protection</h3>
<p>We use advanced security technologies to protect your data from unauthorized access.</p>
<h3>Contact Us</h3>
<p>If you have any questions about our privacy policy, please contact us.</p>`;

  const safeHtml = DOMPurify.sanitize(content || defaultContent);

  return (
    <div className="container py-12 max-w-3xl mx-auto">
      <div
        className="prose prose-invert prose-purple max-w-none [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:font-cairo [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </div>
  );
};

export default PrivacyPolicy;
