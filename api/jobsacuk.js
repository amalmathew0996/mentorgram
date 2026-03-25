export const config = { runtime: "nodejs" };

// jobs.ac.uk RSS feeds — completely free, no API key needed
// URL format: https://www.jobs.ac.uk/jobs/[category]/?format=rss

const FEEDS = [
  { url: "https://www.jobs.ac.uk/jobs/computer-sciences/?format=rss",         sector: "Technology" },
  { url: "https://www.jobs.ac.uk/jobs/engineering-and-technology/?format=rss", sector: "Engineering" },
  { url: "https://www.jobs.ac.uk/jobs/health-and-medical/?format=rss",         sector: "Healthcare" },
  { url: "https://www.jobs.ac.uk/jobs/business-and-management-studies/?format=rss", sector: "Business" },
  { url: "https://www.jobs.ac.uk/jobs/economics/?format=rss",                  sector: "Finance" },
  { url: "https://www.jobs.ac.uk/jobs/it-services/?format=rss",                sector: "Technology" },
  { url: "https://www.jobs.ac.uk/jobs/finance-and-procurement/?format=rss",    sector: "Finance" },
  { url: "https://www.jobs.ac.uk/jobs/mathematics-and-statistics/?format=rss", sector: "AI & Data" },
];

// Parse a single RSS XML string into job objects
function parseRSS(xml, sector) {
  const jobs = [];
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  for (const item of items) {
    const get = (tag) => {
      const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`));
      return m ? (m[1] || m[2] || "").trim() : "";
    };

    const title    = get("title");
    const link     = get("link") || get("guid");
    const pubDate  = get("pubDate");
    const desc     = get("description");

    // Extract company name from description (jobs.ac.uk puts it in description)
    const orgMatch = desc.match(/(?:Organisation|Employer|Institution):\s*([^\n<]+)/i)
                  || desc.match(/<strong>([^<]+)<\/strong>/);
    const company  = orgMatch ? orgMatch[1].trim() : "UK University / Research Institute";

    // Extract location from description
    const locMatch = desc.match(/(?:Location|Place of [Ww]ork):\s*([^\n<,]+)/i);
    const location = locMatch ? locMatch[1].trim() : "United Kingdom";

    // Extract salary from description
    const salMatch = desc.match(/(?:Salary|Remuneration|Grade):\s*([^\n<]+)/i);
    const salary   = salMatch ? salMatch[1].replace(/<[^>]+>/g, "").trim() : "Competitive";

    // Format posted date
    let posted = "";
    if (pubDate) {
      try {
        posted = new Date(pubDate).toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric"
        });
      } catch { posted = pubDate.substring(0, 16); }
    }

    if (title && link) {
      jobs.push({
        title:      title.replace(/<[^>]+>/g, ""),
        company:    company.replace(/<[^>]+>/g, ""),
        location:   location.replace(/<[^>]+>/g, ""),
        salary:     salary.replace(/<[^>]+>/g, "").substring(0, 60),
        sector,
        posted,
        url:        link,
        source:     "jobs.ac.uk",
        sponsorship: false,
      });
    }
  }

  return jobs;
}

export default async function handler(req, res) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Content-Type": "application/json",
  };

  const { searchParams } = new URL(req.url, "https://mentorgramai.com");
  const q    = (searchParams.get("q") || "").toLowerCase();
  const loc  = (searchParams.get("location") || "").toLowerCase();

  try {
    // Fetch all feeds in parallel
    const results = await Promise.allSettled(
      FEEDS.map(({ url, sector }) =>
        fetch(url, {
          headers: { "User-Agent": "Mentorgram AI Job Aggregator (mentorgramai.com)" },
          signal: AbortSignal.timeout(8000),
        })
          .then(r => r.text())
          .then(xml => parseRSS(xml, sector))
          .catch(() => [])
      )
    );

    // Flatten all jobs
    let jobs = results
      .filter(r => r.status === "fulfilled")
      .flatMap(r => r.value);

    // Deduplicate by URL
    const seen = new Set();
    jobs = jobs.filter(j => {
      if (seen.has(j.url)) return false;
      seen.add(j.url);
      return true;
    });

    // Filter by search query if provided
    if (q) {
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.sector.toLowerCase().includes(q)
      );
    }
    if (loc) {
      jobs = jobs.filter(j =>
        j.location.toLowerCase().includes(loc) ||
        loc === "united kingdom" || loc === "uk"
      );
    }

    // Sort by most recent first (jobs with dates first)
    jobs.sort((a, b) => {
      if (!a.posted && !b.posted) return 0;
      if (!a.posted) return 1;
      if (!b.posted) return -1;
      return new Date(b.posted) - new Date(a.posted);
    });

    // Cap at 100 results
    jobs = jobs.slice(0, 100);

    return res.status(200).json({
      jobs,
      source: "jobs.ac.uk",
      count: jobs.length,
      updatedAt: new Date().toISOString(),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message, jobs: [] });
  }
}
