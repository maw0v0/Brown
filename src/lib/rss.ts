export type RssItem = {
  title: string;
  link: string;
  pubDate: string;
  guid?: string;
  description?: string;
};

export type RssChannel = {
  title: string;
  link: string;
  description: string;
  lastBuildDate?: string;
  language?: string;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const buildRssXml = (channel: RssChannel, items: RssItem[]) => {
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
