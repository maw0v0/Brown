import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://realmscans.lovable.app";
const PUBLIC_DIR = path.resolve("public");
const RSS_PATH = path.join(PUBLIC_DIR, "rss.xml");
const SITEMAP_PATH = path.join(PUBLIC_DIR, "sitemap.xml");
const SITEMAP_INDEX_PATH = path.join(PUBLIC_DIR, "sitemap-index.xml");
const SITEMAP_MAX_URLS = 50000;

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");

const loadDotEnv = () => {
  const env = { ...process.env };
  const envPath = path.resolve(".env");
  if (!fs.existsSync(envPath)) {
    return env;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
};

const buildRssXml = (channel, items) => {
  const lastBuildDate =
    channel.lastBuildDate ||
    items[0]?.pubDate ||
    new Date().toUTCString();

  const itemXml = items
    .map((item) => {
      const guid = item.guid || item.link;
      const description = item.description || item.title;
      return [
        "    <item>",
        `      <title>${escapeXml(item.title)}</title>`,
        `      <link>${escapeXml(item.link)}</link>`,
        `      <guid>${escapeXml(guid)}</guid>`,
        `      <pubDate>${escapeXml(item.pubDate)}</pubDate>`,
        `      <description>${escapeXml(description)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${escapeXml(channel.title)}</title>`,
    `    <link>${escapeXml(channel.link)}</link>`,
    `    <description>${escapeXml(channel.description)}</description>`,
    `    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>`,
    channel.language
      ? `    <language>${escapeXml(channel.language)}</language>`
      : null,
    itemXml,
    "  </channel>",
    "</rss>",
  ]
    .filter(Boolean)
    .join("\n");
};

const buildSitemapXml = (urls) => {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((entry) => {
      const lastmod = entry.lastmod || new Date().toISOString().split("T")[0];
      return [
        "  <url>",
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
        entry.priority != null
          ? `    <priority>${Number(entry.priority).toFixed(1)}</priority>`
          : null,
        "  </url>",
      ].join("\n");
    }),
    "</urlset>",
  ].join("\n");
};

const buildSitemapIndexXml = (sitemaps) => {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemaps.map((entry) => {
      const lastmod = entry.lastmod || new Date().toISOString().split("T")[0];
      return [
        "  <sitemap>",
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
        "  </sitemap>",
      ].join("\n");
    }),
    "</sitemapindex>",
  ].join("\n");
};

const ensurePublicDir = () => {
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }
};

const fetchAll = async (supabase, table, select) => {
  const pageSize = 1000;
  let from = 0;
  let all = [];

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(`Sitemap ${table} query failed:`, error.message);
      return [];
    }

    const rows = data || [];
    all = all.concat(rows);
    if (rows.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return all;
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const main = async () => {
  const env = loadDotEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
  const supabaseKey =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials for feed generation.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("id, chapter_number, created_at, manhwa:manhwa_id (title, slug)")
    .order("created_at", { ascending: false })
    .limit(20);

  if (chaptersError) {
    console.error("RSS query failed:", chaptersError.message);
    process.exit(1);
  }

  const rssItems = (chapters || [])
    .filter((row) => row.manhwa?.slug && row.manhwa?.title)
    .map((row) => {
      const title = `${row.manhwa.title} - الفصل ${row.chapter_number}`;
      const link = `${SITE_URL}/manhwa/${row.manhwa.slug}/chapter/${row.chapter_number}`;
      return {
        title,
        link,
        pubDate: new Date(row.created_at).toUTCString(),
        guid: row.id,
      };
    });

  const rssChannel = {
    title: "RealmScans - Latest Chapters",
    link: SITE_URL,
    description: "Latest 20 chapters from RealmScans",
    language: "ar",
    lastBuildDate: rssItems[0]?.pubDate,
  };

  const rssXml = buildRssXml(rssChannel, rssItems);

  const [manhwaRows, chapterRows] = await Promise.all([
    fetchAll(supabase, "manhwa", "slug, updated_at, created_at"),
    fetchAll(supabase, "chapters", "chapter_number, created_at, manhwa:manhwa_id (slug)"),
  ]);

  const nowDate = new Date().toISOString().split("T")[0];
  const urls = [
    { loc: `${SITE_URL}/`, lastmod: nowDate, priority: 1.0 },
  ];

  for (const row of manhwaRows || []) {
    if (!row.slug) continue;
    const lastmod = (row.updated_at || row.created_at || nowDate)
      .split("T")[0];
    urls.push({
      loc: `${SITE_URL}/manhwa/${row.slug}`,
      lastmod,
      priority: 0.8,
    });
  }

  for (const row of chapterRows || []) {
    if (!row.manhwa?.slug || row.chapter_number == null) continue;
    const lastmod = (row.created_at || nowDate).split("T")[0];
    urls.push({
      loc: `${SITE_URL}/manhwa/${row.manhwa.slug}/chapter/${row.chapter_number}`,
      lastmod,
      priority: 0.6,
    });
  }

  const urlChunks = chunkArray(urls, SITEMAP_MAX_URLS);

  ensurePublicDir();

  if (urlChunks.length <= 1) {
    const sitemapXml = buildSitemapXml(urlChunks[0] || []);
    fs.writeFileSync(SITEMAP_PATH, sitemapXml, "utf8");

    const sitemapIndexXml = buildSitemapIndexXml([
      { loc: `${SITE_URL}/sitemap.xml`, lastmod: nowDate },
    ]);
    fs.writeFileSync(SITEMAP_INDEX_PATH, sitemapIndexXml, "utf8");
  } else {
    const sitemapEntries = [];

    for (let i = 0; i < urlChunks.length; i += 1) {
      const fileName = `sitemap-${i + 1}.xml`;
      const filePath = path.join(PUBLIC_DIR, fileName);
      const sitemapXml = buildSitemapXml(urlChunks[i]);
      fs.writeFileSync(filePath, sitemapXml, "utf8");
      sitemapEntries.push({
        loc: `${SITE_URL}/${fileName}`,
        lastmod: nowDate,
      });
    }

    const sitemapIndexXml = buildSitemapIndexXml(sitemapEntries);
    fs.writeFileSync(SITEMAP_INDEX_PATH, sitemapIndexXml, "utf8");
    fs.writeFileSync(SITEMAP_PATH, sitemapIndexXml, "utf8");
  }

  fs.writeFileSync(RSS_PATH, rssXml, "utf8");

  console.log(`Generated: ${RSS_PATH}`);
  console.log(`Generated: ${SITEMAP_INDEX_PATH}`);
  console.log(`Generated: ${SITEMAP_PATH}`);
};

main().catch((error) => {
  console.error("Feed generation failed:", error);
  process.exit(1);
});


