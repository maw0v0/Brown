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

    const { data: manhwaRows } = await supabaseClient
      .from("manhwa")
      .select("slug, updated_at, created_at");

    const { data: chapterRows } = await supabaseClient
      .from("chapters")
      .select("chapter_number, created_at, manhwa (slug)")
      .order("created_at", { ascending: false })
      .limit(2000);

    const nowDate = new Date().toISOString().split("T")[0];
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${nowDate}</lastmod>
    <priority>1.0</priority>
  </url>`;

    manhwaRows?.forEach((row) => {
      if (row.slug) {
        const lastmod = (row.updated_at || row.created_at || nowDate).split("T")[0];
        xml += `
  <url>
    <loc>${SITE_URL}/manhwa/${escapeXml(row.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>0.8</priority>
  </url>`;
      }
    });

    chapterRows?.forEach((row: any) => {
      if (row.manhwa?.slug && row.chapter_number != null) {
        const lastmod = (row.created_at || nowDate).split("T")[0];
        xml += `
  <url>
    <loc>${SITE_URL}/manhwa/${escapeXml(row.manhwa.slug)}/chapter/${row.chapter_number}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>0.6</priority>
  </url>`;
      }
    });

    xml += `\n</urlset>`;

    return new Response(xml.trim(), {
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