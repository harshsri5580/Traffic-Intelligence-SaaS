export async function GET() {
  const baseUrl = "https://www.trafficintelai.com";

  const pages = [
    "",
    "/traffic-cloaker",
    "/traffic-tracking-tool",
    "/ppc-traffic-protection",
    "/click-tracking-tool",
    "/bot-traffic-filtering",
  ];

  const urls = pages.map(
    (p) => `
      <url>
        <loc>${baseUrl}${p}</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>
    `
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join("")}
  </urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}