import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';

const TermsOfService = () => {
  const { lang } = useI18n();
  const [content, setContent] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'terms_of_service').single()
      .then(({ data }) => { if (data?.value) setContent(data.value); });
  }, []);

  const defaultContent = lang === 'ar'
    ? `<h2>الشروط والأحكام</h2>
<p>باستخدامك لهذا الموقع، فإنك توافق على الشروط والأحكام التالية.</p>
<h3>استخدام الموقع</h3>
<p>يجب استخدام الموقع بشكل قانوني ومسؤول. يُمنع أي استخدام غير مصرح به.</p>
<h3>المحتوى</h3>
<p>جميع المحتويات المنشورة على الموقع محمية بحقوق الطبع والنشر.</p>
<h3>الحسابات</h3>
<p>أنت مسؤول عن الحفاظ على سرية معلومات حسابك.</p>
<h3>العملات الافتراضية</h3>
<p>العملات المشتراة غير قابلة للاسترداد ولا يمكن تحويلها إلى أموال حقيقية.</p>
<h3>التعديلات</h3>
<p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت.</p>`
    : `<h2>Terms of Service</h2>
<p>By using this website, you agree to the following terms and conditions.</p>
<h3>Use of the Site</h3>
<p>The site must be used lawfully and responsibly. Any unauthorized use is prohibited.</p>
<h3>Content</h3>
<p>All content published on the site is protected by copyright.</p>
<h3>Accounts</h3>
<p>You are responsible for maintaining the confidentiality of your account information.</p>
<h3>Virtual Currency</h3>
<p>Purchased coins are non-refundable and cannot be converted to real money.</p>
<h3>Modifications</h3>
<p>We reserve the right to modify these terms at any time.</p>`;

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

export default TermsOfService;
