import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = Deno.env.get("SITE_URL") || "https://brownmanga.site";

const escapeXml = (value: string) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: chapterRows } = await supabaseClient
      .from("chapters")
      .select("id, chapter_number, created_at, manhwa:manhwa_id (title, slug)")
      .order("created_at", { ascending: false })
      .limit(20);

    const lastBuildDate = chapterRows?.[0] ? new Date(chapterRows[0].created_at).toUTCString() : new Date().toUTCString();

    let rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>RealmScans - أحدث الفصول</title>
    <link>${SITE_URL}</link>
    <description>آخر تحديثات المانجا المرفوعة على RealmScans</description>
    <language>ar</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />`;

    chapterRows?.forEach((row: any) => {
      const m = row.manhwa;
      if (m?.slug && row.chapter_number != null) {
        const title = `${m.title} - الفصل ${row.chapter_number}`;
        const link = `${SITE_URL}/manhwa/${m.slug}/chapter/${row.chapter_number}`;
        const pubDate = new Date(row.created_at).toUTCString();
        
        rssXml += `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${row.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>تم تحديث فصل جديد من مانهوا ${escapeXml(m.title)}</description>
    </item>`;
      }
    });

    rssXml += `
  </channel>
</rss>`;

    return new Response(rssXml.trim(), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/xml; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});